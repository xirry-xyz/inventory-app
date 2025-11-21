import React, { useState, useEffect, useCallback } from 'react';
// 导入 Firebase 核心模块
import { 
    initializeApp 
} from 'firebase/app';
import { 
    getAuth, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    signOut,                       
    signInAnonymously,
    GoogleAuthProvider,            
    signInWithPopup                
} from 'firebase/auth';
import { getFirestore, doc, addDoc, collection, query, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
    ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Soup, Trash2, Plus, Minus, Search, 
    AlertTriangle, X, Check, LogOut, Loader, Chrome, Home, Settings, Calendar, Menu 
} from 'lucide-react';

// --- Firebase Configuration and Initialization ---
let firebaseApp;
let db;
let auth;
let initializationError = null;

let firebaseConfig = null;
let initialAuthToken = null;
let appId = 'default-app-id'; 

// 1. 获取 Canvas 环境的特殊变量
const configString = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
appId = typeof __app_id !== 'undefined' ? __app_id : appId; 

if (configString && configString.trim() !== '' && configString.trim() !== '{}') {
    // 优先使用 Canvas 提供的配置
    try {
        firebaseConfig = JSON.parse(configString);
    } catch (e) {
        initializationError = `解析特殊配置(__firebase_config)失败: ${e.message}。请检查 JSON 格式。`;
    }
} else {
    // 2. 如果 Canvas 配置缺失，使用硬编码/环境变量（请替换为您真实的 Firebase 配置）
    
    // <--- [YOUR_FIREBASE_CONFIG_HERE] --->
    const hardcodedConfig = {
      apiKey: "YOUR_API_KEY", 
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    // <--- [YOUR_FIREBASE_CONFIG_HERE] --->

    if (hardcodedConfig.projectId && hardcodedConfig.projectId !== "YOUR_PROJECT_ID") {
        firebaseConfig = hardcodedConfig;
    } else {
        initializationError = initializationError || 
                              'Firebase配置缺失或未更新。请在Firebase控制台获取配置，并替换代码中的占位符，或设置部署环境的环境变量。';
    }
}


// 3. 尝试初始化 Firebase App
if (firebaseConfig && !initializationError) {
    try {
        firebaseApp = initializeApp(firebaseConfig);
        db = getFirestore(firebaseApp);
        auth = getAuth(firebaseApp);
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
        initializationError = `Firebase初始化实例失败: ${e.message}。请检查密钥是否正确。`;
    }
}

// 辅助函数：获取用户私有数据的集合路径 (用于 Firestore)
const getUserCollectionPath = (userId, collectionName) => 
    `artifacts/${appId}/users/${userId}/${collectionName}`;

// --- Component Definition ---

const App = () => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [configError, setConfigError] = useState(initializationError); 
    const [showAuthModal, setShowAuthModal] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('全部');
    const [showItemModal, setShowItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货' });
    const [statusMessage, setStatusMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('home'); // 新增：用于底部导航

    // 分类及其图标
    const categories = {
        '全部': <Package className="w-5 h-5" />,
        '食品生鲜': <Leaf className="w-5 h-5" />,
        '日用百货': <ShoppingCart className="w-5 h-5" />,
        '个护清洁': <Wrench className="w-5 h-5" />,
        '医疗健康': <Heart className="w-5 h-5" />,
        '其他': <Sprout className="w-5 h-5" />,
    };
    
    // 底部导航栏配置
    const navItems = [
        { id: 'home', icon: Home, label: '主页' },
        { id: 'list', icon: Menu, label: '清单' },
        { id: 'add', icon: Plus, label: '添加' },
        { id: 'settings', icon: Settings, label: '设置' },
    ];


    // --- 状态消息 ---
    const showStatus = useCallback((message, isError = false, duration = 3000) => {
        setStatusMessage({ message, isError });
        const timer = setTimeout(() => setStatusMessage(null), duration);
        return () => clearTimeout(timer);
    }, []);

    // --- 认证流程和监听 (保持不变) ---
    useEffect(() => {
        if (configError) {
            setLoading(false);
            setIsAuthReady(true);
            setUserId('LOCAL_USER_MODE');
            return;
        }
        
        const startAuth = async () => {
            if (initialAuthToken) {
                try {
                    await signInWithCustomToken(auth, initialAuthToken);
                } catch (e) {
                    try {
                        await signInAnonymously(auth);
                    } catch (anonErr) {
                        setConfigError(`Canvas环境认证失败: ${e.message}。`);
                    }
                }
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
                setShowAuthModal(false); 
            } else {
                setUser(null);
                setUserId(null);
                if (!initialAuthToken && isAuthReady) {
                     setShowAuthModal(true);
                }
            }
            setIsAuthReady(true);
        });

        startAuth(); 
        return () => unsubscribe();
    }, [configError, isAuthReady]); 

    // --- Google 认证函数 (保持不变) ---
    const handleGoogleSignIn = async () => {
        if (!auth) {
            showStatus('Firebase Auth 未初始化，无法登录。', true, 3000);
            return;
        }

        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            showStatus('Google 登录成功！', false);
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                showStatus(`Google 登录失败: ${error.message}`, true, 5000);
            }
        }
    };
    
    // --- 注销函数 (保持不变) ---
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            showStatus('已成功注销', false);
        } catch (e) {
            showStatus(`注销失败: ${e.message}`, true, 5000);
        }
    };
    
    // --- 数据获取 (实时监听) (保持不变) ---
    useEffect(() => {
        if (configError || !isAuthReady || !db || !userId) {
            setInventory([]);
            setLoading(false);
            return;
        }

        const inventoryCollectionPath = getUserCollectionPath(userId, 'inventory');
        const q = query(collection(db, inventoryCollectionPath));

        setLoading(true);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            items.sort((a, b) => {
                const restockA = a.currentStock <= a.safetyStock ? 0 : 1;
                const restockB = b.currentStock <= b.safetyStock ? 0 : 1;
                
                if (restockA !== restockB) {
                    return restockA - restockB;
                }
                return a.name.localeCompare(b.name, 'zh-Hans-CN');
            });

            setInventory(items);
            setLoading(false);
        }, (err) => {
            setConfigError(`数据同步错误: ${err.message}。请检查Firestore规则。`);
            setLoading(false);
        });

        return () => unsubscribe(); 
    }, [isAuthReady, userId, configError]); 

    // --- CRUD Operations (保持不变) ---
    const addItem = async (e) => {
        e.preventDefault();
        
        const name = newItem.name.trim();
        if (!name) {
            showStatus('项目名称不能为空！', true, 2000);
            return;
        }

        if (configError || !db || !userId) {
            showStatus('错误：多端同步未启用或未登录。', true, 4000);
            return;
        }

        const itemToAdd = {
            ...newItem,
            name,
            safetyStock: Number(newItem.safetyStock),
            currentStock: Number(newItem.currentStock),
            category: newItem.category,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            const inventoryCollectionPath = getUserCollectionPath(userId, 'inventory');
            await addDoc(collection(db, inventoryCollectionPath), itemToAdd); 

            setShowItemModal(false);
            setNewItem({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货' });
            showStatus('添加成功！');
        } catch (e) {
            showStatus(`添加失败: ${e.message}`, true, 5000);
        }
    };

    const updateStock = async (id, newStock) => {
        if (configError || !db || !userId) {
            showStatus('错误：多端同步未启用或未登录。', true, 4000);
            return;
        }

        try {
            const inventoryCollectionPath = getUserCollectionPath(userId, 'inventory');
            const itemRef = doc(db, inventoryCollectionPath, id);
            await updateDoc(itemRef, { 
                currentStock: Math.max(0, newStock), 
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            showStatus(`更新库存失败: ${e.message}`, true, 5000);
        }
    };

    const deleteItem = async (id) => {
        if (configError || !db || !userId) {
            showStatus('错误：多端同步未启用或未登录。', true, 4000);
            return;
        }

        if (!window.confirm('确定要删除此项目吗？')) return; 

        try {
            const inventoryCollectionPath = getUserCollectionPath(userId, 'inventory');
            const itemRef = doc(db, inventoryCollectionPath, id);
            await deleteDoc(itemRef);
            showStatus('删除成功！');
        } catch (e) {
            showStatus(`删除失败: ${e.message}`, true, 5000);
        }
    };

    // --- Filtering and Display Logic (保持不变) ---
    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const itemsToRestock = inventory.filter(item => item.currentStock <= item.safetyStock).length;
    
    // --- UI Components ---
    
    // 模态框样式调整为更圆润
    const CustomModal = ({ title, children, isOpen, onClose }) => {
        if (!isOpen) return null;
        
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
                <div 
                    className="bg-white rounded-4xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100" // 重点：圆角调整
                    onClick={e => e.stopPropagation()} 
                >
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        );
    };

    // 认证模态框样式调整
    const AuthModal = ({ isOpen, handleGoogleSignIn }) => {
        const [authLoading, setAuthLoading] = useState(false);

        const handleSignIn = async () => {
            setAuthLoading(true);
            try {
                await handleGoogleSignIn();
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
                    <p className="text-sm text-gray-500 mb-8 text-center">使用 Google 账号一键登录</p>
                    
                    <button
                        onClick={handleSignIn}
                        className={`w-full py-3 rounded-3xl font-semibold flex justify-center items-center space-x-2 transition duration-200 shadow-xl 
                            ${authLoading ? 'bg-primary-light' : 'bg-primary-DEFAULT hover:bg-primary-dark'} text-white`} // 使用新的 primary 颜色
                        disabled={authLoading}
                    >
                        {authLoading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <Chrome className="w-5 h-5"/>
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

    // 物品卡片样式调整
    const ItemCard = ({ item }) => {
        const needsRestock = item.currentStock <= item.safetyStock;
        const IconComponent = categories[item.category] ? categories[item.category].type : Package;
        const isUserLoggedIn = !!user;

        // 根据状态和新主题定义卡片背景和边框颜色
        const cardBgClass = needsRestock 
            ? 'bg-gradient-red-light border-red-300' 
            : 'bg-gradient-green-light border-green-300';
        
        const ringClass = needsRestock ? 'ring-red-400' : 'ring-green-400';

        return (
            // 重点：圆角调整为 rounded-3xl，移除边框线，使用 shadow-xl
            <div className={`rounded-3xl shadow-xl p-5 mb-4 transition-all duration-300 transform hover:shadow-2xl 
                           ${cardBgClass} bg-white border border-opacity-50`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <h3 className={`text-xl font-bold ${needsRestock ? 'text-red-800' : 'text-green-800'}`}>{item.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                            <IconComponent className="w-4 h-4 mr-1 text-gray-600" />
                            <span className="ml-1">{item.category}</span>
                        </p>
                    </div>
                    {needsRestock && (
                        <div className="text-sm font-medium bg-red-800 bg-opacity-90 text-white px-3 py-1 rounded-full flex items-center shadow-md">
                            <AlertTriangle className="w-4 h-4 mr-1"/>
                            需补货
                        </div>
                    )}
                </div>

                <div className="mt-4 border-t border-white border-opacity-50 pt-3">
                    <p className="text-sm text-gray-700 font-medium">安全库存: {item.safetyStock} {item.unit || '份'}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-white rounded-3xl p-1 shadow-inner">
                            {/* 减按钮 */}
                            <button 
                                onClick={() => updateStock(item.id, item.currentStock - 1)}
                                className={`p-2 rounded-full transition-colors active:scale-95 ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary-light text-white hover:bg-primary-DEFAULT shadow-md'}`}
                                disabled={!isUserLoggedIn}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            
                            {/* 库存显示 */}
                            <span className={`px-4 text-xl font-extrabold w-16 text-center 
                                ${needsRestock ? 'text-red-700' : 'text-green-700'}`}>
                                {item.currentStock}
                            </span>
                            
                            {/* 加按钮 */}
                            <button 
                                onClick={() => updateStock(item.id, item.currentStock + 1)}
                                className={`p-2 rounded-full transition-colors active:scale-95 ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary-light text-white hover:bg-primary-DEFAULT shadow-md'}`}
                                disabled={!isUserLoggedIn}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* 删除按钮 */}
                        <button 
                            onClick={() => deleteItem(item.id)}
                            className={`p-2 rounded-full transition-colors active:scale-95 ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-red-700 hover:text-white bg-red-200 hover:bg-red-600 shadow-md'}`}
                            title="删除"
                            disabled={!isUserLoggedIn}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    // 渲染主内容区域，根据 activeTab 决定显示什么
    const renderContent = () => {
        if (activeTab === 'settings') {
            return (
                <div className="p-4 bg-white rounded-4xl shadow-xl mt-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">用户与应用设置</h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-sm font-medium text-gray-700">登录状态</p>
                            {user ? (
                                <>
                                    <p className="text-lg font-semibold text-green-600">已登录</p>
                                    <p className="text-sm text-gray-600">用户: {user.email || user.displayName || 'Google 用户'}</p>
                                    <p className="text-xs text-gray-400">ID: {userId}</p>
                                    <button 
                                        onClick={handleSignOut}
                                        className="mt-3 px-4 py-2 text-sm rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                                    >
                                        <LogOut className="w-4 h-4 inline mr-1"/>
                                        注销
                                    </button>
                                </>
                            ) : (
                                <p className="text-lg font-semibold text-yellow-600">未登录</p>
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

        // 默认显示 'home' 和 'list' (当前的主界面)
        return (
            <>
                {/* 快捷操作和补货提醒 */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-white to-gray-50 p-5 rounded-3xl shadow-lg border border-gray-200">
                    
                    {itemsToRestock > 0 ? (
                        <div className="flex items-center text-red-800 bg-red-200 bg-opacity-70 p-3 rounded-2xl font-bold w-full sm:w-auto mb-3 sm:mb-0 shadow-inner">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            有 <span className="font-extrabold mx-1">{itemsToRestock}</span> 个物品库存不足
                        </div>
                    ) : (
                        <div className="flex items-center text-green-800 bg-green-200 bg-opacity-70 p-3 rounded-2xl font-bold w-full sm:w-auto mb-3 sm:mb-0 shadow-inner">
                            <Check className="w-5 h-5 mr-2" />
                            库存情况良好！
                        </div>
                    )}
                </div>

                {/* 搜索和分类过滤 */}
                <div className="mb-8 bg-white p-5 rounded-4xl shadow-xl border border-gray-100">
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="🔍 搜索物品名称..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            // 输入框调整为大圆角
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-primary-DEFAULT focus:border-primary-DEFAULT transition duration-150 text-lg font-medium"
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
                                        ? 'bg-primary-DEFAULT text-white shadow-lg shadow-primary-light/50 transform scale-[1.02]' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {categories[category]}
                                <span className="ml-2">{category}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 库存列表 */}
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{activeCategory} 物品 ({filteredInventory.length})</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20"> {/* 增加底部填充以避开导航栏 */}
                    {user && filteredInventory.length > 0 ? (
                        filteredInventory.map(item => (
                            <ItemCard key={item.id} item={item} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 p-10 bg-white rounded-3xl shadow-inner border border-gray-200">
                            {!user ? "请先登录才能查看和管理您的库存数据。" : `没有找到 ${activeCategory === '全部' ? '' : `"${activeCategory}"`} 分类的物品。`}
                        </p>
                    )}
                </div>
            </>
        );
    };

    // --- Main Render ---
    
    // 显示加载状态
    if (loading || !isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader className="h-8 w-8 text-primary-DEFAULT mx-auto animate-spin" />
                    <p className="mt-2 text-gray-600">正在等待认证和数据同步...</p>
                </div>
            </div>
        );
    }

    // 主应用界面
    return (
        <div className="min-h-screen bg-gray-100 font-sans relative">
            
            {/* 状态消息提示框 */}
            {statusMessage && (
                <div 
                    className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-full shadow-lg z-50 transition-opacity duration-300
                    ${statusMessage.isError ? 'bg-red-500' : 'bg-green-500'} text-white font-semibold`}
                >
                    {statusMessage.message}
                </div>
            )}

            {/* 顶部标题栏 - 仿图中的渐变背景 */}
            <header className="bg-gradient-to-r from-primary-DEFAULT to-primary-light p-6 pb-20 rounded-b-4xl shadow-xl mb-[-5rem] relative z-0">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center text-white">
                        <h1 className="text-3xl font-extrabold">家庭管家</h1>
                        {user ? (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium hidden sm:block">欢迎, {user.displayName || user.email || '用户'}</span>
                                <button 
                                    onClick={handleSignOut}
                                    className="p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
                                    title="注销"
                                >
                                    <LogOut className="w-5 h-5"/>
                                </button>
                            </div>
                        ) : (
                             <button 
                                onClick={() => setShowAuthModal(true)}
                                className="flex items-center px-3 py-2 text-sm rounded-3xl bg-white text-primary-DEFAULT hover:bg-gray-100 transition-colors shadow-md font-semibold"
                            >
                                <Chrome className="w-4 h-4 mr-1"/>
                                登录
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-primary-light mt-1 text-white opacity-70">
                        {user ? '您的云端库存管理器' : '未登录，请同步数据'}
                    </p>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 pt-4">
                {renderContent()}
            </main>

            {/* 添加物品模态框 */}
            <CustomModal 
                title="添加新物品" 
                isOpen={showItemModal || activeTab === 'add'} // 绑定到底部导航的'添加'按钮
                onClose={() => {setShowItemModal(false); setActiveTab('home');}}
            >
                <form onSubmit={addItem} className="space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">物品名称</label>
                        <input
                            id="name"
                            type="text"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-primary-DEFAULT focus:border-primary-DEFAULT"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">分类</label>
                        <select
                            id="category"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-primary-DEFAULT focus:border-primary-DEFAULT bg-white"
                            required
                        >
                            {Object.keys(categories).filter(c => c !== '全部').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700">当前库存</label>
                            <input
                                id="currentStock"
                                type="number"
                                min="0"
                                value={newItem.currentStock}
                                onChange={(e) => setNewItem({ ...newItem, currentStock: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-primary-DEFAULT focus:border-primary-DEFAULT"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="safetyStock" className="block text-sm font-medium text-gray-700">安全库存</label>
                            <input
                                id="safetyStock"
                                type="number"
                                min="1"
                                value={newItem.safetyStock}
                                onChange={(e) => setNewItem({ ...newItem, safetyStock: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-primary-DEFAULT focus:border-primary-DEFAULT"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={`w-full py-3 rounded-3xl font-bold transition duration-200 shadow-xl 
                            bg-primary-DEFAULT text-white hover:bg-primary-dark`}
                        disabled={!user}
                    >
                        {user ? '保存物品' : '请先登录'}
                    </button>
                </form>
            </CustomModal>
            
            {/* 认证模态框 */}
            <AuthModal 
                isOpen={showAuthModal && !user} 
                handleGoogleSignIn={handleGoogleSignIn}
            />
            
            {/* 底部导航栏 (Bottom Navigation Bar) - 移动端风格 */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-2xl rounded-t-4xl border-t border-gray-200 py-2">
                <div className="max-w-lg mx-auto flex justify-around">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'add') {
                                    setShowItemModal(true); 
                                    setActiveTab('home'); // 确保焦点不在 'add' 上
                                } else {
                                    setActiveTab(item.id);
                                }
                            }}
                            className={`flex flex-col items-center p-2 rounded-full transition-colors duration-200 ${
                                activeTab === item.id || (item.id === 'add' && showItemModal)
                                    ? 'text-primary-DEFAULT font-bold'
                                    : 'text-gray-500 hover:text-primary-light'
                            }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-xs mt-1 hidden sm:block">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default App;