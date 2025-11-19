// store/useNavigationStore.js
import { create } from 'zustand';

const useNavigationStore = create((set, get) => ({
    // Flag to indicate we're coming from review completion
    isComingFromReview: false,
    // Timestamp to auto-expire the flag
    reviewNavigationTimestamp: null,

    setComingFromReview: () => set({
        isComingFromReview: true,
        reviewNavigationTimestamp: Date.now()
    }),

    clearComingFromReview: () => set({
        isComingFromReview: false,
        reviewNavigationTimestamp: null
    }),

    // Auto-clear if flag is older than 5 seconds (safety)
    shouldSkipLiveTracking: () => {
        const state = get();
        if (!state.isComingFromReview) return false;

        // Auto-clear after 5 seconds
        if (state.reviewNavigationTimestamp &&
            Date.now() - state.reviewNavigationTimestamp > 5000) {
            set({ isComingFromReview: false, reviewNavigationTimestamp: null });
            return false;
        }

        return true;
    }
}));

export default useNavigationStore;