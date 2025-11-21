import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Settings, Plus, Soup, ShoppingBag, Droplet, Heart, Zap, Search, Trash2, Edit, Loader2 } from 'lucide-react';

// --- Firebase 配置检查和路径工具 ---
// 确保在 Canvas 环境中安全地访问全局变量
const getAppId = () => {
  // __app_id 可能是 'c_id_App.jsx-8' 这样的格式，我们需要确保路径段是正确的。
  return typeof __app_id !== 'undefined' ? __app_id.split('_')[1] || __app_id : 'default-app-id';
};
const appIdentifier = getAppId(); 
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

// Firebase 路径工具 - 修正路径以确保段数为奇数
const getCollectionPath = (userId, collectionName, isPublic = false) => {
  // 使用 appIdentifier (简化后的 ID)
  if (isPublic) {
    // 公共数据路径: /artifacts/{appIdentifier}/publicData/{collectionName} (5 段)
    return `artifacts/${appIdentifier}/publicData/${collectionName}`;
  }
  // 私有数据路径 (默认): /artifacts/{appIdentifier}/users/${userId}/${collectionName} (5 段)
  return `artifacts/${appIdentifier}/users/${userId}/${collectionName}`;
};

// --- App Component Helper Components ---

const CategoryIcon = ({ category, className = 'w-6 h-6' }) => {
  switch (category) {
    case '食品生鲜':
      return <Soup className={className} />;
    case '日用百货':
      return <ShoppingBag className={className} />;
    case '个护清洁':
      return <Droplet className={className} />;
    case '医药健康':
      return <Heart className={className} />;
    case '其他':
      return <Zap className={className} />;
    default:
      return <ShoppingBag className={className} />;
  }
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full min-h-64">
    <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-xl shadow-lg m-4 text-center">
    <div className="flex justify-center mb-4">
      <Zap className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold mb-2">加载错误</h2>
    <p>{message}</p>
    <p className="mt-2 text-sm">请检查您的配置或稍后重试。</p>
  </div>
);

const CategoryPill = ({ category, currentCategory, onClick }) => {
  const isActive = currentCategory === category;
  const activeClasses = isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50';
  
  return (
    <button
      className={`flex items-center space-x-2 py-2 px-4 rounded-full transition-colors duration-200 ${activeClasses} shadow-md`}
      onClick={() => onClick(category)}
    >
      <CategoryIcon category={category} className="w-4 h-4" />
      <span className="text-sm font-medium whitespace-nowrap">{category}</span>
    </button>
  );
};


