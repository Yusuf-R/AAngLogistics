import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Zustand store for managing client orders
 */
export const useOrderStore = create(
    persist(
        (set, get) => ({
            // --- STATE ---
            recentOrders: [],
            selectedOrder: null,
            draftOrders: [],
            currentDraftId: null,
            error: null,

            // --- MUTATORS ---
            setRecentOrders: (orders) => set({ recentOrders: orders }),
            setError: (error) => set({ error }),

            updateOrderStatus: (orderId, newStatus) => {
                const updatedOrders = get().recentOrders.map((order) =>
                    order._id === orderId ? { ...order, status: newStatus } : order
                );
                set({ recentOrders: updatedOrders });
            },

            addOrder: (order) => {
                set({ recentOrders: [order, ...get().recentOrders] });
            },

            removeOrder: (orderId) => {
                const updatedOrders = get().recentOrders.filter((order) => order._id !== orderId);
                set({ recentOrders: updatedOrders });
            },

            setSelectedOrder: (order) => set({ selectedOrder: order }),
            clearSelectedOrder: () => set({ selectedOrder: null }),


            getOrdersByStatus: (status) => {
                const orders = get().recentOrders;
                const ongoing = ['confirmed', 'assigned', 'picked_up', 'in_transit'];

                if (status.toLowerCase() === 'ongoing') {
                    return orders.filter((o) => ongoing.includes(o.status));
                }

                if (status.toLowerCase() === 'completed') {
                    return orders.filter((o) => o.status === 'delivered');
                }

                return orders.filter((o) => o.status === status);
            },

            getOrdersByCategory: (category) => {
                return get().recentOrders.filter(
                    (order) => order.package?.category?.toLowerCase() === category.toLowerCase()
                );
            },

            searchOrders: (query) => {
                const q = query.toLowerCase();
                return get().recentOrders.filter((order) =>
                    order.orderRef.toLowerCase().includes(q) ||
                    order.package?.description?.toLowerCase().includes(q) ||
                    order.pickup?.address?.toLowerCase().includes(q) ||
                    order.dropoff?.address?.toLowerCase().includes(q)
                );
            },
            saveDraftProgress: (orderId, progress) => {
                const { orderData, step, lastSaved, submitted } = progress;

                if (submitted) {
                    // Move from draft to regular orders when submitted
                    const updatedOrders = get().recentOrders.map((order) =>
                        order._id === orderId ? { ...orderData, _id: orderId } : order
                    );

                    // Remove from drafts
                    const updatedDrafts = get().draftOrders.filter(draft => draft._id !== orderId);

                    set({
                        recentOrders: updatedOrders,
                        draftOrders: updatedDrafts
                    });
                    return;
                }

                // Check if draft already exists
                const existingDraftIndex = get().draftOrders.findIndex(draft => draft._id === orderId);

                if (existingDraftIndex >= 0) {
                    // Update existing draft
                    const updatedDrafts = [...get().draftOrders];
                    updatedDrafts[existingDraftIndex] = {
                        ...updatedDrafts[existingDraftIndex],
                        ...orderData,
                        _id: orderId,
                        lastSaved,
                        currentStep: step
                    };
                    set({ draftOrders: updatedDrafts });
                } else {
                    // Create new draft
                    const newDraft = {
                        ...orderData,
                        _id: orderId,
                        orderRef: `DRAFT-${orderId.split('_')[1]?.slice(0, 8) || 'NEW'}`,
                        status: 'draft',
                        lastSaved,
                        currentStep: step,
                        createdAt: new Date().toISOString()
                    };

                    set({
                        draftOrders: [newDraft, ...get().draftOrders]
                    });
                }

                // Also update recent orders if it exists there
                const recentOrderIndex = get().recentOrders.findIndex(order => order._id === orderId);
                if (recentOrderIndex >= 0) {
                    const updatedRecentOrders = [...get().recentOrders];
                    updatedRecentOrders[recentOrderIndex] = {
                        ...updatedRecentOrders[recentOrderIndex],
                        ...orderData,
                        lastSaved
                    };
                    set({ recentOrders: updatedRecentOrders });
                }
            },

            getDraftProgress: (orderId) => {
                // First check drafts
                const draft = get().draftOrders.find((d) => d._id === orderId);
                if (draft) return draft;

                // Then check recent orders for draft status
                const order = get().recentOrders.find((o) => o._id === orderId && o.status === 'draft');
                return order?.metadata?.draftProgress || null;
            },

            resumeDraft: (orderId) => {
                const draft = get().draftOrders.find(d => d._id === orderId);
                if (draft) {
                    set({ currentDraftId: orderId });
                    return {
                        orderData: draft,
                        step: draft.currentStep || 0
                    };
                }
                return null;
            },

            canResumeOrder: (order) => {
                return order.status === 'draft' &&
                    (order.currentStep > 0 || order.metadata?.draftProgress?.step > 0);
            },

            // Enhanced search to include drafts
            searchOrdersAndDrafts: (query) => {
                const q = query.toLowerCase();
                const orders = get().recentOrders.filter((order) =>
                    order.orderRef?.toLowerCase().includes(q) ||
                    order.package?.description?.toLowerCase().includes(q) ||
                    order.pickup?.address?.toLowerCase().includes(q) ||
                    order.dropoff?.address?.toLowerCase().includes(q)
                );

                const drafts = get().draftOrders.filter((draft) =>
                    draft.orderRef?.toLowerCase().includes(q) ||
                    draft.package?.description?.toLowerCase().includes(q) ||
                    draft.pickup?.address?.toLowerCase().includes(q) ||
                    draft.dropoff?.address?.toLowerCase().includes(q)
                );

                return { orders, drafts };
            },

            // Clean old drafts (optional utility)
            cleanOldDrafts: (daysOld = 7) => {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysOld);

                const validDrafts = get().draftOrders.filter(draft => {
                    const draftDate = new Date(draft.createdAt || draft.lastSaved);
                    return draftDate > cutoffDate;
                });

                set({ draftOrders: validDrafts });
            },

            clearAll: () =>
                set({
                    recentOrders: [],
                    draftOrders: [],
                    selectedOrder: null,
                    currentDraftId: null,
                    error: null
                })
        }),

        {
            name: 'orders-storage',
            storage: createJSONStorage(() => ({
                getItem: async (name) => null,
                setItem: async (name, value) => {},
                removeItem: async (name) => {}
            })),
            partialize: (state) => ({
                savedLocations: state.savedLocations,
                draftOrders: state.draftOrders
            })
        }
    )
);
