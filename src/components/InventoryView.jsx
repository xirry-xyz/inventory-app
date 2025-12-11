import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import InventoryTable from './InventoryTable';
import ItemCard from './ItemCard';

const InventoryView = ({
    activeTab,
    titleText,
    currentList,
    handleShareList,
    handleAddItemClick,
    user,
    itemsList,
    updateStock,
    deleteItem,
    markAsReplaced,
    isUserGoogleLoggedIn
}) => {
    // Basic media query hook replacement
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <>
            {/* List Header */}
            <div className="px-4 sm:px-6 py-4 bg-background border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-muted-foreground text-sm">
                            {titleText}
                        </h3>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    <Button
                        size="sm"
                        onClick={handleAddItemClick}
                        disabled={!user}
                        className="flex-1 sm:flex-none whitespace-nowrap"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {activeTab === 'chores' ? '添加任务' : '添加物品'}
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-0">
                {itemsList.length > 0 ? (
                    isMobile ? (
                        <div className="p-4 space-y-4">
                            {itemsList.map(item => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    updateStock={updateStock}
                                    deleteItem={deleteItem}
                                    markAsReplaced={markAsReplaced}
                                    user={user}
                                    isMobile={isMobile}
                                />
                            ))}
                        </div>
                    ) : (
                        <InventoryTable
                            items={itemsList}
                            updateStock={updateStock}
                            deleteItem={deleteItem}
                            markAsReplaced={markAsReplaced}
                            user={user}
                        />
                    )
                ) : (
                    <div className="py-16 text-center">
                        <p className="text-muted-foreground">
                            {isUserGoogleLoggedIn
                                ? (activeTab === 'restock'
                                    ? "没有需要补货或即将过期的物品"
                                    : "没有找到匹配的物品")
                                : "请先登录"}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default InventoryView;
