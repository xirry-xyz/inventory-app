import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, collection, query, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Soup, Trash2, Plus, Minus, Search, AlertTriangle, X, Check } from 'lucide-react';

// --- Firebase Configuration and Initialization ---
let firebaseApp;
let db;
let auth;

// 1. 从 Canvas 环境获取全局变量并进行安全检查
const appId = typeof __app_id !== 'undefined' ? __app_id : 'inventory-default-app';
let firebaseConfig = null;
let initializationError = null;

try {
    const configString = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
    if (configString) {
        firebaseConfig = JSON.parse(configString);
    } else {
        initializationError = 'Firebase配置缺失。无法初始化。';
    }
} catch (e) {
    console.error("Failed to parse __firebase_config:", e);
    initializationError = `解析配置失败: ${e.message}`;
}

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

if (firebaseConfig && !initializationError) {
    // 2. 只有在配置可用时才尝试初始化
    try {
        firebaseApp = initializeApp(firebaseConfig);
        db = getFirestore(firebaseApp);
        auth = getAuth(firebaseApp);
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
        initializationError = `Firebase初始化失败: ${e.message}`;
    }
}

// 辅助函数：获取用户私有数据的集合路径
const getUserCollectionPath = (userId, collectionName) => 
    `/artifacts/${appId}/users/${userId}/${collectionName}`;

// --- Component Definition ---

