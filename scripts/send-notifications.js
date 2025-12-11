
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
    console.log('Starting notification check...');
    // We need to iterate over users
    // Path: artifacts/{appId}/users/{uid}

    // Hardcoded logic for "default-app-id" if that is what we used in frontend.
    // In src/firebase.js: let appId = 'default-app-id';
    // So we use that.

    const usersRef = db.collection(`artifacts/${TARGET_APP_ID}/users`);
    const usersSnap = await usersRef.get();

    if (usersSnap.empty) {
        console.log('No users found.');
        return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        if (fcmTokens.length === 0) continue;

        // Check chores for this user
        // Chores path: artifacts/{appId}/users/{uid}/chores
        const choresRef = userDoc.ref.collection('chores');
        const choresSnap = await choresRef.get();

        if (choresSnap.empty) continue;

        let choresDue = [];

        choresSnap.forEach(doc => {
            const chore = doc.data();
            if (chore.nextDue) {
                const dueDate = new Date(chore.nextDue);
                const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

                if (dueDay <= today) {
                    choresDue.push(chore.name);
                }
            }
        });

        if (choresDue.length > 0) {
            console.log(`User ${userDoc.id} has ${choresDue.length} due chores. Sending to ${fcmTokens.length} tokens.`);

            // Send message
            const message = {
                notification: {
                    title: 'HomeSync 家务提醒',
                    body: `今天有 ${choresDue.length} 项家务待完成: ${choresDue.slice(0, 3).join(', ')}${choresDue.length > 3 ? '...' : ''}`
                },
                tokens: fcmTokens
            };

            try {
                const response = await messaging.sendMulticast(message);
                console.log(response.successCount + ' messages were sent successfully');

                if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(fcmTokens[idx]);
                        }
                    });
                    console.log('List of tokens that caused failures: ' + failedTokens);
                    // Optional: remove failed tokens from DB
                }
            } catch (error) {
                console.log('Error sending message:', error);
            }
        }
    }
}

sendNotifications().then(() => {
    console.log('Finished.');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
