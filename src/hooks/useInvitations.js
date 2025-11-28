import { useState, useEffect } from 'react';
import {
    collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, collectionGroup
} from 'firebase/firestore';
import { db, appId } from '../firebase';

export const useInvitations = (user) => {
    const [invitations, setInvitations] = useState([]);
    const [loadingInvites, setLoadingInvites] = useState(true);

    const getUserListsPath = (uid) => `artifacts/${appId}/users/${uid}/lists`;

    // Listen for invitations sent TO the current user using Collection Group Query
    useEffect(() => {
        if (!user || !user.email || !db) {
            setInvitations([]);
            setLoadingInvites(false);
            return;
        }

        // Query all 'invitations' collections where toEmail matches current user
        const q = query(
            collectionGroup(db, 'invitations'),
            where("toEmail", "==", user.email),
            where("status", "==", "pending")
        );

        console.log("useInvitations: Listening for invites for:", user.email);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("useInvitations: Snapshot received. Docs:", snapshot.docs.length);
            const invites = snapshot.docs.map(doc => ({
                id: doc.id,
                path: doc.ref.path, // Store reference path to update it later
                ...doc.data()
            }));
            setInvitations(invites);
            setLoadingInvites(false);
        }, (error) => {
            console.error("Error fetching invitations:", error);
            // Check for index requirement
            if (error.message.includes('index')) {
                console.error("INDEX REQUIRED: Please check the console link above to create the index.");
            }
            setLoadingInvites(false);
        });

        return () => unsubscribe();
    }, [user]);

    const sendInvite = async (toEmail, listId, listName, showStatus) => {
        if (!user || !user.uid) return;

        try {
            // Store invite in the list's subcollection: users/{uid}/lists/{listId}/invitations
            // This ensures the owner has write permission.
            const listPath = `${getUserListsPath(user.uid)}/${listId}`;
            const invitesRef = collection(db, listPath, 'invitations');

            await addDoc(invitesRef, {
                toEmail: toEmail,
                listId: listId,
                listName: listName,
                inviterId: user.uid,
                inviterEmail: user.email,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            showStatus(`已发送邀请给 ${toEmail}`);
            return true;
        } catch (error) {
            console.error("Error sending invite:", error);
            showStatus(`发送邀请失败: ${error.message}`, true);
            return false;
        }
    };

    const acceptInvite = async (inviteId, listId, showStatus) => {
        if (!user || !user.uid) return;

        try {
            // We need to find the invite doc to get the inviterId (owner)
            // But we can just use the invite object passed in if we modify the signature
            // Or find it in our local state.
            const invite = invitations.find(i => i.id === inviteId);
            if (!invite) {
                throw new Error("Invitation not found locally");
            }

            // 1. Add user to the list's members
            // Path: users/{inviterId}/lists/{listId}
            const listRef = doc(db, getUserListsPath(invite.inviterId), listId);
            await updateDoc(listRef, {
                members: arrayUnion(user.uid)
            });

            // 2. Update invite status to accepted
            // We use the path stored from the snapshot to reference the doc directly
            const inviteRef = doc(db, invite.path);
            await updateDoc(inviteRef, {
                status: 'accepted',
                updatedAt: serverTimestamp()
            });

            showStatus('已接受邀请！');
            return true;
        } catch (error) {
            console.error("Error accepting invite:", error);
            showStatus(`接受邀请失败: ${error.message}`, true);
            return false;
        }
    };

    const declineInvite = async (inviteId, showStatus) => {
        try {
            const invite = invitations.find(i => i.id === inviteId);
            if (!invite) {
                throw new Error("Invitation not found locally");
            }

            const inviteRef = doc(db, invite.path);
            await updateDoc(inviteRef, {
                status: 'declined',
                updatedAt: serverTimestamp()
            });
            showStatus('已拒绝邀请');
            return true;
        } catch (error) {
            showStatus(`操作失败: ${error.message}`, true);
            return false;
        }
    };

    return {
        invitations,
        loadingInvites,
        sendInvite,
        acceptInvite,
        declineInvite
    };
};
