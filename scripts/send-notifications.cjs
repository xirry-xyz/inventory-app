
const admin = require('firebase-admin');
const moment = require('date-fns'); // Assuming we can use native Date or install date-fns in CI

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
const APP_ID = 'default-app-id'; // You might want to match main app ID or make this dynamic if possible. 
// For now, let's assume 'default-app-id' or pass it as env. 
// Actually, our Firestore structure is `artifacts/${appId}/users/...`
// We need to know the appId. Let's try to pass it or hardcode if user only has one. 
// Or better, let's look for all buckets in artifacts?
// Simpler: Assume appId is passed or default.
const TARGET_APP_ID = process.env.VITE_FIREBASE_APP_ID || 'default-app-id'; // Wait, VITE_ vars might not be here. 
// Let's rely on standard path for now or scan.

async function sendNotifications() {
    console.log(`Starting notification check for App ID: ${TARGET_APP_ID}`);

    const now = new Date();

    // Step 1: Get all users and their FCM tokens
    const usersRef = db.collection(`artifacts/${TARGET_APP_ID}/users`);
    const usersSnap = await usersRef.get();

    // Build a map of userId -> { tokens, email }
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

    // Step 2: Get ALL lists using collectionGroup (same as frontend)
    // This finds lists across all users' subcollections
    const listsSnap = await db.collectionGroup('lists').get();
    console.log(`Found ${listsSnap.size} total list(s) across all users.`);

    // Step 3: For each list, check chores and notify ALL members
    const notificationsByUser = new Map(); // userId -> Set of chore names

    const listPromises = listsSnap.docs.map(async (listDoc) => {
        const listData = listDoc.data();
        const members = listData.members || [];
        const listName = listData.name || 'Unknown List';

        // Fetch chores for this list
        const choresSnap = await listDoc.ref.collection('chores').get();
        if (choresSnap.empty) return;

        // Filter due chores
        const choresDue = choresSnap.docs
            .map(doc => doc.data())
            .filter(chore => {
                if (!chore.nextDue) return false;
                const dueDate = new Date(chore.nextDue);
                return dueDate <= now;
            })
            .map(c => c.name);

        if (choresDue.length === 0) return;

        console.log(`List "${listName}": ${choresDue.length} due chore(s), notifying ${members.length} member(s)`);

        // Add these chores to ALL members' notification queue
        for (const memberId of members) {
            if (!notificationsByUser.has(memberId)) {
                notificationsByUser.set(memberId, new Set());
            }
            choresDue.forEach(choreName => {
                notificationsByUser.get(memberId).add(choreName);
            });
        }
    });

    await Promise.all(listPromises);

    // Step 4: Also check root chores for each user (personal chores not in a list)
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

    // Step 5: Send notifications to each user with their aggregated chores
    console.log(`\nSending notifications to ${notificationsByUser.size} user(s)...`);

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
                .then(response => {
                    console.log(`User ${userId}: Sent! Success: ${response.successCount}, Fail: ${response.failureCount}`);
                })
                .catch(error => {
                    console.log(`User ${userId}: Error sending:`, error.message);
                })
        );
    }

    await Promise.all(sendPromises);
}

sendNotifications().then(() => {
    console.log('Finished.');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
