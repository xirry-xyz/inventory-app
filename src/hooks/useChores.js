import { useState, useEffect } from 'react';
import {
    collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, arrayUnion
} from 'firebase/firestore';
import { db, appId } from '../firebase';

export const useChores = (user, currentList) => {
    const [chores, setChores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to get the chores collection path
    const getChoresPath = () => {
        if (!user || !user.uid) return null;

        if (currentList) {
            // Shared/Specific List
            return `artifacts/${appId}/users/${currentList.ownerId}/lists/${currentList.id}/chores`;
        } else {
            // Default Private List (stored in user's default list bucket or similar? 
            // Actually, for consistency with Inventory, we might want to store it in the default list structure if possible,
            // but `useInventory` puts default items in `users/{uid}/inventory`.
            // Let's put default chores in `users/{uid}/chores` for now to match the pattern.
            return `artifacts/${appId}/users/${user.uid}/chores`;
        }
    };

    useEffect(() => {
        if (!user || !user.uid || !db) {
            setChores([]);
            setLoading(false);
            return;
        }

        const path = getChoresPath();
        if (!path) return;

        setLoading(true);
        const q = query(collection(db, path), orderBy('nextDue', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const choresData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChores(choresData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching chores:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, currentList]);

    const addChore = async (choreData, showStatus) => {
        if (!user) return;
        try {
            const path = getChoresPath();
            // Calculate nextDue based on frequency
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Default to due today if new
            const nextDue = today.toISOString();

            await addDoc(collection(db, path), {
                ...choreData,
                lastCompleted: null,
                nextDue: nextDue,
                createdAt: serverTimestamp()
            });
            showStatus('家务添加成功！');
            return true;
        } catch (err) {
            console.error("Error adding chore:", err);
            showStatus(`添加失败: ${err.message}`, true);
            return false;
        }
    };

    const updateChore = async (id, data, showStatus) => {
        try {
            const path = getChoresPath();
            const choreRef = doc(db, path, id);
            await updateDoc(choreRef, data);
            if (showStatus) showStatus('更新成功！');
            return true;
        } catch (err) {
            console.error("Error updating chore:", err);
            if (showStatus) showStatus(`更新失败: ${err.message}`, true);
            return false;
        }
    };

    const deleteChore = async (id, showStatus) => {
        if (!window.confirm('确定要删除这个家务吗？')) return;
        try {
            const path = getChoresPath();
            const choreRef = doc(db, path, id);
            await deleteDoc(choreRef);
            showStatus('删除成功！');
            return true;
        } catch (err) {
            console.error("Error deleting chore:", err);
            showStatus(`删除失败: ${err.message}`, true);
            return false;
        }
    };

    const completeChore = async (chore, showStatus) => {
        try {
            const path = getChoresPath();
            const choreRef = doc(db, path, chore.id);

            const today = new Date();
            // today.setHours(0, 0, 0, 0); // Keep time for record? Or just date? Let's keep full timestamp for record.

            // Calculate next due date
            const nextDueDate = new Date();
            nextDueDate.setHours(0, 0, 0, 0); // Reset to start of today
            nextDueDate.setDate(nextDueDate.getDate() + Number(chore.frequency));

            // Import arrayUnion if not already imported at top, but better to add it to top imports.
            // Since I can't easily see top imports here without another read, I'll assume I need to add it or use the one from 'firebase/firestore' if available in scope.
            // Actually, I should update the imports first. Let's do that in a separate chunk or just assume I'll fix imports.
            // Wait, I can use a multi-replace to fix imports too.

            await updateDoc(choreRef, {
                lastCompleted: today.toISOString(),
                nextDue: nextDueDate.toISOString(),
                completionHistory: arrayUnion(today.toISOString())
            });
            showStatus('家务已完成！');
        } catch (err) {
            console.error("Error completing chore:", err);
            showStatus(`操作失败: ${err.message}`, true);
        }
    };

    return {
        chores,
        loading,
        error,
        addChore,
        updateChore,
        deleteChore,
        completeChore
    };
};
