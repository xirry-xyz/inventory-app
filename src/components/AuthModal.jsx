import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setAuthLoading(false)}> {/* Basic close protection */}
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-col items-center text-center">
                    <DialogTitle className="text-xl">数据云同步</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        首次使用，请通过 Google 账号登录以启用同步。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center py-6 space-y-4">
                    <Button
                        size="lg"
                        className="w-full h-12 text-base"
                        onClick={handleSignIn}
                        disabled={authLoading}
                    >
                        {authLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                正在登录...
                            </>
                        ) : (
                            <>
                                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                使用 Google 账号登录
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        请确保已在 Firebase 控制台启用 Google 登录。
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthModal;
