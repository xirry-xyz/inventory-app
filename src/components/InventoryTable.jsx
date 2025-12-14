import React from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Cat,
    Plus, Minus, Trash2, AlertTriangle, CheckCircle, CalendarClock, History, Clock
} from 'lucide-react';

const categories = {
    '全部': <Package className="w-4 h-4" />,
    '食品生鲜': <Leaf className="w-4 h-4" />,
    '日用百货': <ShoppingCart className="w-4 h-4" />,
    '个护清洁': <Wrench className="w-4 h-4" />,
    '医疗健康': <Heart className="w-4 h-4" />,
    '猫咪相关': <Cat className="w-4 h-4" />,
    '其他': <Sprout className="w-4 h-4" />,
};

const InventoryTable = ({ items, updateStock, deleteItem, user, markAsReplaced }) => {
    const isUserLoggedIn = !!user && !!user.uid;

    const getExpirationStatus = (date) => {
        if (!date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(date);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return { status: 'expired', days: Math.abs(daysRemaining) };
        if (daysRemaining <= 7) return { status: 'warning', days: daysRemaining };
        return { status: 'good', days: daysRemaining };
    };

    const getPeriodicStatus = (item) => {
        if (!item.isPeriodic || !item.lastReplaced || !item.replacementCycle) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = new Date(item.lastReplaced);
        lastDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + Number(item.replacementCycle));

        const diffTime = nextDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return { status: 'expired', days: Math.abs(daysRemaining) };
        if (daysRemaining <= 7) return { status: 'warning', days: daysRemaining };
        return { status: 'good', days: daysRemaining };
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>物品名称</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead className="text-center">库存状态</TableHead>
                        <TableHead className="text-center">当前库存</TableHead>
                        <TableHead className="text-center">安全库存</TableHead>
                        <TableHead>过期/更换</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => {
                        const needsRestock = item.currentStock <= item.safetyStock;
                        const expInfo = getExpirationStatus(item.expirationDate);
                        const periodicInfo = getPeriodicStatus(item);

                        return (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    {item.name}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        {categories[item.category] || categories['其他']}
                                        <span className="text-sm">{item.category}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {needsRestock ? (
                                        <Badge variant="destructive" className="font-bold">
                                            需补货
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-green-600 border-green-200 dark:text-green-400 dark:border-green-800">
                                            充足
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => updateStock(item.id, item.currentStock - 1)}
                                            disabled={!isUserLoggedIn}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="font-bold min-w-[20px] text-center">{item.currentStock}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => updateStock(item.id, item.currentStock + 1)}
                                            disabled={!isUserLoggedIn}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                    {item.safetyStock}
                                </TableCell>
                                <TableCell>
                                    {expInfo ? (
                                        <div className="flex items-center gap-2">
                                            {expInfo.status === 'expired' ? <AlertTriangle className="h-4 w-4 text-destructive dark:text-red-400" /> :
                                                expInfo.status === 'warning' ? <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" /> :
                                                    <CalendarClock className="h-4 w-4 text-green-500 dark:text-green-400" />}
                                            <span className={
                                                expInfo.status === 'expired' ? 'text-destructive dark:text-red-400 font-medium' :
                                                    expInfo.status === 'warning' ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'
                                            }>
                                                {expInfo.status === 'expired' ? `已过期 ${expInfo.days} 天` :
                                                    expInfo.status === 'warning' ? `${expInfo.days} 天后` :
                                                        item.expirationDate}
                                            </span>
                                        </div>
                                    ) : periodicInfo ? (
                                        <div className="flex items-center gap-2">
                                            {periodicInfo.status === 'expired' ? <AlertTriangle className="h-4 w-4 text-destructive dark:text-red-400" /> :
                                                periodicInfo.status === 'warning' ? <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" /> :
                                                    <History className="h-4 w-4 text-green-500 dark:text-green-400" />}

                                            <span className={`text-sm ${periodicInfo.status === 'expired' ? 'text-destructive dark:text-red-400 font-medium' :
                                                periodicInfo.status === 'warning' ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'
                                                }`}>
                                                {periodicInfo.status === 'expired' ? `超期 ${periodicInfo.days} 天` :
                                                    periodicInfo.status === 'warning' ? `${periodicInfo.days} 天后` :
                                                        `${periodicInfo.days} 天后`}
                                            </span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 ml-1"
                                                onClick={() => markAsReplaced(item.id)}
                                                disabled={!isUserLoggedIn}
                                                title="标记为已更换"
                                            >
                                                <CheckCircle className="h-4 w-4 text-muted-foreground hover:text-green-600" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm pl-2">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ConfirmDialog
                                        title="确定要删除此项目吗？"
                                        description="此操作无法撤销。"
                                        actionText="删除"
                                        onConfirm={() => deleteItem(item.id)}
                                    >
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            disabled={!isUserLoggedIn}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </ConfirmDialog>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default InventoryTable;
