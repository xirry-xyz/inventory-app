import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTheme } from "./ThemeProvider"
import { Sun, Moon, Laptop, CheckCircle2, AlertCircle, Bell, Loader2, LogOut, Chrome } from "lucide-react"
import { ConfirmDialog } from "./ConfirmDialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
    const { theme, setTheme } = useTheme()

    return (
        <Card>
            <CardHeader>
                <CardTitle>用户与应用设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Theme Settings */}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">外观设置</h3>
                    <RadioGroup defaultValue={theme} onValueChange={setTheme} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="light" id="light" />
                            <Label htmlFor="light" className="flex items-center gap-1 cursor-pointer">
                                <Sun className="h-4 w-4" /> 亮色
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dark" id="dark" />
                            <Label htmlFor="dark" className="flex items-center gap-1 cursor-pointer">
                                <Moon className="h-4 w-4" /> 深色
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="system" id="system" />
                            <Label htmlFor="system" className="flex items-center gap-1 cursor-pointer">
                                <Laptop className="h-4 w-4" /> 跟随系统
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

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
                                                permissionStatus === 'granted' ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-xs px-2 mt-1 w-fit"
                                                        onClick={enablePush}
                                                    >
                                                        <Bell className="w-3 h-3 mr-1" /> 重试连接
                                                    </Button>
                                                ) : ( // Default catch-all: Show "Enable" for 'default' or any other falsy/unexpected status
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-6 text-xs px-2 mt-1 w-fit"
                                                        onClick={enablePush}
                                                    >
                                                        <Bell className="w-3 h-3 mr-1" /> 开启通知推送
                                                    </Button>
                                                )
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
                    <ConfirmDialog
                        title="确定要重置通知设置吗？"
                        description="这将清除所有已注册的设备，您需要在刷新页面后重新授权。此操作无法撤销。"
                        onConfirm={async () => {
                            if (!user) return;
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
                        <Button variant="outline">
                            <Bell className="mr-2 h-4 w-4" />
                            重置通知推送
                        </Button>
                    </ConfirmDialog>
                    <p className="text-xs text-muted-foreground">如果遇到收不到通知或重复通知的问题，请尝试此操作。</p>

                    {/* Permission Blocked Guidance */}
                    {pushError && pushError.includes("User Blocked") && (
                        <div className="bg-destructive/10 text-destructive text-xs p-3 rounded mt-2 border border-destructive/20">
                            <strong>需要在系统设置中开启：</strong>
                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                <li>回到手机主屏幕</li>
                                <li>打开 <strong>设置 (Settings)</strong></li>
                                <li>找到本应用 <strong>HomeSync</strong> (或网页名称)</li>
                                <li>点击 <strong>通知 (Notifications)</strong></li>
                                <li>开启 <strong>允许通知</strong></li>
                                <li>完成后回到此处刷新页面</li>
                            </ol>
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-muted-foreground/30 font-mono">
                        v{__APP_VERSION__}
                    </p>
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
