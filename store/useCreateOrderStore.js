import { create } from "zustand";

export const useCreateOrderStore = create((set) => ({
    pickup: null,
    dropoff: null,

    setPickup: (pickup) => set({ pickup }),
    setDropoff: (dropoff) => set({ dropoff }),

    clearLocations: () => set({ pickup: null, dropoff: null }),
}));
