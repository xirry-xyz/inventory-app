import React, { useState, useCallback } from 'react';
import {
    Package, Leaf, ShoppingCart, Wrench, Heart, Cat, Sprout,
    AlertTriangle, Check, Search, Home, LogOut, Chrome, Loader, Plus
} from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';

import Layout from './components/Layout';
import CustomModal from './components/CustomModal';
import AuthModal from './components/AuthModal';
import ItemForm from './components/ItemForm';
import ItemCard from './components/ItemCard';
import StatusMessage from './components/StatusMessage';

// Categories constant (also used in ItemForm, maybe should be shared)
const categories = {
    '全部': <Package className="w-5 h-5" />,
    '食品生鲜': <Leaf className="w-5 h-5" />,
    '日用百货': <ShoppingCart className="w-5 h-5" />,
    '个护清洁': <Wrench className="w-5 h-5" />,
    '医疗健康': <Heart className="w-5 h-5" />,
    '猫咪相关': <Cat className="w-5 h-5" />,
    '其他': <Sprout className="w-5 h-5" />,
};

const App = () => {
    // Hooks
    const {
        user, userId, isAuthReady, configError, showAuthModal, setShowAuthModal,
        handleGoogleSignIn, handleSignOut, setConfigError
    } = useAuth();

    const {
        inventory, loading, addItem, updateStock, deleteItem
    } = useInventory(user, configError, isAuthReady, setConfigError);

    // Local State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('全部');
    const [showItemModal, setShowItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货', expirationDate: '' });
    const [statusMessage, setStatusMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('home');

    // Helpers
    const showStatus = useCallback((message, isError = false, duration = 3000) => {
        setStatusMessage({ message, isError });
        const timer = setTimeout(() => setStatusMessage(null), duration);
        return () => clearTimeout(timer);
    }, []);

    const handleAddItemClick = () => {
        if (!user || !user.uid) {
            showStatus('请先登录才能添加物品', true);
            setShowAuthModal(true);
        } else {
            setShowItemModal(true);
        }
    };

    const handleAddItem = async (item, showStatusFn) => {
        const success = await addItem(item, showStatusFn);
        if (success) {
            setShowItemModal(false);
            setNewItem({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货', expirationDate: '' });
        }
    };

    const handleGoogleSignInWrapper = async () => {
        await handleGoogleSignIn(showStatus);
    };

    const handleSignOutWrapper = async () => {
        await handleSignOut(showStatus);
    };

    const updateStockWrapper = (id, newStock) => updateStock(id, newStock, showStatus);
    const deleteItemWrapper = (id) => deleteItem(id, showStatus);


    // Filtering Logic
    const itemsToRestock = inventory.filter(item => item.currentStock <= item.safetyStock);

    const itemsExpiringSoon = inventory.filter(item => {
        if (!item.expirationDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(item.expirationDate);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return daysRemaining <= 7; // Expiring within 7 days or expired
    });

    const filteredInventory = inventory.filter(item => {
        let listToFilter = inventory;

        if (activeTab === 'restock') {
            // Combine restock and expiring items for this view
            const needsRestock = item.currentStock <= item.safetyStock;
            let isExpiring = false;
            if (item.expirationDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expDate = new Date(item.expirationDate);
                expDate.setHours(0, 0, 0, 0);
                const diffTime = expDate - today;
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                isExpiring = daysRemaining <= 7;
            }
            return (needsRestock || isExpiring) && item.name.toLowerCase().includes(searchTerm.toLowerCase());
        }

        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === '全部' || item.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    // Render Content
    const renderContent = () => {
        if (activeTab === 'settings') {
            const isGoogleUser = !!user && !!user.uid;
            return (
                <div className="p-4 bg-white rounded-4xl shadow-xl mt-6 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">用户与应用设置</h2>
                    <button
                        onClick={() => setActiveTab('home')}
                        className="mb-4 px-4 py-2 text-sm rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-md hidden sm:inline-flex items-center"
                    >
                        <Home className="w-4 h-4 inline mr-1" />
                        返回主页
                    </button>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                            <p className="text-sm font-medium text-gray-700">登录状态</p>
                            {isGoogleUser ? (
                                <>
                                    <p className="text-lg font-semibold text-green-600">已通过 Google 登录</p>
                                    <p className="text-sm text-gray-600">用户: {user.email || user.displayName || 'Google 用户'}</p>
                                    <p className="text-xs text-gray-400 break-words">ID: {userId}</p>
                                    <button
                                        onClick={handleSignOutWrapper}
                                        className="mt-3 px-4 py-2 text-sm rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                                    >
                                        <LogOut className="w-4 h-4 inline mr-1" />
                                        注销
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg font-semibold text-red-600">
                                        未登录
                                    </p>
                                    <p className="text-sm text-gray-600">当前无法同步数据，请登录。</p>
                                    {!configError && (
                                        <button
                                            onClick={() => setShowAuthModal(true)}
                                            className="mt-3 flex items-center px-4 py-2 text-sm rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md font-semibold"
                                        >
                                            <Chrome className="w-4 h-4 mr-1" />
                                            登录以同步
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        {configError && (
                            <div className="p-4 bg-red-100 rounded-2xl border border-red-400 text-red-700">
                                <strong className="font-bold">配置错误：</strong>
                                <span className="block sm:inline">{configError}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        const itemsList = filteredInventory;
        const titleText = activeTab === 'restock' ? '🚨 需补货/过期清单' : `${activeCategory} 物品`;
        const itemQuantity = itemsList.length;
        const isUserGoogleLoggedIn = !!user && !!user.uid;

        return (
            <>
                {/* 快捷操作和补货提醒 */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-3xl shadow-lg border border-gray-200">

                    {(itemsToRestock.length > 0 || itemsExpiringSoon.length > 0) && isUserGoogleLoggedIn ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto mb-3 sm:mb-0 cursor-pointer"
                            onClick={() => setActiveTab('restock')}>

                            {itemsToRestock.length > 0 && (
                                <div className="flex items-center text-red-700 bg-red-100 p-3 rounded-2xl font-bold shadow-inner border border-red-200">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    <span className="font-extrabold mx-1">{itemsToRestock.length}</span> 个缺货
                                </div>
                            )}

                            {itemsExpiringSoon.length > 0 && (
                                <div className="flex items-center text-yellow-700 bg-yellow-100 p-3 rounded-2xl font-bold shadow-inner border border-yellow-200">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    <span className="font-extrabold mx-1">{itemsExpiringSoon.length}</span> 个即将过期
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`flex items-center ${isUserGoogleLoggedIn ? 'text-green-700 bg-green-100 border-green-200' : 'text-red-700 bg-red-100 border-red-200'} p-3 rounded-2xl font-bold w-full sm:w-auto mb-3 sm:mb-0 shadow-inner border`}>
                            {isUserGoogleLoggedIn ? (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    库存情况良好！
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    请登录以启用云同步功能！
                                </>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleAddItemClick}
                        className={`hidden sm:flex items-center px-5 py-2 text-base rounded-3xl font-semibold active:scale-[0.98] transition-all duration-200 shadow-lg 
                            ${isUserGoogleLoggedIn ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                        disabled={!isUserGoogleLoggedIn}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        添加物品
                    </button>
                </div>

                {/* 搜索和分类过滤 (只在 'home' 标签页显示) */}
                {activeTab !== 'restock' && (
                    <div className="mb-8 bg-white p-5 rounded-4xl shadow-xl border border-gray-100">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="🔍 搜索物品名称..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-indigo-600 focus:border-indigo-600 transition duration-150 text-lg font-medium text-gray-800"
                            />
                        </div>

                        {/* 分类标签页 */}
                        <div className="flex flex-wrap gap-2 justify-start">
                            {Object.keys(categories).map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`flex items-center px-4 py-2 rounded-3xl text-sm font-semibold transition duration-200 shadow-md 
                                        ${activeCategory === category
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300/50 transform scale-[1.02] hover:bg-indigo-700'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {categories[category]}
                                    <span className="ml-2">{category}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 库存列表 */}
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{titleText} ({itemQuantity})</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 sm:pb-10">
                    {itemsList.length > 0 ? (
                        itemsList.map(item => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                updateStock={updateStockWrapper}
                                deleteItem={deleteItemWrapper}
                                user={user}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 p-10 bg-white rounded-3xl shadow-inner border border-gray-200">
                            {isUserGoogleLoggedIn
                                ? (activeTab === 'restock'
                                    ? "太棒了！所有物品库存都充足，且没有即将过期的物品。"
                                    : `没有找到 ${activeCategory === '全部' ? '' : `"${activeCategory}"`} 物品。`)
                                : "请先登录，才能查看和管理您的物品清单。"}
                        </p>
                    )}
                </div>
            </>
        );
    };

    // Loading State
    if (loading || !isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader className="h-8 w-8 text-indigo-600 mx-auto animate-spin" />
                    <p className="mt-2 text-gray-600">正在等待认证和数据同步...</p>
                </div>
            </div>
        );
    }

    return (
        <Layout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            handleSignOut={handleSignOutWrapper}
            setShowAuthModal={setShowAuthModal}
            handleAddItemClick={handleAddItemClick}
        >
            <StatusMessage statusMessage={statusMessage} />

            {renderContent()}

            <CustomModal
                title="添加新物品"
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
            >
                <ItemForm
                    newItem={newItem}
                    setNewItem={setNewItem}
                    addItem={handleAddItem}
                    user={user}
                    showStatus={showStatus}
                />
            </CustomModal>

            <AuthModal
                isOpen={showAuthModal && !configError}
                handleGoogleSignIn={handleGoogleSignInWrapper}
                showStatus={showStatus}
            />
        </Layout>
    );
};

export default App;