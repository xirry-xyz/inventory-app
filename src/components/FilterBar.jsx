import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import {
    Package, Leaf, ShoppingCart, Wrench, Heart, Cat, Sprout
} from 'lucide-react';

// Categories constant
export const categories = {
    '全部': <Package className="w-4 h-4 mr-1" />,
    '食品生鲜': <Leaf className="w-4 h-4 mr-1" />,
    '日用百货': <ShoppingCart className="w-4 h-4 mr-1" />,
    '个护清洁': <Wrench className="w-4 h-4 mr-1" />,
    '医疗健康': <Heart className="w-4 h-4 mr-1" />,
    '猫咪相关': <Cat className="w-4 h-4 mr-1" />,
    '其他': <Sprout className="w-4 h-4 mr-1" />,
};

const FilterBar = ({ searchTerm, setSearchTerm, activeCategory, setActiveCategory }) => {
    return (
        <div className="p-4 md:p-6 border-b">
            <div className="flex flex-col gap-4">
                <div className="w-full relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索物品..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="w-full flex-1 flex flex-wrap gap-2">
                    {Object.keys(categories).map(category => (
                        <Button
                            key={category}
                            variant={activeCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveCategory(category)}
                            className="h-8 rounded-full"
                        >
                            {categories[category]}
                            {category}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
