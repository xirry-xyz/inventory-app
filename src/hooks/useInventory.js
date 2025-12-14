import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { db, appId } from '../firebase';

// 辅助函数：获取用户私有数据的集合路径
const getUserCollectionPath = (userId, collectionName) => {
    if (!userId || userId === 'LOCAL_USER_MODE') {
        return null;
    }
    return `artifacts/${appId}/users/${userId}/${collectionName}`;
}

const getInventoryCollectionPath = (userId, currentList) => {
    if (!userId) return null;

    // If a specific list is selected (Private or Shared)
    if (currentList) {
        // Items are stored in a sub-collection of the list document
        // Path: artifacts/{appId}/users/{listOwnerId}/lists/{listId}/items
        return `artifacts/${appId}/users/${currentList.ownerId}/lists/${currentList.id}/items`;
    }

    // Default to private inventory (legacy/default path)
    return `artifacts/${appId}/users/${userId}/inventory`;
}

export const useInventory = (user, configError, isAuthReady, currentList) => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Strictly wait for Auth to be ready and User to be logged in with a UID
        if (configError || !isAuthReady || !db) {
            setInventory([]);
            // Do not set loading to false yet if we are just waiting for auth
            if (configError) setLoading(false);
            return;
        }

        if (!user || !user.uid) {
            setInventory([]);
            setLoading(false);
            return;
        }

        const actualUserId = user.uid;
        const inventoryCollectionPath = getInventoryCollectionPath(actualUserId, currentList);

        if (!inventoryCollectionPath) {
            console.error("Firestore Error: 无法构建有效的集合路径。");
            return;
        }

        const q = query(collection(db, inventoryCollectionPath));

        setLoading(true);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            items.sort((a, b) => {
                // 优先显示需要补货的 (currentStock <= safetyStock)
                const restockA = a.currentStock <= a.safetyStock ? 0 : 1;
                const restockB = b.currentStock <= b.safetyStock ? 0 : 1;

                if (restockA !== restockB) {
                    return restockA - restockB;
                }

                // 其次按过期时间或更换周期排序
                if (a.expirationDate && b.expirationDate) {
                    return new Date(a.expirationDate) - new Date(b.expirationDate);
                }

                // 周期性物品排序
                if (a.isPeriodic && b.isPeriodic) {
                    const nextA = new Date(a.lastReplaced);
                    nextA.setDate(nextA.getDate() + Number(a.replacementCycle));
                    const nextB = new Date(b.lastReplaced);
                    nextB.setDate(nextB.getDate() + Number(b.replacementCycle));
                    return nextA - nextB;
                }

                // 最后按名称排序
                return a.name.localeCompare(b.name, 'zh-Hans-CN');
            });

            setInventory(items);
            setLoading(false);
        }, (err) => {
            if (err.code === 'permission-denied') {
                setError(`数据读取失败: Firestore 权限被拒绝。请确保您的安全规则允许已认证的用户访问。`);
            } else {
                setError(`数据同步错误: ${err.message}`);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady, user, db, configError, currentList]);

    const addItem = useCallback(async (newItem, showStatus) => {
        const name = newItem.name.trim();
        if (!name) {
            showStatus('项目名称不能为空！', true, 2000);
            return false;
        }

        if (!user || !user.uid || configError || !db) {
            showStatus('错误：请先登录才能添加和同步数据。', true, 4000);
            return false;
        }

        const actualUserId = user.uid;
        const inventoryCollectionPath = getInventoryCollectionPath(actualUserId, currentList);

        if (!inventoryCollectionPath) {
            showStatus('错误：无法获取存储路径，请刷新重试。', true, 4000);
            return false;
        }

        const itemToAdd = {
            ...newItem,
            name,
            safetyStock: Number(newItem.safetyStock),
            currentStock: Number(newItem.currentStock),
            category: newItem.category,
            expirationDate: newItem.expirationDate || null, // Add expiration date
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isPeriodic: newItem.isPeriodic || false,
            replacementCycle: newItem.isPeriodic ? Number(newItem.replacementCycle) : null,
            lastReplaced: newItem.isPeriodic ? (newItem.lastReplaced || new Date().toISOString().split('T')[0]) : null,
        };

        try {
            await addDoc(collection(db, inventoryCollectionPath), itemToAdd);
            showStatus('添加成功！');
            return true;
        } catch (e) {
            showStatus(`添加失败: ${e.message}`, true, 5000);
            return false;
        }
    }, [user, configError, currentList]);

    const updateStock = async (id, newStock, showStatus) => {
        if (!user || !user.uid || configError || !db) {
            showStatus('错误：请先登录才能修改数据。', true, 4000);
            return;
        }
        const actualUserId = user.uid;
        const inventoryCollectionPath = getInventoryCollectionPath(actualUserId, currentList);

        if (!inventoryCollectionPath) return;

        try {
            const itemRef = doc(db, inventoryCollectionPath, id);
            await updateDoc(itemRef, {
                currentStock: Math.max(0, newStock),
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            showStatus(`更新库存失败: ${e.message}`, true, 5000);
        }
    };

    const deleteItem = async (id, showStatus) => {
        if (!user || !user.uid || configError || !db) {
            showStatus('错误：请先登录才能删除数据。', true, 4000);
            return;
        }
        const actualUserId = user.uid;
        const inventoryCollectionPath = getInventoryCollectionPath(actualUserId, currentList);

        if (!inventoryCollectionPath) return;



        try {
            const itemRef = doc(db, inventoryCollectionPath, id);
            await deleteDoc(itemRef);
            showStatus('删除成功！');
        } catch (e) {
            showStatus(`删除失败: ${e.message}`, true, 5000);
        }
    };

    const markAsReplaced = async (id, showStatus) => {
        if (!user || !user.uid || configError || !db) {
            showStatus('错误：请先登录才能修改数据。', true, 4000);
            return;
        }
        const actualUserId = user.uid;
        const inventoryCollectionPath = getInventoryCollectionPath(actualUserId, currentList);

        if (!inventoryCollectionPath) return;

        try {
            const itemRef = doc(db, inventoryCollectionPath, id);
            await updateDoc(itemRef, {
                lastReplaced: new Date().toISOString().split('T')[0],
                updatedAt: serverTimestamp(),
            });
            showStatus('已更新更换日期！');
        } catch (e) {
            showStatus(`更新失败: ${e.message}`, true, 5000);
        }
    };

    return {
        inventory,
        loading,
        addItem,
        updateStock,
        updateStock,
        deleteItem,
        markAsReplaced,
        error
    };
};
