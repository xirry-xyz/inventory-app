import { useState, useEffect } from 'react';
import {
    collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, collectionGroup, getDocs, arrayRemove
} from 'firebase/firestore';
import { db, appId } from '../firebase';

export const useSharedLists = (user) => {
    const [sharedLists, setSharedLists] = useState([]);
    const [loadingLists, setLoadingLists] = useState(true);
    const [loadingPreferences, setLoadingPreferences] = useState(true);
    const [mainListName, setMainListName] = useState('主清单'); // State for Main List Name
    const [mainListDeleted, setMainListDeleted] = useState(false); // State for Main List Deleted Status
    const [defaultListId, setDefaultListId] = useState(null); // State for Default List ID

    // Helper to get the user's lists collection path
    const getUserListsPath = (uid) => `artifacts/${appId}/users/${uid}/lists`;

    useEffect(() => {
        if (!user || !user.uid || !db) {
            setSharedLists([]);
            setMainListDeleted(false);
            setLoadingLists(false);
            return;
        }

        // Fetch ALL lists where the user is a member (owned or shared)
        // We use collectionGroup to find lists across all users
        setLoadingLists(true);
        const q = query(
            collectionGroup(db, 'lists'),
            where('members', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const lists = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    path: doc.ref.path, // Store path for updates/deletes
                    ...data,
                    // Use stored type, default to 'shared' if missing (backward compatibility)
                    type: data.type || ((data.members && data.members.length > 1) ? 'shared' : 'private')
                };
            });
            setSharedLists(lists);
            setLoadingLists(false);
        }, (error) => {
            console.error("Error fetching shared lists:", error);
            if (error.message.includes('index')) {
                console.error("INDEX REQUIRED: Please check the console link above to create the index for 'lists' collectionGroup.");
            }
            setLoadingLists(false);
        });

        // Also fetch Main List Name preference and Default List ID
        const prefRef = doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'preferences');
        const unsubscribePref = onSnapshot(prefRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.mainListName) setMainListName(data.mainListName);
                if (data.mainListDeleted) setMainListDeleted(data.mainListDeleted); // Fetch deleted status
                else setMainListDeleted(false); // Reset if field missing
                if (data.defaultListId) setDefaultListId(data.defaultListId);
            }
            setLoadingPreferences(false);
        });

        return () => {
            unsubscribe();
            unsubscribePref();
        };
    }, [user]);

    const setDefaultList = async (listId, showStatus) => {
        if (!user || !user.uid) return;
        try {
            const prefRef = doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'preferences');
            const { setDoc } = await import('firebase/firestore');
            await setDoc(prefRef, { defaultListId: listId }, { merge: true });
            showStatus('已设置为默认列表');
            return true;
        } catch (error) {
            console.error("Error setting default list:", error);
            showStatus(`设置失败: ${error.message}`, true);
            return false;
        }
    };

    const createList = async (listName, type = 'shared', showStatus) => {
        if (!user || !user.uid) return;

        try {
            const listsPath = getUserListsPath(user.uid);
            await addDoc(collection(db, listsPath), {
                name: listName,
                type: type,
                ownerId: user.uid,
                ownerEmail: user.email,
                members: [user.uid], // Owner is automatically a member
                memberEmails: [user.email], // Store emails for display
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            showStatus('列表创建成功！');
            return true;
        } catch (error) {
            console.error("Error creating list:", error);
            showStatus(`创建失败: ${error.message}`, true);
            return false;
        }
    };

    const renameList = async (listId, newName, showStatus) => {
        if (!user || !user.uid) return;
        try {
            if (listId === 'default') {
                // Rename Main List (stored in preferences)
                const prefRef = doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'preferences');
                // Use setDoc with merge to create if not exists
                const { setDoc } = await import('firebase/firestore'); // Import locally if needed or add to top imports
                await setDoc(prefRef, { mainListName: newName }, { merge: true });
                showStatus('主清单重命名成功！');
                return true;
            }

            // Find the list in our local state to get its path
            const list = sharedLists.find(l => l.id === listId);
            if (!list) throw new Error("List not found locally");

            // Use the stored path (works for both owned and shared lists if we have permission)
            const listRef = doc(db, list.path);
            await updateDoc(listRef, {
                name: newName,
                updatedAt: serverTimestamp()
            });
            showStatus('列表重命名成功！');
            return true;
        } catch (error) {
            console.error("Error renaming list:", error);
            showStatus(`重命名失败: ${error.message}`, true);
            return false;
        }
    };

    const deleteList = async (listId, showStatus) => {
        if (!user || !user.uid) return false;

        try {
            if (listId === 'default') {
                // 1. Clear all items in the main inventory
                const inventoryRef = collection(db, `artifacts/${appId}/users/${user.uid}/inventory`);
                const snapshot = await getDocs(inventoryRef);
                const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);

                // 2. Mark as deleted in preferences
                const prefRef = doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'preferences');
                await setDoc(prefRef, { mainListDeleted: true }, { merge: true });

                showStatus('主清单已删除');
                return true;
            }

            // Find the list in our local state to get its path
            const list = sharedLists.find(l => l.id === listId);
            if (!list) throw new Error("List not found locally");

            // Only owner can delete (enforced by rules, but good to check here or handle error)
            const listRef = doc(db, list.path);
            await deleteDoc(listRef);
            showStatus('列表已删除');
            return true;
        } catch (error) {
            console.error("Error deleting list:", error);
            showStatus(`删除失败: ${error.message}`, true);
            return false;
        }
    };

    const removeMember = async (listId, email, showStatus) => {
        if (!user || !user.uid) return false;

        try {
            const list = sharedLists.find(l => l.id === listId);
            if (!list) throw new Error("List not found locally");

            // Only owner can remove members (simple check, safer rules on backend)
            if (list.ownerId !== user.uid) {
                showStatus('只有列表所有者可以移除成员', true);
                return false;
            }

            if (email === list.ownerEmail) {
                showStatus('不能移除所有者', true);
                return false;
            }

            const listRef = doc(db, list.path);

            // We only remove the email from memberEmails array. 
            // We cannot reliably remove the UID from 'members' because we don't have the mapping here.
            await updateDoc(listRef, {
                memberEmails: arrayRemove(email),
                updatedAt: serverTimestamp()
            });

            showStatus(`成员 ${email} 已移除`);
            return true;
        } catch (error) {
            console.error("Error removing member:", error);
            showStatus(`移除失败: ${error.message}`, true);
            return false;
        }
    };

    return {
        sharedLists,
        loadingLists,
        loadingPreferences,
        createList,
        renameList,
        deleteList,
        mainListName,
        mainListDeleted, // Exposed state
        defaultListId,
        setDefaultList,
        removeMember
    };
};
