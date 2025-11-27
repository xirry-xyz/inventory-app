import React from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Box, Container,
    BottomNavigation, BottomNavigationAction, Fab, useMediaQuery, useTheme, Button
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
        { id: 'restock', icon: <Notifications />, label: '补货/过期' },
        { id: 'settings', icon: <Settings />, label: '设置' },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: isMobile ? 10 : 4 }}>
            {/* 顶部标题栏 */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main', pb: 4, mb: -4 }}>
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={() => setActiveTab('home')}
                    >
                        家庭用品库存管家
                    </Typography>

                    {/* 桌面端/大屏幕的设置/登录按钮 */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {user && (
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    你好, {user.displayName || user.email || '用户'}
                                </Typography>
                            )}
                            <IconButton
                                color="inherit"
                                onClick={() => setActiveTab('settings')}
                                title="设置"
                            >
                                <Settings />
                            </IconButton>
                            {user ? (
                                <IconButton
                                    color="inherit"
                                    onClick={handleSignOut}
                                    title="注销"
                                >
                                    <Logout />
                                </IconButton>
                            ) : (
                                <Button
                                    color="inherit"
                                    startIcon={<Login />}
                                    onClick={() => setShowAuthModal(true)}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                >
                                    登录
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* 移动端/小屏幕的设置入口 */}
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings />
                        </IconButton>
                    )}
                </Toolbar>
                <Container maxWidth="lg">
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                        {user ? '您的云端库存管理器' : '请登录以启用云同步'}
                    </Typography>
                </Container>
            </AppBar>

            {/* 主内容区域 */}
            <Container maxWidth="lg" sx={{ mt: 4, position: 'relative', zIndex: 1 }}>
                {children}
            </Container>

            {/* 移动端浮动添加按钮 (FAB) */}
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

            {/* 底部导航栏 */}
            {isMobile && (
                <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, boxShadow: 3 }}>
                    <BottomNavigation
                        showLabels
                        value={activeTab}
                        onChange={(event, newValue) => {
                            setActiveTab(newValue);
                        }}
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
