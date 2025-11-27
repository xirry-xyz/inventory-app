import React, { useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
    Package, Leaf, ShoppingCart, Wrench, Heart, Cat, Sprout,
    AlertTriangle, Check, Search, Home, LogOut, Chrome, Loader, Plus
} from 'lucide-react';
// Note: We are keeping Lucide icons for categories for now as they are specific, 
// but replacing UI icons with MUI icons in Layout.

import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import theme from './theme';

import Layout from './components/Layout';
import CustomModal from './components/CustomModal';
import AuthModal from './components/AuthModal';
import ItemForm from './components/ItemForm';
import ItemCard from './components/ItemCard';
import StatusMessage from './components/StatusMessage';

import {
    Box, Typography, Grid, Paper, InputBase, IconButton, Button, Chip, Stack, CircularProgress
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
            // Combine restock and expiring items for this view
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

    // Render Content
    const renderContent = () => {
        if (activeTab === 'settings') {
            const isGoogleUser = !!user && !!user.uid;
            return (
                <Paper sx={{ p: 4, mt: 4, borderRadius: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>用户与应用设置</Typography>
                    <Button
                        startIcon={<Home />}
                        onClick={() => setActiveTab('home')}
                        sx={{ mb: 2, display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        返回主页
                    </Button>
                    <Stack spacing={2}>
                        <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" color="text.secondary">登录状态</Typography>
                            {isGoogleUser ? (
                                <>
                                    <Typography variant="h6" color="success.main" fontWeight="bold">已通过 Google 登录</Typography>
                                    <Typography variant="body2" color="text.secondary">用户: {user.email || user.displayName || 'Google 用户'}</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ wordBreak: 'break-all' }}>ID: {userId}</Typography>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<LogOut size={16} />}
                                        onClick={handleSignOutWrapper}
                                        sx={{ mt: 2 }}
                                    >
                                        注销
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Typography variant="h6" color="error.main" fontWeight="bold">未登录</Typography>
                                    <Typography variant="body2" color="text.secondary">当前无法同步数据，请登录。</Typography>
                                    {!configError && (
                                        <Button
                                            variant="contained"
                                            startIcon={<Chrome size={16} />}
                                            onClick={() => setShowAuthModal(true)}
                                            sx={{ mt: 2 }}
                                        >
                                            登录以同步
                                        </Button>
                                    )}
                                </>
                            )}
                        </Paper>
                        {configError && (
                            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
                                <Typography fontWeight="bold">配置错误：</Typography>
                                <Typography>{configError}</Typography>
                            </Paper>
                        )}
                    </Stack>
                </Paper>
            );
        }

        const itemsList = filteredInventory;
        const titleText = activeTab === 'restock' ? '🚨 需补货/过期清单' : `${activeCategory} 物品`;
        const itemQuantity = itemsList.length;
        const isUserGoogleLoggedIn = !!user && !!user.uid;

        return (
            <>
                {/* 快捷操作和补货提醒 */}
                <Paper sx={{ p: 3, mb: 4, borderRadius: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>

                    {(itemsToRestock.length > 0 || itemsExpiringSoon.length > 0) && isUserGoogleLoggedIn ? (
                        <Box
                            sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, cursor: 'pointer' }}
                            onClick={() => setActiveTab('restock')}
                        >
                            {itemsToRestock.length > 0 && (
                                <Chip
                                    icon={<Warning />}
                                    label={`${itemsToRestock.length} 个缺货`}
                                    color="error"
                                    variant="soft" // Note: variant="soft" needs custom theme or Joy UI, falling back to standard
                                    sx={{ bgcolor: 'error.light', color: 'error.dark', fontWeight: 'bold' }}
                                />
                            )}

                            {itemsExpiringSoon.length > 0 && (
                                <Chip
                                    icon={<Warning />}
                                    label={`${itemsExpiringSoon.length} 个即将过期`}
                                    color="warning"
                                    sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 'bold' }}
                                />
                            )}
                        </Box>
                    ) : (
                        <Chip
                            icon={isUserGoogleLoggedIn ? <CheckCircle /> : <ErrorIcon />}
                            label={isUserGoogleLoggedIn ? "库存情况良好！" : "请登录以启用云同步功能！"}
                            color={isUserGoogleLoggedIn ? "success" : "error"}
                            sx={{
                                bgcolor: isUserGoogleLoggedIn ? 'success.light' : 'error.light',
                                color: isUserGoogleLoggedIn ? 'success.dark' : 'error.dark',
                                fontWeight: 'bold',
                                py: 2
                            }}
                        />
                    )}

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddItemClick}
                        disabled={!isUserGoogleLoggedIn}
                        sx={{ display: { xs: 'none', sm: 'flex' } }}
                    >
                        添加物品
                    </Button>
                </Paper>

                {/* 搜索和分类过滤 (只在 'home' 标签页显示) */}
                {activeTab !== 'restock' && (
                    <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <Box sx={{ position: 'absolute', top: 12, left: 12, color: 'text.secondary' }}>
                                <SearchIcon />
                            </Box>
                            <InputBase
                                placeholder="🔍 搜索物品名称..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{
                                    width: '100%',
                                    pl: 6, pr: 2, py: 1,
                                    border: 1, borderColor: 'divider', borderRadius: 3,
                                    '&:focus-within': { borderColor: 'primary.main', borderWidth: 2 }
                                }}
                            />
                        </Box>

                        {/* 分类标签页 */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                            {Object.keys(categories).map(category => (
                                <Chip
                                    key={category}
                                    label={category}
                                    icon={React.cloneElement(categories[category], { className: "w-4 h-4" })}
                                    onClick={() => setActiveCategory(category)}
                                    color={activeCategory === category ? "primary" : "default"}
                                    variant={activeCategory === category ? "filled" : "outlined"}
                                    clickable
                                    sx={{
                                        borderRadius: 4,
                                        px: 1,
                                        py: 2.5,
                                        '& .MuiChip-icon': { ml: 1 }
                                    }}
                                />
                            ))}
                        </Stack>
                    </Paper>
                )}

                {/* 库存列表 */}
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                    {titleText} ({itemQuantity})
                </Typography>

                <Grid container spacing={3} pb={10}>
                    {itemsList.length > 0 ? (
                        itemsList.map(item => (
                            <Grid item xs={12} sm={6} lg={4} key={item.id}>
                                <ItemCard
                                    item={item}
                                    updateStock={updateStockWrapper}
                                    deleteItem={deleteItemWrapper}
                                    user={user}
                                />
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: 'background.default' }} variant="outlined">
                                <Typography color="text.secondary">
                                    {isUserGoogleLoggedIn
                                        ? (activeTab === 'restock'
                                            ? "太棒了！所有物品库存都充足，且没有即将过期的物品。"
                                            : `没有找到 ${activeCategory === '全部' ? '' : `"${activeCategory}"`} 物品。`)
                                        : "请先登录，才能查看和管理您的物品清单。"}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </>
        );
    };

    // Loading State
    if (loading || !isAuthReady) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>正在等待认证和数据同步...</Typography>
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