const App = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    // 状态中存储初始化错误信息
    const [error, setError] = useState(initializationError); 
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('全部');
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货' });
    
    // 动作状态消息
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

    // --- 认证和 Firestore 启动 ---
    useEffect(() => {
        // 如果外部配置失败，直接返回
        if (error) {
            setLoading(false);
            return;
        }

        if (!auth || !db) {
            // 如果初始化失败（但不是配置缺失），设置错误信息并停止加载
            if (!error) setError('Firebase 初始化实例失败。');
            setLoading(false);
            return;
        }

        // 1. 登录
        const signIn = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.error("Authentication Error:", e);
                setError(`认证失败: ${e.message}`);
                setIsAuthReady(true);
            }
        };

        // 2. 监听认证状态变化
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
            setIsAuthReady(true); // 认证状态就绪
        });

        signIn(); // 启动登录流程
        return () => unsubscribe(); // 清理监听器
    }, [error]); // 依赖 error，如果 config 缺失，此 effect 不会运行

    // --- 数据获取 (实时监听) ---
    useEffect(() => {
        // 关键：等待认证就绪且获取到 userId 后才开始查询 Firestore
        if (error || !isAuthReady || !db || !userId) {
            if (isAuthReady && !userId && !error) {
                setError('用户认证未完成，无法同步数据。');
            }
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
            
            // 排序: 需补货的在前，然后按名称字母排序
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
            setError(`数据同步错误: ${err.message}`);
            setLoading(false);
        });

        return () => unsubscribe(); // 清理快照监听器
    }, [isAuthReady, userId, error]); // 依赖认证状态和 userId

    // --- CRUD Operations ---
    
    // 显示临时状态消息
    const showStatus = useCallback((message, duration = 3000) => {
        setStatusMessage(message);
        const timer = setTimeout(() => setStatusMessage(null), duration);
        return () => clearTimeout(timer);
    }, []);

    const addItem = async (e) => {
        e.preventDefault();
        if (!db || !userId) return;
        
        const name = newItem.name.trim();
        if (!name) {
            showStatus('项目名称不能为空！', 2000);
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
            // 使用 addDoc 自动生成文档 ID，这是创建新文档的推荐方式
            await addDoc(collection(db, inventoryCollectionPath), itemToAdd); 

            setShowModal(false);
            setNewItem({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货' });
            showStatus('添加成功！');
        } catch (e) {
            console.error("Add Item Error:", e);
            showStatus(`添加失败: ${e.message}`, 5000);
        }
    };

    const updateStock = async (id, newStock) => {
        if (!db || !userId) return;

        try {
            const inventoryCollectionPath = getUserCollectionPath(userId, 'inventory');
            const itemRef = doc(db, inventoryCollectionPath, id);
            await updateDoc(itemRef, { 
                currentStock: Math.max(0, newStock), // 库存不能为负
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Update Stock Error:", e);
            showStatus(`更新库存失败: ${e.message}`, 5000);
        }
    };

    const deleteItem = async (id) => {
        if (!db || !userId) return;

        // 替换 alert/confirm 使用 CustomModal for confirmation in a real app
        // 这里暂时使用 window.confirm，但在生产环境中应使用自定义模态框
        if (!window.confirm('确定要删除此项目吗？')) return; 

        try {
            const inventoryCollectionPath = getUserCollectionPath(userId, 'inventory');
            const itemRef = doc(db, inventoryCollectionPath, id);
            await deleteDoc(itemRef);
            showStatus('删除成功！');
        } catch (e) {
            console.error("Delete Item Error:", e);
            showStatus(`删除失败: ${e.message}`, 5000);
        }
    };

    // --- Filtering and Display Logic ---
    
    const filteredInventory = inventory.filter(item => {
        // 1. 搜索过滤
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. 分类过滤
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
                    onClick={e => e.stopPropagation()} // 防止点击模态框内部关闭
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

    const ItemCard = ({ item }) => {
        const needsRestock = item.currentStock <= item.safetyStock;
        const Icon = categories[item.category] || <Package />;

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
                                className="p-2 bg-gray-200 text-gray-700 rounded-l-lg hover:bg-gray-300 transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className={`px-4 py-2 border-t border-b text-lg font-bold ${needsRestock ? 'text-red-600' : 'text-green-600'}`}>
                                {item.currentStock}
                            </span>
                            <button 
                                onClick={() => updateStock(item.id, item.currentStock + 1)}
                                className="p-2 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => deleteItem(item.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors bg-red-100 rounded-full"
                            title="删除"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Main Render ---
    
    // 显示 Firebase 错误卡片（针对初始化失败）
    if (error) {
        return (
            <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
                <div className="bg-white border-2 border-red-400 rounded-2xl shadow-xl p-8 max-w-lg text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-red-600 mb-2">加载错误</h1>
                    <p className="text-red-500 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">
                        请确保您的Firebase配置 (`__firebase_config`) 正确，并且Canvas环境已正确初始化。
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
                    >
                        刷新页面
                    </button>
                </div>
            </div>
        );
    }

    // 显示加载状态
    if (loading || !isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-gray-600">加载中，请稍候...</p>
                </div>
            </div>
        );
    }

    // 主应用界面
    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 md:p-8">
            {/* 状态消息提示框 */}
            {statusMessage && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg z-50 transition-opacity duration-300">
                    {statusMessage}
                </div>
            )}

            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">家庭用品管家</h1>
                <p className="text-sm text-gray-500">用户 ID: {userId || 'N/A'}</p>
            </header>

            {/* 快捷操作和补货提醒 */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <button 
                    onClick={() => setShowModal(true)} 
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 w-full sm:w-auto mb-3 sm:mb-0"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    添加物品
                </button>
                
                {itemsToRestock > 0 ? (
                    <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg font-medium w-full sm:w-auto">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        有 <span className="font-bold mx-1">{itemsToRestock}</span> 个物品库存不足，建议补货。
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
                {filteredInventory.length > 0 ? (
                    filteredInventory.map(item => (
                        <ItemCard key={item.id} item={item} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 p-8 bg-white rounded-xl shadow-inner">
                        没有找到 {activeCategory === '全部' ? '' : `"${activeCategory}"`} 分类的物品。
                    </p>
                )}
            </div>

            {/* 添加物品模态框 */}
            <CustomModal 
                title="添加新物品" 
                isOpen={showModal} 
                onClose={() => setShowModal(false)}
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
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
                    >
                        保存物品
                    </button>
                </form>
            </CustomModal>
        </div>
    );
};

export default App;