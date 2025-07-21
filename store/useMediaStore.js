// store/mediaStore.js
import { create } from 'zustand';

const useMediaStore = create((set, get) => ({
    images: [],
    video: null,

    addImage: (image) => set((state) => ({
        images: [...state.images, image]
    })),

    removeImage: (key) => set((state) => ({
        images: state.images.filter(img => img.key !== key)
    })),

    setVideo: (video) => set({ video }),

    clearVideo: () => set({ video: null }),

    resetMedia: () => set({ images: [], video: null }),

    // Helper to check if media requirements are met
    isMediaValid: () => {
        const { images } = get();
        return images.length >= 2; // At least 2 images required
    },

    // Get media summary for form validation
    getMediaSummary: () => {
        const { images, video } = get();
        return {
            imageCount: images.length,
            hasVideo: !!video,
            isValid: images.length >= 2
        };
    }
}));

export default useMediaStore;