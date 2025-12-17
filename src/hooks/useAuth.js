import { useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    signInWithCustomToken,
    updateProfile
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth, googleProvider, initializationError, initialAuthToken, appId } from '../firebase';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [configError, setConfigError] = useState(initializationError);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        if (configError || !auth) {
            setIsAuthReady(true);
            setUserId('LOCAL_USER_MODE');
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                if (currentUser.isAnonymous) {
                    signOut(auth).then(() => {
                        setUser(null);
                        setUserId('LOCAL_USER_MODE');
                        setShowAuthModal(true);
                    });
                    return;
                }

                setUser(currentUser);
                setUserId(currentUser.uid);
                setShowAuthModal(false);

            } else {
                setUser(null);
                setUserId('LOCAL_USER_MODE');
                setShowAuthModal(true);
            }

            if (!isAuthReady) {
                setIsAuthReady(true);
            }
        });

        if (!isAuthReady && initialAuthToken) {
            signInWithCustomToken(auth, initialAuthToken).catch(e => {
                console.error("Custom Token 认证失败，请手动登录:", e);
            });
        }

        if (!isAuthReady && !auth.currentUser) {
            const timer = setTimeout(() => {
                if (!auth.currentUser) {
                    setShowAuthModal(true);
                }
            }, 500);
            return () => { unsubscribe(); clearTimeout(timer); };
        }

        return () => unsubscribe();
    }, [configError, isAuthReady]);

    const handleGoogleSignIn = async (showStatus) => {
        if (!auth) {
            showStatus('Firebase Auth 未初始化，无法登录。', true, 3000);
            return;
        }

        try {
            await signInWithPopup(auth, googleProvider);
            showStatus('Google 登录成功！', false);
            setShowAuthModal(false);
        } catch (error) {
            if (error.code === 'auth/unauthorized-domain') {
                showStatus('Google 登录失败: 请确保已在 Firebase 控制台的 Auth > Settings > Authorized domains 中添加此域名。', true, 10000);
            } else if (error.code !== 'auth/popup-closed-by-user') {
                showStatus(`Google 登录失败: ${error.message}`, true, 5000);
            }
        }
    };

    const handleSignOut = async (showStatus) => {
        try {
            await signOut(auth);
            showStatus('已成功注销', false);
        } catch (e) {
            showStatus(`注销失败: ${e.message}`, true, 5000);
        }
    };

    const updateDisplayName = async (newName, showStatus) => {
        if (!auth.currentUser) return false;

        try {
            // 1. Update Auth Profile
            await updateProfile(auth.currentUser, {
                displayName: newName
            });

            // 2. Update Firestore User Document
            const userRef = doc(db, `artifacts/${appId}/users/${auth.currentUser.uid}`);
            await updateDoc(userRef, {
                displayName: newName
            });

            // 3. Update local state
            // Force a new object to trigger re-renders
            setUser({ ...auth.currentUser, displayName: newName });

            showStatus('昵称修改成功！', false);
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            showStatus(`修改失败: ${error.message}`, true);
            return false;
        }
    };

    return {
        user,
        userId,
        isAuthReady,
        configError,
        showAuthModal,
        setShowAuthModal,
        handleGoogleSignIn,
        handleSignOut,
        handleGoogleSignIn,
        handleSignOut,
        updateDisplayName,
        setConfigError
    };
};
