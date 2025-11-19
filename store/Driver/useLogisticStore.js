// store/Driver/useLogisticStore.js
import { create } from 'zustand';
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import { toast } from 'sonner-native';
import DriverUtils from '../../utils/DriverUtilities';
import * as Haptics from "expo-haptics";
import SessionManager from "../../lib/SessionManager";

/**
 * DELIVERY STAGE DEFINITIONS
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

/**
 * Safely extract coordinates from various formats
 */
const extractCoordinates = (location) => {
    if (!location) return null;

    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
        return { lat: location.lat, lng: location.lng };
    }

    if (location.coordinates) {
        const coords = location.coordinates;

        if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
            return { lat: coords.lat, lng: coords.lng };
        }

        if (coords.type === 'Point' && Array.isArray(coords.coordinates) && coords.coordinates.length === 2) {
            const [lng, lat] = coords.coordinates;
            if (typeof lat === 'number' && typeof lng === 'number') {
                return { lat, lng };
            }
        }

        if (Array.isArray(coords.coordinates) && coords.coordinates.length === 2) {
            const [lng, lat] = coords.coordinates;
            if (typeof lat === 'number' && typeof lng === 'number') {
                return { lat, lng };
            }
        }
    }

    console.warn('⚠️ Could not extract coordinates from:', location);
    return null;
};

