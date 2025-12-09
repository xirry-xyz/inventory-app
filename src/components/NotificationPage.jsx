import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Mail, BellOff } from "lucide-react";

const NotificationPage = ({ invitations, acceptInvite, declineInvite, showStatus }) => {
    const handleAccept = async (invite) => {
        await acceptInvite(invite.id, invite.listId, showStatus);
    };

    const handleDecline = async (invite) => {
        await declineInvite(invite.id, showStatus);
    };

    return (
        <div className="container max-w-3xl mx-auto py-6 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">消息中心</h2>

            {invitations.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                        <BellOff className="h-12 w-12 mb-4 opacity-20" />
                        <p>暂无新消息</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        {invitations.map((invite) => (
                            <div key={invite.id} className="flex items-start gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <Avatar className="mt-1">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        <Mail className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <p className="font-medium text-sm">
                                        邀请加入列表: {invite.listName}
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        <span className="font-medium text-foreground">{invite.inviterEmail}</span> 邀请您成为此列表的成员。
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                        onClick={() => handleDecline(invite)}
                                        title="拒绝"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-9 w-9"
                                        onClick={() => handleAccept(invite)}
                                        title="接受"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default NotificationPage;
