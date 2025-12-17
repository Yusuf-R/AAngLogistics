// components/Driver/Discover/LogisticMap.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Platform,
    Modal,
    ScrollView
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useSessionStore } from '../../../store/useSessionStore';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { toast } from 'sonner-native';
import useLogisticStore from '../../../store/Driver/useLogisticStore';
import ScanOverlay from "./ScanOverlay";
import ScanSettingsModal from "./ScanSettingsModal";
import OrdersListModal from "./OrdersListModal";
import MapErrorBoundary from "../../MapErrorBoundary";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';

// ---------- CONSTANTS ----------
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const ACTION_PANEL_W = 200;
const ACTION_PANEL_H = 60;
const EDGE_MARGIN = 16;
const SAFE_TOP = EDGE_MARGIN + 50;
const SAFE_BOTTOM = SCREEN_H - ACTION_PANEL_H - EDGE_MARGIN - 100;
const RECENTER_BTN_SIZE = 48;
const RECENTER_SAFE_BOTTOM = 180;

// ---------- WORKLET HELPERS ----------
function clampWithinScreen(tx, ty) {
    'worklet';
    const minX = EDGE_MARGIN;
    const maxX = SCREEN_W - ACTION_PANEL_W - EDGE_MARGIN;
    const minY = SAFE_TOP;
    const maxY = SAFE_BOTTOM;
    if (tx.value < minX) tx.value = minX;
    if (tx.value > maxX) tx.value = maxX;
    if (ty.value < minY) ty.value = minY;
    if (ty.value > maxY) ty.value = maxY;
}

function clampRecenterButton(tx, ty) {
    'worklet';
    const minX = EDGE_MARGIN;
    const maxX = SCREEN_W - RECENTER_BTN_SIZE - EDGE_MARGIN;
    const minY = SAFE_TOP;
    const maxY = SCREEN_H - RECENTER_BTN_SIZE - RECENTER_SAFE_BOTTOM;
    if (tx.value < minX) tx.value = minX;
    if (tx.value > maxX) tx.value = maxX;
    if (ty.value < minY) ty.value = minY;
    if (ty.value > maxY) ty.value = maxY;
}

function snapActionPanel(tx, ty) {
    'worklet';
    const leftX = EDGE_MARGIN;
    const centerX = (SCREEN_W - ACTION_PANEL_W) / 2;
    const rightX = SCREEN_W - ACTION_PANEL_W - EDGE_MARGIN;
    const candidates = [leftX, centerX, rightX];
    let nearest = candidates[0];
    let minDist = Math.abs(tx.value - candidates[0]);
    for (let i = 1; i < candidates.length; i++) {
        const d = Math.abs(tx.value - candidates[i]);
        if (d < minDist) {
            minDist = d;
            nearest = candidates[i];
        }
    }
    clampWithinScreen(tx, ty);
    tx.value = withSpring(nearest, { damping: 18, stiffness: 220 });
    ty.value = withSpring(Math.min(Math.max(ty.value, SAFE_TOP), SAFE_BOTTOM), {
        damping: 18,
        stiffness: 220
    });
}

function snapRecenterButton(tx, ty) {
    'worklet';
    const leftX = EDGE_MARGIN;
    const rightX = SCREEN_W - RECENTER_BTN_SIZE - EDGE_MARGIN;
    const distToLeft = Math.abs(tx.value - leftX);
    const distToRight = Math.abs(tx.value - rightX);
    const targetX = distToLeft < distToRight ? leftX : rightX;
    clampRecenterButton(tx, ty);
    tx.value = withSpring(targetX, { damping: 18, stiffness: 220 });
    ty.value = withSpring(
        Math.min(Math.max(ty.value, SAFE_TOP), SCREEN_H - RECENTER_BTN_SIZE - RECENTER_SAFE_BOTTOM),
        { damping: 18, stiffness: 220 }
    );
}

// Helper function
const isValidCoordinate = (coord) => {
    if (!coord) return false;
    const lat = coord.latitude || coord.lat;
    const lng = coord.longitude || coord.lng;
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
};