const useLogisticStore = create(
    persist(
        (set, get) => ({
            // ========== DRIVER LOCATION STATE ==========
            currentLocation: null,
            locationHistory: [],
            isTrackingLocation: false,
            locationFailureCount: 0,
            lastLocationUpdate: null,
            locationWatch: null,

            // ========== ACTIVE DELIVERY STATE ==========
            isOnActiveDelivery: false,
            activeOrderId: null,
            activeOrder: null,

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
                photos: [],
                video: null,
                packageCondition: null,
                weight: null,
                notes: '',
                contactPersonVerified: false
            },

            // Delivery verification state
            deliveryVerification: {
                isVerified: false,
                timestamp: null,
                deliveryToken: null,
                tokenVerified: false,
                photos: [],
                video: null,
                recipientName: '',
                recipientSignature: null,
                notes: ''
            },

            // Navigation data
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

            // ========== MAP ORDERS STATE (Simplified - No tabs) ==========
            tabOrders: {
                map: {
                    availableOrders: [],
                    orderCount: 0,
                    lastFetchTimestamp: null,
                    isFetchingOrders: false
                }
            },

            locationSubscription: null,
            offlineQueue: [],

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
                    set({ isTrackingLocation: false, locationFailureCount: state.locationFailureCount + 1 });
                }
            },

            getLocationTrackingConfig: () => {
                const state = get();
                const { deliveryStage, navigationData } = state;

                if (navigationData.isNavigating) {
                    return {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000,
                        distanceInterval: 10
                    };
                }

                if (deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.PICKED_UP) {
                    return {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 30000,
                        distanceInterval: 20
                    };
                }

                if (deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) {
                    return {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 120000,
                        distanceInterval: 50
                    };
                }

                return {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 60000,
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

                if (state.locationWatch) {
                    state.locationWatch.remove();
                    set({ locationWatch: null });
                }

                if (state.geofenceCheckInterval) {
                    clearInterval(state.geofenceCheckInterval);
                    set({ geofenceCheckInterval: null });
                }
            },

            updateLocation: (coords) => {
                const state = get();

                if (!coords?.latitude || !coords?.longitude) {
                    console.warn('⚠️ Invalid location coords:', coords);
                    get().handleLocationFailure();
                    return;
                }

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

                console.log('📍 Location updated:', {
                    lat: newLocation.lat.toFixed(6),
                    lng: newLocation.lng.toFixed(6),
                    isOnDelivery: state.isOnActiveDelivery,
                    isNavigating: state.navigationData?.isNavigating
                });

                if (state.isOnActiveDelivery) {
                    if (state.activeOrderId) {
                        get().syncLocationToBackend(state.activeOrderId, newLocation);
                        get().checkGeofences(newLocation);

                        if (state.navigationData?.isNavigating) {
                            console.log('🔄 Updating ETA...');
                            get().updateETA(newLocation);
                        }
                    }
                    return;
                }

                // Discovery mode - update history and fetch orders
                const updatedHistory = [...state.locationHistory, newLocation].slice(-50);
                set({ locationHistory: updatedHistory });

                // Always fetch for map (no tab context needed)
                get().fetchAvailableOrders(newLocation, true);
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

            checkGeofences: (currentLocation) => {
                const state = get();
                const { activeOrder, deliveryStage } = state;

                if (!activeOrder || !currentLocation) return;

                if (deliveryStage === DELIVERY_STAGES.ACCEPTED) {
                    const pickupLocation = extractCoordinates(activeOrder.location?.pickUp);

                    if (!pickupLocation) {
                        console.warn('⚠️ Could not extract pickup coordinates from:', activeOrder.location?.pickUp);
                        return;
                    }

                    const distanceToPickup = get().calculateDistance(
                        currentLocation.lat,
                        currentLocation.lng,
                        pickupLocation.lat,
                        pickupLocation.lng
                    );

                    console.log('📍 Pickup Geofence Check:', {
                        deliveryStage,
                        currentLocation: { lat: currentLocation.lat, lng: currentLocation.lng },
                        pickupLocation,
                        distanceToPickup: `${distanceToPickup.toFixed(0)}m`,
                        geofenceRadius: `${GEOFENCE_RADIUS}m`,
                        isInside: distanceToPickup <= GEOFENCE_RADIUS
                    });

                    const wasInPickupGeofence = state.isInPickupGeofence;
                    const isNowInPickupGeofence = distanceToPickup <= GEOFENCE_RADIUS;

                    // Proximity warnings
                    if (distanceToPickup <= 25 && distanceToPickup > 15 && !state.proximityWarning25m) {
                        toast.info('📍 Getting close! 25m to pickup location');
                        set({ proximityWarning25m: true });
                    } else if (distanceToPickup <= 15 && distanceToPickup > 10 && !state.proximityWarning15m) {
                        toast.info('📍 Almost there! 15m to pickup location');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        set({ proximityWarning15m: true });
                    } else if (distanceToPickup <= 10 && !state.proximityWarning10m) {
                        toast.success('🎯 You\'re very close! 10m to pickup');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        set({ proximityWarning10m: true });
                    }

                    // Geofence entry/exit
                    if (!wasInPickupGeofence && isNowInPickupGeofence) {
                        set({
                            isInPickupGeofence: true,
                            proximityWarning25m: false,
                            proximityWarning15m: false,
                            proximityWarning10m: false
                        });
                        toast.success('📍 You\'ve arrived at pickup location!');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        console.log('🎯 Entered pickup geofence');

                        get().notifyBackendProximity?.('pickup', 'entered', distanceToPickup);
                    } else if (wasInPickupGeofence && !isNowInPickupGeofence) {
                        set({
                            isInPickupGeofence: false,
                            proximityWarning25m: false,
                            proximityWarning15m: false,
                            proximityWarning10m: false
                        });
                        console.log('🚶 Exited pickup geofence');

                        get().notifyBackendProximity?.('pickup', 'exited', distanceToPickup);
                    }
                }

                if (deliveryStage === DELIVERY_STAGES.PICKED_UP) {
                    const dropoffLocation = extractCoordinates(activeOrder.location?.dropOff);

                    if (!dropoffLocation) {
                        console.warn('⚠️ Could not extract dropoff coordinates from:', activeOrder.location?.dropOff);
                        return;
                    }

                    const distanceToDropoff = get().calculateDistance(
                        currentLocation.lat,
                        currentLocation.lng,
                        dropoffLocation.lat,
                        dropoffLocation.lng
                    );

                    console.log('📍 Dropoff Geofence Check:', {
                        deliveryStage,
                        currentLocation: { lat: currentLocation.lat, lng: currentLocation.lng },
                        dropoffLocation,
                        distanceToDropoff: `${distanceToDropoff.toFixed(0)}m`,
                        geofenceRadius: `${GEOFENCE_RADIUS}m`,
                        isInside: distanceToDropoff <= GEOFENCE_RADIUS
                    });

                    const wasInDropoffGeofence = state.isInDropoffGeofence;
                    const isNowInDropoffGeofence = distanceToDropoff <= GEOFENCE_RADIUS;

                    // Proximity warnings for dropoff
                    if (distanceToDropoff <= 25 && distanceToDropoff > 15 && !state.proximityWarningDropoff25m) {
                        toast.info('📍 Approaching delivery location! 25m away');
                        set({ proximityWarningDropoff25m: true });
                    } else if (distanceToDropoff <= 15 && distanceToDropoff > 10 && !state.proximityWarningDropoff15m) {
                        toast.info('📍 Almost at delivery! 15m away');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        set({ proximityWarningDropoff15m: true });
                    } else if (distanceToDropoff <= 10 && !state.proximityWarningDropoff10m) {
                        toast.success('🎯 Delivery location reached! 10m away');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        set({ proximityWarningDropoff10m: true });
                    }

                    // Geofence entry/exit
                    if (!wasInDropoffGeofence && isNowInDropoffGeofence) {
                        set({
                            isInDropoffGeofence: true,
                            proximityWarningDropoff25m: false,
                            proximityWarningDropoff15m: false,
                            proximityWarningDropoff10m: false
                        });
                        toast.success('📍 You\'ve arrived at delivery location!');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        console.log('🎯 Entered dropoff geofence');

                        get().notifyBackendProximity?.('dropoff', 'entered', distanceToDropoff);
                    } else if (wasInDropoffGeofence && !isNowInDropoffGeofence) {
                        set({
                            isInDropoffGeofence: false,
                            proximityWarningDropoff25m: false,
                            proximityWarningDropoff15m: false,
                            proximityWarningDropoff10m: false
                        });
                        console.log('🚶 Exited dropoff geofence');

                        get().notifyBackendProximity?.('dropoff', 'exited', distanceToDropoff);
                    }
                }
            },

            calculateDistance: (lat1, lon1, lat2, lon2) => {
                const R = 6371e3;
                const φ1 = (lat1 * Math.PI) / 180;
                const φ2 = (lat2 * Math.PI) / 180;
                const Δφ = ((lat2 - lat1) * Math.PI) / 180;
                const Δλ = ((lon2 - lon1) * Math.PI) / 180;

                const a =
                    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                return R * c;
            },

            // ========== ACTIONS: DELIVERY STATE MACHINE ==========

            acceptOrder: async (order) => {
                const state = get();

                try {
                    const currentLocation = state.currentLocation;

                    if (!currentLocation) {
                        toast.error('Unable to get your current location');
                        return { success: false, message: 'Location unavailable' };
                    }

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

                    set({
                        isOnActiveDelivery: true,
                        activeOrderId: order._id,
                        activeOrder: order,
                        deliveryStage: DELIVERY_STAGES.ACCEPTED,
                        deliveryStartTime: Date.now(),
                        deliveryAcceptedTime: Date.now(),
                    });

                    const { user } = result;
                    await get().startLocationTracking();
                    return { success: true, order, user };
                } catch (error) {
                    console.log('Failed to accept order:', error);
                    return { success: false, message: error.message };
                }
            },

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
                    const payload = {
                        orderId: state.activeOrderId,
                        stage: DELIVERY_STAGES.ARRIVED_PICKUP,
                        locationDetails: state.currentLocation
                    }

                    const result = await DriverUtils.arrivePickUp(payload);

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

            confirmPickup: async (verificationData) => {
                const state = get();
                const currentLocation = state.currentLocation;

                if (state.deliveryStage !== DELIVERY_STAGES.ARRIVED_PICKUP) {
                    console.log('❌ Cannot confirm pickup from current stage:', state.deliveryStage);
                    return { success: false, message: 'Invalid stage transition' };
                }

                try {
                    const payload = {
                        orderId: state.activeOrderId,
                        stage: DELIVERY_STAGES.ARRIVED_PICKUP,
                        verificationData,
                        currentLocation
                    }
                    const result = await DriverUtils.confirmPickup(payload);

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
                        isInPickupGeofence: false
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
                    const payload = {
                        orderId: state.activeOrderId,
                        stage: DELIVERY_STAGES.ARRIVED_DROPOFF,
                        locationDetails: state.currentLocation
                    }
                    const result = await DriverUtils.arriveDropOff(payload);

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

            completeDelivery: async (verificationData) => {
                const state = get();

                if (state.deliveryStage !== DELIVERY_STAGES.ARRIVED_DROPOFF) {
                    console.log('❌ Cannot complete delivery from current stage:', state.deliveryStage);
                    return { success: false, message: 'Invalid stage transition' };
                }

                if (!verificationData.tokenVerified) {
                    toast.error('Please verify the delivery token');
                    return { success: false, message: 'Token not verified' };
                }

                try {
                    const payload = {
                        orderId: state.activeOrderId,
                        stage: DELIVERY_STAGES.ARRIVED_DROPOFF,
                        verificationData,
                        locationDetails: state.currentLocation
                    };

                    console.log('📦 Completing delivery:', payload);

                    const result = await DriverUtils.completeDelivery(payload);

                    if (!result.success) {
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

                    console.log('✅ Delivery completed successfully');

                    return {
                        success: true,
                        userData: result.user,
                        nextAction: result.nextAction,
                        earnings: result.earnings
                    };

                } catch (error) {
                    console.log('Failed to complete delivery:', error);
                    toast.error('Failed to complete delivery');
                    return { success: false, message: error.message };
                }
            },

            finalizeDelivery: () => {
                console.log('🔄 Finalizing delivery and returning to discovery...');

                get().stopLocationTracking();

                set({
                    isOnActiveDelivery: false,
                    activeOrderId: null,
                    activeOrder: null,
                    deliveryStage: DELIVERY_STAGES.DISCOVERING,
                    deliveryStartTime: null,
                    deliveryAcceptedTime: null,
                    deliveryCompletedTime: null,
                    isInPickupGeofence: false,
                    isInDropoffGeofence: false,
                    proximityWarning25m: false,
                    proximityWarning15m: false,
                    proximityWarning10m: false,
                    proximityWarningDropoff25m: false,
                    proximityWarningDropoff15m: false,
                    proximityWarningDropoff10m: false,
                    pickupVerification: {
                        isVerified: false,
                        timestamp: null,
                        photos: [],
                        video: null,
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
                        video: null,
                        recipientName: '',
                        recipientSignature: null,
                        notes: ''
                    },
                    navigationData: {
                        isNavigating: false,
                        targetLocation: null,
                        routePolyline: null,
                        estimatedDistance: null,
                        estimatedDuration: null,
                        lastETAUpdate: null
                    },
                    messages: [],
                    lastMessageTimestamp: null,
                    issueReported: false,
                    issueDetails: null,
                    sosActivated: false,
                    locationHistory: []
                });

                console.log('✅ Delivery finalized, returned to discovering');
            },

            cancelDelivery: async (reason, description) => {
                const state = get();

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

            startNavigation: (target) => {
                const state = get();
                const { activeOrder, currentLocation } = state;

                if (!activeOrder || !currentLocation) {
                    toast.error('Cannot start navigation');
                    return;
                }

                const targetCoords = target === 'pickup'
                    ? extractCoordinates(activeOrder.location?.pickUp)
                    : extractCoordinates(activeOrder.location?.dropOff);

                if (!targetCoords) {
                    console.warn('⚠️ Cannot start navigation - invalid target coordinates');
                    return;
                }

                const distance = get().calculateDistance(
                    currentLocation.lat,
                    currentLocation.lng,
                    targetCoords.lat,
                    targetCoords.lng
                );

                const distanceInKm = distance / 1000;
                const estimatedDuration = Math.max(1, Math.ceil((distanceInKm / 40) * 60));
                const validDistance = Math.max(0.1, distanceInKm);

                set({
                    navigationData: {
                        isNavigating: true,
                        targetLocation: target,
                        routePolyline: null,
                        estimatedDistance: validDistance.toFixed(1),
                        estimatedDuration: estimatedDuration,
                        lastETAUpdate: Date.now()
                    }
                });

                get().stopLocationTracking();
                get().startLocationTracking();

                toast.success(`Navigation started to ${target}`);
                console.log(`🧭 Navigation started to ${target}`, {
                    distance: `${validDistance.toFixed(1)} km`,
                    duration: `${estimatedDuration} min`
                });
            },

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

                get().stopLocationTracking();
                get().startLocationTracking();

                console.log('🛑 Navigation stopped');
            },

            updateETA: async (currentLocation) => {
                const state = get();
                const { navigationData, activeOrder } = state;

                if (!navigationData.isNavigating || !activeOrder) return;

                const targetCoords = navigationData.targetLocation === 'pickup'
                    ? extractCoordinates(activeOrder.location?.pickUp)
                    : extractCoordinates(activeOrder.location?.dropOff);

                if (!targetCoords) {
                    console.warn('⚠️ Could not extract target coordinates for ETA calculation');
                    return;
                }

                try {
                    const distance = get().calculateDistance(
                        currentLocation.lat,
                        currentLocation.lng,
                        targetCoords.lat,
                        targetCoords.lng
                    );

                    if (isNaN(distance) || distance < 0) {
                        console.warn('⚠️ Invalid distance calculated:', distance);
                        return;
                    }

                    const distanceInKm = distance / 1000;
                    const estimatedDuration = (distanceInKm / 40) * 60;

                    const validDuration = Math.max(1, Math.ceil(estimatedDuration));
                    const validDistance = Math.max(0.1, distanceInKm);

                    set({
                        navigationData: {
                            ...state.navigationData,
                            estimatedDistance: validDistance.toFixed(1),
                            estimatedDuration: validDuration,
                            lastETAUpdate: Date.now()
                        }
                    });

                    console.log('📊 ETA Updated:', {
                        distance: `${validDistance.toFixed(1)} km`,
                        duration: `${validDuration} min`,
                        target: navigationData.targetLocation
                    });

                } catch (error) {
                    console.log('❌ Failed to update ETA:', error);
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

            // ========== ACTIONS: ORDER FETCHING (Simplified - Map Only) ==========

            fetchAvailableOrders: async (location = null, silent = false) => {
                const state = get();
                const targetLocation = location || state.currentLocation;

                if (!targetLocation) {
                    console.log('⚠️ No location available for fetching orders');
                    return { success: false, message: 'Location unavailable' };
                }

                set({
                    tabOrders: {
                        map: {
                            ...state.tabOrders.map,
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
                        maxDistance: scanSettings.maxDistance
                    };

                    console.log('📡 Fetching orders for map', queryParams);

                    const response = await DriverUtils.getAvailableOrders(queryParams);

                    set({
                        tabOrders: {
                            map: {
                                availableOrders: response.orders || [],
                                orderCount: response.count || 0,
                                lastFetchTimestamp: Date.now(),
                                isFetchingOrders: false
                            }
                        }
                    });

                    console.log(`✅ Orders fetched: ${response.count || 0} orders`);

                    return { success: true, orders: response.orders || [], count: response.count || 0 };
                } catch (error) {
                    console.log('❌ Failed to fetch orders:', error);

                    set({
                        tabOrders: {
                            map: {
                                ...state.tabOrders.map,
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
                set(state => ({
                    tabOrders: {
                        map: {
                            availableOrders: [],
                            orderCount: 0,
                            lastFetchTimestamp: null,
                            isFetchingOrders: false
                        }
                    }
                }));
            },

            clearTabOrders: () => {
                set(state => ({
                    tabOrders: {
                        map: {
                            availableOrders: [],
                            orderCount: 0,
                            lastFetchTimestamp: null,
                            isFetchingOrders: false
                        }
                    }
                }));
            },

            // ========== ACTIONS: COMMUNICATION ==========

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

                toast.info('New message from client');
                console.log('💬 Message received:', messageData.message);
            },

            markMessagesAsRead: () => {
                const state = get();

                const updatedMessages = state.messages.map(msg => ({
                    ...msg,
                    read: true
                }));

                set({ messages: updatedMessages });
            },

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
                    }

                    return result;

                } catch (error) {
                    console.log('Failed to activate SOS:', error);
                    toast.error('Failed to activate SOS. Please call support directly.');
                    return { success: false };
                }
            },

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

            verifyDeliveryToken: async (inputToken) => {
                const state = get();

                if (!state.activeOrder) {
                    return { success: false, message: 'No active order' };
                }

                try {
                    const payload = {
                        orderId: state.activeOrderId,
                        deliveryToken: inputToken,
                        stage: state.deliveryStage
                    }

                    const result = await DriverUtils.verifyDeliveryToken(payload);

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

            updatePickupVerification: (field, value) => {
                const state = get();

                set({
                    pickupVerification: {
                        ...state.pickupVerification,
                        [field]: value
                    }
                });
            },

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

            processOfflineQueue: async () => {
                const state = get();
                const offlineQueue = state.offlineQueue || [];

                if (offlineQueue.length === 0) return;

                console.log(`🔄 Processing ${offlineQueue.length} offline actions...`);

                for (const queuedAction of offlineQueue) {
                    try {
                        console.log('Processing:', queuedAction.action.type);

                        set({
                            offlineQueue: state.offlineQueue.filter(a => a.id !== queuedAction.id)
                        });

                    } catch (error) {
                        console.log('Failed to process queued action:', error);

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

            resetStore: () => {
                const state = get();

                state.stopLocationTracking();

                if (state.geofenceCheckInterval) {
                    clearInterval(state.geofenceCheckInterval);
                }

                set({
                    currentLocation: null,
                    locationHistory: [],
                    isTrackingLocation: false,
                    locationFailureCount: 0,
                    lastLocationUpdate: null,
                    locationSubscription: null,
                    isOnActiveDelivery: false,
                    activeOrderId: null,
                    activeOrder: null,
                    deliveryStage: DELIVERY_STAGES.DISCOVERING,
                    deliveryStartTime: null,
                    deliveryAcceptedTime: null,
                    deliveryCompletedTime: null,
                    isInPickupGeofence: false,
                    isInDropoffGeofence: false,
                    geofenceCheckInterval: null,
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
                    navigationData: {
                        isNavigating: false,
                        targetLocation: null,
                        routePolyline: null,
                        estimatedDistance: null,
                        estimatedDuration: null,
                        lastETAUpdate: null
                    },
                    messages: [],
                    lastMessageTimestamp: null,
                    issueReported: false,
                    issueDetails: null,
                    sosActivated: false,
                    offlineQueue: [],
                    scanSettings: {
                        area: 'territorial',
                        radius: 25,
                        vehicleFilter: [],
                        priorityFilter: 'all',
                        maxDistance: 40
                    }
                });

                console.log('🔄 Logistic store reset');
            },

            // ========== HELPER GETTERS ==========

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

            getDeliveryDuration: () => {
                const state = get();

                if (!state.deliveryStartTime) return 0;

                const endTime = state.deliveryCompletedTime || Date.now();
                const durationMs = endTime - state.deliveryStartTime;

                return Math.floor(durationMs / 60000);
            },

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
            },

            isStoreClean: () => {
                const state = get();
                return (
                    !state.isOnActiveDelivery &&
                    !state.activeOrderId &&
                    !state.activeOrder &&
                    state.deliveryStage === DELIVERY_STAGES.DISCOVERING &&
                    !state.navigationData.isNavigating
                );
            },

            debugStore: () => {
                const state = get();
                console.log('🔍 STORE DEBUG:', {
                    isOnActiveDelivery: state.isOnActiveDelivery,
                    activeOrderId: state.activeOrderId,
                    deliveryStage: state.deliveryStage,
                    currentLocation: state.currentLocation,
                    isTrackingLocation: state.isTrackingLocation,
                    isNavigating: state.navigationData.isNavigating,
                    tokenVerified: state.deliveryVerification.tokenVerified,
                    pickupVerified: state.pickupVerification.isVerified,
                    isClean: get().isStoreClean()

                });
            },

            debugNavigation: () => {
                const state = get();
                const { activeOrder, currentLocation, navigationData } = state;

                console.log('🐛 NAVIGATION DEBUG:', {
                    isNavigating: navigationData.isNavigating,
                    target: navigationData.targetLocation,
                    estimatedDistance: navigationData.estimatedDistance,
                    estimatedDuration: navigationData.estimatedDuration,
                    lastETAUpdate: navigationData.lastETAUpdate ? new Date(navigationData.lastETAUpdate).toLocaleTimeString() : 'never',
                    driverLocation: currentLocation,
                    pickupRaw: activeOrder?.location?.pickUp,
                    pickupExtracted: extractCoordinates(activeOrder?.location?.pickUp),
                    dropoffRaw: activeOrder?.location?.dropOff,
                    dropoffExtracted: extractCoordinates(activeOrder?.location?.dropOff),
                    hasActiveOrder: !!activeOrder,
                    orderId: activeOrder?._id,
                });
            },
        }),
        {
            name: 'logistic-store',
            storage: createJSONStorage(() => AsyncStorage),

            partialize: (state) => ({
                isOnActiveDelivery: state.isOnActiveDelivery,
                activeOrderId: state.activeOrderId,
                activeOrder: state.activeOrder,
                deliveryStage: state.deliveryStage,
                deliveryStartTime: state.deliveryStartTime,
                deliveryAcceptedTime: state.deliveryAcceptedTime,
                pickupVerification: state.pickupVerification,
                deliveryVerification: state.deliveryVerification,
                deliveryCompletedTime: state.deliveryCompletedTime,
                isInPickupGeofence: state.isInPickupGeofence,
                isInDropoffGeofence: state.isInDropoffGeofence,
                currentLocation: state.currentLocation,
                navigationData: state.navigationData,
                scanSettings: state.scanSettings,
            }),
        }
    )
);

export { DELIVERY_STAGES, GEOFENCE_RADIUS };
export default useLogisticStore;