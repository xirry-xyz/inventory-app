import React from 'react';
import {
    ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Cat,
    AlertTriangle, Check, Minus, Plus, Trash2, Calendar, Clock
} from 'lucide-react';

const categories = {
    '全部': <Package className="w-5 h-5" />,
    '食品生鲜': <Leaf className="w-5 h-5" />,
    '日用百货': <ShoppingCart className="w-5 h-5" />,
    '个护清洁': <Wrench className="w-5 h-5" />,
    '医疗健康': <Heart className="w-5 h-5" />,
    '猫咪相关': <Cat className="w-5 h-5" />,
    '其他': <Sprout className="w-5 h-5" />,
};

const ItemCard = ({ item, updateStock, deleteItem, user }) => {
    const needsRestock = item.currentStock <= item.safetyStock;
    const isUserLoggedIn = !!user && !!user.uid;

    // Expiration Logic
    let expirationStatus = 'good'; // good, warning, expired
    let daysRemaining = null;

    if (item.expirationDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(item.expirationDate);
        expDate.setHours(0, 0, 0, 0);

        const diffTime = expDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
            expirationStatus = 'expired';
        } else if (daysRemaining <= 7) {
            expirationStatus = 'warning';
        }
    }

    // Card Styling based on status
    let cardBorderClass = 'border-gray-200 shadow-gray-200/50';
    if (expirationStatus === 'expired') {
        cardBorderClass = 'border-red-500 shadow-red-200/50 bg-red-50';
    } else if (expirationStatus === 'warning') {
        cardBorderClass = 'border-yellow-400 shadow-yellow-200/50 bg-yellow-50';
    } else if (needsRestock) {
        cardBorderClass = 'border-orange-400 shadow-orange-200/50';
    }

    const restockTagClass = needsRestock ? 'bg-orange-600 text-white' : 'bg-green-600 text-white';
    const stockTextColor = needsRestock ? 'text-orange-700' : 'text-indigo-600';

    return (
        <div className={`rounded-3xl shadow-xl p-5 mb-4 transition-all duration-300 transform hover:shadow-2xl 
                       bg-white border-2 ${cardBorderClass}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                        {categories[item.category] || categories['其他']}
                        <span className="ml-1">{item.category}</span>
                    </p>
                </div>
                <div className={`text-sm font-medium px-3 py-1 rounded-full flex items-center shadow-md ${restockTagClass}`}>
                    {needsRestock ? (
                        <>
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            需补货
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4 mr-1" />
                            充足
                        </>
                    )}
                </div>
            </div>

            {/* Expiration Info */}
            {item.expirationDate && (
                <div className={`mb-3 p-2 rounded-xl text-sm font-medium flex items-center
                    ${expirationStatus === 'expired' ? 'bg-red-100 text-red-700' :
                        expirationStatus === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-50 text-green-700'}`}>
                    {expirationStatus === 'expired' ? <AlertTriangle className="w-4 h-4 mr-2" /> :
                        expirationStatus === 'warning' ? <Clock className="w-4 h-4 mr-2" /> :
                            <Calendar className="w-4 h-4 mr-2" />}

                    <span>
                        {expirationStatus === 'expired' ? `已过期 ${Math.abs(daysRemaining)} 天` :
                            expirationStatus === 'warning' ? `${daysRemaining} 天后过期` :
                                `有效期至 ${item.expirationDate}`}
                    </span>
                </div>
            )}

            <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-500 font-medium">安全库存: {item.safetyStock} {item.unit || '份'}</p>

                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center bg-gray-100 rounded-3xl p-1 shadow-inner">
                        <button
                            onClick={() => updateStock(item.id, item.currentStock - 1)}
                            className={`p-2 rounded-full transition-colors active:scale-95 
                                ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-400 text-white hover:bg-indigo-500 shadow-md'}`}
                            disabled={!isUserLoggedIn}
                        >
                            <Minus className="w-4 h-4" />
                        </button>

                        <span className={`px-4 text-xl font-extrabold w-16 text-center ${stockTextColor}`}>
                            {item.currentStock}
                        </span>

                        <button
                            onClick={() => updateStock(item.id, item.currentStock + 1)}
                            className={`p-2 rounded-full transition-colors active:scale-95 
                                ${!isUserLoggedIn ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-400 text-white hover:bg-indigo-500 shadow-md'}`}
                            disabled={!isUserLoggedIn}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

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

export default ItemCard;
