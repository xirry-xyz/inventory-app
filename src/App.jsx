import React, { useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
    Package, Leaf, ShoppingCart, Wrench, Heart, Cat, Sprout,
    AlertTriangle, Check, Search, Home, LogOut, Chrome, Loader, Plus
} from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import { useSharedLists } from './hooks/useSharedLists';
import { useInvitations } from './hooks/useInvitations';
import theme from './theme';

import Layout from './components/Layout';
import CustomModal from './components/CustomModal';
import AuthModal from './components/AuthModal';
import ItemForm from './components/ItemForm';
import InventoryTable from './components/InventoryTable';
import ItemCard from './components/ItemCard'; // Keep for mobile view if needed, or just use table
import StatusMessage from './components/StatusMessage';
import SettingsPage from './components/SettingsPage';
import NotificationPage from './components/NotificationPage';

import {
    Box, Typography, Grid, Paper, InputBase, IconButton, Button, Chip, Stack, CircularProgress, Card, CardContent, Divider, useMediaQuery, Tabs, Tab
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, CheckCircle, Warning, Error as ErrorIcon, Share } from '@mui/icons-material';

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

    // Shared Lists & Invitations Hooks
    const { sharedLists, createList, renameList, deleteList, mainListName } = useSharedLists(user);
    const { invitations, sendInvite, acceptInvite, declineInvite } = useInvitations(user);

    // Local State
    const [currentList, setCurrentList] = useState(null); // null = private, object = shared

    const {
        inventory, loading, addItem, updateStock, deleteItem, markAsReplaced, error: inventoryError
    } = useInventory(user, configError, isAuthReady, currentList);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('全部');
    const [showItemModal, setShowItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货', expirationDate: '' });
    const [statusMessage, setStatusMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('inventory');

    // Helpers
    const showStatus = useCallback((message, isError = false, duration = 3000) => {
        setStatusMessage({ message, isError });
        const timer = setTimeout(() => setStatusMessage(null), duration);
        return () => clearTimeout(timer);
    }, []);

    const handleCreateList = (name, type) => createList(name, type, showStatus);
    const handleRenameList = (id, name) => renameList(id, name, showStatus);
    const handleDeleteList = (id) => deleteList(id, showStatus);

    const handleShareList = () => {
        if (!currentList) return;
        const email = prompt("请输入要邀请的用户 Gmail 地址:");
        if (email) {
            sendInvite(email, currentList.id, currentList.name, showStatus);
        }
    };

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
    const markAsReplacedWrapper = (id) => markAsReplaced(id, showStatus);


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
        // The settings and notifications pages are now rendered directly in Layout's children,
        // so this function only handles inventory and restock tabs.
        if (activeTab === 'settings' || activeTab === 'notifications') {
            return null;
        }

        const itemsList = filteredInventory;
        const titleText = activeTab === 'restock' ? '需补货/过期清单' : `${activeCategory} 物品`;
        const itemQuantity = itemsList.length;
        const isUserGoogleLoggedIn = !!user && !!user.uid;

        return (
            <Stack spacing={3}>
                {/* Tabs Navigation */}
                <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                    >
                        <Tab label="物品清单" value="inventory" />
                        <Tab label="补货提醒" value="restock" />
                    </Tabs>
                </Paper>

                {/* Dashboard Stats (Only on Inventory) */}
                {activeTab === 'inventory' && (
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        <Card sx={{ flex: 1 }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">总物品</Typography>
                                <Typography variant="h5" fontWeight="bold">{inventory.length}</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1 }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">需补货</Typography>
                                <Typography variant="h5" fontWeight="bold" color={itemsToRestock.length > 0 ? "error.main" : "text.primary"}>
                                    {itemsToRestock.length}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1 }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">即将过期</Typography>
                                <Typography variant="h5" fontWeight="bold" color={itemsExpiringSoon.length > 0 ? "warning.main" : "text.primary"}>
                                    {itemsExpiringSoon.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Stack>
                )}

                {/* Filters & Content (Only on Inventory or Restock) */}
                {(activeTab === 'inventory' || activeTab === 'restock') && (
                    <Card sx={{ overflow: 'hidden' }}>
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
                                <Stack direction="column" spacing={0.5}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                                            {titleText}
                                        </Typography>
                                        {currentList && (
                                            <Chip
                                                label="共享列表"
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                        )}
                                    </Stack>
                                    {currentList && currentList.type === 'shared' && (
                                        <Typography variant="caption" color="text.secondary">
                                            创建者: {currentList.ownerEmail || '未知'} | 成员: {currentList.memberEmails ? currentList.memberEmails.join(', ') : `${currentList.members ? currentList.members.length : 0} 人`}
                                        </Typography>
                                    )}
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    {currentList && currentList.type === 'shared' && (
                                        <Button
                                            size="small"
                                            startIcon={<Share />}
                                            onClick={handleShareList}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            邀请成员
                                        </Button>
                                    )}
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={handleAddItemClick}
                                        disabled={!user}
                                    >
                                        添加物品
                                    </Button>
                                </Stack>
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
                                                        markAsReplaced={markAsReplacedWrapper}
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
                                            markAsReplaced={markAsReplacedWrapper}
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
                )}
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
                sharedLists={sharedLists}
                currentList={currentList}
                setCurrentList={setCurrentList}
                onCreateList={handleCreateList}
                onRenameList={handleRenameList}
                onDeleteList={handleDeleteList}
                invitations={invitations}
                acceptInvite={acceptInvite}
                declineInvite={declineInvite}
                showStatus={showStatus}
                mainListName={mainListName}
            >
                <StatusMessage statusMessage={statusMessage} />

                {renderContent()}

                {/* Settings Page */}
                {activeTab === 'settings' && (
                    <SettingsPage
                        user={user}
                        userId={userId}
                        configError={configError || inventoryError}
                        showAuthModal={showAuthModal}
                        setShowAuthModal={setShowAuthModal}
                        handleGoogleSignIn={handleGoogleSignInWrapper}
                        handleSignOut={handleSignOutWrapper}
                        showStatus={showStatus}
                    />
                )}

                {/* Notification Page */}
                {activeTab === 'notifications' && (
                    <NotificationPage
                        invitations={invitations}
                        acceptInvite={acceptInvite}
                        declineInvite={declineInvite}
                        showStatus={showStatus}
                    />
                )}

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