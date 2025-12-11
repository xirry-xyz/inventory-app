import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogOut, Chrome, AlertCircle, CheckCircle2 } from 'lucide-react';

const SettingsPage = ({
    user,
    userId,
    configError,
    showAuthModal,
    setShowAuthModal,
    handleGoogleSignIn,
    handleSignOut,
    showStatus
}) => {
    const isGoogleUser = !!user && !!user.uid;

    return (
        <Card>
            <CardHeader>
                <CardTitle>用户与应用设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">登录状态</h3>
                    {isGoogleUser ? (
                        <>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-green-600 font-bold text-lg">
                                    <CheckCircle2 className="h-5 w-5" />
                                    已通过 Google 登录
                                </div>
                                <p className="text-sm text-muted-foreground">用户: {user.email || user.displayName || 'Google 用户'}</p>
                                <p className="text-xs text-muted-foreground/50 break-all font-mono">ID: {userId}</p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={handleSignOut}
                                className="mt-4"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                注销
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-destructive font-bold text-lg">
                                    <AlertCircle className="h-5 w-5" />
                                    未登录
                                </div>
                                <p className="text-sm text-muted-foreground">当前无法同步数据，请登录。</p>
                            </div>
                            {!configError && (
                                <Button
                                    onClick={() => setShowAuthModal(true)}
                                    className="mt-4"
                                >
                                    <Chrome className="mr-2 h-4 w-4" />
                                    登录以同步
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {configError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>配置错误</AlertTitle>
                        <AlertDescription>
                            {configError}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Diagnostics Panel */}
                <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-4 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> 诊断信息
                    </h3>
                    <div className="text-xs font-mono space-y-1 break-all">
                        <DebugInfo user={user} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Internal Debug Component
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { useToast } from "@/hooks/use-toast";
import { getMessaging, getToken } from "firebase/messaging";

const DebugInfo = ({ user }) => {
    const [info, setInfo] = useState({ loading: true });
    const { toast } = useToast();
    const [repairing, setRepairing] = useState(false);

    const check = async () => {
        setInfo(prev => ({ ...prev, loading: true }));
        try {
            // Check if user doc exists
            const userRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
            const snap = await getDoc(userRef);
            const data = snap.exists() ? snap.data() : null;

            // Check default chores
            const choresRef = collection(db, `artifacts/${appId}/users/${user.uid}/chores`);
            const choresSnap = await getDocs(choresRef);

            setInfo({
                loading: false,
                appId: appId,
                path: `artifacts/${appId}/users/${user.uid}`,
                exists: snap.exists(),
                tokenCount: data?.fcmTokens?.length || 0,
                tokens: data?.fcmTokens || [],
                choreCount: choresSnap.size, // Add this
                permission: typeof Notification !== 'undefined' ? Notification.permission : 'Unsupported',
                vapidKey: !!import.meta.env.VITE_FIREBASE_VAPID_KEY,
                swStatus: 'navigator' in window && 'serviceWorker' in navigator
                    ? (await navigator.serviceWorker.getRegistration() ? 'Active' : 'Missing')
                    : 'Unsupported'
            });
        } catch (e) {
            setInfo({ loading: false, error: e.message });
        }
    };

    useEffect(() => {
        if (!user) {
            setInfo({ loading: false, error: 'No User' });
            return;
        }
        check();
    }, [user]);

    const handleRepair = async () => {
        if (!user) return;
        setRepairing(true);
        try {
            // 1. Try to get Token first
            let currentToken = null;
            if ('Notification' in window && Notification.permission === 'granted') {
                const messaging = getMessaging();
                const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                if (vapidKey) {
                    currentToken = await getToken(messaging, { vapidKey });
                }
            }

            // 2. Force Write User Doc
            const userRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
            const updateData = {
                email: user.email,
                lastSeen: new Date().toISOString()
            };

            if (currentToken) {
                updateData.fcmTokens = arrayUnion(currentToken);
            }

            await setDoc(userRef, updateData, { merge: true });

            toast({
                title: "修复成功",
                description: "用户数据已强制写入数据库，Token: " + (currentToken ? "已更新" : "未获取(权限/环境限制)")
            });

            // 3. Refresh info
            await check();

        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "修复失败",
                description: e.message
            });
        } finally {
            setRepairing(false);
        }
    };

    if (info.loading) return <div>Checking DB...</div>;
    if (info.error) return <div className="text-red-500">Error: {info.error}</div>;

    return (
        <>
            <p><span className="text-muted-foreground">App ID:</span> {info.appId}</p>
            <p><span className="text-muted-foreground">Path:</span> {info.path}</p>
            <p><span className="text-muted-foreground">Doc Exists:</span> {info.exists ? '✅ YES' : '❌ NO'}</p>
            <p><span className="text-muted-foreground">Token Count:</span> {info.tokenCount}</p>
            <p><span className="text-muted-foreground">Default Chores:</span> {info.choreCount}</p>
            {info.tokenCount > 0 && (
                <div className="mt-1 pl-2 border-l-2 border-green-500/20">
                    {info.tokens.map((t, i) => (
                        <p key={i} className="truncate opacity-50">{t.substring(0, 10)}...</p>
                    ))}
                </div>
            )}

            <div className="my-2 border-t pt-2">
                <p><span className="text-muted-foreground">Client Permission:</span> {info.permission}</p>
                <p><span className="text-muted-foreground">VAPID Key:</span> {info.vapidKey ? '✅ Configured' : '❌ Missing'}</p>
                <p><span className="text-muted-foreground">Service Worker:</span> {info.swStatus}</p>
            </div>

            <div className="pt-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRepair}
                    disabled={repairing}
                    className="h-7 text-xs w-full"
                >
                    {repairing ? "修复中..." : "🛠️ 强制同步数据 & 获取Token"}
                </Button>
            </div>
        </>
    );
};

export default SettingsPage;
