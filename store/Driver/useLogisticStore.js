// store/useLogisticStore.js
import { create } from 'zustand';
import * as Location from 'expo-location';
import { toast } from 'sonner-native';
import DriverUtils from '../../utils/DriverUtilities';

const useLogisticStore = create((set, get) => ({
    // ========== DRIVER LOCATION STATE ==========
    currentLocation: null, // { lat, lng, accuracy, timestamp }
    locationHistory: [], // Last 50 location points
    isTrackingLocation: false,
    locationFailureCount: 0,
    lastLocationUpdate: null,

    // ========== ACTIVE DELIVERY STATE ==========
    isOnActiveDelivery: false,
    activeOrderId: null,
    activeOrder: null, // Full order object when on delivery

    // ========== SCAN SETTINGS ==========
    scanSettings: {
        area: 'territorial', // 'current' | 'territorial'
        radius: 25, // km (only for 'current' mode)
        vehicleFilter: [], // e.g., ['motorcycle', 'car'] - empty means all
        priorityFilter: 'all', // 'all' | 'urgent' | 'high_priority'
        maxDistance: 40 // km - max distance for order consideration
    },

    // ========== AVAILABLE ORDERS STATE ==========
    availableOrders: [],
    orderCount: 0,
    lastFetchTimestamp: null,
    isFetchingOrders: false,

    // ========== BACKGROUND POLLING ==========
    pollingInterval: null,
    pollingEnabled: false,

    // ========== ACTIONS: LOCATION TRACKING ==========

    /**
     * Start continuous location tracking (every 30s)
     * Used during active deliveries
     */
    startLocationTracking: async () => {
        const state = get();
        if (state.isTrackingLocation) {
            console.log('Location tracking already active');
            return;
        }

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                toast.error('Location permission denied');
                return;
            }

            set({ isTrackingLocation: true, locationFailureCount: 0 });

            // Subscribe to location updates
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 30000, // 30 seconds
                    distanceInterval: 10 // 10 meters
                },
                (location) => {
                    get().updateLocation(location.coords);
                }
            );

            // Store subscription for cleanup
            set({ locationSubscription: subscription });

            console.log('✅ Location tracking started (30s interval)');
        } catch (error) {
            console.log('Failed to start location tracking:', error);
            toast.error('Failed to start location tracking');
            set({ isTrackingLocation: false });
        }
    },

    /**
     * Stop location tracking
     */
    stopLocationTracking: () => {
        const state = get();
        if (state.locationSubscription) {
            state.locationSubscription.remove();
            set({
                locationSubscription: null,
                isTrackingLocation: false,
                locationFailureCount: 0
            });
            console.log('🛑 Location tracking stopped');
        }
    },

    /**
     * Update current location and handle failures
     */
    updateLocation: (coords) => {
        const state = get();
        const newLocation = {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords?.accuracy || 25,
            timestamp: Date.now()
        };

        // Reset failure count on successful update
        set({
            currentLocation: newLocation,
            lastLocationUpdate: Date.now(),
            locationFailureCount: 0
        });

        // Add to history (keep last 50 points)
        const updatedHistory = [...state.locationHistory, newLocation].slice(-50);
        set({ locationHistory: updatedHistory });

        // If on active delivery, sync with backend
        if (state.isOnActiveDelivery && state.activeOrderId) {
            get().syncLocationToBackend(state.activeOrderId, newLocation);
        }
    },

    /**
     * Handle location tracking failure
     */
    handleLocationFailure: () => {
        const state = get();
        const newFailureCount = state.locationFailureCount + 1;

        set({ locationFailureCount: newFailureCount });

        if (newFailureCount >= 5) {
            console.log('❌ 5 consecutive location failures detected');
            toast.error('Location tracking lost. Please check your connection.');

            // Notify backend about location loss
            if (state.isOnActiveDelivery && state.activeOrderId) {
                get().notifyLocationLoss(state.activeOrderId);
            }

            // Don't stop tracking - keep trying to reconnect
            // User/Admin will be notified and can take action
        } else if (newFailureCount === 3) {
            toast.warning('Having trouble getting your location...');
        }
    },

    /**
     * Sync location to backend during active delivery
     */
    syncLocationToBackend: async (orderId, location) => {
        try {

            const result = await DriverUtils.updateCurrentLocation(orderId, location);

            if (!result.success) {
                console.log('Failed to sync location:', result.message);
                get().handleLocationFailure();
            } else {
                console.log('📍 Location synced to backend:', location);
            }
        } catch (error) {
            console.log('Failed to sync location:', error);
            get().handleLocationFailure();
        }
    },

    /**
     * Notify backend about location tracking loss
     */
    notifyLocationLoss: async (orderId) => {
        try {
            const state = get();


            const result = await DriverUtils.notifyLocationLoss(
                orderId,
                state.currentLocation,
                state.locationFailureCount
            );

            if (result.success) {
                console.log('⚠️ Location loss notification sent:', result.action);
            }
        } catch (error) {
            console.log('Failed to notify location loss:', error);
            toast.error('Failed to notify location loss');
        }
    },

    // ========== ACTIONS: SCAN SETTINGS ==========

    /**
     * Update scan settings
     */
    updateScanSettings: (newSettings) => {
        set((state) => ({
            scanSettings: { ...state.scanSettings, ...newSettings }
        }));
        console.log('⚙️ Scan settings updated:', newSettings);
    },

    /**
     * Reset scan settings to defaults
     */
    resetScanSettings: () => {
        set({
            scanSettings: {
                area: 'current',
                radius: 5,
                vehicleFilter: [],
                priorityFilter: 'all',
                maxDistance: 10
            }
        });
        console.log('🔄 Scan settings reset to defaults');
    },

    // ========== ACTIONS: ORDER FETCHING ==========

    /**
     * Fetch available orders based on current settings
     */
    fetchAvailableOrders: async (location = null, silent = false) => {
        const state = get();
        const targetLocation = location || state.currentLocation;

        if (!targetLocation) {
            console.log('⚠️ No location available for fetching orders');
            return { success: false, message: 'Location unavailable' };
        }

        if (!silent) set({ isFetchingOrders: true });

        try {
            const { scanSettings } = state;

            // Build query params based on settings
            const queryParams = {
                lat: targetLocation.lat,
                lng: targetLocation.lng,
                area: scanSettings.area,
                radius: scanSettings.area === 'current' ? scanSettings.radius : null,
                vehicleFilter: scanSettings.vehicleFilter.length > 0
                    ? scanSettings.vehicleFilter
                    : null,
                priorityFilter: scanSettings.priorityFilter,
                maxDistance: scanSettings.maxDistance,
                status: 'broadcast' // Only fetch orders ready for assignment
            };

            // TODO: Implement API call
            const response = await DriverUtils.getAvailableOrders(queryParams);

            // MOCK DATA for now
            const mockOrders = [
                {
                    _id: '123',
                    orderRef: 'ORD-ABC-123',
                    distance: 2.5,
                    priority: 'normal',
                    vehicleRequirements: ['motorcycle', 'car'],
                    pricing: { totalAmount: 5000 },
                    location: {
                        pickUp: { address: 'UI, Ibadan' },
                        dropOff: { address: 'Bodija Market' }
                    }
                },
                {
                    _id: '124',
                    orderRef: 'ORD-DEF-456',
                    distance: 4.8,
                    priority: 'high',
                    vehicleRequirements: ['car'],
                    pricing: { totalAmount: 8500 },
                    location: {
                        pickUp: { address: 'Jericho Mall' },
                        dropOff: { address: 'Ring Road' }
                    }
                }
            ];

            set({
                availableOrders: response.orders,
                orderCount: response.count,
                lastFetchTimestamp: Date.now(),
                isFetchingOrders: false
            });

            if (!silent) {
                console.log(`✅ Found ${response.count} available orders`);
            }

            return {
                success: true,
                orders: response,
                count: response.count
            };

        } catch (error) {
            console.log('Failed to fetch orders:', error);
            set({ isFetchingOrders: false });

            if (!silent) {
                toast.error('Failed to fetch available orders');
            }

            return { success: false, message: error.message };
        }
    },

    /**
     * Start background polling for orders (every 30s)
     */
    startOrderPolling: () => {
        const state = get();
        if (state.pollingInterval) {
            console.log('Order polling already active');
            return;
        }

        set({ pollingEnabled: true });

        const interval = setInterval(() => {
            const currentState = get();
            if (currentState.pollingEnabled && !currentState.isOnActiveDelivery) {
                currentState.fetchAvailableOrders(null, true); // Silent fetch
            }
        }, 30000); // 30 seconds

        set({ pollingInterval: interval });
        console.log('🔄 Order polling started (30s interval)');
    },

    /**
     * Stop background polling
     */
    stopOrderPolling: () => {
        const state = get();
        if (state.pollingInterval) {
            clearInterval(state.pollingInterval);
            set({ pollingInterval: null, pollingEnabled: false });
            console.log('🛑 Order polling stopped');
        }
    },

    // ========== ACTIONS: ACTIVE DELIVERY MANAGEMENT ==========

    /**
     * Start active delivery (accept an order)
     */
    startActiveDelivery: async (order) => {
        set({
            isOnActiveDelivery: true,
            activeOrderId: order._id,
            activeOrder: order
        });

        // Start location tracking for this delivery
        await get().startLocationTracking();

        // Stop order polling while on delivery
        get().stopOrderPolling();

        toast.success(`Active delivery started: ${order.orderRef}`);
        console.log('🚚 Active delivery started:', order.orderRef);
    },

    /**
     * Complete active delivery
     */
    completeActiveDelivery: () => {
        const state = get();

        // Stop location tracking
        get().stopLocationTracking();

        // Clear active delivery state
        set({
            isOnActiveDelivery: false,
            activeOrderId: null,
            activeOrder: null,
            locationHistory: [] // Clear history after delivery
        });

        // Resume order polling
        get().startOrderPolling();

        toast.success('Delivery completed!');
        console.log('✅ Active delivery completed');
    },

    /**
     * Cancel active delivery
     */
    cancelActiveDelivery: (reason) => {
        const state = get();

        // TODO: Notify backend about cancellation
        console.log('❌ Delivery cancelled:', reason);

        // Stop tracking and clear state
        get().stopLocationTracking();
        set({
            isOnActiveDelivery: false,
            activeOrderId: null,
            activeOrder: null,
            locationHistory: []
        });

        // Resume order polling
        get().startOrderPolling();

        toast.info('Delivery cancelled');
    },

    // ========== UTILITY ACTIONS ==========

    /**
     * Clear all orders
     */
    clearOrders: () => {
        set({
            availableOrders: [],
            orderCount: 0,
            lastFetchTimestamp: null
        });
    },

    /**
     * Reset entire store (logout, etc.)
     */
    resetStore: () => {
        const state = get();

        // Stop all intervals and subscriptions
        state.stopLocationTracking();
        state.stopOrderPolling();

        // Reset all state
        set({
            currentLocation: null,
            locationHistory: [],
            isTrackingLocation: false,
            locationFailureCount: 0,
            lastLocationUpdate: null,
            isOnActiveDelivery: false,
            activeOrderId: null,
            activeOrder: null,
            scanSettings: {
                area: 'current',
                radius: 5,
                vehicleFilter: [],
                priorityFilter: 'all',
                maxDistance: 10
            },
            availableOrders: [],
            orderCount: 0,
            lastFetchTimestamp: null,
            isFetchingOrders: false,
            pollingInterval: null,
            pollingEnabled: false
        });

        console.log('🔄 Logistic store reset');
    }
}));

export default useLogisticStore;