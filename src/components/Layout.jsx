import React, { useState } from 'react';
import {
    Menu as MenuIcon,
    MoreVertical,
    LogOut,
    LogIn,
    User,
    List as ListIcon,
    Users,
    Plus,
    Bell,
    Settings,
    Edit,
    Trash2,
    Pin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    mainListName, // New prop
    defaultListId,
    setDefaultList
}) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const [listModalOpen, setListModalOpen] = useState(false);
    const [listModalMode, setListModalMode] = useState('create'); // 'create' or 'rename'
    const [editingList, setEditingList] = useState(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [listToDelete, setListToDelete] = useState(null);

    const handleOpenCreateModal = () => {
        setListModalMode('create');
        setEditingList(null);
        setListModalOpen(true);
    };

    const handleOpenRenameModal = (list) => {
        setListModalMode('rename');
        setEditingList(list);
        setListModalOpen(true);
    };

    const handleSetDefault = (list) => {
        setDefaultList(list.id, showStatus);
    };

    const handleDeleteListClick = (list) => {
        if (list.id === 'default') {
            const privateListsCount = sharedLists ? sharedLists.filter(l => l.type === 'private').length : 0;
            if (privateListsCount === 0) {
                showStatus('无法删除：这是您唯一的私有列表。', true);
                return;
            }
            setDeleteMessage('确定要清空并删除主清单吗？注意：这会清空主清单中的所有物品。');
        } else {
            setDeleteMessage(`确定要删除列表 "${list.name}" 吗？`);
        }
        setListToDelete(list);
        setDeleteModalOpen(true);
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

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-muted/20 border-r">
            <div className="h-16 flex items-center px-6 border-b">
                <h1 className="text-lg font-bold">
                    Inventory<span className="text-primary">App</span>
                </h1>
            </div>

            <ScrollArea className="flex-1 py-4">
                <div className="px-4 space-y-4">
                    {user && (
                        <div className="space-y-1">
                            <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                我的清单
                            </h3>

                            {/* Private Lists */}
                            <div className="space-y-1">
                                <p className="px-2 text-xs text-muted-foreground/70 font-medium py-1">私有列表</p>
                                {/* Default List */}
                                <div className={`group flex items-center justify-between rounded-md hover:bg-muted/50 transition-colors ${!currentList && activeTab !== 'settings' && activeTab !== 'notifications' ? 'bg-secondary' : ''}`}>
                                    <Button
                                        variant="ghost"
                                        className={`justify-start w-full font-normal hover:bg-transparent ${!currentList && activeTab !== 'settings' && activeTab !== 'notifications' ? 'font-medium' : ''}`}
                                        onClick={() => {
                                            setCurrentList(null);
                                            setActiveTab('chores');
                                            setMobileOpen(false);
                                        }}
                                    >
                                        <User className={`mr-2 h-4 w-4 ${!currentList && activeTab !== 'settings' && activeTab !== 'notifications' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        {mainListName || "主清单"}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleSetDefault({ id: 'default', name: mainListName || '主清单' })} disabled={defaultListId === 'default'}>
                                                <Pin className="mr-2 h-4 w-4" />
                                                {defaultListId === 'default' ? "已设为默认" : "设为默认"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleOpenRenameModal({ id: 'default', name: mainListName || '主清单' })}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                重命名
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteListClick({ id: 'default', name: mainListName || '主清单' })} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                删除
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Other Private Lists */}
                                {privateLists.map(list => (
                                    <div key={list.id} className={`group flex items-center justify-between rounded-md hover:bg-muted/50 transition-colors ${currentList?.id === list.id && activeTab !== 'settings' && activeTab !== 'notifications' ? 'bg-secondary' : ''}`}>
                                        <Button
                                            variant="ghost"
                                            className={`justify-start w-full font-normal hover:bg-transparent ${currentList?.id === list.id && activeTab !== 'settings' && activeTab !== 'notifications' ? 'font-medium' : ''}`}
                                            onClick={() => {
                                                setCurrentList(list);
                                                setActiveTab('chores');
                                                setMobileOpen(false);
                                            }}
                                        >
                                            <ListIcon className={`mr-2 h-4 w-4 ${currentList?.id === list.id && activeTab !== 'settings' && activeTab !== 'notifications' ? 'text-primary' : 'text-muted-foreground'}`} />
                                            {list.name}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleSetDefault(list)} disabled={defaultListId === list.id}>
                                                    <Pin className="mr-2 h-4 w-4" />
                                                    {defaultListId === list.id ? "已设为默认" : "设为默认"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleOpenRenameModal(list)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    重命名
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteListClick(list)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    删除
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>

                            {/* Shared Lists */}
                            <div className="space-y-1 mt-4">
                                <p className="px-2 text-xs text-muted-foreground/70 font-medium py-1">共享列表</p>
                                {sharedListsFiltered.map(list => (
                                    <div key={list.id} className={`group flex items-center justify-between rounded-md hover:bg-muted/50 transition-colors ${currentList?.id === list.id && activeTab !== 'settings' && activeTab !== 'notifications' ? 'bg-secondary' : ''}`}>
                                        <Button
                                            variant="ghost"
                                            className={`justify-start w-full font-normal hover:bg-transparent ${currentList?.id === list.id && activeTab !== 'settings' && activeTab !== 'notifications' ? 'font-medium' : ''}`}
                                            onClick={() => {
                                                setCurrentList(list);
                                                setActiveTab('chores');
                                                setMobileOpen(false);
                                            }}
                                        >
                                            <Users className={`mr-2 h-4 w-4 ${currentList?.id === list.id && activeTab !== 'settings' && activeTab !== 'notifications' ? 'text-secondary-foreground' : 'text-muted-foreground'}`} />
                                            {list.name}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleSetDefault(list)} disabled={defaultListId === list.id}>
                                                    <Pin className="mr-2 h-4 w-4" />
                                                    {defaultListId === list.id ? "已设为默认" : "设为默认"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleOpenRenameModal(list)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    重命名
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteListClick(list)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    删除
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full justify-start text-muted-foreground font-normal mt-2 hover:bg-muted/50"
                                onClick={handleOpenCreateModal}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                新建列表...
                            </Button>
                        </div>
                    )}

                    <Separator className="my-4" />

                    <div className="space-y-1">
                        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            系统
                        </h3>
                        <Button
                            variant={activeTab === 'notifications' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveTab('notifications');
                                setMobileOpen(false);
                            }}
                        >
                            <div className="relative mr-2">
                                <Bell className="h-4 w-4" />
                                {invitations.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                            </div>
                            消息中心
                        </Button>
                        <Button
                            variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveTab('settings');
                                setMobileOpen(false);
                            }}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            设置
                        </Button>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-muted/20">
                {user ? (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.displayName || '用户'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleSignOut} title="退出登录">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button className="w-full" onClick={() => setShowAuthModal(true)}>
                        <LogIn className="mr-2 h-4 w-4" />
                        登录
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-ml-2">
                                <MenuIcon className="h-5 w-5" />
                                <span className="sr-only">Toggle Sidebar</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[280px]">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <h1 className="font-bold text-lg">Inventory App</h1>
                </div>
                {user && (
                    <Button variant="ghost" size="icon" onClick={() => setActiveTab('notifications')}>
                        <div className="relative">
                            <Bell className="h-5 w-5" />
                            {invitations.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                            )}
                        </div>
                    </Button>
                )}
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 h-screen sticky top-0">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 mt-16 md:mt-0 p-4 md:p-8 overflow-y-auto">
                {children}
            </main>

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
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            {deleteMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                            取消
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Layout;
