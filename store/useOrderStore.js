// store/useOrdersStore.ts
import { create } from 'zustand';

export const useOrdersStore = create((set, get) => ({
    recentOrders: [],
    stats: null,
    isInitialized: false,
    selectedOrder: null,
    savedLocations: [],

    setStats: (stats) => set({ stats }),
    setRecentOrders: (orders) => set({ recentOrders: orders }),
    setSavedLocations: (locations) => set({ savedLocations: locations }),

    initializeOrders: (stats, orders) => set({
        stats,
        recentOrders: orders,
        isInitialized: true
    }),

    refreshOrders: async () => {
        try {
            const { getOrderStats, getOrderHistory, getSavedLocations } = await import('../utils/ClientUtilities').then(mod => mod.default);

            const [stats, recentOrders, savedLocations] = await Promise.all([
                getOrderStats(),
                getOrderHistory(),
                getSavedLocations()
            ]);

            set({
                stats,
                recentOrders,
                savedLocations,
                isInitialized: true
            });
        } catch (error) {
            console.error('❌ Failed to refresh orders:', error);
        }
    },

    updateOrderStatus: (orderId, newStatus) => {
        const state = get();
        const updatedOrders = state.recentOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
        );
        set({ recentOrders: updatedOrders });
    },

    addOrder: (order) => {
        const state = get();
        set({ recentOrders: [order, ...state.recentOrders] });
    },

    setSelectedOrder: (order) => set({ selectedOrder: order }),
    clearSelectedOrder: () => set({ selectedOrder: null }),

    clearAll: () => set({
        recentOrders: [],
        stats: null,
        savedLocations: [],
        isInitialized: false,
        selectedOrder: null
    })
}));
