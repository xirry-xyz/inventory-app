import React from 'react';
import { Home, Bell, Settings, LogOut, Chrome, Plus } from 'lucide-react';

const Layout = ({
    children,
    activeTab,
    setActiveTab,
    user,
    handleSignOut,
    setShowAuthModal,
    handleAddItemClick
}) => {
    const navItems = [
        { id: 'home', icon: Home, label: '主页' },
        { id: 'restock', icon: Bell, label: '补货/过期' }, // Updated label
        { id: 'settings', icon: Settings, label: '设置' },
    ];

    return (
        <div className="min-h-screen bg-gray-100 font-sans relative">
            {/* 顶部标题栏 */}
            <header className="bg-gradient-to-r from-indigo-600 to-indigo-400 p-6 pb-20 rounded-b-4xl shadow-xl mb-[-5rem] relative z-0">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center text-white">
                        <h1 className="text-3xl font-extrabold cursor-pointer" onClick={() => setActiveTab('home')}>家庭用品库存管家</h1>
                        {/* 桌面端/大屏幕的设置/登录按钮 */}
                        <div className="hidden sm:flex items-center space-x-4">
                            {user && <span className="text-sm font-medium">你好, {user.displayName || user.email || '用户'}</span>}
                            <button
                                onClick={() => setActiveTab('settings')}
                                className="p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
                                title="设置"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            {user ? (
                                <button
                                    onClick={handleSignOut}
                                    className="p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
                                    title="注销"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="flex items-center px-3 py-2 text-sm rounded-3xl bg-white text-indigo-600 hover:bg-gray-100 transition-colors shadow-md font-semibold"
                                >
                                    <Chrome className="w-4 h-4 mr-1" />
                                    登录
                                </button>
                            )}
                        </div>

                        {/* 移动端/小屏幕的登录/设置入口 */}
                        <div className="sm:hidden">
                            <button
                                onClick={() => setActiveTab('settings')}
                                className="p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
                                title="设置"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-indigo-200 mt-1 text-white opacity-70">
                        {user ? '您的云端库存管理器' : '请登录以启用云同步'}
                    </p>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 pt-4 pb-24 sm:pb-8">
                {children}
            </main>

            {/* 移动端浮动添加按钮 (FAB) - 仅在小屏幕 (< sm) 显示 */}
            <button
                onClick={handleAddItemClick}
                className="sm:hidden fixed bottom-20 right-5 z-30 p-4 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 transition-all duration-200 active:scale-90"
                title="添加物品"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* 底部导航栏 (Bottom Navigation Bar) - 仅在小屏幕 (< sm) 显示 */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-2xl rounded-t-4xl border-t border-gray-200 py-2">
                <div className="max-w-lg mx-auto flex justify-around">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center p-2 rounded-full transition-colors duration-200 ${activeTab === item.id
                                    ? 'text-indigo-600 font-bold'
                                    : 'text-gray-500 hover:text-indigo-400'
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
