import { useState, useEffect } from 'react';
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db, appId } from '../firebase';
import { useToast } from "@/hooks/use-toast";

export const usePushToken = (user) => {
    const [token, setToken] = useState(null);
    const [tokenError, setTokenError] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState('default');
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;

        const requestPermissionAndScan = async () => {
            // Safety check for browsers without Notification API
            if (typeof Notification === 'undefined' || !('Notification' in window)) {
                console.log("This browser does not support notifications.");
                setTokenError("Browser Notification API missing");
                return;
            }

            try {
                // Check if Firebase Messaging is supported
                const supported = await isSupported();
                if (!supported) {
                    setTokenError("Firebase Messaging Not Supported");
                    return;
                }

                const messaging = getMessaging();

                const permission = await Notification.requestPermission();
                setPermissionStatus(permission);

                if (permission === 'granted') {
                    // Try to get token
                    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                    if (!vapidKey) {
                        const msg = "VITE_FIREBASE_VAPID_KEY is missing.";
                        console.warn(msg);
                        setTokenError("Configuration Missing (VAPID Key)");
                        toast({
                            variant: "destructive",
                            title: "配置缺失",
                            description: "VITE_FIREBASE_VAPID_KEY 未配置，无法接收通知！"
                        });
                        return;
                    }

                    try {
                        const currentToken = await getToken(messaging, { vapidKey });
                        if (currentToken) {
                            setToken(currentToken);
                            setTokenError(null);
                            // Save token to Firestore
                            const userRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
                            await setDoc(userRef, {
                                fcmTokens: arrayUnion(currentToken)
                            }, { merge: true });

                            console.log("Token saved/updated for user:", user.uid);
                            // Only toast if it's a fresh connection success (avoids spam on reload if already connected, 
                            // but for now strict feedback is better)
                        } else {
                            console.log('No registration token available.');
                            setTokenError("No Token Available");
                        }
                    } catch (e) {
                        console.error('An error occurred while retrieving token. ', e);
                        setTokenError(e.message);
                    }
                } else {
                    console.log('Notification permission denied.');
                    setTokenError("Permission Denied");
                }
            } catch (err) {
                console.error('An error occurred while retrieving token. ', err);
                setTokenError(err.message);
                toast({
                    variant: "destructive",
                    title: "通知服务出错",
                    description: err.message
                });
            }
        };

        requestPermissionAndScan();
    }, [user, toast]);


    return { token, error: tokenError, permissionStatus };
};
