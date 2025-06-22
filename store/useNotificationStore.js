import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    stats: null,
    isInitialized: false, // Track if we've loaded initial data
    selectedNotification: null,

    setAllNotifications: (notifs) => set({
        notifications: notifs,
        isInitialized: true
    }),

    setStats: (stats) => set({ stats }),

    // Initialize both at once to prevent multiple renders
    initializeNotifications: (notifs, stats) => set({
        notifications: notifs,
        stats,
        isInitialized: true
    }),

    addNotification: (notif) => {
        const state = get();
        const isUnread = notif.read?.status === false;
        const updatedStats = { ...state.stats };

        if (isUnread) {
            updatedStats.unread = (updatedStats.unread || 0) + 1;
            updatedStats.total = (updatedStats.total || 0) + 1;
            const cat = notif.category;
            updatedStats.byCategory = {
                ...updatedStats.byCategory,
                [cat]: (updatedStats.byCategory?.[cat] || 0) + 1,
            };
        }

        set({
            notifications: [notif, ...state.notifications],
            stats: updatedStats
        });
    },

    markAsRead: (notifId) => {
        const state = get();
        const notif = state.notifications.find(n => n._id === notifId);

        // Don't update if already read
        if (!notif || notif.read?.status === true) return;

        const updated = state.notifications.map(n =>
            n._id === notifId ? { ...n, read: { status: true, readAt: new Date() } } : n
        );

        const updatedStats = { ...state.stats };
        if (updatedStats.unread > 0) {
            updatedStats.unread -= 1;
        }

        set({ notifications: updated, stats: updatedStats });
    },

    markAllAsRead: () => {
        const state = get();
        const hasUnreadNotifications = state.notifications.some(n => !n.read?.status);

        // Don't update if no unread notifications
        if (!hasUnreadNotifications) return;

        const updated = state.notifications.map(n => ({
            ...n,
            read: { status: true, readAt: new Date() }
        }));

        set({
            notifications: updated,
            stats: { ...state.stats, unread: 0 }
        });
    },

    deleteNotification: (notifId) => {
        const state = get();
        const notifToDelete = state.notifications.find(n => n._id === notifId);
        if (!notifToDelete) return;

        const updated = state.notifications.filter(n => n._id !== notifId);
        const updatedStats = { ...state.stats };
        const cat = notifToDelete.category;
        const isUnread = !notifToDelete.read?.status;

        updatedStats.total = Math.max(0, updatedStats.total - 1);
        if (isUnread) {
            updatedStats.unread = Math.max(0, updatedStats.unread - 1);
        }

        if (cat && updatedStats.byCategory) {
            updatedStats.byCategory[cat] = Math.max(
                0,
                (updatedStats.byCategory[cat] || 0) - 1
            );
        }

        set({ notifications: updated, stats: updatedStats });
    },

    getUnreadCount: () => {
        const state = get();
        return state.notifications.filter(n => !n.read?.status).length;
    },

    refreshNotifications: async () => {
        try {
            const response = await import("../utils/ClientUtilities").then(mod => mod.default.GetNotifications());
            const { notifications, stats } = response;

            set({
                notifications: notifications || [],
                stats: stats || null,
                isInitialized: true,
            });
        } catch (error) {
            console.error("❌ Failed to refresh notifications:", error);
        }
    },

    setSelectedNotification: (notification) => set({ selectedNotification: notification }),

    clearSelectedNotification: () => set({ selectedNotification: null }),

    clearAll: () => set({
        notifications: [],
        stats: null,
        isInitialized: false,
        selectedNotification: null,
    })
}));