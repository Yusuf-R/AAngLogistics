import { create } from 'zustand';

export const useSavedLocationStore = create((set, get) => ({
    // Current location being edited
    currentEditLocation: null,

    // Set location for editing
    setEditLocation: (location) => set({ currentEditLocation: location }),

    // Clear edit location
    clearEditLocation: () => set({ currentEditLocation: null }),

    // Google Maps selected location data
    selectedMapLocation: null,

    // Set map location data (from Google Maps selection)
    setMapLocation: (locationData) => set({
        selectedMapLocation: {
            address: locationData.address,
            coordinates: {
                type: "Point",
                coordinates: [
                    locationData.longitude || locationData.coordinates?.coordinates?.[0],
                    locationData.latitude || locationData.coordinates?.coordinates?.[1]
                ]
            },
            placeId: locationData.placeId || null,
            formattedAddress: locationData.formattedAddress || locationData.address
        }
    }),

    // Clear map location
    clearMapLocation: () => set({ selectedMapLocation: null }),

    // Optional: Store all locations for additional optimizations
    savedLocations: [],
    setSavedLocations: (locations) => set({ savedLocations: locations }),

    // Update a specific location in the store after edit
    updateLocationInStore: (updatedLocation) => set((state) => ({
        savedLocations: state.savedLocations.map(loc =>
            loc._id === updatedLocation._id ? updatedLocation : loc
        ),
        currentEditLocation: null
    })),

    updateCurrentEditLocationCoordinates: (newData) => set((state) => ({
        currentEditLocation: state.currentEditLocation
            ? {
                ...state.currentEditLocation,
                address: newData.address,
                coordinates: {
                    lat: newData.latitude,
                    lng: newData.longitude,
                },
            }
            : null
    })),
}));