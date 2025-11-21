import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  Filter,
  X,
  Save,
  Home,
  Utensils,
  Bath,
  Stethoscope,
  LayoutGrid,
  Loader2,
  Users 
} from 'lucide-react';

// --- [ FIREBASE IMPORTS ] ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  serverTimestamp, 
  setLogLevel 
} from 'firebase/firestore';

// ----------------------------------------------------
// 这是您的家庭库存追踪应用的主组件。
// 数据通过 **Firebase Firestore** 进行多设备同步存储。
// ----------------------------------------------------

// 预设分类及图标
const CATEGORIES = [
  { id: 'all', name: '全部', icon: LayoutGrid },
  { id: 'food', name: '食品生鲜', icon: Utensils },
  { id: 'daily', name: '日用百货', icon: Home },
  { id: 'toiletries', name: '个护清洁', icon: Bath },
  { id: 'medicine', name: '医药健康', icon: Stethoscope },
  { id: 'other', name: '其他', icon: Package },
];

// 初始演示数据 (仅在 Firestore 为空时使用)
const INITIAL_DATA = [
  { name: '大米', category: 'food', quantity: 5, unit: 'kg', minQuantity: 2, note: '五常大米' },
  { name: '洗衣液', category: 'toiletries', quantity: 1, unit: '瓶', minQuantity: 2, note: '蓝月亮' },
  { name: '感冒灵', category: 'medicine', quantity: 8, unit: '袋', minQuantity: 5, note: '' },
  { name: '抽纸', category: 'daily', quantity: 12, unit: '包', minQuantity: 6, note: '3层120抽' },
];

// 状态徽章组件
const StatusBadge = ({ quantity, min }) => {
  if (quantity === 0) {
    return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold">已耗尽</span>;
  }
  if (quantity <= min) {
    return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-bold">需补货</span>;
  }
  return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">充足</span>;
};

// --- App Component ---

