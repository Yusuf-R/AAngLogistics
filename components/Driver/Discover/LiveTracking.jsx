// components/Driver/Delivery/LiveTrackingScreen.jsx
import React, {useState, useEffect, useRef, useMemo, Component, useCallback} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    ActivityIndicator,
    AppState
} from 'react-native';
import MapView, {Marker, Polyline, Circle, PROVIDER_GOOGLE} from 'react-native-maps';
import {Ionicons} from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import {BlurView} from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {toast} from 'sonner-native';
import useLogisticStore, {DELIVERY_STAGES, GEOFENCE_RADIUS} from '../../../store/Driver/useLogisticStore';
import {useFocusEffect} from "@react-navigation/native";

// Stage-specific panel components
import AcceptedPanel from './Live/AcceptedPanel';
import ArrivedPickupPanel from './Live/ArrivedPickupPanel';
import PickedUpPanel from './Live/PickedUpPanel';
import ArrivedDropoffPanel from './Live/ArrivedDropoffPanel';

const {height: SCREEN_H} = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_H * 0.6;
const PANEL_HEIGHT = SCREEN_H * 0.4;

class LiveMapErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError() {
        return {hasError: true};
    }

    componentDidCatch(error, errorInfo) {
        console.error('🗺️ Map Error Caught:', error, errorInfo);
        this.setState({error, errorInfo});
        // Log to analytics here if needed
    }

    handleRetry = () => {
        this.setState(prev => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prev.retryCount + 1
        }));
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.mapErrorContainer}>
                    <View style={styles.mapErrorCard}>
                        <Ionicons name="map-outline" size={48} color="#EF4444"/>
                        <Text style={styles.mapErrorTitle}>Map Failed to Load</Text>
                        <Text style={styles.mapErrorMessage}>
                            {this.state.error?.message || 'An error occurred while loading the map'}
                        </Text>

                        <View style={styles.errorActions}>
                            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                                <Ionicons name="refresh" size={20} color="#fff"/>
                                <Text style={styles.retryButtonText}>
                                    Retry {this.state.retryCount > 0 ? `(${this.state.retryCount})` : ''}
                                </Text>
                            </TouchableOpacity>

                            {this.state.retryCount >= 3 && (
                                <Text style={styles.contactSupport}>Still having issues? Contact support</Text>
                            )}
                        </View>

                        {this.props.fallbackData && (
                            <View style={styles.fallbackInfo}>
                                <Text style={styles.fallbackTitle}>Current Location:</Text>
                                <Text style={styles.fallbackText}>
                                    📍 Lat: {this.props.fallbackData.currentLocation?.lat?.toFixed?.(4)}
                                </Text>
                                <Text style={styles.fallbackText}>
                                    📍 Lng: {this.props.fallbackData.currentLocation?.lng?.toFixed?.(4)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

// --- helpers ---
// Accepts:
//  - {lat, lng}
//  - {latitude, longitude}
//  - {type: "Point", coordinates: [lng, lat]}
//  - [lng, lat] or [lat, lng]
const normalizePoint = (input, hint) => {
    if (!input) return null;
    if (typeof input.lat === "number" && typeof input.lng === "number") {
        return {latitude: input.lat, longitude: input.lng};
    }
    if (typeof input.latitude === "number" && typeof input.longitude === "number") {
        return {latitude: input.latitude, longitude: input.longitude};
    }
    if (input.type === "Point" && Array.isArray(input.coordinates) && input.coordinates.length >= 2) {
        const [lng, lat] = input.coordinates;
        if (typeof lat === "number" && typeof lng === "number") return {latitude: lat, longitude: lng};
    }
    if (Array.isArray(input) && input.length >= 2) {
        const [a, b] = input;
        if (hint === "lnglat") return {latitude: b, longitude: a};
        if (hint === "latlng") return {latitude: a, longitude: b};
    }
    return null;
};

const isValidLatLng = (pt) => {
    if (!pt) return false;
    const {latitude, longitude} = pt;
    return (
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180
    );
};

const toRegion = (pt, deltas = {latitudeDelta: 0.05, longitudeDelta: 0.05}) =>
    isValidLatLng(pt) ? {...pt, ...deltas} : null;

function LiveTracking({onNavigateToChat}) {
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
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const mapLoadTimeout = useRef(null);

    // auto-nav debounce + target memory
    const navTargetRef = useRef(null);
    const navLockRef = useRef(0);

    // Pulses
    const driverPulse = useSharedValue(0);
    const pickupPulse = useSharedValue(0);
    const dropoffPulse = useSharedValue(0);

    console.log({
        navigationData
    })

    // Key points
    const here = useMemo(() => normalizePoint(currentLocation), [currentLocation]);
    const pickupPt = useMemo(
        () => normalizePoint(activeOrder?.location?.pickUp?.coordinates),
        [activeOrder?.location?.pickUp?.coordinates]
    );
    const dropoffPt = useMemo(
        () => normalizePoint(activeOrder?.location?.dropOff?.coordinates),
        [activeOrder?.location?.dropOff?.coordinates]
    );

    // Initial region
    const initialRegion = useMemo(() => {
        const r = toRegion(here);
        return (
            r || {
                latitude: 9.082,
                longitude: 8.6753,
                latitudeDelta: 8,
                longitudeDelta: 8
            }
        );
    }, [here]);

    const stageInfo = getStageInfo();

    // Inline target for recenter
    const targetLocation = (
        deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP
            ? pickupPt
            : (deliveryStage === DELIVERY_STAGES.PICKED_UP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF
                ? dropoffPt
                : null)
    );

    // --- auto-nav helpers (MUST be defined before effects) ---
    const selectNavTargetFromStage = useCallback(() => {
        if (deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP) return 'pickup';
        if (deliveryStage === DELIVERY_STAGES.PICKED_UP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) return 'dropoff';
        return null;
    }, [deliveryStage]);

    const ensureNavTo = useCallback((target) => {
        const now = Date.now();
        if (now - navLockRef.current < 800) return; // debounce
        navLockRef.current = now;

        if (!target) {
            if (navigationData?.isNavigating) stopNavigation();
            navTargetRef.current = null;
            return;
        }

        const pt = target === 'pickup' ? pickupPt : dropoffPt;
        if (!isValidLatLng(pt)) return;

        if (!navigationData?.isNavigating || navTargetRef.current !== target) {
            startNavigation(target);
            navTargetRef.current = target;
        }
    }, [navigationData?.isNavigating, startNavigation, stopNavigation, pickupPt, dropoffPt]);

    // --- effects ---

    // Map load timeout (diagnostic)
    useEffect(() => {
        const id = setTimeout(() => {
            if (!mapReady) {
                console.log("⚠️ Map taking too long to load");
                toast.info("⚠️ Map taking too long to load")
                setMapError("Map is taking longer than usual to load");
            }
        }, 10000);
        mapLoadTimeout.current = id;
        return () => clearTimeout(id);
    }, [mapReady]);

    // Start/flip navigation automatically when map is ready
    useEffect(() => {
        if (!mapReady) return;
        ensureNavTo(selectNavTargetFromStage());
    }, [mapReady, ensureNavTo, selectNavTargetFromStage]);

    // Stop nav if order disappears or completes
    useEffect(() => {
        if ((!activeOrder || deliveryStage === DELIVERY_STAGES.COMPLETED) && navigationData?.isNavigating) {
            stopNavigation();
            navTargetRef.current = null;
        }
    }, [activeOrder, deliveryStage, navigationData?.isNavigating, stopNavigation]);

    // Unmount cleanup (idempotent)
    useEffect(() => {
        return () => {
            stopNavigation();
            navTargetRef.current = null;
        };
    }, [stopNavigation]);

    // Re-assert nav on focus
    useFocusEffect(
        useCallback(() => {
            ensureNavTo(selectNavTargetFromStage());
            return undefined;
        }, [ensureNavTo, selectNavTargetFromStage])
    );

    // Re-assert nav when app returns to foreground
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') ensureNavTo(selectNavTargetFromStage());
        });
        return () => sub.remove();
    }, [ensureNavTo, selectNavTargetFromStage]);

    // Pulses
    useEffect(() => {
        driverPulse.value = withRepeat(withTiming(1, {duration: 2000, easing: Easing.out(Easing.ease)}), -1, false);

        if (deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP) {
            pickupPulse.value = withRepeat(withTiming(1, {duration: 2500, easing: Easing.out(Easing.ease)}), -1, false);
        } else {
            cancelAnimation(pickupPulse);
            pickupPulse.value = 0;
        }

        if (deliveryStage === DELIVERY_STAGES.PICKED_UP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) {
            dropoffPulse.value = withRepeat(withTiming(1, {
                duration: 2500,
                easing: Easing.out(Easing.ease)
            }), -1, false);
        } else {
            cancelAnimation(dropoffPulse);
            dropoffPulse.value = 0;
        }

        return () => {
            cancelAnimation(driverPulse);
            cancelAnimation(pickupPulse);
            cancelAnimation(dropoffPulse);
        };
    }, [deliveryStage, driverPulse, pickupPulse, dropoffPulse]);

    // Auto-center on current location
    useEffect(() => {
        if (mapReady && mapRef.current && isValidLatLng(here)) {
            mapRef.current.animateToRegion(toRegion(here), 1000);
        }
    }, [here, mapReady]);

    // Haptics on geofence enter
    useEffect(() => {
        if (isInPickupGeofence && deliveryStage === DELIVERY_STAGES.ACCEPTED) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        if (isInDropoffGeofence && deliveryStage === DELIVERY_STAGES.PICKED_UP) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [isInPickupGeofence, isInDropoffGeofence, deliveryStage]);

    // Animated styles
    const driverPulseStyle = useAnimatedStyle(() => ({
        transform: [{scale: 1 + driverPulse.value}],
        opacity: 1 - driverPulse.value
    }));
    const pickupPulseStyle = useAnimatedStyle(() => ({
        transform: [{scale: 1 + pickupPulse.value * 2}],
        opacity: 0.6 - pickupPulse.value * 0.6
    }));
    const dropoffPulseStyle = useAnimatedStyle(() => ({
        transform: [{scale: 1 + dropoffPulse.value * 2}],
        opacity: 0.6 - dropoffPulse.value * 0.6
    }));

    // handlers
    const handleMapReady = () => {
        setMapReady(true);
        setIsMapLoading(false);
        setMapError(null);
        clearTimeout(mapLoadTimeout.current);
    };

    const handleMapError = (error) => {
        console.error("🗺️ Map Error:", error);
        setMapError(error?.message || "Failed to load map");
        setIsMapLoading(false);
        toast.error("Map failed to load. Tap retry to try again.");
    };

    const handleRecenter = () => {
        const tgt = targetLocation;
        if (!mapRef.current || !isValidLatLng(here) || !isValidLatLng(tgt)) return;
        mapRef.current.fitToCoordinates([here, tgt], {
            edgePadding: {top: 100, right: 50, bottom: 350, left: 50},
            animated: true
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleArrivalConfirm = async () => {
        if (deliveryStage === DELIVERY_STAGES.ACCEPTED) {
            const result = await arriveAtPickup();
            if (result.success) {
                toast.success('PickUp confirmation successful')
            }
        } else if (deliveryStage === DELIVERY_STAGES.PICKED_UP) {
            const result = await arriveAtDropoff();
            if (result.success) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    if (!activeOrder || !currentLocation) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="cube-outline" size={64} color="#D1D5DB"/>
                <Text style={styles.loadingText}>Loading delivery information...</Text>
            </View>
        );
    }

    const canDrawStraightLine = useMemo(
        () => isValidLatLng(here) && isValidLatLng(targetLocation),
        [here, targetLocation]
    );

    console.log({deliveryStage, isInPickupGeofence, here, pickupPt, GEOFENCE_RADIUS});


    return (
        <View style={styles.container}>
            {/* MAP 60% */}
            <View style={styles.mapContainer}>
                <LiveMapErrorBoundary fallbackData={{currentLocation, activeOrder}}>
                    {isMapLoading && (
                        <View style={styles.mapLoadingOverlay}>
                            <ActivityIndicator size="large" color="#6366F1"/>
                            <Text style={styles.mapLoadingText}>Loading map...</Text>
                        </View>
                    )}

                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={initialRegion}
                        onMapReady={handleMapReady}
                        onError={handleMapError}
                        showsUserLocation={false}
                        showsMyLocationButton={false}
                        showsCompass={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                        mapType="standard"
                        loadingEnabled={false}
                        loadingIndicatorColor="#6366F1"
                        loadingBackgroundColor="#F9FAFB"
                    >
                        {/* Driver marker + accuracy */}
                        {isValidLatLng(here) && (
                            <>
                                <Marker coordinate={here} anchor={{x: 0.5, y: 0.5}}>
                                    <View style={styles.driverMarkerContainer}>
                                        <Animated.View style={[styles.driverPulse, driverPulseStyle]}/>
                                        <View style={styles.driverMarker}>
                                            <Ionicons name="navigate" size={20} color="#fff"/>
                                        </View>
                                    </View>
                                </Marker>

                                <Circle
                                    center={here}
                                    radius={currentLocation?.accuracy ?? 50}
                                    strokeColor="rgba(99, 102, 241, 0.3)"
                                    fillColor="rgba(99, 102, 241, 0.1)"
                                />
                            </>
                        )}

                        {/* Pickup marker + geofence */}
                        {(deliveryStage === DELIVERY_STAGES.ACCEPTED || deliveryStage === DELIVERY_STAGES.ARRIVED_PICKUP) &&
                            isValidLatLng(pickupPt) && (
                                <>
                                    <Marker coordinate={pickupPt} anchor={{x: 0.5, y: 0.5}}>
                                        <View style={styles.locationMarkerContainer}>
                                            <Animated.View
                                                style={[styles.locationPulse, pickupPulseStyle, {borderColor: "#10B981"}]}
                                            />
                                            <View style={[styles.locationMarker, {backgroundColor: "#10B981"}]}>
                                                <Ionicons name="cube" size={20} color="#fff"/>
                                            </View>
                                        </View>
                                    </Marker>

                                    <Circle
                                        center={pickupPt}
                                        radius={GEOFENCE_RADIUS}
                                        strokeColor="rgba(16, 185, 129, 0.3)"
                                        fillColor="rgba(16, 185, 129, 0.1)"
                                        strokeWidth={2}
                                    />
                                </>
                            )}

                        {/* Dropoff marker + geofence */}
                        {(deliveryStage === DELIVERY_STAGES.PICKED_UP || deliveryStage === DELIVERY_STAGES.ARRIVED_DROPOFF) &&
                            isValidLatLng(dropoffPt) && (
                                <>
                                    <Marker coordinate={dropoffPt} anchor={{x: 0.5, y: 0.5}}>
                                        <View style={styles.locationMarkerContainer}>
                                            <Animated.View
                                                style={[styles.locationPulse, dropoffPulseStyle, {borderColor: "#EF4444"}]}
                                            />
                                            <View style={[styles.locationMarker, {backgroundColor: "#EF4444"}]}>
                                                <Ionicons name="location" size={20} color="#fff"/>
                                            </View>
                                        </View>
                                    </Marker>

                                    <Circle
                                        center={dropoffPt}
                                        radius={GEOFENCE_RADIUS}
                                        strokeColor="rgba(239, 68, 68, 0.3)"
                                        fillColor="rgba(239, 68, 68, 0.1)"
                                        strokeWidth={2}
                                    />
                                </>
                            )}

                        {/* Route polyline */}
                        {/*{navigationData.isNavigating &&*/}
                        {/*    Array.isArray(navigationData.routePolyline) &&*/}
                        {/*    navigationData.routePolyline.length > 1 && (*/}
                        {/*        <Polyline*/}
                        {/*            coordinates={navigationData.routePolyline*/}
                        {/*                .map((p) => normalizePoint(p) || p)*/}
                        {/*                .filter(isValidLatLng)}*/}
                        {/*            strokeColor="#6366F1"*/}
                        {/*            strokeWidth={4}*/}
                        {/*            lineDashPattern={[1]}*/}
                        {/*        />*/}
                        {/*    )}*/}

                        {/* Route polyline */}
                        {canDrawStraightLine && (
                            <Polyline
                                coordinates={[here, targetLocation]}
                                strokeColor="#4F46E5"
                                strokeWidth={5}
                                geodesic
                                lineCap="round"
                                lineJoin="round"
                                zIndex={9999}
                                lineDashPattern={[10, 8]}
                            />
                        )}

                    </MapView>
                </LiveMapErrorBoundary>

                {/* Status bar */}
                {/*<View style={styles.statusBar}>*/}
                {/*    <BlurView intensity={80} tint="light" style={styles.statusBarBlur}>*/}
                {/*        <View style={[styles.stageIndicator, {backgroundColor: `${stageInfo.color}15`}]}>*/}
                {/*            <Ionicons name={stageInfo.icon} size={20} color={stageInfo.color}/>*/}
                {/*        </View>*/}
                {/*        <View style={styles.statusInfo}>*/}
                {/*            <Text style={styles.statusTitle}>{stageInfo.title}</Text>*/}
                {/*            <Text style={styles.statusDescription}>{stageInfo.description}</Text>*/}
                {/*        </View>*/}
                {/*        <View style={styles.orderBadge}>*/}
                {/*            <Text style={styles.orderRef}>{activeOrder.orderRef}</Text>*/}
                {/*        </View>*/}
                {/*    </BlurView>*/}
                {/*</View>*/}

                {/* ETA Card (when navigating) */}
                {navigationData.isNavigating && (
                    <View style={styles.etaCard}>
                        <BlurView intensity={80} tint="light" style={styles.etaBlur}>
                            <Ionicons name="time-outline" size={20} color="#6366F1"/>
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

                <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
                    <BlurView intensity={80} tint="light" style={styles.recenterBlur}>
                        <Ionicons name="locate" size={24} color="#6366F1"/>
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.sosButton}
                    onPress={() => { /* modal soon */
                        toast.info('Coming soon!!')
                    }}
                    onLongPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        toast.info('Coming soon!!')
                    }}
                >
                    <BlurView intensity={80} tint="light" style={styles.sosBlur}>
                        <Ionicons name="alert-circle" size={24} color="#EF4444"/>
                    </BlurView>
                </TouchableOpacity>

                {((isInPickupGeofence && deliveryStage === DELIVERY_STAGES.ACCEPTED) ||
                    (isInDropoffGeofence && deliveryStage === DELIVERY_STAGES.PICKED_UP)) && (
                    <TouchableOpacity style={styles.arrivedButton} onPress={handleArrivalConfirm}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff"/>
                        <Text style={styles.arrivedText}>I've Arrived</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* PANEL 40% */}
            <View style={styles.panelContainer}>
                {(() => {
                    switch (deliveryStage) {
                        case DELIVERY_STAGES.ACCEPTED:
                            return <AcceptedPanel onNavigateToChat={onNavigateToChat}/>;
                        case DELIVERY_STAGES.ARRIVED_PICKUP:
                            return <ArrivedPickupPanel/>;
                        case DELIVERY_STAGES.PICKED_UP:
                            return <PickedUpPanel/>;
                        case DELIVERY_STAGES.ARRIVED_DROPOFF:
                            return <ArrivedDropoffPanel/>;
                        default:
                            return null;
                    }
                })()}
            </View>
        {/*    bottom space */}
            <View style={styles.bottomSpace}/>
        </View>
    );
}

const additionalStyles = {
    mapLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(249, 250, 251, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        gap: 12
    },
    mapLoadingText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },

    mapErrorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20
    },
    mapErrorCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    mapErrorTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#EF4444',
        marginTop: 16,
        marginBottom: 8
    },
    mapErrorMessage: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20
    },
    errorActions: {
        width: '100%',
        gap: 12,
        alignItems: 'center'
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center'
    },
    retryButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },
    contactSupport: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#F59E0B',
        textAlign: 'center',
        marginTop: 8
    },
    fallbackInfo: {
        width: '100%',
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        gap: 4
    },
    fallbackTitle: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 4
    },
    fallbackText: {
        fontSize: 12,
        fontFamily: 'PoppinsMono',
        color: '#6B7280'
    }
};

const styles = StyleSheet.create({
    ...additionalStyles,
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
        shadowOffset: {width: 0, height: 2},
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
        shadowOffset: {width: 0, height: 2},
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
        shadowOffset: {width: 0, height: 2},
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

    // ETA (future)
    etaCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 140 : 100,
        left: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
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
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 30
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
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 30
    },
    sosBlur: {
        padding: 12
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
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6
    },
    arrivedText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },

    // Panel
    panelContainer: {
        height: PANEL_HEIGHT,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8
    },
    bottomSpace: {
        height: 120
    }
});

export default LiveTracking;
