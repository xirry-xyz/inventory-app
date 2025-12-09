import React from 'react';
import {
    Card, CardContent, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Plus, Minus, Trash2, AlertTriangle, CheckCircle, CalendarClock, History, Clock,
    ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Cat
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

const ItemCard = ({ item, updateStock, deleteItem, user, markAsReplaced, isMobile }) => {
    const needsRestock = item.currentStock <= item.safetyStock;
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

    const expInfo = getExpirationStatus(item.expirationDate);
    const periodicInfo = getPeriodicStatus(item);

    return (
        <Card className="h-full flex flex-col relative transition-all hover:border-primary/50 hover:shadow-md">
            <CardContent className="flex-grow p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-base leading-none">
                            {item.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            {categories[item.category] || categories['其他']}
                            <span>{item.category}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {needsRestock ? (
                            <Badge variant="destructive" className="h-6 font-bold px-1.5">需补货</Badge>
                        ) : (
                            <Badge variant="outline" className="h-6 text-green-600 border-green-200 px-1.5">充足</Badge>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            className={`h-7 w-7 text-muted-foreground hover:text-destructive ${isMobile ? '' : 'sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'}`}
                            onClick={() => deleteItem(item.id)}
                            disabled={!isUserLoggedIn}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    {/* Stock Control */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">当前库存</span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateStock(item.id, item.currentStock - 1)}
                                disabled={!isUserLoggedIn}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold min-w-[20px] text-center">{item.currentStock}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateStock(item.id, item.currentStock + 1)}
                                disabled={!isUserLoggedIn}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Expiry / Periodic Info */}
                    {(expInfo || periodicInfo) && (
                        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                                {expInfo ? (
                                    <>
                                        {expInfo.status === 'expired' ? <AlertTriangle className="h-4 w-4 text-destructive" /> :
                                            expInfo.status === 'warning' ? <Clock className="h-4 w-4 text-orange-500" /> :
                                                <CalendarClock className="h-4 w-4 text-green-500" />}
                                        <span className={`text-sm ${expInfo.status === 'expired' ? 'text-destructive font-medium' : expInfo.status === 'warning' ? 'text-orange-500' : 'text-foreground'}`}>
                                            {expInfo.status === 'expired' ? `已过期 ${expInfo.days} 天` :
                                                expInfo.status === 'warning' ? `${expInfo.days} 天后过期` :
                                                    item.expirationDate}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {periodicInfo.status === 'expired' ? <AlertTriangle className="h-4 w-4 text-destructive" /> :
                                            periodicInfo.status === 'warning' ? <Clock className="h-4 w-4 text-orange-500" /> :
                                                <History className="h-4 w-4 text-green-500" />}
                                        <span className={`text-sm ${periodicInfo.status === 'expired' ? 'text-destructive font-medium' : periodicInfo.status === 'warning' ? 'text-orange-500' : 'text-foreground'}`}>
                                            {periodicInfo.status === 'expired' ? `超期 ${periodicInfo.days} 天` :
                                                periodicInfo.status === 'warning' ? `${periodicInfo.days} 天后更换` :
                                                    `${periodicInfo.days} 天后更换`}
                                        </span>
                                    </>
                                )}
                            </div>
                            {periodicInfo && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 ml-1 bg-background shadow-sm"
                                    onClick={() => markAsReplaced(item.id)}
                                    disabled={!isUserLoggedIn}
                                    title="标记为已更换"
                                >
                                    <CheckCircle className="h-4 w-4 text-muted-foreground hover:text-green-600" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ItemCard;
