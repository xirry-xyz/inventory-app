import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ChoreForm = ({ onSubmit, onCancel }) => {
    const [name, setName] = useState('');
    const [frequency, setFrequency] = useState(7);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
            name,
            frequency: Number(frequency)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
                <Label htmlFor="chore-name">任务名称</Label>
                <Input
                    id="chore-name"
                    placeholder="例如：给猫咪换水"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="chore-frequency">重复频率 (天/次)</Label>
                <div className="relative">
                    <Input
                        id="chore-frequency"
                        type="number"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        required
                        min={1}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                        天/次
                    </div>
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                    每隔多少天执行一次
                </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    取消
                </Button>
                <Button type="submit">
                    添加任务
                </Button>
            </div>
        </form>
    );
};

export default ChoreForm;
