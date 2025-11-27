import React, { memo } from 'react';
import {
    ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Cat
} from 'lucide-react';

// 分类及其图标 (duplicated here for now, could be moved to a constants file)
const categories = {
    '全部': <Package className="w-5 h-5" />,
    '食品生鲜': <Leaf className="w-5 h-5" />,
    '日用百货': <ShoppingCart className="w-5 h-5" />,
    '个护清洁': <Wrench className="w-5 h-5" />,
    '医疗健康': <Heart className="w-5 h-5" />,
    '猫咪相关': <Cat className="w-5 h-5" />,
    '其他': <Sprout className="w-5 h-5" />,
};

const ItemForm = memo(({ newItem, setNewItem, addItem, user, showStatus }) => {

    const availableCategories = Object.keys(categories).filter(c => c !== '全部');

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setNewItem(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addItem(newItem, showStatus);
    };

    // 检查用户是否已登录 (user 存在且有 uid)
    const isLoggedIn = !!user && !!user.uid;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">物品名称</label>
                <input
                    key="item-name-input"
                    id="name"
                    type="text"
                    value={newItem.name}
                    onChange={handleInputChange}
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

            {/* Expiration Date Input */}
            <div>
                <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                    过期日期 (可选)
                </label>
                <input
                    key="item-expiration-date-input"
                    id="expirationDate"
                    type="date"
                    value={newItem.expirationDate || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm p-3 focus:ring-indigo-600 focus:border-indigo-600 text-gray-800"
                />
            </div>

            <button
                type="submit"
                className={`w-full py-3 rounded-3xl font-bold transition duration-200 shadow-xl 
                    ${isLoggedIn ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}
                disabled={!isLoggedIn}
            >
                {isLoggedIn ? '保存物品' : '请先登录'}
            </button>
        </form>
    );
});

export default ItemForm;
