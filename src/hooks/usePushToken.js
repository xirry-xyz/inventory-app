import { useState, useEffect } from 'react';
import { getMessaging, getToken } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, appId } from '../firebase';

export const usePushToken = (user) => {
    const [token, setToken] = useState(null);

    useEffect(() => {
        if (!user) return;

        const messaging = getMessaging();

        const requestPermissionAndScan = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // Try to get token
                    // NOTE: VAPID key is required. We will expect it in env var VITE_FIREBASE_VAPID_KEY
                    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                    if (!vapidKey) {
                        console.warn("VITE_FIREBASE_VAPID_KEY is missing. Push notifications will not work.");
                        return;
                    }

                    const currentToken = await getToken(messaging, { vapidKey });
                    if (currentToken) {
                        setToken(currentToken);
                        // Save token to Firestore
                        const userRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
                        // Use arrayUnion to add without duplicates
                        await updateDoc(userRef, {
                            fcmTokens: arrayUnion(currentToken)
                        });
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }
                }
            } catch (err) {
                console.log('An error occurred while retrieving token. ', err);
            }
        };

        requestPermissionAndScan();
    }, [user]);

    return token;
};
