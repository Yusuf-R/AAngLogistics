import { create } from 'zustand';
import SecureStorage from '../lib/SecureStorage';

export const useSessionStore = create((set) => ({
    user: null,
    token: null,
    role: null,
    onboarded: null,
    allOrderData: null,

    // Load session from SecureStorage on app start
    loadSession: async () => {
        const [user, token, role, onboarded, refToken, allOrderData] = await Promise.all([
            SecureStorage.getUserData(),
            SecureStorage.getAccessToken(),
            SecureStorage.getRole(),
            SecureStorage.hasOnboarded(),
            SecureStorage.getRefreshToken(),
            SecureStorage.getAllOrderData(),
        ]);
        set({ user, token, role, onboarded, refToken, allOrderData });
    },

    getCurrentSession: async () => {
        let { user, token, role, onboarded, refToken } = useSessionStore.getState();

        if (!user || !token || !role || !refToken) {
            await useSessionStore.getState().loadSession();
            user = useSessionStore.getState().user;
            token = useSessionStore.getState().token;
            refToken = useSessionStore.getState().refToken;
            role = useSessionStore.getState().role;
            onboarded = useSessionStore.getState().onboarded;
        }

        return { user, token, role, onboarded };
    },

    // Mutators — call after successful login, verify, etc.
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),
    setRefToken: (refToken) => set({ refToken }),
    setRole: (role) => set({ role }),
    setOnboarded: (value) => set({ onboarded: value }),

    // Add setter for allOrderData
    setAllOrderData: (allOrderData) => set({ allOrderData }),

    // Logout
    clearSession: () => set({ user: null, token: null, allOrderData: null }),
}));
