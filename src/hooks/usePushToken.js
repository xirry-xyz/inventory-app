import { useState, useEffect } from 'react';
import { getMessaging, getToken } from "firebase/messaging";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db, appId } from '../firebase';
import { useToast } from "@/hooks/use-toast";

export const usePushToken = (user) => {
    const [token, setToken] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;

        const messaging = getMessaging();

        const requestPermissionAndScan = async () => {
            // Safety check for browsers without Notification API (e.g. strict iOS settings or non-PWA context on old iOS)
            if (typeof Notification === 'undefined' || !('Notification' in window)) {
                console.log("This browser does not support notifications.");
                // Optional: Toast warning, or just silent fail to avoid annoying user on unsupported devices
                return;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // Try to get token
                    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                    if (!vapidKey) {
                        console.warn("VITE_FIREBASE_VAPID_KEY is missing.");
                        toast({
                            variant: "destructive",
                            title: "配置缺失",
                            description: "VITE_FIREBASE_VAPID_KEY 未配置，无法接收通知！"
                        });
                        return;
                    }

                    const currentToken = await getToken(messaging, { vapidKey });
                    if (currentToken) {
                        setToken(currentToken);
                        // Save token to Firestore
                        const userRef = doc(db, `artifacts/${appId}/users/${user.uid}`);

                        try {
                            await setDoc(userRef, {
                                fcmTokens: arrayUnion(currentToken)
                            }, { merge: true });
                            console.log("Token saved/updated for user:", user.uid);
                            console.log("Token saved/updated for user:", user.uid);
                            // silent success -> explicit success for debug
                            toast({
                                title: "推送连接成功",
                                description: "设备已注册，可以接收通知。",
                                duration: 2000
                            });
                        } catch (e) {
                            console.error("Error saving token:", e);
                            toast({
                                variant: "destructive",
                                title: "Token 保存失败",
                                description: e.message
                            });
                        }
                    } else {
                        console.log('No registration token available.');
                    }
                } else {
                    console.log('Notification permission denied.');
                    // Silent fail - don't annoy user every time they open app
                }
            } catch (err) {
                console.error('An error occurred while retrieving token. ', err);
                toast({
                    variant: "destructive",
                    title: "通知服务出错",
                    description: err.message
                });
            }
        };

        requestPermissionAndScan();
    }, [user, toast]);

    return token;
};
