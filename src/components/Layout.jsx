import React from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Box, Container,
    BottomNavigation, BottomNavigationAction, Fab, useMediaQuery, useTheme, Button, Stack
} from '@mui/material';
import {
    Home, Notifications, Settings, Logout, Login, Add
} from '@mui/icons-material';

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
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const navItems = [
        { id: 'home', icon: <Home />, label: '主页' },
        { id: 'restock', icon: <Notifications />, label: '补货' },
        { id: 'settings', icon: <Settings />, label: '设置' },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: isMobile ? 10 : 4 }}>
            {/* Minimalist Header */}
            <AppBar position="static" color="default" elevation={0}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ minHeight: 64 }}>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ flexGrow: 1, fontWeight: 800, cursor: 'pointer', letterSpacing: '-0.5px' }}
                            onClick={() => setActiveTab('home')}
                        >
                            inventory<Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>tracker</Box>
                        </Typography>

                        {/* Desktop Nav */}
                        {!isMobile && (
                            <Stack direction="row" spacing={1} alignItems="center">
                                {user ? (
                                    <>
                                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                                            {user.email}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleSignOut}
                                            size="small"
                                            disableElevation
                                        >
                                            退出
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => setShowAuthModal(true)}
                                        size="small"
                                        disableElevation
                                    >
                                        登录
                                    </Button>
                                )}
                            </Stack>
                        )}

                        {/* Mobile Settings Icon */}
                        {isMobile && (
                            <IconButton
                                onClick={() => setActiveTab('settings')}
                                size="small"
                            >
                                <Settings />
                            </IconButton>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {children}
            </Container>

            {/* Mobile FAB */}
            {isMobile && (
                <Fab
                    color="primary"
                    aria-label="add"
                    sx={{ position: 'fixed', bottom: 80, right: 16 }}
                    onClick={handleAddItemClick}
                >
                    <Add />
                </Fab>
            )}

            {/* Mobile Bottom Nav */}
            {isMobile && (
                <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderTop: '1px solid #E5E7EB' }}>
                    <BottomNavigation
                        showLabels
                        value={activeTab}
                        onChange={(event, newValue) => {
                            setActiveTab(newValue);
                        }}
                        sx={{ bgcolor: 'background.paper' }}
                    >
                        {navItems.map(item => (
                            <BottomNavigationAction
                                key={item.id}
                                label={item.label}
                                value={item.id}
                                icon={item.icon}
                            />
                        ))}
                    </BottomNavigation>
                </Box>
            )}
        </Box>
    );
};

export default Layout;
