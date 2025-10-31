// store/Driver/useLocationStore.js
import { create } from 'zustand';

export const useLocationStore = create((set) => ({
    // Mode tracking
    mode: null, // 'new' | 'edit' | 'view'
    editingLocation: null,

    // Map data
    mapData: {
        coordinates: { lat: 0, lng: 0 },
        address: '',
        isReady: false
    },

    // Form data
    formData: {
        address: '',
        coordinates: { lat: 0, lng: 0 },
        landmark: '',
        contactPerson: {
            name: '',
            phone: '',
            alternatePhone: ''
        },
        extraInformation: '',
        locationType: 'residential',
        building: {
            name: '',
            floor: '',
            unit: ''
        }
    },

    // Actions
    setMode: (mode) => set({ mode }),

    setEditingLocation: (location) => set({
        editingLocation: location,
        mode: location ? 'edit' : null
    }),

    setMapData: (data) => set((state) => ({
        mapData: { ...state.mapData, ...data }
    })),

    setFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),

    resetLocationStore: () => set({
        mode: null,
        editingLocation: null,
        mapData: {
            coordinates: { lat: 0, lng: 0 },
            address: '',
            isReady: false
        },
        formData: {
            address: '',
            coordinates: { lat: 0, lng: 0 },
            landmark: '',
            contactPerson: { name: '', phone: '', alternatePhone: '' },
            extraInformation: '',
            locationType: 'residential',
            building: { name: '', floor: '', unit: '' }
        }
    })
}));