
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import CustomModal from './CustomModal';

const ManageMembersDialog = ({ isOpen, onClose, list, currentAtomicUser, onRemoveMember, showStatus }) => {
    if (!list) return null;

    const isOwner = list.ownerId === currentAtomicUser?.uid;

    const handleRemove = async (email) => {
        if (!isOwner) return;
        if (confirm(`确定要移除成员 ${email} 吗？`)) {
            await onRemoveMember(list.id, email, showStatus);
        }
    };

    return (
        <CustomModal
            title="管理成员"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-medium text-muted-foreground">成员列表</h4>
                    <div className="space-y-2">
                        {list.memberEmails && list.memberEmails.map((email) => {
                            const isEmailOwner = email === list.ownerEmail;
                            const canRemove = isOwner && !isEmailOwner;

                            return (
                                <div key={email} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border">
                                    <span className="text-sm truncate flex-1 mr-2" title={email}>
                                        {email}
                                        {isEmailOwner && <span className="ml-2 text-xs text-primary font-medium">(所有者)</span>}
                                    </span>
                                    {canRemove && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemove(email)}
                                            title="移除成员"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                        {(!list.memberEmails || list.memberEmails.length === 0) && (
                            <p className="text-sm text-muted-foreground">暂无成员信息</p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose}>关闭</Button>
                </div>
            </div>
        </CustomModal>
    );
};

export default ManageMembersDialog;
