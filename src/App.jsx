import React, { useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
    Package, Leaf, ShoppingCart, Wrench, Heart, Cat, Sprout,
    AlertTriangle, Check, Search, Home, LogOut, Chrome, Loader, Plus
} from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import theme from './theme';

import Layout from './components/Layout';
import CustomModal from './components/CustomModal';
import AuthModal from './components/AuthModal';
import ItemForm from './components/ItemForm';
import InventoryTable from './components/InventoryTable';
import ItemCard from './components/ItemCard'; // Keep for mobile view if needed, or just use table
import StatusMessage from './components/StatusMessage';

import {
    Box, Typography, Grid, Paper, InputBase, IconButton, Button, Chip, Stack, CircularProgress, Card, CardContent, Divider, useMediaQuery
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';

// Categories constant
const categories = {
    '全部': <Package className="w-5 h-5" />,
    '食品生鲜': <Leaf className="w-5 h-5" />,
    '日用百货': <ShoppingCart className="w-5 h-5" />,
    '个护清洁': <Wrench className="w-5 h-5" />,
    '医疗健康': <Heart className="w-5 h-5" />,
    '猫咪相关': <Cat className="w-5 h-5" />,
    '其他': <Sprout className="w-5 h-5" />,
};

const App = () => {
    // Hooks
    const {
        user, userId, isAuthReady, configError, showAuthModal, setShowAuthModal,
        handleGoogleSignIn, handleSignOut, setConfigError
    } = useAuth();

    const {
        inventory, loading, addItem, updateStock, deleteItem
    } = useInventory(user, configError, isAuthReady, setConfigError);

    // Local State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('全部');
    const [showItemModal, setShowItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货', expirationDate: '' });
    const [statusMessage, setStatusMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('home');

    // Helpers
    const showStatus = useCallback((message, isError = false, duration = 3000) => {
        setStatusMessage({ message, isError });
        const timer = setTimeout(() => setStatusMessage(null), duration);
        return () => clearTimeout(timer);
    }, []);

    const handleAddItemClick = () => {
        if (!user || !user.uid) {
            showStatus('请先登录才能添加物品', true);
            setShowAuthModal(true);
        } else {
            setShowItemModal(true);
        }
    };

    const handleAddItem = async (item, showStatusFn) => {
        const success = await addItem(item, showStatusFn);
        if (success) {
            setShowItemModal(false);
            setNewItem({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货', expirationDate: '' });
        }
    };

    const handleGoogleSignInWrapper = async () => {
        await handleGoogleSignIn(showStatus);
    };

    const handleSignOutWrapper = async () => {
        await handleSignOut(showStatus);
    };

    const updateStockWrapper = (id, newStock) => updateStock(id, newStock, showStatus);
    const deleteItemWrapper = (id) => deleteItem(id, showStatus);


    // Filtering Logic
    const itemsToRestock = inventory.filter(item => item.currentStock <= item.safetyStock);

    const itemsExpiringSoon = inventory.filter(item => {
        if (!item.expirationDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(item.expirationDate);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return daysRemaining <= 7; // Expiring within 7 days or expired
    });

    const filteredInventory = inventory.filter(item => {
        let listToFilter = inventory;

        if (activeTab === 'restock') {
            const needsRestock = item.currentStock <= item.safetyStock;
            let isExpiring = false;
            if (item.expirationDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expDate = new Date(item.expirationDate);
                expDate.setHours(0, 0, 0, 0);
                const diffTime = expDate - today;
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                isExpiring = daysRemaining <= 7;
            }
            return (needsRestock || isExpiring) && item.name.toLowerCase().includes(searchTerm.toLowerCase());
        }

        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === '全部' || item.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Render Content
    const renderContent = () => {
        if (activeTab === 'settings') {
            const isGoogleUser = !!user && !!user.uid;
            return (
                <Card>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>用户与应用设置</Typography>
                        <Stack spacing={3}>
                            <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>登录状态</Typography>
                                {isGoogleUser ? (
                                    <>
                                        <Typography variant="h6" color="success.main" fontWeight="bold">已通过 Google 登录</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>用户: {user.email || user.displayName || 'Google 用户'}</Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, wordBreak: 'break-all' }}>ID: {userId}</Typography>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<LogOut size={16} />}
                                            onClick={handleSignOutWrapper}
                                            sx={{ mt: 3 }}
                                        >
                                            注销
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="h6" color="error.main" fontWeight="bold">未登录</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>当前无法同步数据，请登录。</Typography>
                                        {!configError && (
                                            <Button
                                                variant="contained"
                                                startIcon={<Chrome size={16} />}
                                                onClick={() => setShowAuthModal(true)}
                                                sx={{ mt: 3 }}
                                            >
                                                登录以同步
                                            </Button>
                                        )}
                                    </>
                                )}
                            </Box>
                            {configError && (
                                <Box sx={{ p: 3, bgcolor: 'error.lighter', color: 'error.dark', borderRadius: 2 }}>
                                    <Typography fontWeight="bold">配置错误：</Typography>
                                    <Typography>{configError}</Typography>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            );
        }

        const itemsList = filteredInventory;
        const titleText = activeTab === 'restock' ? '需补货/过期清单' : `${activeCategory} 物品`;
        const itemQuantity = itemsList.length;
        const isUserGoogleLoggedIn = !!user && !!user.uid;

        return (
            <Stack spacing={4}>
                {/* Dashboard Stats */}
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>总物品数</Typography>
                                <Typography variant="h4" fontWeight="bold">{inventory.length}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>需补货</Typography>
                                <Typography variant="h4" fontWeight="bold" color={itemsToRestock.length > 0 ? "error.main" : "text.primary"}>
                                    {itemsToRestock.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>即将过期</Typography>
                                <Typography variant="h4" fontWeight="bold" color={itemsExpiringSoon.length > 0 ? "warning.main" : "text.primary"}>
                                    {itemsExpiringSoon.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters & Content */}
                <Card>
                    <CardContent sx={{ p: 0 }}>
                        {/* Search & Filter Header */}
                        {activeTab !== 'restock' && (
                            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ position: 'relative' }}>
                                            <Box sx={{ position: 'absolute', top: 10, left: 12, color: 'text.secondary' }}>
                                                <SearchIcon fontSize="small" />
                                            </Box>
                                            <InputBase
                                                placeholder="搜索物品..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                sx={{
                                                    width: '100%',
                                                    pl: 5, pr: 2, py: 0.5,
                                                    border: '1px solid', borderColor: 'divider', borderRadius: 1,
                                                    fontSize: '0.875rem',
                                                    '&:focus-within': { borderColor: 'primary.main', borderWidth: 1 }
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                                            {Object.keys(categories).map(category => (
                                                <Chip
                                                    key={category}
                                                    label={category}
                                                    onClick={() => setActiveCategory(category)}
                                                    color={activeCategory === category ? "primary" : "default"}
                                                    variant={activeCategory === category ? "filled" : "outlined"}
                                                    clickable
                                                    size="small"
                                                    sx={{ borderRadius: 1 }}
                                                />
                                            ))}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* List Header */}
                        <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                                {titleText}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                共 {itemQuantity} 项
                            </Typography>
                        </Box>

                        {/* Inventory Table (Desktop) / Grid (Mobile) */}
                        <Box sx={{ p: 0 }}>
                            {itemsList.length > 0 ? (
                                isMobile ? (
                                    <Grid container spacing={2} sx={{ p: 2 }}>
                                        {itemsList.map(item => (
                                            <Grid item xs={12} key={item.id}>
                                                <ItemCard
                                                    item={item}
                                                    updateStock={updateStockWrapper}
                                                    deleteItem={deleteItemWrapper}
                                                    user={user}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <InventoryTable
                                        items={itemsList}
                                        updateStock={updateStockWrapper}
                                        deleteItem={deleteItemWrapper}
                                        user={user}
                                    />
                                )
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <Typography color="text.secondary">
                                        {isUserGoogleLoggedIn
                                            ? (activeTab === 'restock'
                                                ? "没有需要补货或即将过期的物品"
                                                : "没有找到匹配的物品")
                                            : "请先登录"}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        );
    };

    // Loading State
    if (loading || !isAuthReady) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>加载中...</Typography>
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Layout
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                handleSignOut={handleSignOutWrapper}
                setShowAuthModal={setShowAuthModal}
                handleAddItemClick={handleAddItemClick}
            >
                <StatusMessage statusMessage={statusMessage} />

                {renderContent()}

                <CustomModal
                    title="添加新物品"
                    isOpen={showItemModal}
                    onClose={() => setShowItemModal(false)}
                >
                    <ItemForm
                        newItem={newItem}
                        setNewItem={setNewItem}
                        addItem={handleAddItem}
                        user={user}
                        showStatus={showStatus}
                    />
                </CustomModal>

                <AuthModal
                    isOpen={showAuthModal && !configError}
                    handleGoogleSignIn={handleGoogleSignInWrapper}
                    showStatus={showStatus}
                />
            </Layout>
        </ThemeProvider>
    );
};

export default App;