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
import { ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Soup, Trash2, Plus, Minus, Search, AlertTriangle, X, Check, LogOut, Loader, Chrome } from 'lucide-react';

// --- Firebase Configuration and Initialization ---
let firebaseApp;
let db;
let auth;
let initializationError = null;

let firebaseConfig = null;
let initialAuthToken = null;
// 新增：获取应用ID，用于构建 Firestore 的正确路径
let appId = 'default-app-id'; 

// 统一环境变量获取逻辑 (使用 process.env 避免 import.meta 警告)
const getEnvVar = (name) => {
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
    }
    return null;
};

// 检查 Vercel/Vite 标准环境变量
const VITE_PROJECT_ID = getEnvVar('VITE_FIREBASE_PROJECT_ID');

if (VITE_PROJECT_ID) {
    // Vercel/Vite 环境下的标准环境变量
    firebaseConfig = {
        apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
        authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: VITE_PROJECT_ID,
        storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
        appId: getEnvVar('VITE_FIREBASE_APP_ID')
    };
} 
// 尝试从 Canvas 环境的特殊全局变量中获取
else {
    const configString = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
    initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    // 修复：获取 __app_id
    appId = typeof __app_id !== 'undefined' ? __app_id : appId; 

    if (configString && configString.trim() !== '' && configString.trim() !== '{}') {
        try {
            firebaseConfig = JSON.parse(configString);
        } catch (e) {
            initializationError = `解析特殊配置(__firebase_config)失败: ${e.message}。请检查 JSON 格式。`;
        }
    }
}


