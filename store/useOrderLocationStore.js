// store/useOrderLocationStore.js - REFACTORED LEAN VERSION
import { create } from 'zustand';

const useOrderLocationStore = create((set, get) => ({
    // MAP STATE MANAGEMENT ONLY
    isMapOpen: false,
    mapMode: 'pickup', // 'pickup' | 'dropoff'

    // RAW MAP SELECTIONS (temporary holders)
    selectedPickupLocation: null,
    selectedDropoffLocation: null,

    // MAP CONTROL ACTIONS
    openMapForPickup: () => set({
        isMapOpen: true,
        mapMode: 'pickup',
        selectedPickupLocation: null // Clear previous selection
    }),

    openMapForDropoff: () => set({
        isMapOpen: true,
        mapMode: 'dropoff',
        selectedDropoffLocation: null // Clear previous selection
    }),

    closeMap: () => set({ isMapOpen: false }),

    // LOCATION SETTING (from map)
    setPickupLocation: (location) => set({
        selectedPickupLocation: location,
        // Don't close map here - let Step2 handle it
    }),

    setDropoffLocation: (location) => set({
        selectedDropoffLocation: location,
        // Don't close map here - let Step2 handle it
    }),

    // RESET ACTIONS
    clearPickupSelection: () => set({ selectedPickupLocation: null }),
    clearDropoffSelection: () => set({ selectedDropoffLocation: null }),

    resetMapState: () => set({
        isMapOpen: false,
        mapMode: 'pickup',
        selectedPickupLocation: null,
        selectedDropoffLocation: null,
    })
}));

export { useOrderLocationStore };