// ---------- COMPONENT ----------
function LogisticMap() {
    const userData = useSessionStore((state) => state.user);
    const {
        currentLocation: storeLocation,
        updateLocation,
        isOnActiveDelivery,
        tabOrders
    } = useLogisticStore();

    const { availableOrders, orderCount, isFetchingOrders } = tabOrders.map;

    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [region, setRegion] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [savedLocationsModal, setSavedLocationsModal] = useState(false);
    const [manualLocation, setManualLocation] = useState(null);
    const [recenterLoading, setRecenterLoading] = useState(false);

    // Modals
    const [showScanOverlay, setShowScanOverlay] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);

    // Action panel SVs
    const actionTx = useSharedValue(EDGE_MARGIN);
    const actionTy = useSharedValue(SAFE_BOTTOM);
    const actionPickedUp = useSharedValue(0);
    const actionScale = useSharedValue(1);

    // Recenter button SVs
    const recenterTx = useSharedValue(SCREEN_W - RECENTER_BTN_SIZE - EDGE_MARGIN);
    const recenterTy = useSharedValue(SCREEN_H - RECENTER_BTN_SIZE - RECENTER_SAFE_BOTTOM - 60);
    const recenterPickedUp = useSharedValue(0);
    const recenterScale = useSharedValue(1);

    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);
    const locationSubscriptionRef = useRef(null);
    const savedLocations = userData?.savedLocations || [];

    // Component lifecycle management
    useEffect(() => {
        console.log('🗺️ LogisticMap MOUNTING');

        const setupMap = async () => {
            try {
                setErrorMsg(null);

                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    toast.info('Location Permission Denied');
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                const currentLocation = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = currentLocation.coords;

                console.log('✅ Initial location obtained:', { latitude, longitude });

                setLocation(currentLocation.coords);
                updateLocation(currentLocation.coords);

                setRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421
                });

                const subscriber = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 5000,
                        distanceInterval: 10
                    },
                    (newLocation) => {
                        setLocation(newLocation.coords);
                        updateLocation(newLocation.coords);
                    }
                );

                locationSubscriptionRef.current = subscriber;
                console.log('✅ Location watch started');

            } catch (error) {
                console.log('❌ Map init error:', error);
                toast.info('Location Error: Try again without interference');
                setErrorMsg('Failed to get location: Try again without interference');
            }
        };

        setupMap();

        return () => {
            console.log('🗺️ LogisticMap UNMOUNTING');
            if (locationSubscriptionRef.current) {
                locationSubscriptionRef.current.remove();
                locationSubscriptionRef.current = null;
            }
        };
    }, []);

    const cleanup = () => {
        if (locationSubscriptionRef.current) {
            locationSubscriptionRef.current.remove();
            locationSubscriptionRef.current = null;
        }
    };

    const initializeMap = async () => {
        try {
            setErrorMsg(null);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                toast.info('Location Permission Denied');
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLocation.coords;

            console.log('✅ Location obtained:', { latitude, longitude });

            setLocation(currentLocation.coords);
            updateLocation(currentLocation.coords);

            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421
            });

            const subscriber = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 5000,
                    distanceInterval: 10
                },
                (newLocation) => {
                    setLocation(newLocation.coords);
                    updateLocation(newLocation.coords);
                }
            );

            locationSubscriptionRef.current = subscriber;

        } catch (error) {
            console.log('❌ Map init error:', error);
            toast.info('Location Error: Try again without interference');
            setErrorMsg('Failed to get location: Try again without interference');
        }
    };

    // Drag gesture for Action Panel
    const actionDragGesture = Gesture.Simultaneous(
        Gesture.LongPress()
            .minDuration(200)
            .onStart(() => {
                actionPickedUp.value = 1;
                actionScale.value = withSpring(1.03);
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }),
        Gesture.Pan()
            .onChange((e) => {
                if (!actionPickedUp.value) return;
                actionTx.value += e.changeX;
                actionTy.value += e.changeY;
                clampWithinScreen(actionTx, actionTy);
            })
            .onEnd(() => {
                clampWithinScreen(actionTx, actionTy);
                snapActionPanel(actionTx, actionTy);
                actionPickedUp.value = 0;
                actionScale.value = withSpring(1);
            })
    );

    const actionPanelStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: actionTx.value },
            { translateY: actionTy.value },
            { scale: actionScale.value }
        ]
    }));

    const recenterDragGesture = Gesture.Simultaneous(
        Gesture.LongPress()
            .minDuration(200)
            .onStart(() => {
                recenterPickedUp.value = 1;
                recenterScale.value = withSpring(1.1);
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }),
        Gesture.Pan()
            .onChange((e) => {
                if (!recenterPickedUp.value) return;
                recenterTx.value += e.changeX;
                recenterTy.value += e.changeY;
                clampRecenterButton(recenterTx, recenterTy);
            })
            .onEnd(() => {
                clampRecenterButton(recenterTx, recenterTy);
                snapRecenterButton(recenterTx, recenterTy);
                recenterPickedUp.value = 0;
                recenterScale.value = withSpring(1);
            })
    );

    const recenterButtonStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: recenterTx.value },
            { translateY: recenterTy.value },
            { scale: recenterScale.value }
        ]
    }));

    const handlePlaceSelect = useCallback((data, details) => {
        if (!details?.geometry?.location) return;

        const { lat, lng } = details.geometry.location;
        const newRegion = { latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 };

        setRegion(newRegion);
        setManualLocation({ latitude: lat, longitude: lng, address: details.formatted_address || data.description });
        setSelectedLocation(null);
        updateLocation({ latitude: lat, longitude: lng });

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }

        Keyboard.dismiss();
    }, [updateLocation]);

    const handleSavedLocationSelect = useCallback((savedLocation) => {
        const { coordinates } = savedLocation;
        const newRegion = {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005
        };

        setRegion(newRegion);
        setSelectedLocation(savedLocation);
        setManualLocation(null);
        setSavedLocationsModal(false);
        updateLocation({
            latitude: coordinates.lat,
            longitude: coordinates.lng,
        });

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }
    }, []);

    const handleRecenter = useCallback(async () => {
        setRecenterLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setRecenterLoading(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            const userRegion = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
            };

            setRegion(userRegion);
            setLocation(currentLocation.coords);
            setSelectedLocation(null);
            setManualLocation(null);
            updateLocation(currentLocation.coords);

            if (mapRef.current) {
                mapRef.current.animateToRegion(userRegion, 1000);
            }
            setRecenterLoading(false);
        } catch (error) {
            setRecenterLoading(false);
            console.log('Recenter error:', error);
            toast.error('Location Error');
            useLogisticStore.getState().clearTabOrders('map');
        }
    }, [updateLocation]);

    const getLocationIcon = (type) => {
        const icons = {
            residential: 'home',
            commercial: 'business',
            office: 'briefcase',
            mall: 'cart',
            hospital: 'medical',
            school: 'school',
            other: 'location'
        };
        return icons[type] || 'location';
    };

    const handleScanComplete = useCallback((result) => {
        setShowScanOverlay(false);

        if (result.success && result.count > 0) {
            toast.success(`Found ${result.count} order${result.count > 1 ? 's' : ''}!`);
            setTimeout(() => {
                setShowOrdersModal(true);
            }, 300);
        } else {
            toast.info(result.message || 'No orders found. Try adjusting your settings.');
        }
    }, []);

    // Memoized Autocomplete
    const AutocompleteComponent = useMemo(
        () => (
            <GooglePlacesAutocomplete
                ref={autocompleteRef}
                placeholder="Search for location..."
                fetchDetails={true}
                onPress={handlePlaceSelect}
                query={{
                    key: GOOGLE_MAPS_API_KEY,
                    language: 'en',
                    components: 'country:ng'
                }}
                debounce={400}
                keyboardShouldPersistTaps="handled"
                styles={{
                    container: { flex: 0 },
                    textInput: {
                        height: 48,
                        fontSize: 15,
                        fontFamily: 'PoppinsRegular',
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3
                    },
                    listView: {
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        marginTop: 8,
                        maxHeight: 300,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3
                    },
                    row: { padding: 13, minHeight: 60 },
                    description: { fontFamily: 'PoppinsRegular', fontSize: 14 },
                    poweredContainer: { display: 'none' },
                    separator: { height: 0.5, backgroundColor: '#E5E7EB' }
                }}
                textInputProps={{
                    autoCorrect: false,
                    autoCapitalize: 'none',
                    returnKeyType: 'search',
                    clearButtonMode: 'while-editing'
                }}
                enablePoweredByContainer={false}
                minLength={2}
                timeout={1000}
                autoFillOnNotFound={false}
                currentLocation={false}
                currentLocationLabel="Current location"
                disableScroll={false}
                enableHighAccuracyLocation={true}
                filterReverseGeocodingByTypes={[]}
                GooglePlacesDetailsQuery={{}}
                GoogleReverseGeocodingQuery={{}}
                isRowScrollable={true}
                listUnderlayColor="#c8c7cc"
                listViewDisplayed="auto"
                keepResultsAfterBlur={false}
                nearbyPlacesAPI="GooglePlacesSearch"
                numberOfLines={1}
                onTimeout={() => console.warn('Google Places request timeout')}
                predefinedPlaces={[]}
                predefinedPlacesAlwaysVisible={false}
                suppressDefaultStyles={false}
                textInputHide={false}
            />
        ),
        [handlePlaceSelect]
    );

    if (errorMsg) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={initializeMap}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!location || !isValidCoordinate(location)) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Getting your location...</Text>
                <TouchableOpacity
                    style={[styles.retryButton, { marginTop: 16 }]}
                    onPress={initializeMap}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchContainer}>
                {AutocompleteComponent}
                {savedLocations.length > 0 && (
                    <TouchableOpacity
                        style={styles.savedLocationsButton}
                        onPress={() => setSavedLocationsModal(true)}
                    >
                        <Ionicons name="bookmark" size={20} color="#6366F1" />
                        <Text style={styles.savedLocationsText}>Saved Locations</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Map */}
            <MapErrorBoundary>
                <View style={styles.mapContainer}>
                    {region && (
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            provider={PROVIDER_GOOGLE}
                            region={region}
                            showsUserLocation={false}
                            showsMyLocationButton={false}
                            followsUserLocation={!manualLocation && !selectedLocation}
                            zoomControlEnabled
                            showsCompass
                            mapType="standard"
                            moveOnMarkerPress={false}
                            pitchEnabled={false}
                            rotateEnabled={false}
                        >
                            {/* Current Location with Buffer Circle */}
                            {location && isValidCoordinate(location) && (
                                <>
                                    {/* Buffer Circle - Shows coverage area */}
                                    <Circle
                                        center={{ latitude: location.latitude, longitude: location.longitude }}
                                        radius={100}
                                        strokeColor="rgba(99, 102, 241, 0.4)"
                                        strokeWidth={2}
                                        fillColor="rgba(99, 102, 241, 0.08)"
                                    />

                                    {/* Inner Accuracy Circle */}
                                    <Circle
                                        center={{ latitude: location.latitude, longitude: location.longitude }}
                                        radius={location.accuracy || 50}
                                        strokeColor="rgba(99, 102, 241, 0.3)"
                                        strokeWidth={1}
                                        fillColor="rgba(99, 102, 241, 0.15)"
                                    />

                                    {/* Location Marker */}
                                    <Marker
                                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                                        anchor={{ x: 0.5, y: 0.5 }}
                                    >
                                        <View style={styles.markerContainer}>
                                            <View style={styles.markerCenter}>
                                                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                                            </View>
                                        </View>
                                    </Marker>
                                </>
                            )}

                            {/* Manual / Saved Location */}
                            {(manualLocation || selectedLocation) && (() => {
                                const coord = manualLocation || {
                                    latitude: selectedLocation?.coordinates?.lat,
                                    longitude: selectedLocation?.coordinates?.lng
                                };

                                if (!isValidCoordinate(coord)) return null;

                                return (
                                    <>
                                        <Circle
                                            center={coord}
                                            radius={100}
                                            strokeColor="rgba(239, 68, 68, 0.4)"
                                            strokeWidth={2}
                                            fillColor="rgba(239, 68, 68, 0.08)"
                                        />
                                        <Marker
                                            coordinate={coord}
                                            anchor={{ x: 0.5, y: 0.5 }}
                                        >
                                            <View style={styles.markerContainer}>
                                                <View style={[styles.markerCenter, { backgroundColor: '#EF4444' }]}>
                                                    <Ionicons
                                                        name={selectedLocation ? getLocationIcon(selectedLocation.locationType) : 'location'}
                                                        size={22}
                                                        color="#FFFFFF"
                                                    />
                                                </View>
                                            </View>
                                        </Marker>
                                    </>
                                );
                            })()}
                        </MapView>
                    )}

                    {/* Draggable Recenter Button */}
                    <GestureDetector gesture={recenterDragGesture}>
                        <Animated.View style={[styles.recenterButton, recenterButtonStyle]}>
                            {recenterLoading ? (
                                <ActivityIndicator size="small" color="#6366F1" />
                            ) : (
                                <TouchableOpacity
                                    style={styles.recenterTouchable}
                                    onPress={handleRecenter}
                                    activeOpacity={0.8}
                                    disabled={recenterLoading}
                                >
                                    <Ionicons name="locate" size={24} color="#6366F1" />
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    </GestureDetector>
                </View>
            </MapErrorBoundary>

            {/* Draggable Action Panel */}
            <GestureDetector gesture={actionDragGesture}>
                <Animated.View style={[styles.draggableActionPanel, actionPanelStyle]}>
                    <BlurView intensity={85} tint="light" style={styles.glassActionPanel}>
                        {/* Settings */}
                        <TouchableOpacity
                            style={styles.glassActionButton}
                            onPress={() => setShowSettingsModal(true)}
                        >
                            <Ionicons name="settings" size={20} color="#6366F1" />
                        </TouchableOpacity>

                        {/* Scan */}
                        <TouchableOpacity
                            style={styles.glassActionButton}
                            onPress={() => setShowScanOverlay(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="radio-sharp" size={22} color="#6366F1" />
                        </TouchableOpacity>

                        {/* Orders List with Count */}
                        <TouchableOpacity
                            style={styles.ordersButton}
                            onPress={() => setShowOrdersModal(true)}
                            disabled={isFetchingOrders}
                        >
                            <Ionicons name="cube" size={20} color="#6366F1" />
                            {isFetchingOrders ? (
                                <ActivityIndicator size="small" color="#6366F1" style={styles.loadingIndicator} />
                            ) : orderCount > 0 ? (
                                <View style={styles.orderCountBadge}>
                                    <Text style={styles.orderCountText}>{orderCount}</Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    </BlurView>
                </Animated.View>
            </GestureDetector>

            {/* Saved Locations Modal */}
            <Modal
                visible={savedLocationsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSavedLocationsModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Saved Locations</Text>
                        <TouchableOpacity onPress={() => setSavedLocationsModal(false)}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {savedLocations.map((savedLocation) => (
                            <TouchableOpacity
                                key={savedLocation._id}
                                style={styles.savedLocationItem}
                                onPress={() => handleSavedLocationSelect(savedLocation)}
                            >
                                <View style={styles.locationIcon}>
                                    <Ionicons
                                        name={getLocationIcon(savedLocation.locationType)}
                                        size={20}
                                        color="#6366F1"
                                    />
                                </View>
                                <View style={styles.locationDetails}>
                                    <Text style={styles.locationType}>
                                        {savedLocation.locationType.charAt(0).toUpperCase() +
                                            savedLocation.locationType.slice(1)}
                                    </Text>
                                    <Text style={styles.locationAddress} numberOfLines={2}>
                                        {savedLocation.address}
                                    </Text>
                                    {savedLocation.landmark && (
                                        <Text style={styles.locationLandmark}>📍 {savedLocation.landmark}</Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            {/* Scan Overlay */}
            <ScanOverlay
                visible={showScanOverlay}
                onClose={() => setShowScanOverlay(false)}
                onScanComplete={handleScanComplete}
                targetTab="map"
            />

            {/* Settings Modal */}
            <ScanSettingsModal
                visible={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                targetTab="map"
            />

            {/* Orders List Modal */}
            <OrdersListModal
                visible={showOrdersModal}
                onClose={() => setShowOrdersModal(false)}
                sourceTab="map"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { fontSize: 16, fontFamily: 'PoppinsRegular', color: '#6B7280', marginTop: 12 },
    errorText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 16
    },
    retryButton: { backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 16, fontFamily: 'PoppinsSemiBold' },
    searchContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 100 : 150,
        left: 16,
        right: 16,
        zIndex: 1000,
        gap: 8
    },
    savedLocationsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    savedLocationsText: { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#6366F1' },
    mapContainer: { flex: 1, position: 'relative' },
    map: { width: '100%', height: '100%' },
    markerContainer: { alignItems: 'center', justifyContent: 'center' },
    markerCenter: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    recenterButton: {
        position: 'absolute',
        width: RECENTER_BTN_SIZE,
        height: RECENTER_BTN_SIZE,
        zIndex: 999,
    },
    recenterTouchable: {
        width: '100%',
        height: '100%',
        borderRadius: RECENTER_BTN_SIZE / 2,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5
    },
    draggableActionPanel: {
        position: 'absolute',
        width: ACTION_PANEL_W,
        height: ACTION_PANEL_H,
        zIndex: 1000
    },
    glassActionPanel: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    glassActionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    ordersButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    orderCountBadge: {
        position: 'absolute',
        top: 8,
        right: 12,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5
    },
    orderCountText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'PoppinsSemiBold'
    },
    loadingIndicator: {
        position: 'absolute',
        top: 8,
        right: 20,
        width: 18,
        height: 18,
    },
    modalContainer: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 60 : 20 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    modalTitle: { fontSize: 20, fontFamily: 'PoppinsSemiBold', color: '#111827' },
    modalContent: { flex: 1, padding: 20 },
    savedLocationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    locationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    locationDetails: { flex: 1 },
    locationType: { fontSize: 16, fontFamily: 'PoppinsSemiBold', color: '#111827', marginBottom: 4 },
    locationAddress: { fontSize: 14, fontFamily: 'PoppinsRegular', color: '#6B7280', marginBottom: 4 },
    locationLandmark: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#9CA3AF' },
});

export default LogisticMap;