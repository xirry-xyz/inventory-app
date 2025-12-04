import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';


import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import { useSharedLists } from './hooks/useSharedLists';
import { useInvitations } from './hooks/useInvitations';
import { useChores } from './hooks/useChores';
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
import ChoreList from './components/ChoreList';
import ChoreForm from './components/ChoreForm';
import ChoreCalendar from './components/ChoreCalendar';
import DashboardStats from './components/DashboardStats';
import FilterBar, { categories } from './components/FilterBar';
import InventoryView from './components/InventoryView';

import {
    Box, Typography, Grid, Paper, InputBase, IconButton, Button, Chip, Stack, CircularProgress, Card, CardContent, Divider, useMediaQuery, Tabs, Tab
} from '@mui/material';
import { Add as AddIcon, Share } from '@mui/icons-material';



const App = () => {
    // Hooks
    const {
        user, userId, isAuthReady, configError, showAuthModal, setShowAuthModal,
        handleGoogleSignIn, handleSignOut, setConfigError
    } = useAuth();

    // Shared Lists & Invitations Hooks
    const { sharedLists, loadingLists, loadingPreferences, createList, renameList, deleteList, mainListName, defaultListId, setDefaultList } = useSharedLists(user);
    const { invitations, sendInvite, acceptInvite, declineInvite } = useInvitations(user);

    // Local State
    const [currentList, setCurrentList] = useState(null); // null = private, object = shared
    const [isRestored, setIsRestored] = useState(false);

    // Restore selected list from preference
    useEffect(() => {
        // Wait for Auth to be ready
        if (!isAuthReady) return;

        // If user is not logged in, we are "restored" (nothing to restore)
        if (!user) {
            if (!isRestored) setIsRestored(true);
            return;
        }

        // If user is logged in, wait for lists and preferences to load
        if (loadingLists || loadingPreferences) return;

        if (!isRestored) {
            if (defaultListId) {
                if (defaultListId === 'default') {
                    setCurrentList(null);
                } else {
                    const foundList = sharedLists.find(l => l.id === defaultListId);
                    if (foundList) {
                        setCurrentList(foundList);
                    }
                }
            }
            setIsRestored(true);
        }
    }, [isAuthReady, user, loadingLists, loadingPreferences, sharedLists, isRestored, defaultListId]);

    const {
        inventory, loading, addItem, updateStock, deleteItem, markAsReplaced, error: inventoryError
    } = useInventory(user, configError, isAuthReady, currentList);

    const {
        chores, addChore, updateChore, deleteChore, completeChore, removeCompletion
    } = useChores(user, currentList);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('全部');
    const [showItemModal, setShowItemModal] = useState(false);
    const [showChoreModal, setShowChoreModal] = useState(false);
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
            if (activeTab === 'chores') {
                setShowChoreModal(true);
            } else {
                setShowItemModal(true);
            }
        }
    };

    const handleAddItem = async (item, showStatusFn) => {
        const success = await addItem(item, showStatusFn);
        if (success) {
            setShowItemModal(false);
            setNewItem({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货', expirationDate: '' });
        }
    };

    const handleAddChore = async (chore) => {
        const success = await addChore(chore, showStatus);
        if (success) {
            setShowChoreModal(false);
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
            return (needsRestock || isExpiring) && (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        }

        const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
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
                        <Tab label="家务提醒" value="chores" />
                    </Tabs>
                </Paper>

                {/* Dashboard Stats (Only on Inventory) */}
                {activeTab === 'inventory' && (
                    <DashboardStats
                        totalItems={inventory.length}
                        restockCount={itemsToRestock.length}
                        expiringCount={itemsExpiringSoon.length}
                    />
                )}

                {/* Filters & Content (Only on Inventory or Restock) */}
                {(activeTab === 'inventory' || activeTab === 'restock' || activeTab === 'chores') && (
                    <Card sx={{ overflow: 'hidden' }}>
                        <CardContent sx={{ p: 0 }}>
                            {/* Search & Filter Header (Only for Inventory/Restock) */}
                            {activeTab !== 'restock' && activeTab !== 'chores' && (
                                <FilterBar
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    activeCategory={activeCategory}
                                    setActiveCategory={setActiveCategory}
                                />
                            )}

                            {/* Content Area */}
                            {activeTab === 'chores' ? (
                                <Box sx={{ p: 2 }}>
                                    <ChoreCalendar
                                        chores={chores}
                                        onRemoveCompletion={(id, date) => removeCompletion(id, date, showStatus)}
                                    />
                                    <ChoreList
                                        chores={chores}
                                        onComplete={(chore, date) => completeChore(chore, showStatus, date)}
                                        onDelete={(id) => deleteChore(id, showStatus)}
                                        user={user}
                                    />
                                </Box>
                            ) : (
                                <InventoryView
                                    activeTab={activeTab}
                                    titleText={titleText}
                                    currentList={currentList}
                                    handleShareList={handleShareList}
                                    handleAddItemClick={handleAddItemClick}
                                    user={user}
                                    itemsList={itemsList}
                                    updateStock={updateStockWrapper}
                                    deleteItem={deleteItemWrapper}
                                    markAsReplaced={markAsReplacedWrapper}
                                    isUserGoogleLoggedIn={isUserGoogleLoggedIn}
                                />
                            )}
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
                defaultListId={defaultListId}
                setDefaultList={setDefaultList}
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

                <CustomModal
                    title="添加家务任务"
                    isOpen={showChoreModal}
                    onClose={() => setShowChoreModal(false)}
                >
                    <ChoreForm
                        onSubmit={handleAddChore}
                        onCancel={() => setShowChoreModal(false)}
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