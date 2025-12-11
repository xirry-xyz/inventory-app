import { useState, useEffect } from 'react';
import { getMessaging, getToken } from "firebase/messaging";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db, appId } from '../firebase';
import { toast } from "sonner"; // Import sonner for visibility

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
                    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                    if (!vapidKey) {
                        console.warn("VITE_FIREBASE_VAPID_KEY is missing.");
                        toast.error("VITE_FIREBASE_VAPID_KEY 未配置，无法接收通知！");
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
                            // Only show success once per session or if it's new could be annoying, 
                            // but for debugging this is crucial.
                            // toast.success("通知服务连接成功！"); 
                        } catch (e) {
                            console.error("Error saving token:", e);
                            toast.error(`Token 保存失败: ${e.message}`);
                        }
                    } else {
                        console.log('No registration token available.');
                    }
                } else {
                    console.log('Notification permission denied.');
                    toast.warning("请开启通知权限以接收家务提醒");
                }
            } catch (err) {
                console.error('An error occurred while retrieving token. ', err);
                toast.error(`通知服务出错: ${err.message}`);
            }
        };

        requestPermissionAndScan();
    }, [user]);

    return token;
};
