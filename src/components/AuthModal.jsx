import React, { useState } from 'react';
import { Dialog, DialogContent, Typography, Button, Box, CircularProgress } from '@mui/material';
import { Google } from '@mui/icons-material';

const AuthModal = ({ isOpen, handleGoogleSignIn, showStatus }) => {
    const [authLoading, setAuthLoading] = useState(false);

    const handleSignIn = async () => {
        setAuthLoading(true);
        try {
            await handleGoogleSignIn(showStatus);
        } finally {
            setAuthLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog
            open={isOpen}
            PaperProps={{
                sx: { borderRadius: 4, maxWidth: 400, width: '100%', p: 2 }
            }}
        >
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    数据云同步
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                    首次使用，请通过 Google 账号登录以启用同步。
                </Typography>

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSignIn}
                    disabled={authLoading}
                    startIcon={authLoading ? <CircularProgress size={20} color="inherit" /> : <Google />}
                    sx={{ height: 56, mb: 3 }}
                >
                    {authLoading ? '正在登录...' : '使用 Google 账号登录'}
                </Button>

                <Typography variant="caption" color="text.disabled" align="center">
                    请确保已在 Firebase 控制台启用 Google 登录。
                </Typography>
            </DialogContent>
        </Dialog>
    );
};

export default AuthModal;
