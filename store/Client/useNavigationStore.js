// store/useNavigationStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useNavigationStore = create(
    persist(
        (set, get) => ({
            // Store last routes with timestamps
            lastRoutes: {}, // key: screenName, value: { route, timestamp }

            // Set last route for a specific screen
            setLastRoute: (screenKey, route) => {
                set((state) => ({
                    lastRoutes: {
                        ...state.lastRoutes,
                        [screenKey]: {
                            route,
                            timestamp: Date.now()
                        }
                    }
                }));
            },

            // Get last route for a screen (and optionally clear it)
            getLastRoute: (screenKey, clearAfterGet = true) => {
                const routeData = get().lastRoutes[screenKey];

                if (clearAfterGet && routeData) {
                    // Clear after getting
                    set((state) => {
                        const newRoutes = { ...state.lastRoutes };
                        delete newRoutes[screenKey];
                        return { lastRoutes: newRoutes };
                    });
                }

                return routeData?.route || null;
            },

            // Clear all or specific
            clearLastRoute: (screenKey = null) => {
                if (screenKey) {
                    set((state) => {
                        const newRoutes = { ...state.lastRoutes };
                        delete newRoutes[screenKey];
                        return { lastRoutes: newRoutes };
                    });
                } else {
                    set({ lastRoutes: {} });
                }
            },

            // Cleanup old entries (older than 5 minutes)
            cleanupOldRoutes: () => {
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

                set((state) => {
                    const newRoutes = {};

                    Object.entries(state.lastRoutes).forEach(([key, value]) => {
                        if (value.timestamp > fiveMinutesAgo) {
                            newRoutes[key] = value;
                        }
                    });

                    return { lastRoutes: newRoutes };
                });
            }
        }),
        {
            name: 'navigation-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ lastRoutes: state.lastRoutes })
        }
    )
);

export default useNavigationStore;