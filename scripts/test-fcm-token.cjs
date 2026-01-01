/**
 * Test FCM token validity for a specific user
 * Usage: FIREBASE_SERVICE_ACCOUNT=... node scripts/test-fcm-token.cjs [userId]
 */

const admin = require('firebase-admin');

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
const messaging = admin.messaging();
const APP_ID = 'default-app-id';

// Target user ID from command line or default
const targetUserId = process.argv[2] || null;

async function testTokens() {
    console.log('=== FCM Token Diagnostic Tool ===\n');

    const usersRef = db.collection(`artifacts/${APP_ID}/users`);
    let usersSnap;

    if (targetUserId) {
        const userDoc = await usersRef.doc(targetUserId).get();
        if (!userDoc.exists) {
            console.error(`User ${targetUserId} not found!`);
            process.exit(1);
        }
        usersSnap = { docs: [userDoc] };
    } else {
        usersSnap = await usersRef.get();
    }

    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const tokens = userData.fcmTokens || [];
        const email = userData.email || 'N/A';
        const displayName = userData.displayName || 'N/A';

        console.log(`\n━━━ User: ${userId} ━━━`);
        console.log(`    Email: ${email}`);
        console.log(`    Display Name: ${displayName}`);
        console.log(`    Token Count: ${tokens.length}`);

        if (tokens.length === 0) {
            console.log('    ⚠️  No FCM tokens registered!');
            continue;
        }

        // Test each token with a dry-run message
        console.log('\n    Testing tokens...');

        const uniqueTokens = [...new Set(tokens)];
        if (uniqueTokens.length !== tokens.length) {
            console.log(`    ⚠️  Found ${tokens.length - uniqueTokens.length} duplicate token(s)`);
        }

        const tokensToRemove = [];

        for (let i = 0; i < uniqueTokens.length; i++) {
            const token = uniqueTokens[i];
            const shortToken = token.substring(0, 30) + '...';

            try {
                // Send a dry-run message to verify token validity
                await messaging.send({
                    token: token,
                    notification: {
                        title: 'Test',
                        body: 'Test'
                    }
                }, true); // dryRun = true

                console.log(`    [${i + 1}] ✅ Valid: ${shortToken}`);
            } catch (error) {
                const errorCode = error.code;
                console.log(`    [${i + 1}] ❌ Invalid: ${shortToken}`);
                console.log(`        Error: ${errorCode} - ${error.message}`);

                // Mark for removal if it's an unrecoverable token error
                if (errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered' ||
                    errorCode === 'messaging/mismatched-credential') {
                    tokensToRemove.push(token);
                }
            }
        }

        // Offer to clean up invalid tokens
        if (tokensToRemove.length > 0) {
            console.log(`\n    🧹 Cleaning up ${tokensToRemove.length} invalid token(s)...`);
            await userDoc.ref.update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
            });
            console.log(`    ✅ Removed invalid tokens from Firestore.`);
        }

        // Show token age info if available
        if (userData.fcmTokenUpdatedAt) {
            const updatedAt = userData.fcmTokenUpdatedAt.toDate();
            const ageHours = Math.round((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60));
            console.log(`\n    Token last updated: ${updatedAt.toISOString()} (${ageHours}h ago)`);
        }
    }

    console.log('\n=== Diagnostic Complete ===');
}

testTokens().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
