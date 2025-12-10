import { useEffect } from 'react';

export const useChoreNotifications = (chores) => {
    useEffect(() => {
        // Request permission on mount if supported
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return;
        }

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const checkChores = () => {
            if (Notification.permission !== 'granted') return;

            const now = new Date();
            const hour = now.getHours();

            // Only notify between 10:00 AM and 8:00 PM (20:00)
            if (hour < 10 || hour >= 20) {
                console.log('Outside notification hours (10am - 8pm)');
                return;
            }

            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let hasNotified = false;

            chores.forEach(chore => {
                if (!chore.nextDue) return;

                const dueDate = new Date(chore.nextDue);
                const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

                // If due today or earlier (overdue)
                if (dueDay <= today) {

                    // Avoid spamming multiple notifications at once
                    if (!hasNotified) {
                        new Notification(`家务提醒: ${chore.name}`, {
                            body: `这项家务需要完成了！`,
                            tag: `chore-${chore.id}` // Tag check to replace existing notifications if needed
                        });
                        hasNotified = true; // Just notify for the first one found per check to avoid flooding
                    }
                }
            });
        };

        // Check initially after a short delay
        const timeout = setTimeout(checkChores, 5000);

        // Check every 2.5 hours (2.5 * 60 * 60 * 1000 = 9000000 ms)
        const interval = setInterval(checkChores, 9000000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [chores]);
};
