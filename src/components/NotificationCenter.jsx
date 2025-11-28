import React, { useState } from 'react';
import {
    IconButton, Badge, Popover, List, ListItem, ListItemText,
    Typography, Box, Button, Divider, ListItemAvatar, Avatar
} from '@mui/material';
import { Notifications, Check, Close, Mail } from '@mui/icons-material';

const NotificationCenter = ({ invitations, acceptInvite, declineInvite, showStatus, renderAsListItem }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        // Prevent event bubbling if inside a button
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    const handleAccept = async (invite) => {
        const success = await acceptInvite(invite.id, invite.listId, showStatus);
        if (success) {
            // Optional: Close popover or keep open
        }
    };

    const handleDecline = async (invite) => {
        await declineInvite(invite.id, showStatus);
    };

    const trigger = renderAsListItem ? (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }} onClick={handleClick}>
            <Badge badgeContent={invitations.length} color="error" sx={{ mr: 2 }}>
                <Notifications fontSize="small" color="action" />
            </Badge>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>消息中心</Typography>
        </Box>
    ) : (
        <IconButton color="inherit" onClick={handleClick}>
            <Badge badgeContent={invitations.length} color="error">
                <Notifications />
            </Badge>
        </IconButton>
    );

    return (
        <>
            {trigger}
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: { width: 320, maxHeight: 400 }
                }}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="bold">消息中心</Typography>
                </Box>
                {invitations.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">暂无新消息</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {invitations.map((invite, index) => (
                            <React.Fragment key={invite.id}>
                                <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', width: '100%', gap: 1.5 }}>
                                        <ListItemAvatar sx={{ minWidth: 0 }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                                                <Mail fontSize="small" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    邀请加入列表
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary">
                                                    <Box component="span" fontWeight="bold" color="text.primary">
                                                        {invite.inviterEmail}
                                                    </Box>
                                                    {' 邀请您加入 '}
                                                    <Box component="span" fontWeight="bold" color="primary.main">
                                                        {invite.listName}
                                                    </Box>
                                                </Typography>
                                            }
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<Close />}
                                            onClick={() => handleDecline(invite)}
                                        >
                                            拒绝
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Check />}
                                            onClick={() => handleAccept(invite)}
                                        >
                                            接受
                                        </Button>
                                    </Box>
                                </ListItem>
                                {index < invitations.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Popover>
        </>
    );
};

export default NotificationCenter;
