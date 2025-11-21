import React, { useState, useEffect, useMemo } from 'react';
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
  LayoutGrid
} from 'lucide-react';

// 预设分类及图标
const CATEGORIES = [
  { id: 'all', name: '全部', icon: LayoutGrid },
  { id: 'food', name: '食品生鲜', icon: Utensils },
  { id: 'daily', name: '日用百货', icon: Home },
  { id: 'toiletries', name: '个护清洁', icon: Bath },
  { id: 'medicine', name: '医药健康', icon: Stethoscope },
  { id: 'other', name: '其他', icon: Package },
];

// 初始演示数据
const INITIAL_DATA = [
  { id: 1, name: '大米', category: 'food', quantity: 5, unit: 'kg', minQuantity: 2, note: '五常大米' },
  { id: 2, name: '洗衣液', category: 'toiletries', quantity: 1, unit: '瓶', minQuantity: 2, note: '蓝月亮' },
  { id: 3, name: '感冒灵', category: 'medicine', quantity: 8, unit: '袋', minQuantity: 5, note: '' },
  { id: 4, name: '抽纸', category: 'daily', quantity: 12, unit: '包', minQuantity: 6, note: '3层120抽' },
];

// 状态徽章组件 (移至外部以优化性能)
const StatusBadge = ({ quantity, min }) => {
  if (quantity === 0) {
    return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold">已耗尽</span>;
  }
  if (quantity <= min) {
    return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-bold">需补货</span>;
  }
  return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">充足</span>;
};

export default function App() {
  // --- State Management ---
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('home_inventory_items');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Form State
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'daily',
    quantity: 1,
    unit: '个',
    minQuantity: 1,
    note: ''
  });

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('home_inventory_items', JSON.stringify(items));
  }, [items]);

  // --- Logic ---
  
  // 增加物品
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const item = {
      id: Date.now(),
      ...newItem
    };
    setItems([item, ...items]);
    setShowAddModal(false);
    // Reset form
    setNewItem({ name: '', category: 'daily', quantity: 1, unit: '个', minQuantity: 1, note: '' });
  };

  // 删除物品确认逻辑
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setItems(items.filter(item => item.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  // 更新库存
  const updateQuantity = (id, delta) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, Number(item.quantity) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // 筛选与统计
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, activeCategory]);

  const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="text-indigo-600 w-6 h-6" />
            <h1 className="text-xl font-bold text-slate-800">家庭日用品管家</h1>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">添加物品</span>
            <span className="sm:hidden">添加</span>
          </button>
        </div>
        
        {/* Low Stock Alert Banner */}
        {lowStockItems.length > 0 && (
          <div className="bg-orange-50 border-b border-orange-100">
            <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between text-orange-800 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>
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
                  <Icon className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Summary (Optional) */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center">
            <div className="text-slate-500 text-xs mb-1">总物品</div>
            <div className="text-lg font-bold text-slate-800">{items.length}</div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center">
            <div className="text-slate-500 text-xs mb-1">需补货</div>
            <div className="text-lg font-bold text-orange-600">{lowStockItems.length}</div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center">
            <div className="text-slate-500 text-xs mb-1">总分类</div>
            <div className="text-lg font-bold text-indigo-600">{CATEGORIES.length - 1}</div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>没有找到相关物品</p>
            </div>
          ) : (
            filteredItems.map(item => {
              // 安全地获取图标组件
              const category = CATEGORIES.find(c => c.id === item.category);
              const CategoryIcon = category ? category.icon : Package;
              
              return (
                <div 
                  key={item.id} 
                  className={`
                    bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md
                    ${item.quantity <= item.minQuantity ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100'}
                  `}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${item.quantity <= item.minQuantity ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
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
                      className="text-slate-300 hover:text-red-500 p-1 transition-colors"
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
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`text-lg font-bold min-w-[3rem] text-center ${item.quantity <= item.minQuantity ? 'text-orange-600' : 'text-slate-700'}`}>
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
              确定要删除这个物品吗？删除后无法恢复。
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
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
                      onChange={e => setNewItem({...newItem, minQuantity: Number(e.target.value)})}
                    />
                    <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 bg-slate-800 text-white text-xs p-2 rounded w-48 z-10">
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
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