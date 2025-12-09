import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const categories = [
    '食品生鲜',
    '日用百货',
    '个护清洁',
    '医疗健康',
    '猫咪相关',
    '其他'
];

const ItemForm = memo(({ newItem, setNewItem, addItem, user, showStatus }) => {

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Shader select onValueChange handler wrapper
    const handleSelectChange = (name, value) => {
        setNewItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (checked) => {
        setNewItem(prev => ({
            ...prev,
            isPeriodic: checked
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addItem(newItem, showStatus);
    };

    // 检查用户是否已登录 (user 存在且有 uid)
    const isLoggedIn = !!user && !!user.uid;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">基本信息</h4>
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">物品名称</Label>
                        <Input
                            id="name"
                            name="name"
                            value={newItem.name}
                            onChange={handleInputChange}
                            required
                            placeholder="例如：洗手液"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>分类</Label>
                        <Select
                            value={newItem.category}
                            onValueChange={(val) => handleSelectChange('category', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择分类" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">库存设置</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentStock">当前库存</Label>
                        <Input
                            id="currentStock"
                            name="currentStock"
                            type="number"
                            value={newItem.currentStock}
                            onChange={handleInputChange}
                            required
                            min={0}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="safetyStock">安全库存</Label>
                        <Input
                            id="safetyStock"
                            name="safetyStock"
                            type="number"
                            value={newItem.safetyStock}
                            onChange={handleInputChange}
                            required
                            min={1}
                        />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="expirationDate">过期日期 (可选)</Label>
                        <Input
                            id="expirationDate"
                            name="expirationDate"
                            type="date"
                            value={newItem.expirationDate || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">周期性更换 (可选)</h4>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="isPeriodic"
                        checked={newItem.isPeriodic || false}
                        onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="isPeriodic" className="text-sm font-normal cursor-pointer">
                        启用周期性更换提醒 (如电动牙刷头)
                    </Label>
                </div>

                {newItem.isPeriodic && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="replacementCycle">更换周期 (天)</Label>
                            <Input
                                id="replacementCycle"
                                name="replacementCycle"
                                type="number"
                                value={newItem.replacementCycle || ''}
                                onChange={handleInputChange}
                                required={newItem.isPeriodic}
                                min={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastReplaced">上次更换日期</Label>
                            <Input
                                id="lastReplaced"
                                name="lastReplaced"
                                type="date"
                                value={newItem.lastReplaced || new Date().toISOString().split('T')[0]}
                                onChange={handleInputChange}
                                required={newItem.isPeriodic}
                            />
                        </div>
                    </div>
                )}
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={!isLoggedIn}
            >
                {isLoggedIn ? '保存物品' : '请先登录'}
            </Button>
        </form>
    );
});

export default ItemForm;