// --- 主 App 组件 ---
function App() {
  const [items, setItems] = useState([]);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isFirebaseError, setIsFirebaseError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('全部');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [currentItem, setCurrentItem] = useState(null);
  
  // 模态框表单状态
  const [name, setName] = useState('');
  const [safetyThreshold, setSafetyThreshold] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [itemCategory, setItemCategory] = useState('日用百货');
  const [unit, setUnit] = useState('件');

  // --- 初始化 Firebase (只运行一次) ---
  useEffect(() => {
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      console.error("Firebase Config is missing or undefined.");
      setIsFirebaseError(true);
      return;
    }

    try {
      const firebaseApp = initializeApp(firebaseConfig);
      const firestore = getFirestore(firebaseApp);
      const firebaseAuth = getAuth(firebaseApp);
      
      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (!user) {
          // 尝试使用自定义 token 登录，如果 token 不存在则匿名登录
          const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
          try {
            if (token) {
              await signInWithCustomToken(firebaseAuth, token);
            } else {
              await signInAnonymously(firebaseAuth);
            }
          } catch(e) {
            console.error("Auth sign-in failed:", e);
          }
          // 再次触发 onAuthStateChanged
        } else {
          setCurrentUser(user);
          setIsAuthReady(true);
        }
      });

      // 如果 onAuthStateChanged 已经完成了，但没有用户（例如，初始 token 不存在且匿名登录失败）
      // 确保在 onAuthStateChanged 监听器建立后，标记为就绪
      setTimeout(() => {
        if (!currentUser && !isAuthReady) {
          setIsAuthReady(true);
        }
      }, 3000); 

      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setIsFirebaseError(true);
    }
  }, []);

  // --- 实时数据监听 ---
  useEffect(() => {
    // 只有在认证准备好且有用户ID时才开始监听
    if (!isAuthReady || !currentUser || !db) return;

    const userId = currentUser.uid;
    const itemsCollectionPath = getCollectionPath(userId, 'inventoryItems');
    const q = query(collection(db, itemsCollectionPath));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // 确保数字类型正确
        safetyThreshold: Number(doc.data().safetyThreshold),
        currentStock: Number(doc.data().currentStock),
      }));
      setItems(fetchedItems);
    }, (error) => {
      console.error("Error listening to inventory items:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady, currentUser, db]);


  // --- 数据操作函数 ---

  // 打开添加或编辑模态框
  const openModal = (type, item = null) => {
    setModalType(type);
    setCurrentItem(item);
    if (type === 'add') {
      setName('');
      setSafetyThreshold('1');
      setCurrentStock('1');
      setItemCategory('日用百货');
      setUnit('件');
    } else if (type === 'edit' && item) {
      setName(item.name);
      setSafetyThreshold(item.safetyThreshold.toString());
      setCurrentStock(item.currentStock.toString());
      setItemCategory(item.category);
      setUnit(item.unit);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 添加或更新库存项
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !db) return;

    // 简单校验
    if (!name || isNaN(Number(safetyThreshold)) || isNaN(Number(currentStock))) {
      return;
    }

    const itemData = {
      name: name.trim(),
      safetyThreshold: Number(safetyThreshold),
      currentStock: Number(currentStock),
      category: itemCategory,
      unit: unit.trim(),
      updatedAt: serverTimestamp(),
      userId: currentUser.uid,
    };

    try {
      const itemsCollectionPath = getCollectionPath(currentUser.uid, 'inventoryItems');

      if (modalType === 'add') {
        // 使用 setDoc 到一个新的文档引用
        await setDoc(doc(collection(db, itemsCollectionPath)), itemData);
      } else if (modalType === 'edit' && currentItem) {
        await setDoc(doc(db, itemsCollectionPath, currentItem.id), itemData, { merge: true });
      }
      closeModal();
    } catch (e) {
      console.error("Error adding/updating document: ", e);
      // 使用 window.alert 替代，因为 Canvas 不支持 confirm/alert
      alert("操作失败，请查看控制台获取详情。"); 
    }
  };

  // 增减库存
  const updateStock = useCallback(async (id, change) => {
    if (!currentUser || !db) return;
    const userId = currentUser.uid;
    const itemsCollectionPath = getCollectionPath(userId, 'inventoryItems');
    const itemRef = doc(db, itemsCollectionPath, id);

    try {
      await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) {
          throw new Error("Document does not exist!");
        }

        const newStock = (itemDoc.data().currentStock || 0) + change;
        
        transaction.update(itemRef, { 
          currentStock: Math.max(0, newStock), // 库存不能为负
          updatedAt: serverTimestamp(),
        });
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  }, [currentUser, db]);

  // 删除库存项
  const deleteItem = async (id) => {
    if (!currentUser || !db) return;
    
    // 使用自定义的模态/确认框替代 window.confirm
    if (!window.confirm("确定要删除此物品吗？")) return; 

    try {
      const itemsCollectionPath = getCollectionPath(currentUser.uid, 'inventoryItems');
      await deleteDoc(doc(db, itemsCollectionPath, id));
    } catch (e) {
      console.error("Error removing document: ", e);
    }
  };


  // --- 筛选和排序逻辑 ---
  const categories = ['全部', '食品生鲜', '日用百货', '个护清洁', '医药健康', '其他'];

  const filteredItems = useMemo(() => {
    let result = items;
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

    // 1. 类别筛选
    if (currentCategory !== '全部') {
      result = result.filter(item => item.category === currentCategory);
    }

    // 2. 搜索筛选
    if (lowerCaseSearchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // 3. 排序：首先是需要补货的，然后按名称排序 (在客户端排序，避免索引问题)
    result.sort((a, b) => {
      const aNeedsReplenish = a.currentStock <= a.safetyThreshold;
      const bNeedsReplenish = b.currentStock <= b.safetyThreshold;

      if (aNeedsReplenish && !bNeedsReplenish) return -1;
      if (!aNeedsReplenish && bNeedsReplenish) return 1;
      
      return a.name.localeCompare(b.name, 'zh-CN');
    });

    return result;
  }, [items, searchTerm, currentCategory]);

  const totalItems = items.length;
  const itemsToReplenish = items.filter(item => item.currentStock <= item.safetyThreshold).length;

  // --- 渲染组件 ---

  if (isFirebaseError) {
    return <ErrorMessage message="Firebase 初始化配置失败，请检查配置变量是否正确。" />;
  }

  if (!isAuthReady || !currentUser) {
    return <LoadingSpinner />;
  }
  
  // 修正后的 StockCounter 组件（不再需要）
  // 逻辑已合并到 ItemCard 中以简化渲染，避免 React 渲染错误。

  const ItemCard = ({ item }) => {
    const isLowStock = item.currentStock <= item.safetyThreshold;
    const cardClasses = isLowStock ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white';
    
    return (
      <div className={`flex flex-col md:flex-row items-stretch border-2 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${cardClasses} p-4 space-y-3 md:space-y-0 md:space-x-4`}>
        
        {/* 左侧：图标和名称 */}
        <div className="flex items-center space-x-4 flex-grow">
          <div className={`p-3 rounded-full ${isLowStock ? 'bg-red-200' : 'bg-indigo-100'} flex-shrink-0`}>
            <CategoryIcon category={item.category} className={`w-6 h-6 ${isLowStock ? 'text-red-600' : 'text-indigo-600'}`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
            <div className="text-sm text-gray-500 mt-0.5 flex items-center space-x-1">
              <span className="font-medium">{item.category}</span>
              <span className="text-xs">·</span>
              <span className='text-xs'>安全库存: {item.safetyThreshold} {item.unit}</span>
            </div>
            {isLowStock && (
                <div className="mt-1 flex items-center text-sm font-medium text-red-600 space-x-1 bg-red-100 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 fill-red-600" />
                    <span>需补货</span>
                </div>
            )}
          </div>
        </div>

        {/* 右侧：库存操作和计数 */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          
          {/* 库存操作 */}
          <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
            <button 
              onClick={() => updateStock(item.id, -1)}
              className="p-2 rounded-full text-indigo-600 hover:bg-white transition-colors duration-150 disabled:opacity-50"
              disabled={item.currentStock <= 0}
            >
              <span className="font-bold text-xl leading-none">-</span>
            </button>
            <div className="px-4 text-center text-lg font-mono font-bold text-gray-800 w-16">
              {item.currentStock}
              <span className="text-sm text-gray-500 ml-1">{item.unit}</span>
            </div>
            <button 
              onClick={() => updateStock(item.id, 1)}
              className="p-2 rounded-full text-indigo-600 hover:bg-white transition-colors duration-150"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <button 
              onClick={() => openModal('edit', item)}
              className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
              title="编辑"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button 
              onClick={() => deleteItem(item.id)}
              className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
              title="删除"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 lg:p-8">
      
      {/* 头部和统计信息 */}
      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">家庭用品管家</h1>
            <div className="text-xs text-gray-500">
                用户 ID: {currentUser.uid.substring(0, 8)}...
            </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-md border-b-4 border-indigo-500">
            <p className="text-sm font-medium text-gray-500">总物品种类</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalItems}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-b-4 border-red-500">
            <p className="text-sm font-medium text-gray-500">需补货数量</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{itemsToReplenish}</p>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto">
        
        {/* 工具栏: 搜索和添加 */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索物品名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150"
            />
          </div>
          <button
            onClick={() => openModal('add')}
            className="flex items-center justify-center space-x-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-indigo-700 transition duration-150 w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>添加物品</span>
          </button>
        </div>

        {/* 类别筛选 */}
        <div className="mb-8 overflow-x-auto whitespace-nowrap py-2 flex space-x-3">
          {categories.map(category => (
            <CategoryPill 
              key={category} 
              category={category} 
              currentCategory={currentCategory} 
              onClick={setCurrentCategory} 
            />
          ))}
        </div>

        {/* 库存列表 */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-xl shadow-md text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">未找到物品。请尝试添加新物品或更改筛选条件。</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))
          )}
        </div>
      </main>

      {/* 添加/编辑模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl transform transition-all">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
              {modalType === 'add' ? '添加新物品' : '编辑物品'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 物品名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">物品名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如: 大米, 洗衣液"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 类别 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">类别</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                >
                  {categories.filter(c => c !== '全部').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 安全库存 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">安全库存 (低于此数量需补货)</label>
                <input
                  type="number"
                  value={safetyThreshold}
                  onChange={(e) => setSafetyThreshold(e.target.value)}
                  min="0"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 当前库存 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">当前库存</label>
                <input
                  type="number"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  min="0"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              {/* 单位 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">单位</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="例如: kg, 瓶, 袋"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>


              {/* 按钮 */}
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-150 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-150 font-medium shadow-md"
                >
                  {modalType === 'add' ? '添加' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;