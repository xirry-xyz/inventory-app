import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Button
} from '@mui/material';
import { Logout, Login } from '@mui/icons-material';
// Using Lucide icons as they were used in App.jsx, or switch to MUI icons for consistency.
// App.jsx used: import { LogOut, Chrome } from 'lucide-react';
import { LogOut, Chrome } from 'lucide-react';

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
            <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>用户与应用设置</Typography>
                <Stack spacing={3}>
                    <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>登录状态</Typography>
                        {isGoogleUser ? (
                            <>
                                <Typography variant="h6" color="success.main" fontWeight="bold">已通过 Google 登录</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>用户: {user.email || user.displayName || 'Google 用户'}</Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, wordBreak: 'break-all' }}>ID: {userId}</Typography>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<LogOut size={16} />}
                                    onClick={handleSignOut}
                                    sx={{ mt: 3 }}
                                >
                                    注销
                                </Button>
                            </>
                        ) : (
                            <>
                                <Typography variant="h6" color="error.main" fontWeight="bold">未登录</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>当前无法同步数据，请登录。</Typography>
                                {!configError && (
                                    <Button
                                        variant="contained"
                                        startIcon={<Chrome size={16} />}
                                        onClick={() => setShowAuthModal(true)}
                                        sx={{ mt: 3 }}
                                    >
                                        登录以同步
                                    </Button>
                                )}
                            </>
                        )}
                    </Box>
                    {configError && (
                        <Box sx={{ p: 3, bgcolor: 'error.lighter', color: 'error.dark', borderRadius: 2 }}>
                            <Typography fontWeight="bold">配置错误：</Typography>
                            <Typography>{configError}</Typography>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default SettingsPage;
