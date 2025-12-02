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

    const completeChore = async (chore, showStatus, date = new Date()) => {
        try {
            const path = getChoresPath();
            const choreRef = doc(db, path, chore.id);

            const completionDate = new Date(date);
            completionDate.setHours(0, 0, 0, 0); // Normalize to midnight
            const completionDateStr = completionDate.toDateString();
            const completionISO = completionDate.toISOString();

            // Check if already completed on this date
            if (chore.completionHistory) {
                const alreadyCompleted = chore.completionHistory.some(timestamp => {
                    const d = new Date(timestamp);
                    return d.toDateString() === completionDateStr;
                });

                if (alreadyCompleted) {
                    showStatus('该日期已经完成过了，无需重复打卡', true);
                    return;
                }
            }

            // Calculate next due date based on the *latest* completion
            // If we are backdating, the next due date might not change if there's a later completion
            // But usually "next due" implies from the last time it was done.
            // Let's assume we want to recalculate based on the *latest* completion date in history + this new one.

            let allCompletions = [...(chore.completionHistory || []), completionISO];
            // Sort to find the latest
            allCompletions.sort((a, b) => new Date(a) - new Date(b));
            const latestCompletion = new Date(allCompletions[allCompletions.length - 1]);

            const nextDueDate = new Date(latestCompletion);
            nextDueDate.setHours(0, 0, 0, 0);
            nextDueDate.setDate(nextDueDate.getDate() + Number(chore.frequency));

            await updateDoc(choreRef, {
                lastCompleted: latestCompletion.toISOString(),
                nextDue: nextDueDate.toISOString(),
                completionHistory: arrayUnion(completionISO)
            });
            showStatus('家务已完成！');
        } catch (err) {
            console.error("Error completing chore:", err);
            showStatus(`操作失败: ${err.message}`, true);
        }
    };

    const removeCompletion = async (choreId, dateToRemove, showStatus) => {
        try {
            const path = getChoresPath();
            const choreRef = doc(db, path, choreId);

            // We need the current chore data to filter the history
            const chore = chores.find(c => c.id === choreId);
            if (!chore) throw new Error("Chore not found");

            const dateToRemoveStr = new Date(dateToRemove).toDateString();

            const newHistory = (chore.completionHistory || []).filter(timestamp => {
                return new Date(timestamp).toDateString() !== dateToRemoveStr;
            });

            // Recalculate lastCompleted and nextDue
            let lastCompleted = null;
            let nextDue = null;

            if (newHistory.length > 0) {
                newHistory.sort((a, b) => new Date(a) - new Date(b));
                const latest = new Date(newHistory[newHistory.length - 1]);
                lastCompleted = latest.toISOString();

                const next = new Date(latest);
                next.setHours(0, 0, 0, 0);
                next.setDate(next.getDate() + Number(chore.frequency));
                nextDue = next.toISOString();
            } else {
                // No history left, reset to created date or today?
                // If we reset, maybe nextDue should be today?
                // Let's set nextDue to today for simplicity if no history
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                nextDue = today.toISOString();
            }

            await updateDoc(choreRef, {
                lastCompleted,
                nextDue,
                completionHistory: newHistory
            });

            showStatus('记录已删除');
        } catch (err) {
            console.error("Error removing completion:", err);
            showStatus(`删除失败: ${err.message}`, true);
        }
    };

    return {
        chores,
        loading,
        error,
        addChore,
        updateChore,
        deleteChore,
        deleteChore,
        completeChore,
        removeCompletion
    };
};
