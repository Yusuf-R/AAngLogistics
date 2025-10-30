// store/Driver/useNotificationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MMKVStorage } from '../../lib/MMKVStorage'; // Your MMKV helper
import DriverUtils from '../../utils/DriverUtilities';

// Create MMKV storage adapter for Zustand
const mmkvStorage = {
    getItem: (name) => {
        try {
            return MMKVStorage.getItem(name);
        } catch (error) {
            console.warn(`[MMKV] Failed to get item ${name}:`, error);
            return null;
        }
    },
    setItem: (name, value) => {
        try {
            MMKVStorage.setItem(name, value);
        } catch (error) {
            console.warn(`[MMKV] Failed to set item ${name}:`, error);
        }
    },
    removeItem: (name) => {
        try {
            MMKVStorage.removeItem(name);
        } catch (error) {
            console.warn(`[MMKV] Failed to remove item ${name}:`, error);
        }
    },
};

export const useNotificationStore = create(
    persist(
        (set, get) => ({
            notifications: [],
            stats: { unread: 0, total: 0 },
            isInitialized: false,
            selectedNotification: null,
            isLoading: false,
            lastFetched: null,

            fetchNotificationStats: async () => {
                try {
                    set({ isLoading: true });
                    const response = await DriverUtils.GetNotificationStats();
                    const { stats } = response;

                    set({
                        stats,
                        isLoading: false,
                        lastFetched: Date.now(),
                        isInitialized: true
                    });
                } catch (error) {
                    console.error('Failed to fetch notification stats:', error);
                    set({ isLoading: false });
                }
            },

            fetchNotifications: async (limit = 100) => {
                try {
                    set({ isLoading: true });
                    const response = await DriverUtils.GetNotification();
                    const { notifications, stats } = response;

                    set({
                        notifications,
                        stats,
                        isLoading: false,
                        isInitialized: true
                    });
                } catch (error) {
                    console.error('Failed to fetch notifications:', error);
                    set({ isLoading: false });
                }
            },

            incrementBadge: () => {
                const { stats } = get();
                set({
                    stats: {
                        ...stats,
                        unread: stats.unread + 1,
                        total: stats.total + 1
                    }
                });
            },

            decrementBadge: () => {
                const { stats } = get();
                set({
                    stats: {
                        ...stats,
                        unread: Math.max(0, stats.unread - 1)
                    }
                });
            },

            markAsRead: (notificationId) => {
                const { notifications, stats } = get();

                const updatedNotifications = notifications.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, read: { status: true, readAt: new Date() } }
                        : notif
                );

                set({
                    notifications: updatedNotifications,
                    stats: {
                        ...stats,
                        unread: Math.max(0, stats.unread - 1)
                    }
                });

                DriverUtils.MarkAsRead(notificationId);
            },

            clearBadge: () => {
                const { stats } = get();
                set({
                    stats: {
                        ...stats,
                        unread: 0
                    }
                });
            },

            clearAll: () => set({
                notifications: [],
                stats: null,
                isInitialized: false,
                selectedNotification: null,
            }),

            // 🔥 NEW: Debug method to check storage
            debugStorage: () => {
                const stored = MMKVStorage.getItem('driver-notification-storage');
                console.log('📦 Stored notification data:', stored);
                return stored;
            }
        }),
        {
            name: 'driver-notification-storage',
            storage: mmkvStorage, // 🔥 Use MMKV instead of AsyncStorage
            partialize: (state) => ({
                stats: state.stats,
                lastFetched: state.lastFetched,
                isInitialized: state.isInitialized
            }),
            onRehydrateStorage: () => (state) => {
                console.log('🔄 Notification store rehydrated from MMKV');
                if (state) {
                    console.log('📊 Rehydrated stats:', state.stats);
                }
            },
            version: 1,
            migrate: (persistedState, version) => {
                console.log(`🔄 Migrating from version ${version}`);
                return persistedState;
            }
        }
    )
);