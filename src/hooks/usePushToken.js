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
    const [isLoading, setIsLoading] = useState(false);

    const register = async () => {
        setIsLoading(true);
        setTokenError(null);

        // Safety check for browsers without Notification API
        if (typeof Notification === 'undefined' || !('Notification' in window)) {
            console.log("This browser does not support notifications.");
            setTokenError("Browser Notification API missing");
            setIsLoading(false);
            return;
        }

        try {
            // Check if Firebase Messaging is supported
            const supported = await isSupported();
            if (!supported) {
                setTokenError("Firebase Messaging Not Supported");
                setIsLoading(false);
                return;
            }

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
                    setIsLoading(false);
                    return;
                }

                const messaging = getMessaging();

                try {
                    // Explicitly register Service Worker to avoid hanging
                    let registration;
                    try {
                        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                        console.log('Service Worker registered with scope:', registration.scope);
                    } catch (swError) {
                        console.error('SW registration failed:', swError);
                        throw new Error(`SW Register Failed: ${swError.message}`);
                    }

                    // Get Token with Service Worker Registration
                    const currentToken = await getToken(messaging, {
                        vapidKey,
                        serviceWorkerRegistration: registration
                    });

                    if (currentToken) {
                        setToken(currentToken);
                        setTokenError(null);
                        // Save token to Firestore
                        const userRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
                        await setDoc(userRef, {
                            fcmTokens: arrayUnion(currentToken)
                        }, { merge: true });

                        console.log("Token saved/updated for user:", user.uid);
                        toast({
                            title: "推送连接成功",
                            description: "设备已注册，可以接收通知。",
                            duration: 2000
                        });
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
                setTokenError("Permission Denied (User Blocked)");
            }
        } catch (err) {
            console.error('An error occurred during registration. ', err);
            setTokenError(err.message);
            toast({
                variant: "destructive",
                title: "通知服务出错",
                description: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        // Check current permission status without asking
        if (typeof Notification !== 'undefined' && 'Notification' in window) {
            setPermissionStatus(Notification.permission);
            // If already granted, try to auto-register (which will set loading)
            if (Notification.permission === 'granted') {
                register();
            }
        }
    }, [user, toast]);

    return { token, error: tokenError, permissionStatus, register, isLoading };
};
