import React, { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Trash2, Repeat, Calendar } from 'lucide-react';

const ChoreList = ({ chores, onComplete, onDelete, onEdit, user }) => {
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [selectedChore, setSelectedChore] = useState(null);
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);

    const getStatus = (nextDue) => {
        if (!nextDue) return { label: '新任务', color: 'info' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(nextDue);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return { label: `逾期 ${Math.abs(daysRemaining)} 天`, variant: 'destructive', days: daysRemaining };
        if (daysRemaining === 0) return { label: '今天', variant: 'warning', days: 0 };
        return { label: `${daysRemaining} 天后`, variant: 'secondary', days: daysRemaining };
    };

    const handleCompleteClick = (chore) => {
        setSelectedChore(chore);
        setCompletionDate(new Date().toISOString().split('T')[0]);
        setCompleteDialogOpen(true);
    };

    const handleConfirmComplete = () => {
        if (selectedChore && completionDate) {
            onComplete(selectedChore, completionDate);
            setCompleteDialogOpen(false);
            setSelectedChore(null);
        }
    };

    if (chores.length === 0) {
        return (
            <div className="py-16 text-center">
                <p className="text-muted-foreground">
                    没有家务任务，点击右上角添加
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chores.map(chore => {
                    const status = getStatus(chore.nextDue);
                    const isOverdue = status.variant === 'destructive';
                    const isToday = status.variant === 'warning';

                    return (
                        <Card key={chore.id} className="h-full flex flex-col relative overflow-hidden transition-all hover:shadow-md">
                            {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />}
                            {isToday && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />}

                            <CardContent className="flex-grow p-4 space-y-4">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-base leading-tight">
                                            {chore.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                            <Repeat className="h-3.5 w-3.5" />
                                            <span>每 {chore.frequency} 天</span>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={status.variant === 'warning' ? 'secondary' : status.variant}
                                        className={`${status.variant === 'warning' ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' : ''} whitespace-nowrap`}
                                    >
                                        {status.label}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                                    <span>上次完成: {chore.lastCompleted ? new Date(chore.lastCompleted).toLocaleDateString() : '从未'}</span>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <ConfirmDialog
                                        title="确定要删除这个家务吗？"
                                        description="此操作无法撤销，任务将被永久删除。"
                                        actionText="删除"
                                        onConfirm={() => onDelete(chore.id)}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            disabled={!user}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </ConfirmDialog>
                                    <Button
                                        size="sm"
                                        className="h-8"
                                        onClick={() => handleCompleteClick(chore)}
                                        disabled={!user}
                                    >
                                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                        完成
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>完成任务</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">请确认完成日期</Label>
                            <Input
                                id="date"
                                type="date"
                                value={completionDate}
                                onChange={(e) => setCompletionDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>取消</Button>
                        <Button onClick={handleConfirmComplete}>确认完成</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ChoreList;