// 2. 检查配置是否仍然缺失
if (!firebaseConfig || !firebaseConfig.projectId) {
    initializationError = initializationError || 
                          'Firebase配置缺失。请在Vercel上设置VITE_FIREBASE_* 环境变量，或在Canvas环境中提供__firebase_config。';
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
// 修复：使用标准的 Canvas 私有数据路径结构
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

    // 分类及其图标
    const categories = {
        '全部': <Package className="w-5 h-5" />,
        '食品生鲜': <Leaf className="w-5 h-5" />,
        '日用百货': <ShoppingCart className="w-5 h-5" />,
        '个护清洁': <Wrench className="w-5 h-5" />,
        '医疗健康': <Heart className="w-5 h-5" />,
        '其他': <Sprout className="w-5 h-5" />,
    };

    // --- 状态消息 ---
    const showStatus = useCallback((message, isError = false, duration = 3000) => {
        setStatusMessage({ message, isError });
        const timer = setTimeout(() => setStatusMessage(null), duration);
        return () => clearTimeout(timer);
    }, []);

    // --- 认证流程和监听 ---
    useEffect(() => {
        if (configError) {
            setLoading(false);
            setIsAuthReady(true);
            setUserId('LOCAL_USER_MODE');
            return;
        }
        
        const startAuth = async () => {
            // Canvas 环境的初始登录（如果有 initialAuthToken）
            if (initialAuthToken) {
                try {
                    await signInWithCustomToken(auth, initialAuthToken);
                } catch (e) {
                    console.error("Custom Token Sign-In Error:", e);
                    try {
                        await signInAnonymously(auth);
                    } catch (anonErr) {
                        console.error("Anonymous Sign-In Error:", anonErr);
                        setConfigError(`Canvas环境认证失败: ${e.message}。`);
                    }
                }
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
                setShowAuthModal(false); // 用户已登录，关闭认证模态框
            } else {
                setUser(null);
                setUserId(null);
                // 如果没有登录用户且不在 Canvas 环境中，弹出登录框
                if (!initialAuthToken && isAuthReady) {
                     setShowAuthModal(true);
                }
            }
            setIsAuthReady(true);
        });

        startAuth(); 
        return () => unsubscribe();
    }, [configError, isAuthReady]); 

    // --- Google 认证函数 ---
    const handleGoogleSignIn = async () => {
        if (!auth) {
            showStatus('Firebase Auth 未初始化，无法登录。', true, 3000);
            return;
        }

        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // 成功后 onAuthStateChanged 会自动更新状态并关闭模态框
            showStatus('Google 登录成功！', false);
        } catch (error) {
            console.error("Google Sign-In Error:", error.message);
            // 处理用户关闭弹窗、网络错误等
            if (error.code !== 'auth/popup-closed-by-user') {
                showStatus(`Google 登录失败: ${error.message}`, true, 5000);
            }
        }
    };
    
    // --- 注销函数 ---
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            showStatus('已成功注销', false);
        } catch (e) {
            console.error("Sign Out Error:", e);
            showStatus(`注销失败: ${e.message}`, true, 5000);
        }
    };
    
    // --- 数据获取 (实时监听) ---
    useEffect(() => {
        if (configError || !isAuthReady || !db || !userId) {
            setInventory([]);
            setLoading(false);
            return;
        }

        // 使用更新后的路径
        const inventoryCollectionPath = getUserCollectionPath(userId, 'inventory');
        const q = query(collection(db, inventoryCollectionPath));

        setLoading(true);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // 排序逻辑不变 (先补货，再按名称)
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
            console.error("Firestore Snapshot Error:", err);
            // 错误信息提示用户检查 Firestore 规则
            setConfigError(`数据同步错误: ${err.message}。请检查Firestore规则。`);
            setLoading(false);
        });

        return () => unsubscribe(); 
    }, [isAuthReady, userId, configError]); 

    // --- CRUD Operations ---
    
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
            console.error("Add Item Error:", e);
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
            console.error("Update Stock Error:", e);
            showStatus(`更新库存失败: ${e.message}`, true, 5000);
        }
    };

    const deleteItem = async (id) => {
        if (configError || !db || !userId) {
            showStatus('错误：多端同步未启用或未登录。', true, 4000);
            return;
        }

        // 使用浏览器原生的 confirm, 在 Canvas 中需替换为自定义模态框
        if (!window.confirm('确定要删除此项目吗？')) return; 

        try {
            const inventoryCollectionPath = getUserCollectionPath(userId, 'inventory');
            const itemRef = doc(db, inventoryCollectionPath, id);
            await deleteDoc(itemRef);
            showStatus('删除成功！');
        } catch (e) {
            console.error("Delete Item Error:", e);
            showStatus(`删除失败: ${e.message}`, true, 5000);
        }
    };

    // --- Filtering and Display Logic ---
    
    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const itemsToRestock = inventory.filter(item => item.currentStock <= item.safetyStock).length;
    
    // --- UI Components ---
    
    const CustomModal = ({ title, children, isOpen, onClose }) => {
        if (!isOpen) return null;
        
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
                <div 
                    className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100"
                    onClick={e => e.stopPropagation()} 
                >
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        );
    };

    // 简化后的 AuthModal，只包含 Google 登录
    const AuthModal = ({ isOpen, handleGoogleSignIn }) => {
        const [authLoading, setAuthLoading] = useState(false);

        const handleSignIn = async () => {
            setAuthLoading(true);
            try {
                await handleGoogleSignIn();
            } finally {
                // 如果登录成功，onAuthStateChanged 会关闭模态框，这里仅在失败时重置状态
                setAuthLoading(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        登录以同步数据
                    </h3>
                    <p className="text-sm text-gray-500 mb-8 text-center">使用 Google 账号一键登录</p>
                    
                    <button
                        onClick={handleSignIn}
                        className={`w-full py-3 rounded-lg font-semibold flex justify-center items-center space-x-2 transition duration-200 shadow-md 
                            ${authLoading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} text-white`}
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

    const ItemCard = ({ item }) => {
        const needsRestock = item.currentStock <= item.safetyStock;
        const Icon = categories[item.category] ? categories[item.category] : <Package />;
        const isUserLoggedIn = !!user;

        return (
            <div className={`bg-white rounded-xl shadow-lg p-4 mb-4 transition-all duration-300 transform hover:shadow-xl ${needsRestock ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                        <h3 className={`text-xl font-semibold ${needsRestock ? 'text-red-700' : 'text-gray-800'}`}>{item.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                            {Icon}
                            <span className="ml-2">{item.category}</span>
                        </p>
                    </div>
                    {needsRestock && (
                        <div className="text-sm font-medium bg-red-100 text-red-600 px-3 py-1 rounded-full flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1"/>
                            需补货
                        </div>
                    )}
                </div>

                <div className="mt-4 border-t pt-3">
                    <p className="text-sm text-gray-600">安全库存: {item.safetyStock} {item.unit || '份'}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center">
                            <button 
                                onClick={() => updateStock(item.id, item.currentStock - 1)}
                                className={`p-2 rounded-l-lg transition-colors ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                disabled={!isUserLoggedIn}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className={`px-4 py-2 border-t border-b text-lg font-bold ${needsRestock ? 'text-red-600' : 'text-green-600'}`}>
                                {item.currentStock}
                            </span>
                            <button 
                                onClick={() => updateStock(item.id, item.currentStock + 1)}
                                className={`p-2 rounded-r-lg transition-colors ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                disabled={!isUserLoggedIn}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => deleteItem(item.id)}
                            className={`p-2 rounded-full transition-colors ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-red-500 hover:text-red-700 bg-red-100'}`}
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

    // --- Main Render ---
    
    // 显示加载状态
    if (loading || !isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-gray-600">正在等待认证和数据同步...</p>
                </div>
            </div>
        );
    }

    // 主应用界面
    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 md:p-8">
            {/* 状态消息提示框 */}
            {statusMessage && (
                <div 
                    className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-50 transition-opacity duration-300
                    ${statusMessage.isError ? 'bg-red-500' : 'bg-green-500'} text-white`}
                >
                    {statusMessage.message}
                </div>
            )}

            <header className="mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">家庭用品管家 (云同步)</h1>
                    <div className="flex items-center space-x-2">
                        {user ? (
                            <button 
                                onClick={handleSignOut}
                                className="flex items-center px-3 py-2 text-sm rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                            >
                                <LogOut className="w-4 h-4 mr-1"/>
                                注销
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowAuthModal(true)}
                                className="flex items-center px-3 py-2 text-sm rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                <Chrome className="w-4 h-4 mr-1"/>
                                Google 登录
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                    {configError ? (
                        <span className="text-red-500 font-bold">同步功能未启用</span>
                    ) : (
                        user ? (
                           <>
                                <span>当前用户: {user.displayName || user.email || 'Google 用户'}</span>
                                {/* 显示完整的 userId，帮助用户查找彼此或调试 */}
                                <span className="ml-2 text-xs text-gray-400">ID: {userId}</span> 
                           </>
                        ) : (
                            <span className="text-yellow-500 font-bold">未登录，请使用 Google 账号登录</span>
                        )
                    )}
                </p>
                
                {/* 显眼的配置错误提示 */}
                {configError && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative">
                        <strong className="font-bold">配置错误：</strong>
                        <span className="block sm:inline">{configError}</span>
                        <p className="text-sm mt-1">请在 Vercel 项目设置中设置 `VITE_FIREBASE_*` 环境变量。</p>
                    </div>
                )}
            </header>

            {/* 快捷操作和补货提醒 */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <button 
                    onClick={() => setShowItemModal(true)} 
                    className={`flex items-center px-4 py-2 rounded-lg shadow-md transition duration-200 w-full sm:w-auto mb-3 sm:mb-0
                        ${!user ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    disabled={!user}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    添加物品
                </button>
                
                {itemsToRestock > 0 ? (
                    <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg font-medium w-full sm:w-auto">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        有 <span className="font-bold mx-1">{itemsToStock}</span> 个物品库存不足，建议补货。
                    </div>
                ) : (
                    <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg font-medium w-full sm:w-auto">
                        <Check className="w-5 h-5 mr-2" />
                        库存充足
                    </div>
                )}
            </div>

            {/* 搜索和分类过滤 */}
            <div className="mb-8 bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜索物品名称..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                </div>

                {/* 分类标签页 */}
                <div className="flex flex-wrap gap-2 justify-start">
                    {Object.keys(categories).map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition duration-200 
                                ${activeCategory === category 
                                    ? 'bg-indigo-600 text-white shadow-lg' 
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {user && filteredInventory.length > 0 ? (
                    filteredInventory.map(item => (
                        <ItemCard key={item.id} item={item} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 p-8 bg-white rounded-xl shadow-inner">
                        {!user ? "请先登录才能查看和管理您的库存数据。" : `没有找到 ${activeCategory === '全部' ? '' : `"${activeCategory}"`} 分类的物品。`}
                    </p>
                )}
            </div>

            {/* 添加物品模态框 */}
            <CustomModal 
                title="添加新物品" 
                isOpen={showItemModal} 
                onClose={() => setShowItemModal(false)}
            >
                <form onSubmit={addItem} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">物品名称</label>
                        <input
                            id="name"
                            type="text"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">分类</label>
                        <select
                            id="category"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2"
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
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2"
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
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={`w-full py-2 rounded-lg font-semibold transition duration-200 
                            bg-indigo-600 text-white hover:bg-indigo-700`}
                    >
                        保存物品
                    </button>
                </form>
            </CustomModal>
            
            {/* 认证模态框 */}
            <AuthModal 
                isOpen={showAuthModal && !user} 
                handleGoogleSignIn={handleGoogleSignIn}
            />
        </div>
    );
};

export default App;