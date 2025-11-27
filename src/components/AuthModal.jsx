import React, { useState } from 'react';
import { Loader, Chrome } from 'lucide-react';

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
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-4xl shadow-2xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                    数据云同步
                </h3>
                <p className="text-sm text-gray-500 mb-8 text-center">
                    首次使用，请通过 Google 账号登录以启用同步。
                </p>

                <button
                    onClick={handleSignIn}
                    className={`w-full py-3 rounded-3xl font-semibold flex justify-center items-center space-x-2 transition duration-200 shadow-xl 
                        ${authLoading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                    disabled={authLoading}
                >
                    {authLoading ? (
                        <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                        <Chrome className="w-5 h-5" />
                    )}
                    <span>{authLoading ? '正在登录...' : '使用 Google 账号登录'}</span>
                </button>

                <p className="text-xs text-gray-400 mt-6 text-center">
                    请确保已在 Firebase 控制台启用 Google 登录。
                </p>
            </div>
        </div>
    );
};

export default AuthModal;
