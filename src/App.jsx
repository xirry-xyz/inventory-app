import React, { useState, useCallback, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast"; // Ensure this hook path is correct
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import { useSharedLists } from './hooks/useSharedLists';
import { useInvitations } from './hooks/useInvitations';
import { useChores } from './hooks/useChores';
import { useChoreNotifications } from './hooks/useChoreNotifications';

import Layout from './components/Layout';
import CustomModal from './components/CustomModal';
import AuthModal from './components/AuthModal';
import ItemForm from './components/ItemForm';
import InventoryView from './components/InventoryView';
import SettingsPage from './components/SettingsPage';
import NotificationPage from './components/NotificationPage';
import ChoreList from './components/ChoreList';
import ChoreForm from './components/ChoreForm';
import ChoreCalendar from './components/ChoreCalendar';
import DashboardStats from './components/DashboardStats';
import FilterBar from './components/FilterBar';

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

    // Call notification hook
    useChoreNotifications(chores);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('全部');
    const [showItemModal, setShowItemModal] = useState(false);
    const [showChoreModal, setShowChoreModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', safetyStock: 1, currentStock: 0, category: '日用百货', expirationDate: '' });
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('chores');

    // Helpers
    const showStatus = useCallback((message, isError = false, duration = 3000) => {
        toast({
            variant: isError ? "destructive" : "default",
            description: message,
            duration: duration,
        });
    }, [toast]);

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

    // Loading State
    if (loading || !isAuthReady) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">加载中...</p>
            </div>
        );
    }

    const itemsList = filteredInventory;
    const titleText = activeTab === 'restock' ? '需补货/过期清单' : `${activeCategory} 物品`;
    const isUserGoogleLoggedIn = !!user && !!user.uid;

    return (
        <>
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
                {/* Main Content Areas */}
                {activeTab === 'settings' ? (
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
                ) : activeTab === 'notifications' ? (
                    <NotificationPage
                        invitations={invitations}
                        acceptInvite={acceptInvite}
                        declineInvite={declineInvite}
                        showStatus={showStatus}
                    />
                ) : (
                    <div className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="chores">家务提醒</TabsTrigger>
                                <TabsTrigger value="inventory">物品清单</TabsTrigger>
                                <TabsTrigger value="restock">补货提醒</TabsTrigger>
                            </TabsList>

                            {/* Dashboard Stats (Only on Inventory) */}
                            {activeTab === 'inventory' && (
                                <div className="mt-6">
                                    <DashboardStats
                                        totalItems={inventory.length}
                                        restockCount={itemsToRestock.length}
                                        expiringCount={itemsExpiringSoon.length}
                                    />
                                </div>
                            )}

                            <div className="mt-6"> {/* Content Wrapper */}
                                <Card className="overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* Search & Filter Header */}
                                        {activeTab !== 'restock' && activeTab !== 'chores' && (
                                            <FilterBar
                                                searchTerm={searchTerm}
                                                setSearchTerm={setSearchTerm}
                                                activeCategory={activeCategory}
                                                setActiveCategory={setActiveCategory}
                                            />
                                        )}

                                        <TabsContent value="chores" className="mt-0 p-4 border-none data-[state=inactive]:hidden">
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
                                        </TabsContent>

                                        <TabsContent value="inventory" className="mt-0 data-[state=inactive]:hidden">
                                            <InventoryView
                                                activeTab="inventory"
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
                                        </TabsContent>

                                        <TabsContent value="restock" className="mt-0 data-[state=inactive]:hidden">
                                            <InventoryView
                                                activeTab="restock"
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
                                        </TabsContent>
                                    </CardContent>
                                </Card>
                            </div>
                        </Tabs>
                    </div>
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
            <Toaster />
        </>
    );
};

export default App;