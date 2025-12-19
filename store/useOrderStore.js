// store/useOrderStore.js
import { create } from 'zustand';
import ClientUtils from '../utils/ClientUtilities'
import SessionManager from "../lib/SessionManager";
import SecureStorage from "../lib/SecureStorage";
import {upsertOrder} from "../lib/upsert";

export const useOrderStore = create((set, get) => ({
    // --- State ---
    orderData: {}, // this was used during the create order operation -> it a single data object
    currentStep: 0,
    selectedOrder: null,
    orderRef: null,
    trackingOrder: null,
    liveTrackingData: new Map(), // orderId -> real-time data
    driverLocations: new Map(),
    isResumeMode: false,

    // --- Actions ---

    // Initialize the store with full order payload
    initDraft: (data, isResume = false) =>
        set({
            orderData: data || {},
            currentStep: isResume ? (data?.metadata?.draftProgress?.step || 0) : 0,
            isResumeMode: isResume // NEW
        }),

    // Resume an existing draft into the same store
    resumeDraft: (order) => {
        const resumeStep = order?.metadata?.draftProgress?.step || 0;
        set({
            orderData: order,
            currentStep: resumeStep,
            isResumeMode: true,
            selectedOrder: order
        });
    },

    setSelectedOrder: (order) =>
        set({ selectedOrder: order }),
    setTrackingOrder: (order) =>
        set({ trackingOrder: order }),
    setOrderRef: (ref) =>
        set({ orderRef: ref }),

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
            const {order} = await ClientUtils.SaveDraft(orderData);
            // pull current allOrderData from session storage
            const allOrderData = await SecureStorage.getAllOrderData();
            // update just that one order inside orders[]
            const updatedAll = upsertOrder(allOrderData, order);
            await SessionManager.updateAllOrderData(updatedAll);
        } catch (error) {
            console.log('Failed to save draft:', error);
            throw new Error('Failed to save draft');
        }
    },

    // Move between steps, saving first
    goToStep: async (step) => {
        try {
            await get().saveDraft();
            set({ currentStep: step });
        } catch (error) {
            console.log('Failed to save draft before step change:', error);
            throw new Error('Failed to change step due to save error');
        }
    },

    goNext: async () => {
        const next = get().currentStep + 1;
        await get().goToStep(next);
    },

    goPrevious: async () => {
        const prev = get().currentStep - 1;
        if (prev >= 0) {
            set({ currentStep: prev });
        }
    },

    // tracking utils
    updateOrderTracking: (orderUpdate) => {
        const state = get();
        const { orderId, trackingHistory, status, currentEntry } = orderUpdate;

        // Update the specific order being tracked
        if (state.trackingOrder?._id === orderId) {
            set({
                trackingOrder: {
                    ...state.trackingOrder,
                    status,
                    orderTrackingHistory: trackingHistory
                }
            });
        }

        // Update orders in the general list
        const updatedOrders = state.orders.map(order =>
            order._id === orderId
                ? { ...order, status, orderTrackingHistory: trackingHistory }
                : order
        );

        set({ orders: updatedOrders });

        // Store live tracking metadata
        const liveData = new Map(state.liveTrackingData);
        liveData.set(orderId, {
            status,
            currentEntry,
            updatedAt: new Date()
        });
        set({ liveTrackingData: liveData });
    },

    updateDriverLocation: (locationUpdate) => {
        const state = get();
        const { orderId, location, eta, distance, timestamp } = locationUpdate;

        // Update tracking order if it matches
        if (state.trackingOrder?._id === orderId) {
            set({
                trackingOrder: {
                    ...state.trackingOrder,
                    driverAssignment: {
                        ...state.trackingOrder.driverAssignment,
                        currentLocation: {
                            ...location,
                            timestamp: timestamp || new Date()
                        },
                        estimatedArrival: eta ? {
                            pickup: new Date(Date.now() + eta * 60000)
                        } : state.trackingOrder.driverAssignment?.estimatedArrival,
                        distance: distance ? {
                            remaining: distance,
                            unit: 'km'
                        } : state.trackingOrder.driverAssignment?.distance
                    }
                }
            });
        }

        // Update driver locations map for quick access
        const driverLocations = new Map(state.driverLocations);
        driverLocations.set(orderId, {
            location,
            eta,
            distance,
            timestamp: timestamp || new Date()
        });
        set({ driverLocations });
    },

    updateDriverAssignment: (driverData) => {
        const state = get();
        const { orderId, driverId, driverInfo } = driverData;

        if (state.trackingOrder?._id === orderId) {
            set({
                trackingOrder: {
                    ...state.trackingOrder,
                    driverAssignment: {
                        ...state.trackingOrder.driverAssignment,
                        driverId,
                        driverInfo,
                        status: 'assigned',
                        assignedAt: new Date()
                    }
                }
            });
        }
    },

    // Clear the state (optional)
    clearDraft: () =>
        set({ orderData: {}, currentStep: 0, selectedOrder: null }),
}));
