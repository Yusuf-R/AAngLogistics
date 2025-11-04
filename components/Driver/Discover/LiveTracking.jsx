// components/Driver/Delivery/LiveTrackingScreen.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    ScrollView,
    Animated as RNAnimated
} from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import useLogisticStore, { DELIVERY_STAGES, GEOFENCE_RADIUS } from '../../../store/Driver/useLogisticStore';

// Stage-specific panel components
import AcceptedPanel from './Live/AcceptedPanel';
import ArrivedPickupPanel from './Live/ArrivedPickupPanel';
import PickedUpPanel from './Live/PickedUpPanel';
import ArrivedDropoffPanel from './Live/ArrivedDropoffPanel';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_H * 0.6; // 60% for map
const PANEL_HEIGHT = SCREEN_H * 0.4; // 40% for panel

function LiveTracking({ navigation }) {
    const {
        currentLocation,
        activeOrder,
        deliveryStage,
        isInPickupGeofence,
        isInDropoffGeofence,
        navigationData,
        getStageInfo,
        startNavigation,
        stopNavigation,
        arriveAtPickup,
        arriveAtDropoff
    } = useLogisticStore();

    const mapRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const [showSOSModal, setShowSOSModal] = useState(false);

    // Animation values
    const driverPulse = useSharedValue(0);
    const pickupPulse = useSharedValue(0);
    const dropoffPulse = useSharedValue(0);
    const panelTranslateY = useSharedValue(0);

    // Map region state
    const [region, setRegion] = useState(null);

    // Initialize map region
    useEffect(() => {
        if (currentLocation) {
            setRegion({
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
            });
        }
    }, [currentLocation]);

    // Start pulsing animations
    useEffect(() => {
        // Driver location pulse
        driverPulse.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );

        // Pickup pulse (only before pickup)
        if (deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP) {
            pickupPulse.value = withRepeat(
                withTiming(1, { duration: 2500, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );
        } else {
            cancelAnimation(pickupPulse);
            pickupPulse.value = 0;
        }

        // Dropoff pulse (only after pickup)
        if (deliveryStage === DELIVERY_STAGES.PICKED_UP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) {
            dropoffPulse.value = withRepeat(
                withTiming(1, { duration: 2500, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );
        } else {
            cancelAnimation(dropoffPulse);
            dropoffPulse.value = 0;
        }

        return () => {
            cancelAnimation(driverPulse);
            cancelAnimation(pickupPulse);
            cancelAnimation(dropoffPulse);
        };
    }, [deliveryStage]);

    // Auto-center map on location updates
    useEffect(() => {
        if (mapReady && currentLocation && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05
                },
                1000
            );
        }
    }, [currentLocation, mapReady]);

    // Handle "I've Arrived" based on geofence
    useEffect(() => {
        if (isInPickupGeofence && deliveryStage === DELIVERY_STAGES.ACCEPTED) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (isInDropoffGeofence && deliveryStage === DELIVERY_STAGES.PICKED_UP) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [isInPickupGeofence, isInDropoffGeofence, deliveryStage]);

    // Pulse animation styles
    const driverPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + driverPulse.value }],
        opacity: 1 - driverPulse.value
    }));

    const pickupPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + pickupPulse.value * 2 }],
        opacity: 0.6 - pickupPulse.value * 0.6
    }));

    const dropoffPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + dropoffPulse.value * 2 }],
        opacity: 0.6 - dropoffPulse.value * 0.6
    }));

    // Get current stage info
    const stageInfo = getStageInfo();

    // Determine which location to focus on
    const getTargetLocation = () => {
        if (deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP) {
            return activeOrder?.location.pickUp.coordinates;
        }
        if (deliveryStage === DELIVERY_STAGES.PICKED_UP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) {
            return activeOrder?.location.dropOff.coordinates;
        }
        return null;
    };

    const targetLocation = getTargetLocation();

    // Recenter map to show both driver and target
    const handleRecenter = () => {
        if (!currentLocation || !targetLocation || !mapRef.current) return;

        const coordinates = [
            { latitude: currentLocation.lat, longitude: currentLocation.lng },
            { latitude: targetLocation.lat, longitude: targetLocation.lng }
        ];

        mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
            animated: true
        });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Handle navigation start
    const handleStartNavigation = () => {
        const target = deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP
            ? 'pickup'
            : 'dropoff';

        startNavigation(target);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // Handle navigation stop
    const handleStopNavigation = () => {
        stopNavigation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Handle arrival confirmation
    const handleArrivalConfirm = async () => {
        if (deliveryStage === DELIVERY_STAGES.ACCEPTED) {
            const result = await arriveAtPickup();
            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } else if (deliveryStage === DELIVERY_STAGES.PICKED_UP) {
            const result = await arriveAtDropoff();
            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
    };

    // Render appropriate panel based on delivery stage
    const renderPanel = () => {
        switch (deliveryStage) {
            case DELIVERY_STAGES.ACCEPTED:
                return <AcceptedPanel />;
            case DELIVERY_STAGES.ARRIVED_PICKUP:
                return <ArrivedPickupPanel />;
            case DELIVERY_STAGES.PICKED_UP:
                return <PickedUpPanel />;
            case DELIVERY_STAGES.ARRIVED_DROPOFF:
                return <ArrivedDropoffPanel />;
            default:
                return null;
        }
    };

    if (!activeOrder || !currentLocation) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
                <Text style={styles.loadingText}>Loading delivery information...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* MAP SECTION - 60% */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    region={region}
                    onMapReady={() => setMapReady(true)}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    mapType="standard"
                >
                    {/* Driver Current Location */}
                    {currentLocation && (
                        <>
                            <Marker
                                coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <View style={styles.driverMarkerContainer}>
                                    <Animated.View style={[styles.driverPulse, driverPulseStyle]} />
                                    <View style={styles.driverMarker}>
                                        <Ionicons name="navigate" size={20} color="#fff" />
                                    </View>
                                </View>
                            </Marker>

                            {/* Accuracy Circle */}
                            <Circle
                                center={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
                                radius={currentLocation.accuracy || 50}
                                strokeColor="rgba(99, 102, 241, 0.3)"
                                fillColor="rgba(99, 102, 241, 0.1)"
                            />
                        </>
                    )}

                    {/* Pickup Location (before pickup) */}
                    {(deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP) && (
                        <>
                            <Marker
                                coordinate={{
                                    latitude: activeOrder.location.pickUp.coordinates.lat,
                                    longitude: activeOrder.location.pickUp.coordinates.lng
                                }}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <View style={styles.locationMarkerContainer}>
                                    <Animated.View style={[styles.locationPulse, pickupPulseStyle, { borderColor: '#10B981' }]} />
                                    <View style={[styles.locationMarker, { backgroundColor: '#10B981' }]}>
                                        <Ionicons name="cube" size={20} color="#fff" />
                                    </View>
                                </View>
                            </Marker>

                            {/* Pickup Geofence */}
                            <Circle
                                center={{
                                    latitude: activeOrder.location.pickUp.coordinates.lat,
                                    longitude: activeOrder.location.pickUp.coordinates.lng
                                }}
                                radius={GEOFENCE_RADIUS}
                                strokeColor="rgba(16, 185, 129, 0.3)"
                                fillColor="rgba(16, 185, 129, 0.1)"
                                strokeWidth={2}
                            />
                        </>
                    )}

                    {/* Dropoff Location (after pickup) */}
                    {(deliveryStage === DELIVERY_STAGES.PICKED_UP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) && (
                        <>
                            <Marker
                                coordinate={{
                                    latitude: activeOrder.location.dropOff.coordinates.lat,
                                    longitude: activeOrder.location.dropOff.coordinates.lng
                                }}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <View style={styles.locationMarkerContainer}>
                                    <Animated.View style={[styles.locationPulse, dropoffPulseStyle, { borderColor: '#EF4444' }]} />
                                    <View style={[styles.locationMarker, { backgroundColor: '#EF4444' }]}>
                                        <Ionicons name="location" size={20} color="#fff" />
                                    </View>
                                </View>
                            </Marker>

                            {/* Dropoff Geofence */}
                            <Circle
                                center={{
                                    latitude: activeOrder.location.dropOff.coordinates.lat,
                                    longitude: activeOrder.location.dropOff.coordinates.lng
                                }}
                                radius={GEOFENCE_RADIUS}
                                strokeColor="rgba(239, 68, 68, 0.3)"
                                fillColor="rgba(239, 68, 68, 0.1)"
                                strokeWidth={2}
                            />
                        </>
                    )}

                    {/* Route Polyline (if navigation active) */}
                    {navigationData.isNavigating && navigationData.routePolyline && (
                        <Polyline
                            coordinates={navigationData.routePolyline}
                            strokeColor="#6366F1"
                            strokeWidth={4}
                            lineDashPattern={[1]}
                        />
                    )}
                </MapView>

                {/* Floating Status Bar */}
                <View style={styles.statusBar}>
                    <BlurView intensity={80} tint="light" style={styles.statusBarBlur}>
                        <View style={[styles.stageIndicator, { backgroundColor: `${stageInfo.color}15` }]}>
                            <Ionicons name={stageInfo.icon} size={20} color={stageInfo.color} />
                        </View>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusTitle}>{stageInfo.title}</Text>
                            <Text style={styles.statusDescription}>{stageInfo.description}</Text>
                        </View>
                        <View style={styles.orderBadge}>
                            <Text style={styles.orderRef}>{activeOrder.orderRef}</Text>
                        </View>
                    </BlurView>
                </View>

                {/* ETA Card (when navigating) */}
                {navigationData.isNavigating && (
                    <View style={styles.etaCard}>
                        <BlurView intensity={80} tint="light" style={styles.etaBlur}>
                            <Ionicons name="time-outline" size={20} color="#6366F1" />
                            <View style={styles.etaInfo}>
                                <Text style={styles.etaTime}>
                                    {navigationData.estimatedDuration || '--'} min
                                </Text>
                                <Text style={styles.etaDistance}>
                                    {navigationData.estimatedDistance || '--'} km
                                </Text>
                            </View>
                        </BlurView>
                    </View>
                )}

                {/* Recenter Button */}
                <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
                    <BlurView intensity={80} tint="light" style={styles.recenterBlur}>
                        <Ionicons name="locate" size={24} color="#6366F1" />
                    </BlurView>
                </TouchableOpacity>

                {/* SOS Button */}
                <TouchableOpacity
                    style={styles.sosButton}
                    onPress={() => setShowSOSModal(true)}
                    onLongPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        // Immediate SOS activation on long press
                    }}
                >
                    <BlurView intensity={80} tint="light" style={styles.sosBlur}>
                        <Ionicons name="alert-circle" size={24} color="#EF4444" />
                    </BlurView>
                </TouchableOpacity>

                {/* Navigation Controls */}
                {!navigationData.isNavigating && targetLocation && (
                    <TouchableOpacity
                        style={styles.startNavButton}
                        onPress={handleStartNavigation}
                    >
                        <Ionicons name="navigate" size={20} color="#fff" />
                        <Text style={styles.startNavText}>Start Navigation</Text>
                    </TouchableOpacity>
                )}

                {navigationData.isNavigating && (
                    <TouchableOpacity
                        style={styles.stopNavButton}
                        onPress={handleStopNavigation}
                    >
                        <Ionicons name="stop" size={20} color="#fff" />
                        <Text style={styles.stopNavText}>Stop Navigation</Text>
                    </TouchableOpacity>
                )}

                {/* "I've Arrived" Button (appears in geofence) */}
                {((isInPickupGeofence && deliveryStage === DELIVERY_STAGES.ACCEPTED) ||
                    (isInDropoffGeofence && deliveryStage === DELIVERY_STAGES.PICKED_UP)) && (
                    <TouchableOpacity
                        style={styles.arrivedButton}
                        onPress={handleArrivalConfirm}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.arrivedText}>I've Arrived</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* PANEL SECTION - 40% */}
            <View style={styles.panelContainer}>
                {renderPanel()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },

    // Loading State
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        gap: 16
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },

    // Map Section
    mapContainer: {
        height: MAP_HEIGHT,
        position: 'relative'
    },
    map: {
        ...StyleSheet.absoluteFillObject
    },

    // Driver Marker
    driverMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    driverMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    driverPulse: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#6366F1'
    },

    // Location Markers (Pickup/Dropoff)
    locationMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    locationMarker: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    locationPulse: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3
    },

    // Status Bar
    statusBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 16,
        right: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    statusBarBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12
    },
    stageIndicator: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center'
    },
    statusInfo: {
        flex: 1
    },
    statusTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    statusDescription: {
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    orderBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    orderRef: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },

    // ETA Card
    etaCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 140 : 100,
        left: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    etaBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10
    },
    etaInfo: {
        gap: 2
    },
    etaTime: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#111827'
    },
    etaDistance: {
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },

    // Recenter Button
    recenterButton: {
        position: 'absolute',
        bottom: 20,
        right: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    recenterBlur: {
        padding: 12
    },

    // SOS Button
    sosButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 140 : 100,
        right: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    sosBlur: {
        padding: 12
    },

    // Navigation Buttons
    startNavButton: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    },
    startNavText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },
    stopNavButton: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    },
    stopNavText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },

    // Arrived Button
    arrivedButton: {
        position: 'absolute',
        bottom: 20,
        left: '50%',
        marginLeft: -80,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6
    },
    arrivedText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },

    // Panel Section
    panelContainer: {
        height: PANEL_HEIGHT,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8
    }
});

export default LiveTracking;