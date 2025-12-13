import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogOut, Chrome, AlertCircle, CheckCircle2, Bell, Loader2 } from 'lucide-react';

const SettingsPage = ({
    user,
    userId,
    configError,
    showAuthModal,
    setShowAuthModal,
    handleGoogleSignIn,
    handleSignOut,

    showStatus,

    pushToken,
    pushError,
    permissionStatus,
    enablePush,
    pushLoading
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
                                <div className="flex items-center gap-2 text-sm mt-2">
                                    <span className="text-muted-foreground">推送服务:</span>
                                    {pushToken ? (
                                        <span className="text-green-600 flex items-center gap-1 font-medium">
                                            <CheckCircle2 className="h-3 w-3" /> 已连接
                                        </span>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-destructive flex items-center gap-1 font-medium">
                                                <AlertCircle className="h-3 w-3" /> 未连接
                                            </span>
                                            {pushError && <span className="text-xs text-muted-foreground">原因: {pushError}</span>}
                                            {permissionStatus === 'denied' && <span className="text-xs text-destructive font-bold">请检查浏览器通知权限！</span>}
                                            {/* Show button if default OR if granted but disconnected (error exists or not loading) */}
                                            {/* Simplified logic: If not connected and not loading, show button/instructions */}
                                            {(!pushToken && !pushLoading) && (
                                                permissionStatus === 'default' ? (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-6 text-xs px-2 mt-1 w-fit"
                                                        onClick={enablePush}
                                                    >
                                                        <Bell className="w-3 h-3 mr-1" /> 开启通知推送
                                                    </Button>
                                                ) : permissionStatus === 'granted' ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-xs px-2 mt-1 w-fit"
                                                        onClick={enablePush}
                                                    >
                                                        <Bell className="w-3 h-3 mr-1" /> 重试连接
                                                    </Button>
                                                ) : null
                                            )}
                                            {pushLoading && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" /> 连接中...
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
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



                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">高级设置</h3>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (!user) return;
                            if (!confirm('确定要重置通知设置吗？这将清除所有已注册的设备，您需要在刷新页面后重新授权。')) return;

                            try {
                                const { doc, updateDoc, deleteField } = await import('firebase/firestore');
                                const { db, appId } = await import('../firebase');

                                const userRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
                                await updateDoc(userRef, {
                                    fcmTokens: deleteField()
                                });

                                showStatus("通知设置已重置，正在刷新...", false);
                                setTimeout(() => window.location.reload(), 1500);
                            } catch (e) {
                                console.error(e);
                                showStatus("重置失败: " + e.message, true);
                            }
                        }}
                    >
                        <Bell className="mr-2 h-4 w-4" />
                        重置通知推送
                    </Button>
                    <p className="text-xs text-muted-foreground">如果遇到收不到通知或重复通知的问题，请尝试此操作。</p>
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
            </CardContent>
        </Card >
    );
};

export default SettingsPage;
