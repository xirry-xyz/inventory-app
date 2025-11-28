import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme, useMediaQuery,
    Avatar, Stack, Button, Badge
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home,
    Notifications,
    Settings,
    Add,
    Logout,
    Login,
    ChevronLeft,
    ListAlt,
    Person,
    Group,
    MoreVert,
    Edit,
    Delete,
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    Tune
} from '@mui/icons-material';
import { Menu, MenuItem, ListSubheader, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import NotificationCenter from './NotificationCenter';
import ListActionModal from './ListActionModal';

const drawerWidth = 240;

const Layout = ({
    children,
    activeTab,
    setActiveTab,
    user,
    handleSignOut,
    setShowAuthModal,
    handleAddItemClick,
    sharedLists,
    currentList,
    setCurrentList,
    onCreateList,
    onRenameList,
    onDeleteList,
    invitations,
    acceptInvite,
    declineInvite,
    showStatus,
    mainListName // New prop
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Nav items removed in favor of Tabs in App.jsx

    const [listModalOpen, setListModalOpen] = useState(false);
    const [listModalMode, setListModalMode] = useState('create'); // 'create' or 'rename'
    const [editingList, setEditingList] = useState(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [listToDelete, setListToDelete] = useState(null);

    // Menu state for list actions
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedListForMenu, setSelectedListForMenu] = useState(null);

    const handleListMenuOpen = (event, list) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedListForMenu(list);
    };

    const handleListMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedListForMenu(null);
    };

    const handleOpenCreateModal = () => {
        setListModalMode('create');
        setEditingList(null);
        setListModalOpen(true);
    };

    const handleOpenRenameModal = () => {
        if (selectedListForMenu) {
            setListModalMode('rename');
            setEditingList(selectedListForMenu);
            setListModalOpen(true);
        }
        handleListMenuClose();
    };

    const handleDeleteListClick = () => {
        if (selectedListForMenu) {
            if (selectedListForMenu.id === 'default') {
                const privateListsCount = sharedLists ? sharedLists.filter(l => l.type === 'private').length : 0;
                if (privateListsCount === 0) {
                    showStatus('无法删除：这是您唯一的私有列表。', true);
                    handleListMenuClose();
                    return;
                }
                setDeleteMessage('确定要清空并删除主清单吗？注意：这会清空主清单中的所有物品。');
            } else {
                setDeleteMessage(`确定要删除列表 "${selectedListForMenu.name}" 吗？`);
            }
            setListToDelete(selectedListForMenu);
            setDeleteModalOpen(true);
        }
        handleListMenuClose();
    };

    const handleConfirmDelete = () => {
        if (listToDelete) {
            onDeleteList(listToDelete.id);
            if (currentList?.id === listToDelete.id) {
                setCurrentList(null);
            }
        }
        setDeleteModalOpen(false);
        setListToDelete(null);
    };

    const handleListModalSubmit = (name, type) => {
        if (listModalMode === 'create') {
            onCreateList(name, type);
        } else {
            onRenameList(editingList.id, name);
        }
    };

    // Separate lists
    const privateLists = sharedLists ? sharedLists.filter(l => l.type === 'private') : [];
    const sharedListsFiltered = sharedLists ? sharedLists.filter(l => l.type === 'shared') : [];

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ px: 2 }}>
                <Typography variant="h6" noWrap component="div" fontWeight="bold">
                    Inventory<Box component="span" color="primary.main">App</Box>
                </Typography>
            </Toolbar>
            <Divider />
            <List sx={{ px: 2, pt: 2 }}>
                {/* Dashboard Navigation Removed */}
            </List>

            {/* List Switcher */}
            {user && (
                <Box sx={{ px: 2, flexGrow: 1, overflowY: 'auto' }}>
                    <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 'bold', lineHeight: '32px', mb: 1 }}>
                        我的清单
                    </ListSubheader>
                    <List dense sx={{ p: 0 }}>
                        {/* Private Lists Section */}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, mb: 1, display: 'block', px: 1, fontWeight: 'bold' }}>
                            私有列表
                        </Typography>

                        {/* Default List (Main Inventory) */}
                        <ListItem
                            disablePadding
                            sx={{ mb: 0.5 }}
                            secondaryAction={
                                <IconButton edge="end" size="small" onClick={(e) => handleListMenuOpen(e, { id: 'default', name: mainListName || '主清单', type: 'private' })}>
                                    <MoreVert fontSize="small" sx={{ fontSize: '1rem' }} />
                                </IconButton>
                            }
                        >
                            <ListItemButton
                                selected={!currentList && activeTab !== 'settings' && activeTab !== 'notifications'} // Null means default private list
                                onClick={() => {
                                    setCurrentList(null);
                                    setActiveTab('inventory');
                                    if (isMobile) setMobileOpen(false);
                                }}
                                sx={{
                                    borderRadius: 2,
                                    '&.Mui-selected': {
                                        bgcolor: 'action.selected',
                                        borderLeft: '4px solid',
                                        borderColor: 'primary.main',
                                        paddingLeft: '12px'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <Person fontSize="small" color={!currentList ? "primary" : "action"} />
                                </ListItemIcon>
                                <ListItemText primary={mainListName || "主清单"} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: !currentList ? 'bold' : 'normal' }} />
                            </ListItemButton>
                        </ListItem>

                        {/* Other Private Lists */}
                        {privateLists.map(list => (
                            <ListItem
                                key={list.id}
                                disablePadding
                                secondaryAction={
                                    <IconButton edge="end" size="small" onClick={(e) => handleListMenuOpen(e, list)}>
                                        <MoreVert fontSize="small" sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                }
                                sx={{ mb: 0.5 }}
                            >
                                <ListItemButton
                                    selected={currentList?.id === list.id && activeTab !== 'settings' && activeTab !== 'notifications'}
                                    onClick={() => {
                                        setCurrentList(list);
                                        setActiveTab('inventory');
                                        if (isMobile) setMobileOpen(false);
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        '&.Mui-selected': {
                                            bgcolor: 'action.selected',
                                            borderLeft: '4px solid',
                                            borderColor: 'primary.main',
                                            paddingLeft: '12px'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <ListAlt fontSize="small" color={currentList?.id === list.id ? "primary" : "action"} />
                                    </ListItemIcon>
                                    <ListItemText primary={list.name} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: currentList?.id === list.id ? 'bold' : 'normal' }} />
                                </ListItemButton>
                            </ListItem>
                        ))}

                        {/* Shared Lists Header */}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, mb: 1, display: 'block', px: 1, fontWeight: 'bold' }}>
                            共享列表
                        </Typography>
                        {sharedListsFiltered.map(list => (
                            <ListItem
                                key={list.id}
                                disablePadding
                                secondaryAction={
                                    <IconButton edge="end" size="small" onClick={(e) => handleListMenuOpen(e, list)}>
                                        <MoreVert fontSize="small" sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                }
                                sx={{ mb: 0.5 }}
                            >
                                <ListItemButton
                                    selected={currentList?.id === list.id && activeTab !== 'settings' && activeTab !== 'notifications'}
                                    onClick={() => {
                                        setCurrentList(list);
                                        setActiveTab('inventory');
                                        if (isMobile) setMobileOpen(false);
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        '&.Mui-selected': {
                                            bgcolor: 'action.selected',
                                            borderLeft: '4px solid',
                                            borderColor: 'primary.main',
                                            paddingLeft: '12px'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <Group fontSize="small" color={currentList?.id === list.id ? "secondary" : "action"} />
                                    </ListItemIcon>
                                    <ListItemText primary={list.name} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: currentList?.id === list.id ? 'bold' : 'normal' }} />
                                </ListItemButton>
                            </ListItem>
                        ))}

                        <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={handleOpenCreateModal}
                            sx={{ mt: 1, textTransform: 'none', justifyContent: 'flex-start', px: 2, color: 'text.secondary' }}
                            fullWidth
                        >
                            新建列表...
                        </Button>
                    </List>
                </Box>
            )}

            <Divider sx={{ my: 1, mx: 2 }} />

            {/* System Section */}
            <List sx={{ px: 2, pb: 1 }}>
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 'bold', lineHeight: '32px', mb: 1 }}>
                    系统
                </ListSubheader>

                {/* Notification Center Item */}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                        selected={activeTab === 'notifications'}
                        onClick={() => {
                            setActiveTab('notifications');
                            if (isMobile) setMobileOpen(false);
                        }}
                        sx={{
                            borderRadius: 2,
                            '&.Mui-selected': {
                                bgcolor: 'action.selected',
                                borderLeft: '4px solid',
                                borderColor: 'primary.main',
                                paddingLeft: '12px'
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <Badge badgeContent={invitations.length} color="error" variant="dot">
                                <Notifications fontSize="small" color={activeTab === 'notifications' ? "primary" : "action"} />
                            </Badge>
                        </ListItemIcon>
                        <ListItemText primary="消息中心" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: activeTab === 'notifications' ? 'bold' : 'normal' }} />
                    </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                        selected={activeTab === 'settings'}
                        onClick={() => {
                            setActiveTab('settings');
                            if (isMobile) setMobileOpen(false);
                        }}
                        sx={{
                            borderRadius: 2,
                            '&.Mui-selected': {
                                bgcolor: 'action.selected',
                                borderLeft: '4px solid',
                                borderColor: 'primary.main',
                                paddingLeft: '12px'
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <Settings fontSize="small" color={activeTab === 'settings' ? "primary" : "action"} />
                        </ListItemIcon>
                        <ListItemText primary="设置" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: activeTab === 'settings' ? 'bold' : 'normal' }} />
                    </ListItemButton>
                </ListItem>
            </List>

            <Box sx={{ px: 2, pb: 2 }}>
                {/* Add Item Button Removed from Sidebar */}

                <Divider sx={{ mb: 2 }} />

                {user ? (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: 'hidden' }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.875rem' }}>
                            {user.email ? user.email[0].toUpperCase() : 'U'}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography variant="body2" noWrap fontWeight="bold">
                                {user.displayName || '用户'}
                            </Typography>
                            <Typography variant="caption" noWrap display="block" color="text.secondary">
                                {user.email}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={handleSignOut}>
                            <Logout fontSize="small" />
                        </IconButton>
                    </Stack>
                ) : (
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Login />}
                        onClick={() => setShowAuthModal(true)}
                    >
                        登录
                    </Button>
                )}
            </Box>
        </Box >
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Mobile Header */}
            {isMobile && (
                <AppBar
                    position="fixed"
                    sx={{
                        width: { md: `calc(100% - ${drawerWidth}px)` },
                        ml: { md: `${drawerWidth}px` },
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        boxShadow: 1
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { md: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" fontWeight="bold" sx={{ flexGrow: 1 }}>
                            Inventory App
                        </Typography>
                        {user && (
                            <IconButton color="inherit" onClick={() => setActiveTab('notifications')}>
                                <Badge badgeContent={invitations.length} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                        )}
                    </Toolbar>
                </AppBar>
            )}

            {/* Sidebar Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Mobile Temporary Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop Permanent Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #E5E7EB' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    mt: isMobile ? 8 : 0
                }}
            >
                {children}
            </Box>
            {/* List Actions Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleListMenuClose}
            >
                <MenuItem onClick={handleOpenRenameModal}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>重命名</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDeleteListClick} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <Delete fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>删除</ListItemText>
                </MenuItem>
            </Menu>

            {/* Create/Rename Modal */}
            <ListActionModal
                open={listModalOpen}
                onClose={() => setListModalOpen(false)}
                mode={listModalMode}
                initialName={editingList?.name}
                initialType={editingList?.type}
                onSubmit={handleListModalSubmit}
            />

            {/* Delete Confirmation Modal */}
            <Dialog
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 2, minWidth: 300 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
                    确认删除
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {deleteMessage}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteModalOpen(false)}
                        sx={{ color: 'text.secondary', borderRadius: 2 }}
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        disableElevation
                        sx={{ borderRadius: 2 }}
                    >
                        删除
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Layout;
