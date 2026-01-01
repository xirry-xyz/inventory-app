
const admin = require('firebase-admin');

// Get Service Account from Environment
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

if (!serviceAccount) {
    console.error('FIREBASE_SERVICE_ACCOUNT missing');
    process.exit(1);
}

// Initialize Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Extract appId from a list document path
 * Path format: artifacts/{appId}/users/{ownerId}/lists/{listId}
 */
function extractAppIdFromPath(path) {
    const parts = path.split('/');
    // parts[0] = 'artifacts', parts[1] = appId
    return parts[1] || 'default-app-id';
}

/**
 * Extract ownerId from a list document path
 * Path format: artifacts/{appId}/users/{ownerId}/lists/{listId}
 */
function extractOwnerIdFromPath(path) {
    const parts = path.split('/');
    // parts[3] = ownerId
    return parts[3];
}

async function sendNotifications() {
    console.log('Starting notification check...');

    const now = new Date();

    // Step 1: Get ALL lists using collectionGroup
    const listsSnap = await db.collectionGroup('lists').get();
    console.log(`Found ${listsSnap.size} total list(s) across all apps.`);

    // Group lists by appId
    const listsByAppId = new Map();
    for (const listDoc of listsSnap.docs) {
        const appId = extractAppIdFromPath(listDoc.ref.path);
        if (!listsByAppId.has(appId)) {
            listsByAppId.set(appId, []);
        }
        listsByAppId.get(appId).push(listDoc);
    }

    console.log(`Lists found in ${listsByAppId.size} app(s): ${Array.from(listsByAppId.keys()).join(', ')}`);

    // Process each appId separately
    for (const [appId, lists] of listsByAppId) {
        console.log(`\n=== Processing App: ${appId} ===`);

        // Get all users for this appId
        const usersRef = db.collection(`artifacts/${appId}/users`);
        const usersSnap = await usersRef.get();

        // Build token map for this appId
        const userTokensMap = new Map();
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const fcmTokens = userData.fcmTokens || [];
            if (fcmTokens.length > 0) {
                userTokensMap.set(userDoc.id, {
                    tokens: fcmTokens,
                    email: userData.email || 'Unknown'
                });
            }
        }

        console.log(`Found ${usersSnap.size} user(s), ${userTokensMap.size} with FCM tokens.`);

        // Collect notifications for users in this appId
        const notificationsByUser = new Map();

        // Process each list
        for (const listDoc of lists) {
            const listData = listDoc.data();
            const members = listData.members || [];
            const listName = listData.name || 'Unknown List';

            // Fetch chores for this list
            const choresSnap = await listDoc.ref.collection('chores').get();
            if (choresSnap.empty) continue;

            // Filter due chores
            const choresDue = choresSnap.docs
                .map(doc => doc.data())
                .filter(chore => {
                    if (!chore.nextDue) return false;
                    const dueDate = new Date(chore.nextDue);
                    return dueDate <= now;
                })
                .map(c => c.name);

            if (choresDue.length === 0) continue;

            console.log(`List "${listName}": ${choresDue.length} due chore(s), notifying ${members.length} member(s)`);

            // Add chores to all members' notification queue
            for (const memberId of members) {
                if (!notificationsByUser.has(memberId)) {
                    notificationsByUser.set(memberId, new Set());
                }
                choresDue.forEach(choreName => {
                    notificationsByUser.get(memberId).add(choreName);
                });
            }
        }

        // Also check root chores for each user (personal chores not in a list)
        for (const userDoc of usersSnap.docs) {
            const rootChoresSnap = await userDoc.ref.collection('chores').get();
            if (rootChoresSnap.empty) continue;

            const choresDue = rootChoresSnap.docs
                .map(doc => doc.data())
                .filter(chore => {
                    if (!chore.nextDue) return false;
                    const dueDate = new Date(chore.nextDue);
                    return dueDate <= now;
                })
                .map(c => c.name);

            if (choresDue.length > 0) {
                if (!notificationsByUser.has(userDoc.id)) {
                    notificationsByUser.set(userDoc.id, new Set());
                }
                choresDue.forEach(choreName => {
                    notificationsByUser.get(userDoc.id).add(choreName);
                });
            }
        }

        // Send notifications
        console.log(`\nSending notifications to ${notificationsByUser.size} user(s) in app ${appId}...`);

        const sendPromises = [];
        for (const [userId, choresSet] of notificationsByUser) {
            const userInfo = userTokensMap.get(userId);
            if (!userInfo) {
                console.log(`User ${userId}: No FCM tokens, skipping.`);
                continue;
            }

            const choresList = Array.from(choresSet);
            console.log(`User ${userId}: ${choresList.length} due chore(s) to notify.`);

            const message = {
                notification: {
                    title: 'HomeSync 家务提醒',
                    body: `今天有 ${choresList.length} 项家务待完成: ${choresList.slice(0, 3).join(', ')}${choresList.length > 3 ? '...' : ''}`
                },
                android: {
                    notification: {
                        tag: 'daily-chore-reminder'
                    }
                },
                webpush: {
                    notification: {
                        tag: 'daily-chore-reminder'
                    }
                },
                tokens: [...new Set(userInfo.tokens)]
            };

            sendPromises.push(
                messaging.sendEachForMulticast(message)
                    .then(async (response) => {
                        console.log(`User ${userId}: Sent! Success: ${response.successCount}, Fail: ${response.failureCount}`);

                        // Clean up invalid tokens after failed sends
                        if (response.failureCount > 0) {
                            const tokensToRemove = [];
                            const tokens = [...new Set(userInfo.tokens)];

                            response.responses.forEach((resp, idx) => {
                                if (!resp.success) {
                                    const errorCode = resp.error?.code;
                                    if (errorCode === 'messaging/invalid-registration-token' ||
                                        errorCode === 'messaging/registration-token-not-registered' ||
                                        errorCode === 'messaging/mismatched-credential') {
                                        tokensToRemove.push(tokens[idx]);
                                        console.log(`  - Removing invalid token (${errorCode}): ${tokens[idx].substring(0, 20)}...`);
                                    }
                                }
                            });

                            if (tokensToRemove.length > 0) {
                                const userRef = db.doc(`artifacts/${appId}/users/${userId}`);
                                await userRef.update({
                                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
                                });
                                console.log(`  - Removed ${tokensToRemove.length} invalid token(s) from user ${userId}`);
                            }
                        }
                    })
                    .catch(error => {
                        console.log(`User ${userId}: Error sending:`, error.message);
                    })
            );
        }

        await Promise.all(sendPromises);
    }
}

sendNotifications().then(() => {
    console.log('\nFinished.');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
