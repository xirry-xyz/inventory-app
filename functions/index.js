const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Trigger when a chore is updated in a specific list
// Path: artifacts/{appId}/users/{ownerId}/lists/{listId}/chores/{choreId}
exports.onChoreCompleted = functions.firestore
    .document('artifacts/{appId}/users/{ownerId}/lists/{listId}/chores/{choreId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const oldValue = change.before.data();

        // 1. Check if the chore was just completed
        // We check if 'lastCompleted' changed and is newer than before
        if (newValue.lastCompleted === oldValue.lastCompleted) {
            return null; // No change in completion status
        }

        const { appId, ownerId, listId, choreId } = context.params;
        const completedByName = newValue.completedByName || '有人';
        const completedByUid = newValue.completedBy;
        const choreName = newValue.name || '家务';

        console.log(`Chore ${choreId} completed by ${completedByName} in list ${listId}`);

        try {
            // 2. Get the List document to find members
            const listRef = db.doc(`artifacts/${appId}/users/${ownerId}/lists/${listId}`);
            const listSnap = await listRef.get();

            if (!listSnap.exists) {
                console.log(`List ${listId} not found.`);
                return null;
            }

            const listData = listSnap.data();
            const members = listData.members || []; // Array of UIDs

            // 3. Filter members to notify (exclude the completer)
            const recipients = members.filter(uid => uid !== completedByUid);

            if (recipients.length === 0) {
                console.log('No recipients to notify.');
                return null;
            }

            console.log(`Notifying ${recipients.length} users:`, recipients);

            // 4. Fetch FCM tokens for each recipient
            // Path: artifacts/{appId}/users/{uid}
            const tokens = [];
            const userPromises = recipients.map(async (uid) => {
                const userDoc = await db.doc(`artifacts/${appId}/users/${uid}`).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
                        tokens.push(...userData.fcmTokens);
                    }
                }
            });

            await Promise.all(userPromises);

            if (tokens.length === 0) {
                console.log('No valid tokens found for recipients.');
                return null;
            }

            // Remove duplicates
            const uniqueTokens = [...new Set(tokens)];

            // 5. Send Notification
            const message = {
                notification: {
                    title: '家务完成通知',
                    body: `太棒了！${completedByName} 已完成家务：${choreName}`
                },
                data: {
                    listId: listId,
                    choreId: choreId,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standard for some SDKs, or handle in client
                },
                tokens: uniqueTokens
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`Notifications sent: Success ${response.successCount}, Failure ${response.failureCount}`);

            // Cleanup invalid tokens if any failure (Optional enhancement)

            return null;

        } catch (error) {
            console.error('Error sending chore notification:', error);
            return null;
        }
    });
