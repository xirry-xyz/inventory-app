import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const DashboardStats = ({ totalItems, restockCount, expiringCount }) => {
    return (
        <div className="flex w-full gap-2 sm:gap-4">
            <div className="flex-1">
                <Card className="h-full">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs text-muted-foreground block mb-1">总物品</span>
                        <span className="text-xl font-bold leading-none">{totalItems}</span>
                    </CardContent>
                </Card>
            </div>
            <div className="flex-1">
                <Card className="h-full">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs text-muted-foreground block mb-1">需补货</span>
                        <span className={`text-xl font-bold leading-none ${restockCount > 0 ? "text-destructive" : ""}`}>
                            {restockCount}
                        </span>
                    </CardContent>
                </Card>
            </div>
            <div className="flex-1">
                <Card className="h-full">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs text-muted-foreground block mb-1">即将过期</span>
                        <span className={`text-xl font-bold leading-none ${expiringCount > 0 ? "text-yellow-600" : ""}`}>
                            {expiringCount}
                        </span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardStats;
