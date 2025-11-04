// store/useLogisticStore.js
import { create } from 'zustand';
import * as Location from 'expo-location';
import { toast } from 'sonner-native';
import DriverUtils from '../../utils/DriverUtilities';

/**
 * DELIVERY STAGE DEFINITIONS:
 * - 'discovering': Driver is browsing available orders (default state)
 * - 'accepted': Order accepted, en route to pickup location
 * - 'arrived_pickup': Driver has arrived at pickup location (within geofence)
 * - 'picked_up': Package collected, en route to delivery location
 * - 'arrived_dropoff': Driver has arrived at delivery location (within geofence)
 * - 'delivered': Package delivered successfully
 * - 'completed': Delivery completed, ready to return to discovering
 * - 'cancelled': Delivery cancelled (with reason)
 */

const DELIVERY_STAGES = {
    DISCOVERING: 'discovering',
    ACCEPTED: 'accepted',
    ARRIVED_PICKUP: 'arrived_pickup',
    PICKED_UP: 'picked_up',
    ARRIVED_DROPOFF: 'arrived_dropoff',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const GEOFENCE_RADIUS = 500; // meters

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

    // ========== DELIVERY STATE MACHINE ==========
    deliveryStage: DELIVERY_STAGES.DISCOVERING,
    deliveryStartTime: null,
    deliveryAcceptedTime: null,
    deliveryCompletedTime: null,

    // Geofence tracking
    isInPickupGeofence: false,
    isInDropoffGeofence: false,
    geofenceCheckInterval: null,

    // Pickup verification state
    pickupVerification: {
        isVerified: false,
        timestamp: null,
        photos: [], // Array of photo URIs
        packageCondition: null, // 'good' | 'damaged' | 'tampered'
        weight: null,
        notes: '',
        contactPersonVerified: false
    },

    // Delivery verification state
    deliveryVerification: {
        isVerified: false,
        timestamp: null,
        deliveryToken: null, // 6-digit token
        tokenVerified: false,
        photos: [], // Optional delivery photos
        recipientName: '',
        recipientSignature: null,
        notes: ''
    },

    // Navigation data
    navigationData: {
        isNavigating: false,
        targetLocation: null, // 'pickup' | 'dropoff'
        routePolyline: null,
        estimatedDistance: null, // in km
        estimatedDuration: null, // in minutes
        lastETAUpdate: null
    },

    // Communication
    messages: [], // In-app messages between driver and client
    lastMessageTimestamp: null,

    // Emergency & Issues
    issueReported: false,
    issueDetails: null,
    sosActivated: false,

    // ========== SCAN SETTINGS ==========
    scanSettings: {
        area: 'territorial',
        radius: 25,
        vehicleFilter: [],
        priorityFilter: 'all',
        maxDistance: 40
    },

    // ========== TAB CONTEXT ==========
    currentTabContext: 'map',

    // ========== TAB-SPECIFIC ORDERS STATE ==========
    tabOrders: {
        map: {
            availableOrders: [],
            orderCount: 0,
            lastFetchTimestamp: null,
            isFetchingOrders: false
        },
        orders: {
            availableOrders: [],
            orderCount: 0,
            lastFetchTimestamp: null,
            isFetchingOrders: false
        }
    },

    // ========== ACTIONS: TAB MANAGEMENT ==========

    setCurrentTabContext: (tab) => set({ currentTabContext: tab }),

    // ========== ACTIONS: LOCATION TRACKING ==========

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

            // Adaptive tracking based on delivery stage
            const trackingConfig = get().getLocationTrackingConfig();

            const subscription = await Location.watchPositionAsync(
                trackingConfig,
                (location) => {
                    get().updateLocation(location.coords);
                }
            );

            set({ locationSubscription: subscription });
            console.log('✅ Location tracking started:', trackingConfig);
        } catch (error) {
            console.log('Failed to start location tracking:', error);
            toast.error('Failed to start location tracking');
            set({ isTrackingLocation: false });
        }
    },

    /**
     * Get adaptive location tracking configuration based on delivery stage
     */
    getLocationTrackingConfig: () => {
        const state = get();
        const { deliveryStage, navigationData } = state;

        // High frequency during active navigation
        if (navigationData.isNavigating) {
            return {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000, // 5 seconds
                distanceInterval: 10
            };
        }

        // Medium frequency during active delivery
        if (deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.PICKED_UP) {
            return {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 30000, // 30 seconds
                distanceInterval: 20
            };
        }

        // Low frequency when at pickup/dropoff
        if (deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) {
            return {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 120000, // 2 minutes
                distanceInterval: 50
            };
        }

        // Default for discovering
        return {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 60000, // 1 minute
            distanceInterval: 50
        };
    },

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

        // Stop geofence checking
        if (state.geofenceCheckInterval) {
            clearInterval(state.geofenceCheckInterval);
            set({ geofenceCheckInterval: null });
        }
    },

    updateLocation: (coords, sourceTab = null) => {
        const state = get();
        const newLocation = {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords?.accuracy || 25,
            timestamp: Date.now()
        };

        set({
            currentLocation: newLocation,
            lastLocationUpdate: Date.now(),
            locationFailureCount: 0
        });

        const updatedHistory = [...state.locationHistory, newLocation].slice(-50);
        set({ locationHistory: updatedHistory });

        const targetTab = sourceTab || state.currentTabContext;

        if (!state.isOnActiveDelivery && targetTab) {
            get().fetchAvailableOrders(newLocation, true, targetTab);
        }

        // Sync location during active delivery
        if (state.isOnActiveDelivery && state.activeOrderId) {
            get().syncLocationToBackend(state.activeOrderId, newLocation);

            // Check geofences
            get().checkGeofences(newLocation);

            // Update ETA if navigating
            if (state.navigationData.isNavigating) {
                get().updateETA(newLocation);
            }
        }
    },

    handleLocationFailure: () => {
        const state = get();
        const newFailureCount = state.locationFailureCount + 1;

        set({ locationFailureCount: newFailureCount });

        if (newFailureCount >= 5) {
            console.log('❌ 5 consecutive location failures detected');
            toast.error('Location tracking lost. Please check your connection.');

            if (state.isOnActiveDelivery && state.activeOrderId) {
                get().notifyLocationLoss(state.activeOrderId);
            }
        } else if (newFailureCount === 3) {
            toast.warning('Having trouble getting your location...');
        }
    },

    syncLocationToBackend: async (orderId, location) => {
        try {
            const state = get();
            const result = await DriverUtils.updateCurrentLocation(orderId, location, state.deliveryStage);

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

    // ========== ACTIONS: GEOFENCE MANAGEMENT ==========

    /**
     * Check if driver is within pickup/dropoff geofence
     */
    checkGeofences: (currentLocation) => {
        const state = get();
        const { activeOrder, deliveryStage } = state;

        if (!activeOrder || !currentLocation) return;

        // Check pickup geofence (only relevant before pickup)
        if (deliveryStage === DELIVERY_STAGES.ACCEPTED) {
            const pickupLocation = activeOrder.location.pickUp.coordinates;
            const distanceToPickup = get().calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                pickupLocation.lat,
                pickupLocation.lng
            );

            const wasInPickupGeofence = state.isInPickupGeofence;
            const isNowInPickupGeofence = distanceToPickup <= GEOFENCE_RADIUS;

            if (!wasInPickupGeofence && isNowInPickupGeofence) {
                // Entered pickup geofence
                set({ isInPickupGeofence: true });
                toast.success('📍 You\'ve arrived at pickup location!');
                console.log('🎯 Entered pickup geofence');
            } else if (wasInPickupGeofence && !isNowInPickupGeofence) {
                // Exited pickup geofence
                set({ isInPickupGeofence: false });
                console.log('🚶 Exited pickup geofence');
            }
        }

        // Check dropoff geofence (only relevant after pickup)
        if (deliveryStage === DELIVERY_STAGES.PICKED_UP) {
            const dropoffLocation = activeOrder.location.dropOff.coordinates;
            const distanceToDropoff = get().calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                dropoffLocation.lat,
                dropoffLocation.lng
            );

            const wasInDropoffGeofence = state.isInDropoffGeofence;
            const isNowInDropoffGeofence = distanceToDropoff <= GEOFENCE_RADIUS;

            if (!wasInDropoffGeofence && isNowInDropoffGeofence) {
                // Entered dropoff geofence
                set({ isInDropoffGeofence: true });
                toast.success('📍 You\'ve arrived at delivery location!');
                console.log('🎯 Entered dropoff geofence');
            } else if (wasInDropoffGeofence && !isNowInDropoffGeofence) {
                // Exited dropoff geofence
                set({ isInDropoffGeofence: false });
                console.log('🚶 Exited dropoff geofence');
            }
        }
    },

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * Returns distance in meters
     */
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    },

    // ========== ACTIONS: DELIVERY STATE MACHINE ==========

    /**
     * Accept an order and start delivery
     */
    acceptOrder: async (order) => {
        const state = get();
        const currentTab = state.currentTabContext || 'map';

        try {
            const currentLocation = state.currentLocation;

            if (!currentLocation) {
                toast.error('Unable to get your current location');
                return { success: false, message: 'Location unavailable' };
            }
            // Call API to accept order
            const result = await DriverUtils.acceptOrder(
                order._id,
                {
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                    accuracy: currentLocation.accuracy || 0
                }
            );

            if (!result.success) {
                toast.error(result.message || 'Failed to accept order');
                return { success: false, message: result.message };
            }

            // Update state
            set({
                isOnActiveDelivery: true,
                activeOrderId: order._id,
                activeOrder: order,
                deliveryStage: DELIVERY_STAGES.ACCEPTED,
                deliveryStartTime: Date.now(),
                deliveryAcceptedTime: Date.now(),

                // Clear discovery orders
                tabOrders: {
                    ...state.tabOrders,
                    [currentTab]: {
                        availableOrders: [],
                        orderCount: 0,
                        lastFetchTimestamp: null,
                        isFetchingOrders: false
                    }
                }
            });

            // Start location tracking
            await get().startLocationTracking();

            toast.success(`Order ${order.orderRef} accepted!`);
            console.log('✅ Order accepted:', order.orderRef);

            return { success: true, order };

        } catch (error) {
            console.log('Failed to accept order:', error);
            toast.error('Failed to accept order. Please try again.');
            return { success: false, message: error.message };
        }
    },

    /**
     * Transition to arrived at pickup
     */
    arriveAtPickup: async () => {
        const state = get();

        if (state.deliveryStage !== DELIVERY_STAGES.ACCEPTED) {
            console.log('❌ Cannot arrive at pickup from current stage:', state.deliveryStage);
            return { success: false, message: 'Invalid stage transition' };
        }

        if (!state.isInPickupGeofence) {
            toast.warning('You must be within 500m of pickup location');
            return { success: false, message: 'Not in pickup geofence' };
        }

        try {
            const result = await DriverUtils.updateDeliveryStage(
                state.activeOrderId,
                DELIVERY_STAGES.ARRIVED_PICKUP,
                state.currentLocation
            );

            if (!result.success) {
                toast.error(result.message || 'Failed to update status');
                return { success: false, message: result.message };
            }

            set({ deliveryStage: DELIVERY_STAGES.ARRIVED_PICKUP });
            toast.success('Arrived at pickup location');
            console.log('📍 Arrived at pickup');

            return { success: true };

        } catch (error) {
            console.log('Failed to arrive at pickup:', error);
            toast.error('Failed to update status');
            return { success: false, message: error.message };
        }
    },

    /**
     * Confirm package pickup
     */
    confirmPickup: async (verificationData) => {
        const state = get();

        if (state.deliveryStage !== DELIVERY_STAGES.ARRIVED_PICKUP) {
            console.log('❌ Cannot confirm pickup from current stage:', state.deliveryStage);
            return { success: false, message: 'Invalid stage transition' };
        }

        try {
            const result = await DriverUtils.confirmPickup(
                state.activeOrderId,
                verificationData,
                state.currentLocation
            );

            if (!result.success) {
                toast.error(result.message || 'Failed to confirm pickup');
                return { success: false, message: result.message };
            }

            set({
                deliveryStage: DELIVERY_STAGES.PICKED_UP,
                pickupVerification: {
                    ...verificationData,
                    isVerified: true,
                    timestamp: Date.now()
                },
                isInPickupGeofence: false // Reset geofence
            });

            toast.success('Package pickup confirmed!');
            console.log('✅ Pickup confirmed');

            return { success: true };

        } catch (error) {
            console.log('Failed to confirm pickup:', error);
            toast.error('Failed to confirm pickup');
            return { success: false, message: error.message };
        }
    },

    /**
     * Transition to arrived at dropoff
     */
    arriveAtDropoff: async () => {
        const state = get();

        if (state.deliveryStage !== DELIVERY_STAGES.PICKED_UP) {
            console.log('❌ Cannot arrive at dropoff from current stage:', state.deliveryStage);
            return { success: false, message: 'Invalid stage transition' };
        }

        if (!state.isInDropoffGeofence) {
            toast.warning('You must be within 500m of delivery location');
            return { success: false, message: 'Not in dropoff geofence' };
        }

        try {
            const result = await DriverUtils.updateDeliveryStage(
                state.activeOrderId,
                DELIVERY_STAGES.ARRIVED_DROPOFF,
                state.currentLocation
            );

            if (!result.success) {
                toast.error(result.message || 'Failed to update status');
                return { success: false, message: result.message };
            }

            set({ deliveryStage: DELIVERY_STAGES.ARRIVED_DROPOFF });
            toast.success('Arrived at delivery location');
            console.log('📍 Arrived at dropoff');

            return { success: true };

        } catch (error) {
            console.log('Failed to arrive at dropoff:', error);
            toast.error('Failed to update status');
            return { success: false, message: error.message };
        }
    },

    /**
     * Complete delivery
     */
    completeDelivery: async (verificationData) => {
        const state = get();

        if (state.deliveryStage !== DELIVERY_STAGES.ARRIVED_DROPOFF) {
            console.log('❌ Cannot complete delivery from current stage:', state.deliveryStage);
            return { success: false, message: 'Invalid stage transition' };
        }

        // Verify delivery token
        if (!verificationData.tokenVerified) {
            toast.error('Please verify the delivery token');
            return { success: false, message: 'Token not verified' };
        }

        try {
            const result = await DriverUtils.completeDelivery(
                state.activeOrderId,
                verificationData,
                state.currentLocation
            );

            if (!result.success) {
                toast.error(result.message || 'Failed to complete delivery');
                return { success: false, message: result.message };
            }

            set({
                deliveryStage: DELIVERY_STAGES.DELIVERED,
                deliveryVerification: {
                    ...verificationData,
                    isVerified: true,
                    timestamp: Date.now()
                },
                deliveryCompletedTime: Date.now()
            });

            toast.success('🎉 Delivery completed successfully!');
            console.log('✅ Delivery completed');

            // Transition to completed after a short delay
            setTimeout(() => {
                get().finalizeDelivery();
            }, 2000);

            return { success: true };

        } catch (error) {
            console.log('Failed to complete delivery:', error);
            toast.error('Failed to complete delivery');
            return { success: false, message: error.message };
        }
    },

    /**
     * Finalize delivery and return to discovering state
     */
    finalizeDelivery: () => {
        const state = get();
        const currentTab = state.currentTabContext || 'map';

        get().stopLocationTracking();

        set({
            // Reset delivery state
            isOnActiveDelivery: false,
            activeOrderId: null,
            activeOrder: null,
            deliveryStage: DELIVERY_STAGES.DISCOVERING,
            deliveryStartTime: null,
            deliveryAcceptedTime: null,
            deliveryCompletedTime: null,

            // Reset geofences
            isInPickupGeofence: false,
            isInDropoffGeofence: false,

            // Reset verifications
            pickupVerification: {
                isVerified: false,
                timestamp: null,
                photos: [],
                packageCondition: null,
                weight: null,
                notes: '',
                contactPersonVerified: false
            },
            deliveryVerification: {
                isVerified: false,
                timestamp: null,
                deliveryToken: null,
                tokenVerified: false,
                photos: [],
                recipientName: '',
                recipientSignature: null,
                notes: ''
            },

            // Reset navigation
            navigationData: {
                isNavigating: false,
                targetLocation: null,
                routePolyline: null,
                estimatedDistance: null,
                estimatedDuration: null,
                lastETAUpdate: null
            },

            // Reset messages and issues
            messages: [],
            lastMessageTimestamp: null,
            issueReported: false,
            issueDetails: null,
            sosActivated: false,

            locationHistory: []
        });

        // Fetch orders for current tab
        get().fetchAvailableOrders(null, false, currentTab);

        console.log('🔄 Delivery finalized, returned to discovering');
    },

    /**
     * Cancel delivery (only before pickup)
     */
    cancelDelivery: async (reason, description) => {
        const state = get();

        // Cannot cancel after pickup
        if (state.deliveryStage === DELIVERY_STAGES.PICKED_UP ||
            state.deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) {
            toast.error('Cannot cancel after pickup. Please contact support.');
            return { success: false, message: 'Cannot cancel after pickup' };
        }

        try {
            const result = await DriverUtils.cancelDelivery(
                state.activeOrderId,
                reason,
                description,
                state.currentLocation,
                state.deliveryStage
            );

            if (!result.success) {
                toast.error(result.message || 'Failed to cancel delivery');
                return { success: false, message: result.message };
            }

            set({ deliveryStage: DELIVERY_STAGES.CANCELLED });
            toast.info('Delivery cancelled');
            console.log('❌ Delivery cancelled:', reason);

            // Return to discovering after short delay
            setTimeout(() => {
                get().finalizeDelivery();
            }, 1500);

            return { success: true };

        } catch (error) {
            console.log('Failed to cancel delivery:', error);
            toast.error('Failed to cancel delivery');
            return { success: false, message: error.message };
        }
    },

    // ========== ACTIONS: NAVIGATION ==========

    /**
     * Start navigation to pickup or dropoff
     */
    startNavigation: (target) => {
        const state = get();
        const { activeOrder, currentLocation } = state;

        if (!activeOrder || !currentLocation) {
            toast.error('Cannot start navigation');
            return;
        }

        const targetLocation = target === 'pickup'
            ? activeOrder.location.pickUp.coordinates
            : activeOrder.location.dropOff.coordinates;

        set({
            navigationData: {
                isNavigating: true,
                targetLocation: target,
                routePolyline: null, // Will be updated by routing service
                estimatedDistance: null,
                estimatedDuration: null,
                lastETAUpdate: Date.now()
            }
        });

        // Restart location tracking with high frequency
        get().stopLocationTracking();
        get().startLocationTracking();

        toast.success(`Navigation started to ${target}`);
        console.log(`🧭 Navigation started to ${target}`);
    },

    /**
     * Stop navigation
     */
    stopNavigation: () => {
        set({
            navigationData: {
                isNavigating: false,
                targetLocation: null,
                routePolyline: null,
                estimatedDistance: null,
                estimatedDuration: null,
                lastETAUpdate: null
            }
        });

        // Restart location tracking with normal frequency
        get().stopLocationTracking();
        get().startLocationTracking();

        console.log('🛑 Navigation stopped');
    },

    /**
     * Update ETA based on current location
     */
    updateETA: async (currentLocation) => {
        const state = get();
        const { navigationData, activeOrder } = state;

        if (!navigationData.isNavigating || !activeOrder) return;

        const targetCoords = navigationData.targetLocation === 'pickup'
            ? activeOrder.location.pickUp.coordinates
            : activeOrder.location.dropOff.coordinates;

        try {
            // Calculate distance
            const distance = get().calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                targetCoords.lat,
                targetCoords.lng
            );

            // Estimate duration (assuming average speed of 40 km/h in city)
            const estimatedDuration = (distance / 1000) / 40 * 60; // in minutes

            set({
                navigationData: {
                    ...state.navigationData,
                    estimatedDistance: (distance / 1000).toFixed(1), // in km
                    estimatedDuration: Math.ceil(estimatedDuration),
                    lastETAUpdate: Date.now()
                }
            });

        } catch (error) {
            console.log('Failed to update ETA:', error);
        }
    },

    // ========== ACTIONS: SCAN SETTINGS ==========

    updateScanSettings: (newSettings) => {
        set((state) => ({
            scanSettings: { ...state.scanSettings, ...newSettings }
        }));
        console.log('⚙️ Scan settings updated:', newSettings);
    },

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

    fetchAvailableOrders: async (location = null, silent = false, tab = null) => {
        const state = get();
        const targetTab = tab || state.currentTabContext || 'map';
        const targetLocation = location || state.currentLocation;

        if (!targetLocation) {
            console.log(`⚠️ No location available for fetching orders (tab: ${targetTab})`);
            return { success: false, message: 'Location unavailable' };
        }

        set({
            tabOrders: {
                ...state.tabOrders,
                [targetTab]: {
                    ...state.tabOrders[targetTab],
                    isFetchingOrders: !silent
                }
            }
        });

        try {
            const { scanSettings } = state;

            const queryParams = {
                lat: targetLocation.lat,
                lng: targetLocation.lng,
                area: scanSettings.area,
                radius: scanSettings.area === 'current' ? scanSettings.radius : null,
                vehicleFilter: scanSettings.vehicleFilter.length > 0 ? scanSettings.vehicleFilter : null,
                priorityFilter: scanSettings.priorityFilter,
                maxDistance: scanSettings.maxDistance,
                tabContext: targetTab
            };

            console.log(`📡 Fetching orders for tab: ${targetTab}`, queryParams);

            const response = await DriverUtils.getAvailableOrders(queryParams);

            set({
                tabOrders: {
                    ...state.tabOrders,
                    [targetTab]: {
                        availableOrders: response.orders || [],
                        orderCount: response.count || 0,
                        lastFetchTimestamp: Date.now(),
                        isFetchingOrders: false
                    }
                }
            });

            console.log(`✅ Orders fetched for ${targetTab}: ${response.count || 0} orders`);

            return { success: true, orders: response.orders || [], count: response.count || 0 };
        } catch (error) {
            console.log(`❌ Failed to fetch orders for ${targetTab}:`, error);

            set({
                tabOrders: {
                    ...state.tabOrders,
                    [targetTab]: {
                        ...state.tabOrders[targetTab],
                        isFetchingOrders: false,
                        orderCount: 0,
                        availableOrders: []
                    }
                }
            });

            return { success: false, message: error.message };
        }
    },

    // ========== UTILITY ACTIONS ==========

    clearOrders: () => {
        const state = get();
        const currentTab = state.currentTabContext || 'map';

        set(state => ({
            tabOrders: {
                ...state.tabOrders,
                [currentTab]: {
                    availableOrders: [],
                    orderCount: 0,
                    lastFetchTimestamp: null,
                    isFetchingOrders: false
                }
            }
        }));
    },

    clearTabOrders: (tab = 'map') => {
        set(state => ({
            tabOrders: {
                ...state.tabOrders,
                [tab]: {
                    availableOrders: [],
                    orderCount: 0,
                    lastFetchTimestamp: null,
                    isFetchingOrders: false
                }
            }
        }));
    },

    getTabOrders: (tab) => {
        const state = get();
        return state.tabOrders[tab] || {
            availableOrders: [],
            orderCount: 0,
            lastFetchTimestamp: null,
            isFetchingOrders: false
        };
    },

    // ========== ACTIONS: COMMUNICATION ==========

    /**
     * Send message to client
     */
    sendMessage: async (message, type = 'text') => {
        const state = get();

        if (!state.activeOrderId) {
            console.log('❌ No active order to send message');
            return { success: false };
        }

        try {
            const result = await DriverUtils.sendMessage(
                state.activeOrderId,
                message,
                type,
                state.deliveryStage
            );

            if (result.success) {
                const newMessage = {
                    id: Date.now().toString(),
                    sender: 'driver',
                    message,
                    type,
                    timestamp: Date.now(),
                    delivered: true
                };

                set({
                    messages: [...state.messages, newMessage],
                    lastMessageTimestamp: Date.now()
                });

                console.log('💬 Message sent:', message);
            }

            return result;

        } catch (error) {
            console.log('Failed to send message:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Receive message from client
     */
    receiveMessage: (messageData) => {
        const state = get();

        const newMessage = {
            id: messageData.id || Date.now().toString(),
            sender: 'client',
            message: messageData.message,
            type: messageData.type || 'text',
            timestamp: messageData.timestamp || Date.now(),
            read: false
        };

        set({
            messages: [...state.messages, newMessage],
            lastMessageTimestamp: Date.now()
        });

        // Show notification
        toast.info('New message from client');
        console.log('💬 Message received:', messageData.message);
    },

    /**
     * Mark messages as read
     */
    markMessagesAsRead: () => {
        const state = get();

        const updatedMessages = state.messages.map(msg => ({
            ...msg,
            read: true
        }));

        set({ messages: updatedMessages });
    },

    /**
     * Send automated status update to client
     */
    sendAutomatedUpdate: async (updateType) => {
        const state = get();

        const updates = {
            'on_way_to_pickup': `I'm on my way to the pickup location. ETA: ${state.navigationData.estimatedDuration || '--'} minutes.`,
            'arrived_pickup': `I've arrived at the pickup location.`,
            'package_collected': `Package collected successfully! Now heading to delivery location.`,
            'on_way_to_delivery': `I'm on my way to deliver your package. ETA: ${state.navigationData.estimatedDuration || '--'} minutes.`,
            'arrived_delivery': `I've arrived at the delivery location.`,
            'delivered': `Your package has been delivered successfully! 🎉`
        };

        const message = updates[updateType];
        if (message) {
            await get().sendMessage(message, 'automated');
        }
    },

    // ========== ACTIONS: EMERGENCY & ISSUES ==========

    /**
     * Report an issue
     */
    reportIssue: async (issueType, description, severity = 'medium') => {
        const state = get();

        if (!state.activeOrderId) {
            console.log('❌ No active order to report issue');
            return { success: false };
        }

        try {
            const result = await DriverUtils.reportIssue(
                state.activeOrderId,
                issueType,
                description,
                severity,
                state.deliveryStage,
                state.currentLocation
            );

            if (result.success) {
                set({
                    issueReported: true,
                    issueDetails: {
                        type: issueType,
                        description,
                        severity,
                        timestamp: Date.now(),
                        resolved: false
                    }
                });

                toast.info('Issue reported. Support will contact you shortly.');
                console.log('⚠️ Issue reported:', issueType);
            }

            return result;

        } catch (error) {
            console.log('Failed to report issue:', error);
            toast.error('Failed to report issue');
            return { success: false, message: error.message };
        }
    },

    /**
     * Activate SOS emergency mode
     */
    activateSOS: async () => {
        const state = get();

        if (state.sosActivated) {
            console.log('⚠️ SOS already activated');
            return;
        }

        try {
            const result = await DriverUtils.activateSOS(
                state.activeOrderId,
                state.currentLocation,
                state.deliveryStage
            );

            if (result.success) {
                set({ sosActivated: true });

                toast.error('🆘 SOS ACTIVATED - Support has been notified');
                console.log('🆘 SOS ACTIVATED');

                // TODO: Trigger additional emergency protocols
                // - Share location with emergency contacts
                // - Auto-call emergency services (if configured)
                // - Send push notifications to admin
            }

            return result;

        } catch (error) {
            console.log('Failed to activate SOS:', error);
            toast.error('Failed to activate SOS. Please call support directly.');
            return { success: false };
        }
    },

    /**
     * Deactivate SOS
     */
    deactivateSOS: async () => {
        const state = get();

        if (!state.sosActivated) return;

        try {
            const result = await DriverUtils.deactivateSOS(state.activeOrderId);

            if (result.success) {
                set({ sosActivated: false });
                toast.success('SOS deactivated');
                console.log('✅ SOS deactivated');
            }

            return result;

        } catch (error) {
            console.log('Failed to deactivate SOS:', error);
            return { success: false };
        }
    },

    // ========== ACTIONS: VERIFICATION HELPERS ==========

    /**
     * Verify delivery token
     */
    verifyDeliveryToken: async (inputToken) => {
        const state = get();

        if (!state.activeOrder) {
            return { success: false, message: 'No active order' };
        }

        try {
            const result = await DriverUtils.verifyDeliveryToken(
                state.activeOrderId,
                inputToken
            );

            if (result.success) {
                set({
                    deliveryVerification: {
                        ...state.deliveryVerification,
                        deliveryToken: inputToken,
                        tokenVerified: true
                    }
                });

                toast.success('✅ Token verified!');
                console.log('✅ Delivery token verified');
            } else {
                toast.error('❌ Invalid token. Please try again.');
            }

            return result;

        } catch (error) {
            console.log('Failed to verify token:', error);
            toast.error('Failed to verify token');
            return { success: false, message: error.message };
        }
    },

    /**
     * Update pickup verification data
     */
    updatePickupVerification: (field, value) => {
        const state = get();

        set({
            pickupVerification: {
                ...state.pickupVerification,
                [field]: value
            }
        });
    },

    /**
     * Update delivery verification data
     */
    updateDeliveryVerification: (field, value) => {
        const state = get();

        set({
            deliveryVerification: {
                ...state.deliveryVerification,
                [field]: value
            }
        });
    },

    // ========== ACTIONS: OFFLINE QUEUE MANAGEMENT ==========

    /**
     * Queue action for when offline
     */
    queueOfflineAction: (action) => {
        const state = get();
        const offlineQueue = state.offlineQueue || [];

        set({
            offlineQueue: [...offlineQueue, {
                id: Date.now().toString(),
                action,
                timestamp: Date.now(),
                retries: 0
            }]
        });

        console.log('📦 Action queued for offline sync:', action.type);
    },

    /**
     * Process offline queue when connection restored
     */
    processOfflineQueue: async () => {
        const state = get();
        const offlineQueue = state.offlineQueue || [];

        if (offlineQueue.length === 0) return;

        console.log(`🔄 Processing ${offlineQueue.length} offline actions...`);

        for (const queuedAction of offlineQueue) {
            try {
                // TODO: Process each queued action
                console.log('Processing:', queuedAction.action.type);

                // Remove from queue after successful processing
                set({
                    offlineQueue: state.offlineQueue.filter(a => a.id !== queuedAction.id)
                });

            } catch (error) {
                console.log('Failed to process queued action:', error);

                // Increment retry count
                const updatedQueue = state.offlineQueue.map(a =>
                    a.id === queuedAction.id
                        ? { ...a, retries: a.retries + 1 }
                        : a
                );

                set({ offlineQueue: updatedQueue });
            }
        }

        toast.success('Offline actions synced');
        console.log('✅ Offline queue processed');
    },

    // ========== STORE RESET ==========

    /**
     * Reset entire store (logout, etc.)
     */
    resetStore: () => {
        const state = get();

        // Stop all tracking
        state.stopLocationTracking();

        // Clear geofence interval
        if (state.geofenceCheckInterval) {
            clearInterval(state.geofenceCheckInterval);
        }

        // Reset all state to initial values
        set({
            // Location state
            currentLocation: null,
            locationHistory: [],
            isTrackingLocation: false,
            locationFailureCount: 0,
            lastLocationUpdate: null,
            locationSubscription: null,

            // Active delivery state
            isOnActiveDelivery: false,
            activeOrderId: null,
            activeOrder: null,

            // Delivery state machine
            deliveryStage: DELIVERY_STAGES.DISCOVERING,
            deliveryStartTime: null,
            deliveryAcceptedTime: null,
            deliveryCompletedTime: null,

            // Geofence
            isInPickupGeofence: false,
            isInDropoffGeofence: false,
            geofenceCheckInterval: null,

            // Verification
            pickupVerification: {
                isVerified: false,
                timestamp: null,
                photos: [],
                packageCondition: null,
                weight: null,
                notes: '',
                contactPersonVerified: false
            },
            deliveryVerification: {
                isVerified: false,
                timestamp: null,
                deliveryToken: null,
                tokenVerified: false,
                photos: [],
                recipientName: '',
                recipientSignature: null,
                notes: ''
            },

            // Navigation
            navigationData: {
                isNavigating: false,
                targetLocation: null,
                routePolyline: null,
                estimatedDistance: null,
                estimatedDuration: null,
                lastETAUpdate: null
            },

            // Communication
            messages: [],
            lastMessageTimestamp: null,

            // Emergency
            issueReported: false,
            issueDetails: null,
            sosActivated: false,

            // Offline queue
            offlineQueue: [],

            // Scan settings
            scanSettings: {
                area: 'territorial',
                radius: 25,
                vehicleFilter: [],
                priorityFilter: 'all',
                maxDistance: 40
            },

            // Tab context
            currentTabContext: 'map',

            // Tab orders
            tabOrders: {
                map: {
                    availableOrders: [],
                    orderCount: 0,
                    lastFetchTimestamp: null,
                    isFetchingOrders: false
                },
                orders: {
                    availableOrders: [],
                    orderCount: 0,
                    lastFetchTimestamp: null,
                    isFetchingOrders: false
                }
            }
        });

        console.log('🔄 Logistic store reset');
    },

    // ========== HELPER GETTERS ==========

    /**
     * Get current delivery stage display info
     */
    getStageInfo: () => {
        const state = get();
        const stageInfo = {
            [DELIVERY_STAGES.DISCOVERING]: {
                title: 'Discovering Orders',
                description: 'Browse and accept delivery requests',
                icon: 'search',
                color: '#6366F1'
            },
            [DELIVERY_STAGES.ACCEPTED]: {
                title: 'Heading to Pickup',
                description: 'Navigate to pickup location',
                icon: 'navigate',
                color: '#F59E0B'
            },
            [DELIVERY_STAGES.ARRIVED_PICKUP]: {
                title: 'At Pickup Location',
                description: 'Verify and collect package',
                icon: 'location',
                color: '#10B981'
            },
            [DELIVERY_STAGES.PICKED_UP]: {
                title: 'Package Collected',
                description: 'Heading to delivery location',
                icon: 'cube',
                color: '#8B5CF6'
            },
            [DELIVERY_STAGES.ARRIVED_DROPOFF]: {
                title: 'At Delivery Location',
                description: 'Complete delivery handover',
                icon: 'checkmark-circle',
                color: '#EF4444'
            },
            [DELIVERY_STAGES.DELIVERED]: {
                title: 'Delivery Complete',
                description: 'Package delivered successfully',
                icon: 'checkmark-done',
                color: '#10B981'
            },
            [DELIVERY_STAGES.COMPLETED]: {
                title: 'Completed',
                description: 'Returning to discovery mode',
                icon: 'checkmark-done-circle',
                color: '#10B981'
            },
            [DELIVERY_STAGES.CANCELLED]: {
                title: 'Delivery Cancelled',
                description: 'Order has been cancelled',
                icon: 'close-circle',
                color: '#EF4444'
            }
        };

        return stageInfo[state.deliveryStage] || stageInfo[DELIVERY_STAGES.DISCOVERING];
    },

    /**
     * Check if action is allowed in current stage
     */
    canPerformAction: (action) => {
        const state = get();
        const { deliveryStage } = state;

        const allowedActions = {
            [DELIVERY_STAGES.DISCOVERING]: ['accept_order'],
            [DELIVERY_STAGES.ACCEPTED]: ['arrive_at_pickup', 'start_navigation', 'cancel_delivery'],
            [DELIVERY_STAGES.ARRIVED_PICKUP]: ['confirm_pickup', 'cancel_delivery'],
            [DELIVERY_STAGES.PICKED_UP]: ['arrive_at_dropoff', 'start_navigation'],
            [DELIVERY_STAGES.ARRIVED_DROPOFF]: ['complete_delivery'],
            [DELIVERY_STAGES.DELIVERED]: [],
            [DELIVERY_STAGES.COMPLETED]: [],
            [DELIVERY_STAGES.CANCELLED]: []
        };

        return allowedActions[deliveryStage]?.includes(action) || false;
    },

    /**
     * Get delivery duration in minutes
     */
    getDeliveryDuration: () => {
        const state = get();

        if (!state.deliveryStartTime) return 0;

        const endTime = state.deliveryCompletedTime || Date.now();
        const durationMs = endTime - state.deliveryStartTime;

        return Math.floor(durationMs / 60000); // Convert to minutes
    },

    /**
     * Get delivery progress percentage
     */
    getDeliveryProgress: () => {
        const state = get();
        const stageProgress = {
            [DELIVERY_STAGES.DISCOVERING]: 0,
            [DELIVERY_STAGES.ACCEPTED]: 20,
            [DELIVERY_STAGES.ARRIVED_PICKUP]: 40,
            [DELIVERY_STAGES.PICKED_UP]: 60,
            [DELIVERY_STAGES.ARRIVED_DROPOFF]: 80,
            [DELIVERY_STAGES.DELIVERED]: 100,
            [DELIVERY_STAGES.COMPLETED]: 100,
            [DELIVERY_STAGES.CANCELLED]: 0
        };

        return stageProgress[state.deliveryStage] || 0;
    }
}));

// Export delivery stages for use in components
export { DELIVERY_STAGES, GEOFENCE_RADIUS };
export default useLogisticStore;