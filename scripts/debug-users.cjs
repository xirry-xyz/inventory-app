
const admin = require('firebase-admin');

// Get Service Account
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

if (!serviceAccount) {
    console.error('FIREBASE_SERVICE_ACCOUNT env var missing.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugUsers() {
    console.log('=== User Diagnostics ===');

    // 1. Try to list users normally (what the notification script does)
    const appId = 'default-app-id';
    console.log(`\n1. Checking standard path: artifacts/${appId}/users`);
    const usersRef = db.collection(`artifacts/${appId}/users`);
    const usersSnap = await usersRef.get();

    if (usersSnap.empty) {
        console.log('❌ No user documents found in standard list.');
    } else {
        console.log(`✅ Found ${usersSnap.size} user documents.`);
        usersSnap.forEach(doc => {
            const data = doc.data();
            const tokens = data.fcmTokens || [];
            console.log(`   - User [${doc.id}]: ${tokens.length} tokens.`);
        });
    }

    // 2. Try to find "Phantom" users via 'chores' subcollection
    console.log(`\n2. Scanning for 'phantom' users via Chores...`);
    // Note: collectionGroup queries all collections named 'chores' regardless of path
    const choresSnap = await db.collectionGroup('chores').get();

    if (choresSnap.empty) {
        console.log('❌ No chores found in entire database.');
    } else {
        const userIds = new Set();
        choresSnap.forEach(doc => {
            // Path: artifacts/{appId}/users/{uid}/chores/{choreId}
            // Parent: chores
            // Parent.Parent: {uid}
            const userDoc = doc.ref.parent.parent;
            if (userDoc) {
                userIds.add(userDoc.id);
            }
        });

        console.log(`ℹ️ Found ${userIds.size} unique User IDs from chores:`, Array.from(userIds));

        for (const uid of userIds) {
            const userDocRef = db.doc(`artifacts/${appId}/users/${uid}`);
            const docSnap = await userDocRef.get();
            if (docSnap.exists) {
                console.log(`   - User [${uid}]: ✅ Exists. Tokens: ${(docSnap.data().fcmTokens || []).length}`);
            } else {
                console.log(`   - User [${uid}]: ❌ MISSING (Phantom). This user has data but no parent document.`);
            }
        }
    }
}

debugUsers().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
