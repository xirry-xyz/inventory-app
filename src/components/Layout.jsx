import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme, useMediaQuery,
    Avatar, Stack, Button
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home,
    Notifications,
    Settings,
    Add,
    Logout,
    Login,
    ChevronLeft
} from '@mui/icons-material';

const drawerWidth = 240;

const Layout = ({
    children,
    activeTab,
    setActiveTab,
    user,
    handleSignOut,
    setShowAuthModal,
    handleAddItemClick
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navItems = [
        { id: 'home', icon: <Home />, label: '主页' },
        { id: 'restock', icon: <Notifications />, label: '补货' },
        { id: 'settings', icon: <Settings />, label: '设置' },
    ];

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ px: 2 }}>
                <Typography variant="h6" noWrap component="div" fontWeight="bold">
                    Inventory<Box component="span" color="primary.main">App</Box>
                </Typography>
            </Toolbar>
            <Divider />
            <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
                {navItems.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            selected={activeTab === item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (isMobile) setMobileOpen(false);
                            }}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: 'inherit',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ p: 2 }}>
                <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Add />}
                    onClick={handleAddItemClick}
                    disabled={!user}
                    sx={{ mb: 2 }}
                >
                    添加物品
                </Button>

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
        </Box>
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
                        <Typography variant="h6" noWrap component="div" fontWeight="bold">
                            {navItems.find(i => i.id === activeTab)?.label || 'Inventory'}
                        </Typography>
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
        </Box>
    );
};

export default Layout;
