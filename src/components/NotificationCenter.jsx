import React, { useState } from 'react';
import { Bell, Check, X, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const NotificationCenter = ({ invitations, acceptInvite, declineInvite, showStatus, renderAsListItem }) => {
    const [open, setOpen] = useState(false);

    const handleAccept = async (invite) => {
        const success = await acceptInvite(invite.id, invite.listId, showStatus);
        if (success) {
            // Optional: Close popover or keep open
            if (invitations.length <= 1) setOpen(false);
        }
    };

    const handleDecline = async (invite) => {
        await declineInvite(invite.id, showStatus);
        if (invitations.length <= 1) setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {renderAsListItem ? (
                    <div className="flex items-center w-full cursor-pointer py-2 px-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <div className="relative mr-3">
                            <Bell className="h-4 w-4" />
                            {invitations.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
                            )}
                        </div>
                        <span className="text-sm font-medium">消息中心</span>
                        {invitations.length > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-[10px]">
                                {invitations.length}
                            </Badge>
                        )}
                    </div>
                ) : (
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {invitations.length > 0 && (
                            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                            </span>
                        )}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b font-semibold bg-muted/40">消息中心</div>
                {invitations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">暂无新消息</div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                        {invitations.map((invite) => (
                            <div key={invite.id} className="p-4 border-b last:border-0 flex flex-col gap-3 hover:bg-muted/20 transition-colors">
                                <div className="flex gap-3 items-start">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            <Mail className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-sm flex-1">
                                        <div className="font-semibold mb-1">邀请加入列表</div>
                                        <div className="text-muted-foreground leading-snug">
                                            <span className="font-medium text-foreground">{invite.inviterEmail}</span> 邀请您加入 <span className="font-medium text-primary">{invite.listName}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                        onClick={() => handleDecline(invite)}
                                    >
                                        <X className="h-4 w-4 mr-1" /> 拒绝
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8"
                                        onClick={() => handleAccept(invite)}
                                    >
                                        <Check className="h-4 w-4 mr-1" /> 接受
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationCenter;
