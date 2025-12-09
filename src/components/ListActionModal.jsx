import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ListActionModal = ({ open, onClose, mode, initialName, initialType, onSubmit }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('private');

    useEffect(() => {
        if (open) {
            setName(initialName || '');
            setType(initialType || 'private');
        }
    }, [open, initialName, initialType]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim(), type);
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? '新建列表' : '重命名列表'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">列表名称</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="请输入列表名称"
                            autoFocus
                        />
                    </div>

                    {mode === 'create' && (
                        <div className="space-y-2">
                            <Label htmlFor="type">列表类型</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择列表类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">个人私有列表</SelectItem>
                                    <SelectItem value="shared">共享列表</SelectItem>
                                </SelectContent>
                            </Select>
                            {type === 'shared' && (
                                <p className="text-xs text-muted-foreground">
                                    创建后可以通过邀请链接邀请他人加入。
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            取消
                        </Button>
                        <Button type="submit" disabled={!name.trim()}>
                            确定
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ListActionModal;
