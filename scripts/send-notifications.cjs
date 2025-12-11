
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
    // Path: artifacts/{appId}/users/{uid}
    const usersRef = db.collection(`artifacts/${TARGET_APP_ID}/users`);
    const usersSnap = await usersRef.get();

    console.log(`Found ${usersSnap.size} user(s). Processing in parallel...`);

    const now = new Date();

    // Process all users in parallel
    const userPromises = usersSnap.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        if (fcmTokens.length === 0) {
            console.log(`Skipping User ${userDoc.id}: No tokens.`);
            return;
        }

        console.log(`User ${userDoc.id}: Found ${fcmTokens.length} tokens. Checking chores...`);

        let allChores = [];

        // Parallel Fetch 1: Root Chores
        const rootChoresPromise = userDoc.ref.collection('chores').get().then(snap => {
            return snap.docs.map(doc => doc.data());
        });

        // Parallel Fetch 2: Lists Chores
        const listsPromise = userDoc.ref.collection('lists').get().then(async (listsSnap) => {
            if (listsSnap.empty) return [];

            // For each list, fetch chores in parallel
            const listChoresPromises = listsSnap.docs.map(listDoc =>
                listDoc.ref.collection('chores').get().then(snap =>
                    snap.docs.map(doc => doc.data())
                )
            );

            const listChoresResults = await Promise.all(listChoresPromises);
            return listChoresResults.flat();
        });

        // Wait for both sources
        const [rootChores, listChores] = await Promise.all([rootChoresPromise, listsPromise]);
        allChores = [...rootChores, ...listChores];

        console.log(`User ${userDoc.id}: Found ${allChores.length} total chores.`);

        if (allChores.length === 0) return;

        // Filter Due Chores
        const choresDue = allChores.filter(chore => {
            if (!chore.nextDue) return false;
            const dueDate = new Date(chore.nextDue);
            return dueDate <= now;
        }).map(c => c.name);

        if (choresDue.length > 0) {
            console.log(`User ${userDoc.id} has ${choresDue.length} due chores. sending...`);

            // Send message
            const message = {
                notification: {
                    title: 'HomeSync 家务提醒',
                    body: `今天有 ${choresDue.length} 项家务待完成: ${choresDue.slice(0, 3).join(', ')}${choresDue.length > 3 ? '...' : ''}`
                },
                tokens: fcmTokens
            };

            try {
                const response = await messaging.sendEachForMulticast(message);
                console.log(`User ${userDoc.id}: Sent! Success: ${response.successCount}, Fail: ${response.failureCount}`);
            } catch (error) {
                console.log(`User ${userDoc.id}: Error sending message:`, error);
            }
        }
    });

    await Promise.all(userPromises);
}

sendNotifications().then(() => {
    console.log('Finished.');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
