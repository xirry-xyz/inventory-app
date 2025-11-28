import React from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    IconButton,
    Button,
    Stack,
    Divider,
    Container
} from '@mui/material';
import {
    Check as CheckIcon,
    Close as CloseIcon,
    Mail as MailIcon,
    NotificationsNone as EmptyIcon
} from '@mui/icons-material';

const NotificationPage = ({ invitations, acceptInvite, declineInvite, showStatus }) => {
    const handleAccept = async (invite) => {
        await acceptInvite(invite.id, invite.listId, showStatus);
    };

    const handleDecline = async (invite) => {
        await declineInvite(invite.id, showStatus);
    };

    return (
        <Container maxWidth="md">
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                消息中心
            </Typography>

            {invitations.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <EmptyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                        暂无新消息
                    </Typography>
                </Paper>
            ) : (
                <Paper>
                    <List disablePadding>
                        {invitations.map((invite, index) => (
                            <React.Fragment key={invite.id}>
                                {index > 0 && <Divider />}
                                <ListItem
                                    alignItems="flex-start"
                                    secondaryAction={
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                edge="end"
                                                color="error"
                                                onClick={() => handleDecline(invite)}
                                                title="拒绝"
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                color="success"
                                                onClick={() => handleAccept(invite)}
                                                title="接受"
                                            >
                                                <CheckIcon />
                                            </IconButton>
                                        </Stack>
                                    }
                                    sx={{ py: 2 }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                                            <MailIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                邀请加入列表: {invite.listName}
                                            </Typography>
                                        }
                                        secondary={
                                            <React.Fragment>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    {invite.inviterEmail}
                                                </Typography>
                                                {" 邀请您成为此列表的成员。"}
                                            </React.Fragment>
                                        }
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Container>
    );
};

export default NotificationPage;
