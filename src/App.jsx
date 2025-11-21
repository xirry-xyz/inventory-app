import React, { useState, useEffect, useCallback, memo } from 'react';
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
    AlertTriangle, X, Check, LogOut, Loader, Chrome, Home, Settings, Menu, Bell, Cat 
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
    // 2. 如果 Canvas 配置缺失，使用硬编码/环境变量 (已更新为用户提供的配置)
    
    // <--- [YOUR_FIREBASE_CONFIG_HERE] --->
    const hardcodedConfig = {
      apiKey: "AIzaSyCbQZ-qkJuPr3lmufKbVgK1U_Rmyfy4u0E",
      authDomain: "home-inventory-manager-5ec7a.firebaseapp.com",
      projectId: "home-inventory-manager-5ec7a",
      storageBucket: "home-inventory-manager-5ec7a.firebasestorage.app",
      messagingSenderId: "712500151586",
      appId: "1:712500151586:web:b44aa3d513b97a174d917b"
    };
    // <--- [YOUR_FIREBASE_CONFIG_HERE] --->

    if (hardcodedConfig.projectId && hardcodedConfig.projectId !== "YOUR_PROJECT_ID") {
        firebaseConfig = hardcodedConfig;
    } else {
        // 如果用户提供的配置有问题，则设置错误
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
// 确保只有当 userId 是一个有效的 UID 时，才构建私有路径。
const getUserCollectionPath = (userId, collectionName) => {
    // 简单检查 userId 是否为 Canvas 的本地模式或匿名模式。
    if (userId && (userId.startsWith('anonymous-') || userId === 'LOCAL_USER_MODE')) {
        // 对于未完全认证的用户，我们仍使用一个路径，但实际数据写入会通过 user 检查来阻止
        return `artifacts/${appId}/users/${userId}/${collectionName}`;
    }
    // 对于已登录的用户 (UID)，使用标准路径
    return `artifacts/${appId}/users/${userId}/${collectionName}`;
}


// 分类及其图标
const categories = {
    '全部': <Package className="w-5 h-5" />,
    '食品生鲜': <Leaf className="w-5 h-5" />,
    '日用百货': <ShoppingCart className="w-5 h-5" />,
    '个护清洁': <Wrench className="w-5 h-5" />,
    '医疗健康': <Heart className="w-5 h-5" />,
    '猫咪相关': <Cat className="w-5 h-5" />, 
    '其他': <Sprout className="w-5 h-5" />,
};

// --- CustomModal 组件定义 (移到 App 外部以增加稳定性) ---
const CustomModal = ({ title, children, isOpen, onClose }) => {
    // 使用 CSS 隐藏，而不是返回 null，确保 DOM 结构稳定
    const visibilityClass = isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';
    
    return (
        <div 
            className={`fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${visibilityClass}`} 
            onClick={onClose}
            // 确保 DOM 始终存在
            style={{ display: 'flex' }} 
        >
            <div 
                className={`bg-white rounded-4xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`} 
                onClick={e => e.stopPropagation()} 
            >
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
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

// --- ItemForm 组件定义 (抽象并使用 memo 隔离输入状态) ---
const ItemForm = memo(({ newItem, setNewItem, addItem, user }) => {
    
    // 过滤掉 '全部' 类别，因为它不是实际物品的分类
    const availableCategories = Object.keys(categories).filter(c => c !== '全部');
    
    // 优化后的 onChange handler
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setNewItem(prev => ({ 
            ...prev, 
            [id]: value 
        }));
    };
    
    return (
        <form onSubmit={addItem} className="space-y-5">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">物品名称</label>
                <input
                    key="item-name-input" 
                    id="name"
                    type="text"
                    value={newItem.name}
                    onChange={handleInputChange} // 使用优化的 handler
                    className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-indigo-600 focus:border-indigo-600 text-gray-800"
                    required
                />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">分类</label>
                <select
                    key="item-category-select" 
                    id="category"
                    value={newItem.category}
                    onChange={handleInputChange} 
                    className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-gray-800"
                    required
                >
                    {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            <div className="flex space-x-4">
                <div className="flex-1">
                    <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700">当前库存</label>
                    <input
                        key="item-current-stock-input" 
                        id="currentStock"
                        type="number"
                        min="0"
                        value={newItem.currentStock}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-indigo-600 focus:border-indigo-600 text-gray-800"
                        required
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="safetyStock" className="block text-sm font-medium text-gray-700">安全库存</label>
                    <input
                        key="item-safety-stock-input" 
                        id="safetyStock"
                        type="number"
                        min="1"
                        value={newItem.safetyStock}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-indigo-600 focus:border-indigo-600 text-gray-800"
                        required
                    />
                </div>
            </div>
            <button
                type="submit"
                className={`w-full py-3 rounded-3xl font-bold transition duration-200 shadow-xl 
                    ${user ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}
                disabled={!user}
            >
                {user ? '保存物品' : '请先登录'}
            </button>
        </form>
    );
});

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
    // 默认激活“全部”
    const [activeCategory, setActiveCategory] = useState('全部');
    const [showItemModal, setShowItemModal] = useState(false);
    // 新增项默认分类为 '日用百货'
    const [newItem, setNewItem] = useState({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货' }); 
    const [statusMessage, setStatusMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('home'); 
    
    // 底部导航栏配置 (移除 'add' tab)
    const navItems = [
        { id: 'home', icon: Home, label: '主页' },
        { id: 'restock', icon: Bell, label: '补货提醒' },
        { id: 'settings', icon: Settings, label: '设置' },
    ];


    // --- 状态消息 ---
    const showStatus = useCallback((message, isError = false, duration = 3000) => {
        setStatusMessage({ message, isError });
        const timer = setTimeout(() => setStatusMessage(null), duration);
        return () => clearTimeout(timer);
    }, []);

    // --- 认证流程和监听 (核心修复区域) ---
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
                        // 如果 Custom Token 失败，尝试匿名登录作为后备
                        await signInAnonymously(auth);
                    } catch (anonErr) {
                        setConfigError(`Canvas环境认证失败: ${e.message}。`);
                    }
                }
            } else {
                 // 尝试匿名登录作为后备
                 try {
                    await signInAnonymously(auth);
                 } catch (e) {
                    // 如果匿名登录也失败，则设置错误
                    setConfigError(`Firebase认证失败: ${e.message}。`);
                 }
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // *** 关键修复 1：确保 user 状态被正确设置 ***
                setUser(currentUser);
                setUserId(currentUser.uid); // 使用 UID 作为唯一标识
                setShowAuthModal(false); 
            } else {
                setUser(null);
                // *** 关键修复 2：如果未登录，使用匿名 ID 或本地 ID，但明确标识它不是一个真正的同步用户 ***
                const currentAnonId = auth.currentUser?.uid || crypto.randomUUID();
                setUserId('anonymous-' + currentAnonId); 
                
                // 仅在首次加载完成且未登录时，才弹出登录模态框
                if (!initialAuthToken && isAuthReady) {
                     setShowAuthModal(true);
                }
            }
            setIsAuthReady(true);
            setLoading(false); // 在这里关闭加载状态，确保 UI 尽快渲染
        });

        if (!isAuthReady) {
            startAuth(); 
        } else {
             // 如果已经就绪，但 user 为 null，重新检查是否需要弹出模态框
             if (!user && !initialAuthToken) setShowAuthModal(true);
        }
        
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
            // onAuthStateChanged 会处理状态更新
            showStatus('Google 登录成功！', false);
        } catch (error) {
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
            // onAuthStateChanged 会更新 user/userId 状态
        } catch (e) {
            showStatus(`注销失败: ${e.message}`, true, 5000);
        }
    };
    
    // --- 数据获取 (实时监听) ---
    useEffect(() => {
        // 只有当认证就绪且有 userId (且不是匿名的本地模式) 且 db 存在时才进行数据操作
        if (configError || !isAuthReady || !db || !user || !userId) {
            setInventory([]);
            // setLoading(false); // 已经在 onAuthStateChanged 中处理
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
                // 优先显示需要补货的 (currentStock <= safetyStock)
                const restockA = a.currentStock <= a.safetyStock ? 0 : 1;
                const restockB = b.currentStock <= b.safetyStock ? 0 : 1;
                
                if (restockA !== restockB) {
                    return restockA - restockB;
                }
                // 其次按名称排序
                return a.name.localeCompare(b.name, 'zh-Hans-CN');
            });

            setInventory(items);
            setLoading(false);
        }, (err) => {
            // Firestore 权限错误或网络错误
            setConfigError(`数据同步错误: ${err.message}。请检查Firestore规则。`);
            setLoading(false);
        });

        return () => unsubscribe(); 
    }, [isAuthReady, user, userId, configError]); // 依赖 user 对象，只有登录后才开始同步

    // --- CRUD Operations ---
    // 使用 useCallback 包装 addItem，确保引用稳定
    const addItem = useCallback(async (e) => {
        e.preventDefault();
        
        const name = newItem.name.trim();
        if (!name) {
            showStatus('项目名称不能为空！', true, 2000);
            return;
        }
        
        // *** 关键修复 3：明确检查 user.uid，如果 user 存在，userId 必须是其 UID ***
        // 只有在 user 存在且其 UID 与 userId 匹配时，才允许写入。
        if (!user || !user.uid || user.uid !== userId || configError || !db) {
            console.error("添加物品失败：用户状态不完整或配置有误。", { user, userId, configError });
            showStatus('错误：请先登录才能添加和同步数据。', true, 4000);
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
    }, [newItem, user, configError, userId, showStatus]); // 依赖 newItem, user 等

    const updateStock = async (id, newStock) => {
         // *** 关键修复 4：数据操作前都检查 user.uid 完整性 ***
         if (!user || !user.uid || user.uid !== userId || configError || !db) {
            showStatus('错误：请先登录才能修改数据。', true, 4000);
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
         // *** 关键修复 5：数据操作前都检查 user.uid 完整性 ***
         if (!user || !user.uid || user.uid !== userId || configError || !db) {
            showStatus('错误：请先登录才能删除数据。', true, 4000);
            return;
        }
        
        // 使用 window.confirm 作为临时替代方案，但应该用自定义模态框
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
    
    // --- UI Helpers ---
    const handleAddItemClick = () => {
        // *** 关键修复 6：检查 user 对象是否存在，以判断是否已登录 ***
        if (!user) {
            showStatus('请先登录才能添加物品', true);
            // 弹出登录模态框
            setShowAuthModal(true);
        } else {
            // 弹出添加物品模态框
            setShowItemModal(true);
        }
    };


    // --- Filtering and Display Logic ---
    const itemsToRestock = inventory.filter(item => item.currentStock <= item.safetyStock);

    const filteredInventory = inventory.filter(item => {
        let listToFilter = inventory;
        
        // 针对 "补货提醒" 标签页的特殊过滤
        if (activeTab === 'restock') {
            listToFilter = itemsToRestock;
        }

        // 搜索过滤 (在当前 listToFilter 上执行)
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 类别过滤
        const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
        
        // 如果在非“补货提醒”页，则应用类别过滤
        if (activeTab !== 'restock') {
            return matchesSearch && matchesCategory;
        } else {
             // 如果在“补货提醒”页，只需要满足搜索条件，且本身是需补货的
            return item.currentStock <= item.safetyStock && matchesSearch;
        }
    });

    
    // --- UI Components ---
    
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
                            ${authLoading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`} 
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

    // 物品卡片样式调整 (重点增强可读性)
    const ItemCard = ({ item }) => {
        const needsRestock = item.currentStock <= item.safetyStock;
        // 动态获取图标组件
        const IconComponent = categories[item.category] ? categories[item.category].type : Package;
        const isUserLoggedIn = !!user; // 仅检查 user 是否为非 null

        // 优化：卡片背景固定为白色，只用边框/阴影/标签来区分状态
        const cardClass = needsRestock 
            ? 'border-red-400 shadow-red-200/50' // 红色警示边框和阴影
            : 'border-gray-200 shadow-gray-200/50'; // 正常边框和阴影
        
        // 标题颜色统一使用深色文本，保证可读性
        const titleColor = 'text-gray-900'; 
        const restockTagClass = needsRestock ? 'bg-red-600 text-white' : 'bg-green-600 text-white'; // 标签颜色
        
        // 库存数字颜色调整
        const stockTextColor = needsRestock ? 'text-red-700' : 'text-indigo-600'; 

        return (
            // 重点：使用 bg-white, 增加 border, 优化阴影
            <div className={`rounded-3xl shadow-xl p-5 mb-4 transition-all duration-300 transform hover:shadow-2xl 
                           bg-white border-2 ${cardClass}`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        {/* 确保标题是深色文本 */}
                        <h3 className={`text-xl font-bold ${titleColor}`}>{item.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                            {/* 动态渲染图标 */}
                            {categories[item.category] || categories['其他']} 
                            <span className="ml-1">{item.category}</span>
                        </p>
                    </div>
                    {/* 补货状态标签 */}
                    <div className={`text-sm font-medium px-3 py-1 rounded-full flex items-center shadow-md ${restockTagClass}`}>
                        {needsRestock ? (
                             <>
                                <AlertTriangle className="w-4 h-4 mr-1"/>
                                需补货
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-1"/>
                                充足
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-500 font-medium">安全库存: {item.safetyStock} {item.unit || '份'}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-gray-100 rounded-3xl p-1 shadow-inner">
                            {/* 减按钮 */}
                            <button 
                                onClick={() => updateStock(item.id, item.currentStock - 1)}
                                // 按钮背景使用主色调，确保可见性
                                className={`p-2 rounded-full transition-colors active:scale-95 
                                    ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-400 text-white hover:bg-indigo-500 shadow-md'}`}
                                disabled={!isUserLoggedIn}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            
                            {/* 库存显示 - 确保数字颜色对比度高 */}
                            <span className={`px-4 text-xl font-extrabold w-16 text-center ${stockTextColor}`}>
                                {item.currentStock}
                            </span>
                            
                            {/* 加按钮 */}
                            <button 
                                onClick={() => updateStock(item.id, item.currentStock + 1)}
                                className={`p-2 rounded-full transition-colors active:scale-95 
                                    ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-400 text-white hover:bg-indigo-500 shadow-md'}`}
                                disabled={!isUserLoggedIn}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* 删除按钮 */}
                        <button 
                            onClick={() => deleteItem(item.id)}
                            className={`p-2 rounded-full transition-colors active:scale-95 
                                ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-red-700 hover:text-white bg-red-100 hover:bg-red-600 shadow-md'}`}
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
                <div className="p-4 bg-white rounded-4xl shadow-xl mt-6 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">用户与应用设置</h2>
                    {/* 桌面端：添加一个返回主页的按钮 */}
                    <button 
                        onClick={() => setActiveTab('home')}
                        className="mb-4 px-4 py-2 text-sm rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-md hidden sm:inline-flex items-center"
                    >
                        <Home className="w-4 h-4 inline mr-1"/>
                        返回主页
                    </button>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                            <p className="text-sm font-medium text-gray-700">登录状态</p>
                            {user ? (
                                <>
                                    <p className="text-lg font-semibold text-green-600">已登录</p>
                                    <p className="text-sm text-gray-600">用户: {user.email || user.displayName || 'Google 用户'}</p>
                                    {/* 必须显示完整的 userId */}
                                    <p className="text-xs text-gray-400 break-words">ID: {userId}</p>
                                    <button 
                                        onClick={handleSignOut}
                                        className="mt-3 px-4 py-2 text-sm rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                                    >
                                        <LogOut className="w-4 h-4 inline mr-1"/>
                                        注销
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg font-semibold text-yellow-600">未登录 (匿名或本地模式)</p>
                                    {/* 确保在未登录且没有配置错误时显示登录按钮 */}
                                    {!configError && (
                                        <button 
                                            onClick={() => setShowAuthModal(true)}
                                            className="mt-3 flex items-center px-4 py-2 text-sm rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md font-semibold"
                                        >
                                            <Chrome className="w-4 h-4 mr-1"/>
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

        // 'home' 和 'restock' 视图的主逻辑
        const itemsList = activeTab === 'restock' ? itemsToRestock : filteredInventory;
        const titleText = activeTab === 'restock' ? '🚨 需补货清单' : `${activeCategory} 物品`;
        const itemQuantity = activeTab === 'restock' ? itemsToRestock.length : filteredInventory.length;
        
        return (
            <>
                {/* 快捷操作和补货提醒 */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-3xl shadow-lg border border-gray-200">
                    
                    {itemsToRestock.length > 0 ? (
                        <div className="flex items-center text-red-700 bg-red-100 p-3 rounded-2xl font-bold w-full sm:w-auto mb-3 sm:mb-0 shadow-inner border border-red-200 cursor-pointer"
                             onClick={() => setActiveTab('restock')}>
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            有 <span className="font-extrabold mx-1">{itemsToRestock.length}</span> 个物品库存不足
                        </div>
                    ) : (
                        <div className="flex items-center text-green-700 bg-green-100 p-3 rounded-2xl font-bold w-full sm:w-auto mb-3 sm:mb-0 shadow-inner border border-green-200">
                            <Check className="w-5 h-5 mr-2" />
                            库存情况良好！
                        </div>
                    )}
                    
                    {/* 桌面端新增的 “添加物品” 按钮 */}
                    <button 
                        onClick={handleAddItemClick}
                        className="hidden sm:flex items-center px-5 py-2 text-base rounded-3xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg font-semibold active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5 mr-2"/>
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

                        {/* 分类标签页 - 重点修复可见性 */}
                        <div className="flex flex-wrap gap-2 justify-start">
                            {Object.keys(categories).map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`flex items-center px-4 py-2 rounded-3xl text-sm font-semibold transition duration-200 shadow-md 
                                        ${activeCategory === category 
                                            // 选中状态：使用深色背景 (indigo-600) 和白色文本 (text-white)
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300/50 transform scale-[1.02] hover:bg-indigo-700' 
                                            // 未选中状态：使用浅色背景 (gray-200) 和深色文本 (text-gray-700)
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
                {/* 确保标题文本颜色是深色，可读性高 */}
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{titleText} ({itemQuantity})</h2>
                
                {/* 增加底部填充，避免被移动端导航栏遮挡，大屏幕上也增加间距 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 sm:pb-10">
                    {itemsList.length > 0 ? (
                        itemsList.map(item => (
                            <ItemCard key={item.id} item={item} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 p-10 bg-white rounded-3xl shadow-inner border border-gray-200">
                            {activeTab === 'restock' 
                                ? "太棒了！所有物品库存都充足，无需补货。"
                                : (!user ? "请先登录才能查看和管理您的库存数据。" : `没有找到 ${activeCategory === '全部' ? '' : `"${activeCategory}"`} 物品。`)}
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
                    <Loader className="h-8 w-8 text-indigo-600 mx-auto animate-spin" />
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

            {/* 顶部标题栏 */}
            <header className="bg-gradient-to-r from-indigo-600 to-indigo-400 p-6 pb-20 rounded-b-4xl shadow-xl mb-[-5rem] relative z-0">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center text-white">
                        <h1 className="text-3xl font-extrabold cursor-pointer" onClick={() => setActiveTab('home')}>家庭管家</h1>
                        {/* 桌面端/大屏幕的设置/登录按钮 */}
                        <div className="hidden sm:flex items-center space-x-4">
                            {/* *** 关键修复 7：确保只在 user 存在时显示欢迎语 *** */}
                            {user && <span className="text-sm font-medium">你好, {user.displayName || user.email || '用户'}</span>}
                            <button
                                onClick={() => setActiveTab('settings')}
                                className="p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
                                title="设置"
                            >
                                <Settings className="w-5 h-5"/>
                            </button>
                            {user ? (
                                <button 
                                    onClick={handleSignOut}
                                    className="p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
                                    title="注销"
                                >
                                    <LogOut className="w-5 h-5"/>
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setShowAuthModal(true)}
                                    className="flex items-center px-3 py-2 text-sm rounded-3xl bg-white text-indigo-600 hover:bg-gray-100 transition-colors shadow-md font-semibold"
                                >
                                    <Chrome className="w-4 h-4 mr-1"/>
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
                                <Settings className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-indigo-200 mt-1 text-white opacity-70">
                        {user ? '您的云端库存管理器' : '请登录以启用云同步'}
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
                isOpen={showItemModal} 
                onClose={() => setShowItemModal(false)}
            >
                {/* 将表单内容作为子组件传递 */}
                <ItemForm 
                    newItem={newItem} 
                    setNewItem={setNewItem} 
                    addItem={addItem} 
                    user={user}
                />
            </CustomModal>
            
            {/* 认证模态框 */}
            {/* 只有在没有 user 且没有配置错误时才显示认证模态框 */}
            <AuthModal 
                isOpen={showAuthModal && !user && !configError} 
                handleGoogleSignIn={handleGoogleSignIn}
            />
            
            {/* 移动端浮动添加按钮 (FAB) - 仅在小屏幕 (< sm) 显示 */}
            <button
                onClick={handleAddItemClick}
                className="sm:hidden fixed bottom-20 right-5 z-30 p-4 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 transition-all duration-200 active:scale-90"
                title="添加物品"
            >
                <Plus className="w-6 h-6"/>
            </button>
            
            {/* 底部导航栏 (Bottom Navigation Bar) - 仅在小屏幕 (< sm) 显示 */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-2xl rounded-t-4xl border-t border-gray-200 py-2">
                <div className="max-w-lg mx-auto flex justify-around">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center p-2 rounded-full transition-colors duration-200 ${
                                activeTab === item.id 
                                    // 选中状态：使用主色调
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

export default App;