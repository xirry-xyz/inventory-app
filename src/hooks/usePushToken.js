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
                            // silent success
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
                    toast({
                        description: "请开启通知权限以接收家务提醒"
                    });
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
