// store/useOrderStore.js
import { create } from 'zustand';
import ClientUtils from '../utils/ClientUtilities'

export const useOrderStore = create((set, get) => ({
    // --- State ---
    orderData: {},
    currentStep: 0,
    selectedOrder: null,

    // --- Actions ---

    // Initialize the store with full order payload
    initDraft: (data) =>
        set({ orderData: data || {}, currentStep: 0 }),

    // Resume an existing draft into the same store
    resumeDraft: (order) =>
        set({
            selectedOrder: order,
            orderData: order,
            currentStep: order?.metadata?.draftProgress?.step || 0,
        }),

    setSelectedOrder: (order) =>
        set({ selectedOrder: order }),

    // Determine if an order is resumable
    canResumeOrder: (order) =>
        order?.status === 'draft' &&
        (order?.metadata?.draftProgress?.step || 0) > 0,

    // Update a single top-level field in the orderData
    updateField: (key, value) =>
        set((state) => ({
            orderData: {
                ...state.orderData,
                [key]: value,
            },
        })),

    // Replace orderData fully (e.g. after validation result)
    updateOrderData: (newData) =>
        set({ orderData: newData }),

    // Persist the current orderData to the backend
    saveDraft: async () => {
        const { orderData } = get();
        if (!orderData) throw new Error('Missing orderData');
        try {
            await ClientUtils.SaveDraft(orderData);
        } catch (error) {
            console.error('Failed to save draft:', error);
            throw new Error('Failed to save draft');
        }
    },

    // Move between steps, saving first
    goToStep: async (step) => {
        try {
            await get().saveDraft();
            set({ currentStep: step });
        } catch (error) {
            console.error('Failed to save draft before step change:', error);
            throw new Error('Failed to save draft before step change');
        }
    },

    goNext: async () => {
        const next = get().currentStep + 1;
        await get().goToStep(next);
    },

    goPrevious: async () => {
        const prev = get().currentStep - 1;
        if (prev >= 0) await get().goToStep(prev);
    },

    // Clear the state (optional)
    clearDraft: () =>
        set({ orderData: {}, currentStep: 0, selectedOrder: null }),
}));