export default function App() {
  // --- Firebase State ---
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- App State ---
  const [items, setItems] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [error, setError] = useState(null);
  
  // 表单状态
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'daily',
    quantity: 1,
    unit: '个',
    minQuantity: 1,
    note: ''
  });

  // --- [ FIREBASE INITIALIZATION & AUTH ] ---
  useEffect(() => {
    // setLogLevel('Debug'); // 启用调试日志
    
    try {
      // 1. 获取全局配置
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

      if (!firebaseConfig.apiKey) {
        throw new Error("Firebase configuration not found.");
      }
      
      // 2. 初始化 Firebase
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);
      
      setDb(firestore);
      setAuth(firebaseAuth);

      // 3. 处理认证
      const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
        // 核心修复：确保 user 对象存在且包含 uid
        if (user && user.uid) { 
          setUserId(user.uid);
          setIsAuthReady(true);
          console.log("Auth Success. User ID:", user.uid);
        } else {
          // 如果用户未登录，尝试进行登录
          console.log("No user found. Attempting sign-in...");
          try {
              if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                  await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                  console.log("Signed in with custom token.");
              } else {
                  await signInAnonymously(firebaseAuth);
                  console.log("Signed in anonymously.");
              }
              // 注意: 成功的登录操作会再次触发 onAuthStateChanged，最终进入 if (user) 分支

          } catch(e) {
             console.error("Auth sign-in failed:", e);
             setError("登录失败，请检查网络或配置。");
             setIsAuthReady(true); // 即使失败也要标记为就绪，以显示错误信息
          }
        }
      });
      
      // 4. 清理函数
      return () => unsubscribeAuth();

    } catch (e) {
      console.error("Firebase Initialization Error:", e);
      setError("Firebase 初始化失败。请检查配置。");
      setIsAuthReady(true); 
    }
  }, []); 

  // --- [ FIRESTORE DATA LISTENER ] ---
  useEffect(() => {
    // 只有在认证和数据库准备好后才开始监听
    if (!isAuthReady || !db || !userId) return;
    
    // 使用公共路径进行协作库存管理
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const inventoryCollectionRef = collection(db, `artifacts/${appId}/public/data/inventory`);
    
    const q = query(inventoryCollectionRef);

    // 监听数据变化 (实时同步)
    const unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // 确保 quantity 和 minQuantity 是数字类型
        quantity: Number(doc.data().quantity),
        minQuantity: Number(doc.data().minQuantity),
      }));
      
      setItems(fetchedItems);
      setIsLoadingData(false);

      // 如果集合为空，初始化演示数据
      if (fetchedItems.length === 0) {
        console.log("Collection is empty. Initializing demo data.");
        
        // 确保在添加演示数据时，等待数据加载完成标志已设置为 false
        if (isLoadingData) return; 

        // 在 Firestore 中添加演示数据
        const initialDataPromises = INITIAL_DATA.map(item => 
          addDoc(inventoryCollectionRef, {
            ...item,
            createdAt: serverTimestamp() 
          })
        );
        try {
            await Promise.all(initialDataPromises);
            console.log("Demo data added.");
        } catch (e) {
            console.error("Error adding demo data: ", e);
        }
      }

    }, (err) => {
      console.error("Firestore Snapshot Error:", err);
      setError("实时数据同步失败。");
      setIsLoadingData(false);
    });

    // 清理函数：组件卸载时停止监听
    return () => unsubscribeSnapshot();
  }, [isAuthReady, db, userId, isLoadingData]);

  // --- Logic: Firestore CRUD Operations ---
  
  // 增加物品 (Add)
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!db || !newItem.name.trim() || newItem.quantity < 0 || newItem.minQuantity < 0) return;

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const inventoryCollectionRef = collection(db, `artifacts/${appId}/public/data/inventory`);
      
      await addDoc(inventoryCollectionRef, {
        ...newItem,
        quantity: Number(newItem.quantity),
        minQuantity: Number(newItem.minQuantity),
        createdAt: serverTimestamp()
      });

      setShowAddModal(false);
      // 重置表单
      setNewItem({ name: '', category: 'daily', quantity: 1, unit: '个', minQuantity: 1, note: '' });

    } catch (e) {
      console.error("Error adding document: ", e);
      setError("添加物品失败。");
    }
  };

  // 更新库存 (Update)
  const updateQuantity = useCallback(async (id, delta) => {
    if (!db) return;

    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const itemDocRef = doc(db, `artifacts/${appId}/public/data/inventory`, id);
      
      // 使用 updateDoc 仅更新 quantity 字段
      await updateDoc(itemDocRef, {
        quantity: newQty
      });

    } catch (e) {
      console.error("Error updating document: ", e);
      setError("更新库存失败。");
    }
  }, [db, items]); 

  // 删除物品确认逻辑
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
  };

  // 确认删除 (Delete)
  const confirmDelete = async () => {
    if (!db || !itemToDelete) return;

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const itemDocRef = doc(db, `artifacts/${appId}/public/data/inventory`, itemToDelete);
      
      await deleteDoc(itemDocRef);
      setItemToDelete(null);

    } catch (e) {
      console.error("Error deleting document: ", e);
      setError("删除物品失败。");
    }
  };

  // 筛选与统计 (Search and Filter)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, activeCategory]);

  const lowStockItems = useMemo(() => items.filter(item => item.quantity <= item.minQuantity), [items]);
  
  // 渲染加载或错误状态
  if (!isAuthReady || isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        {error ? (
          <div className="text-red-600 text-center p-4 bg-red-100 rounded-xl shadow-md">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold mb-1">加载错误</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="text-center text-indigo-600">
            <Loader2 className="w-10 h-10 mx-auto animate-spin mb-3" />
            <p className="text-lg font-medium">正在连接云同步...</p>
          </div>
        )}
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="text-indigo-600 w-6 h-6" />
            <h1 className="text-xl font-bold text-slate-800">家庭日用品管家 (云同步)</h1>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-sm active:scale-[.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">添加物品</span>
            <span className="sm:hidden">添加</span>
          </button>
        </div>
        
        {/* User ID and Alert Banner */}
        {userId && (
            <div className="bg-indigo-50 border-b border-indigo-100">
                <div className="max-w-3xl mx-auto px-4 py-1.5 flex items-center justify-between text-indigo-800 text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">用户ID: </span>
                        <span className="truncate">{userId}</span>
                    </div>
                </div>
            </div>
        )}
        {lowStockItems.length > 0 && (
          <div className="bg-orange-50 border-b border-orange-100">
            <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between text-orange-800 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  有 <strong>{lowStockItems.length}</strong> 个物品库存不足，建议补货。
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {/* Filters & Search */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="搜索物品名称..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Pills */}
          <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all border
                    ${isActive 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                  `}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inventory List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-xl shadow-sm border border-slate-100">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>没有找到相关物品</p>
              <p className="text-sm mt-1">请尝试更换搜索词或分类</p>
              {userId && !isLoadingData && items.length === 0 && <p className="text-xs mt-3 text-indigo-500">（当前库存为空，已自动添加演示数据）</p>}
            </div>
          ) : (
            filteredItems.map(item => {
              // 安全地获取图标组件
              const category = CATEGORIES.find(c => c.id === item.category);
              const CategoryIcon = category ? category.icon : Package;
              
              const isLowStock = item.quantity <= item.minQuantity;

              return (
                <div 
                  key={item.id} 
                  className={`
                    bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md
                    ${isLowStock ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100'}
                  `}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${isLowStock ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                          {item.name}
                          <StatusBadge quantity={item.quantity} min={item.minQuantity} />
                        </h3>
                        {item.note && <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>}
                        <p className="text-xs text-slate-500 mt-1">
                          安全库存: {item.minQuantity} {item.unit}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-slate-300 hover:text-red-500 p-1 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                    <span className="text-xs text-slate-500 font-medium pl-1">当前库存</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all"
                        disabled={item.quantity <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`text-lg font-bold min-w-[3rem] text-center ${isLowStock ? 'text-orange-600' : 'text-slate-700'}`}>
                        {item.quantity}<span className="text-xs font-normal text-slate-400 ml-1">{item.unit}</span>
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center bg-indigo-600 border border-indigo-600 rounded-full text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">确认删除</h3>
            <p className="text-slate-600 mb-6 text-sm">
              确定要删除物品 
              <span className="font-semibold text-red-600">
                "{items.find(i => i.id === itemToDelete)?.name}" 
              </span> 
              吗？删除后无法恢复。
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">添加新物品</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">物品名称 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="例如：洗洁精"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">单位</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="个/瓶/包"
                    value={newItem.unit}
                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">当前库存</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newItem.quantity}
                    // 确保输入值始终是数字
                    onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">安全警戒线</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newItem.minQuantity}
                      // 确保输入值始终是数字
                      onChange={e => setNewItem({...newItem, minQuantity: Number(e.target.value)})}
                    />
                    <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs p-2 rounded-lg w-48 z-10 shadow-lg whitespace-normal">
                      当库存低于这个数量时，系统会提示你补货。
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注 (品牌/规格)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="例如：500ml 柠檬味"
                  value={newItem.note}
                  onChange={e => setNewItem({...newItem, note: e.target.value})}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-[.98]"
                >
                  <Save className="w-5 h-5" />
                  保存物品
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}