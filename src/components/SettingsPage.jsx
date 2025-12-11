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
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';

const DebugInfo = ({ user }) => {
    const [info, setInfo] = useState({ loading: true });

    useEffect(() => {
        if (!user) {
            setInfo({ loading: false, error: 'No User' });
            return;
        }
        const check = async () => {
            try {
                // Check if user doc exists
                const userRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
                const snap = await getDoc(userRef);
                const data = snap.exists() ? snap.data() : null;

                setInfo({
                    loading: false,
                    appId: appId,
                    path: `artifacts/${appId}/users/${user.uid}`,
                    exists: snap.exists(),
                    tokenCount: data?.fcmTokens?.length || 0,
                    tokens: data?.fcmTokens || []
                });
            } catch (e) {
                setInfo({ loading: false, error: e.message });
            }
        };
        check();
    }, [user]);

    if (info.loading) return <div>Checking DB...</div>;
    if (info.error) return <div className="text-red-500">Error: {info.error}</div>;

    return (
        <>
            <p><span className="text-muted-foreground">App ID:</span> {info.appId}</p>
            <p><span className="text-muted-foreground">Path:</span> {info.path}</p>
            <p><span className="text-muted-foreground">Doc Exists:</span> {info.exists ? '✅ YES' : '❌ NO'}</p>
            <p><span className="text-muted-foreground">Tokens:</span> {info.tokenCount}</p>
            {info.tokenCount > 0 && (
                <div className="mt-1 pl-2 border-l-2 border-green-500/20">
                    {info.tokens.map((t, i) => (
                        <p key={i} className="truncate opacity-50">{t.substring(0, 10)}...</p>
                    ))}
                </div>
            )}
        </>
    );
};

export default SettingsPage;
