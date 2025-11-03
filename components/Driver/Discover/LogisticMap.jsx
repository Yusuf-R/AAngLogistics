// components/Driver/Discover/LogisticMap.jsx
import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
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
import MapView, {Marker, Circle, PROVIDER_GOOGLE} from 'react-native-maps';
import * as Location from 'expo-location';
import {Ionicons} from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
    withSequence,
    runOnJS,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';

import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {useSessionStore} from '../../../store/useSessionStore';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import {BlurView} from 'expo-blur';
import {toast} from 'sonner-native';
import useLogisticStore from '../../../store/Driver/useLogisticStore';
import ScanOverlay from "./ScanOverlay";
import ScanSettingsModal from "./ScanSettingsModal";
import OrdersListModal from "./OrdersListModal";
import MapErrorBoundary from "../../MapErrorBoundary";

// ---------- CONSTANTS (file scope) ----------
const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Panel size
const ACTION_PANEL_W = 200;
const ACTION_PANEL_H = 60;
const EDGE_MARGIN = 16;
const SAFE_TOP = EDGE_MARGIN + 50;
const SAFE_BOTTOM = SCREEN_H - ACTION_PANEL_H - EDGE_MARGIN - 50;

const RECENTER_BTN_SIZE = 48;
const RECENTER_SAFE_BOTTOM = 180;

// ---------- WORKLET HELPERS (file scope) ----------
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
    // Snap horizontally to left / center / right; keep clamped vertically.
    const leftX = EDGE_MARGIN;
    const centerX = (SCREEN_W - ACTION_PANEL_W) / 2;
    const rightX = SCREEN_W - ACTION_PANEL_W - EDGE_MARGIN;

    const candidates = [leftX, centerX, rightX];

    // nearest horizontal target
    let nearest = candidates[0];
    let minDist = Math.abs(tx.value - candidates[0]);
    for (let i = 1; i < candidates.length; i++) {
        const d = Math.abs(tx.value - candidates[i]);
        if (d < minDist) {
            minDist = d;
            nearest = candidates[i];
        }
    }

    // clamp Y before/after snapping
    clampWithinScreen(tx, ty);

    tx.value = withSpring(nearest, {damping: 18, stiffness: 220});
    ty.value = withSpring(Math.min(Math.max(ty.value, SAFE_TOP), SAFE_BOTTOM), {
        damping: 18,
        stiffness: 220
    });
}

function snapRecenterButton(tx, ty) {
    'worklet';
    // Snap to edges: left or right
    const leftX = EDGE_MARGIN;
    const rightX = SCREEN_W - RECENTER_BTN_SIZE - EDGE_MARGIN;

    const distToLeft = Math.abs(tx.value - leftX);
    const distToRight = Math.abs(tx.value - rightX);

    const targetX = distToLeft < distToRight ? leftX : rightX;

    clampRecenterButton(tx, ty);
    tx.value = withSpring(targetX, {damping: 18, stiffness: 220});
    ty.value = withSpring(
        Math.min(Math.max(ty.value, SAFE_TOP), SCREEN_H - RECENTER_BTN_SIZE - RECENTER_SAFE_BOTTOM),
        {damping: 18, stiffness: 220}
    );
}

// ---------- COMPONENT ----------
function LogisticMap() {
    const userData = useSessionStore((state) => state.user);

    // Zustand Store
    const {
        currentLocation: storeLocation,
        fetchAvailableOrders,
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

    // SCAN STATE
    const [isScanning, setIsScanning] = useState(false);
    const [recenterLoading, setRecenterLoading] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(30);
    const [scanCenter, setScanCenter] = useState(null); // { latitude, longitude, label? }

    const [scanResult, setScanResult] = useState(null);

    // Modals
    const [showScanOverlay, setShowScanOverlay] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);

    // Action panel SVs
    const actionTx = useSharedValue(EDGE_MARGIN);
    const actionTy = useSharedValue(SAFE_BOTTOM);
    const actionPickedUp = useSharedValue(0);
    const actionScale = useSharedValue(1);

    // Recenter button SVs (start at right side, above zoom controls)
    const recenterTx = useSharedValue(SCREEN_W - RECENTER_BTN_SIZE - EDGE_MARGIN);
    const recenterTy = useSharedValue(SCREEN_H - RECENTER_BTN_SIZE - RECENTER_SAFE_BOTTOM - 60);
    const recenterPickedUp = useSharedValue(0);
    const recenterScale = useSharedValue(1);

    // Sonar pulses
    const pulse1 = useSharedValue(0);
    const pulse2 = useSharedValue(0);
    const pulse3 = useSharedValue(0);

    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);
    const savedLocations = userData?.savedLocations || [];


    const scanPulse = useSharedValue(0);

    useEffect(() => {
        useLogisticStore.getState().setCurrentTabContext('map');
        initializeMap();
    }, []);


    // Start sonar animation when location is available
    useEffect(() => {
        if (location) {
            const PULSE_DURATION = 2500;

            pulse1.value = 0;
            pulse2.value = 0;
            pulse3.value = 0;

            pulse1.value = withRepeat(
                withTiming(1, {duration: PULSE_DURATION, easing: Easing.linear}),
                -1,
                false
            );

            setTimeout(() => {
                pulse2.value = withRepeat(
                    withTiming(1, {duration: PULSE_DURATION, easing: Easing.linear}),
                    -1,
                    false
                );
            }, PULSE_DURATION / 3);

            setTimeout(() => {
                pulse3.value = withRepeat(
                    withTiming(1, {duration: PULSE_DURATION, easing: Easing.linear}),
                    -1,
                    false
                );
            }, (PULSE_DURATION * 2) / 3);
        }

        return () => {
            cancelAnimation(pulse1);
            cancelAnimation(pulse2);
            cancelAnimation(pulse3);
        };
    }, [location]);

    const initializeMap = async () => {
        try {
            setErrorMsg(null);

            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                toast.info('Location Permission Denied');
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            const {latitude, longitude} = currentLocation.coords;
            console.log({currentLocation, pt: 'init'})

            setLocation(currentLocation.coords);

            // Update store location
            updateLocation(currentLocation.coords, 'map');

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
                    updateLocation(newLocation.coords, 'map');
                }
            );

            return () => subscriber.remove();
        } catch (error) {
            console.log('Map init error:', error);
            toast.info('Location Error: Try again without interference');
            setErrorMsg('Failed to get location: Try again without interference');
        }
    };

    // Pulses style
    const pulse1Style = useAnimatedStyle(() => ({
        transform: [{scale: pulse1.value * 15}],
        opacity: 1 - pulse1.value
    }));
    const pulse2Style = useAnimatedStyle(() => ({
        transform: [{scale: pulse2.value * 15}],
        opacity: 1 - pulse2.value
    }));
    const pulse3Style = useAnimatedStyle(() => ({
        transform: [{scale: pulse3.value * 15}],
        opacity: 1 - pulse3.value
    }));


    // Scan pulse animation controller
    useEffect(() => {
        if (isScanning) {
            // Big expanding ring
            scanPulse.value = withRepeat(withTiming(1, {duration: 1500, easing: Easing.out(Easing.ease)}), -1, false);
            // Staggered local sonar
            pulse1.value = withRepeat(withTiming(1, {duration: 3000, easing: Easing.out(Easing.ease)}), -1, false);
            pulse2.value = withRepeat(
                withSequence(withTiming(0, {duration: 1000}), withTiming(1, {
                    duration: 3000,
                    easing: Easing.out(Easing.ease)
                })),
                -1,
                false
            );
            pulse3.value = withRepeat(
                withSequence(withTiming(0, {duration: 2000}), withTiming(1, {
                    duration: 3000,
                    easing: Easing.out(Easing.ease)
                })),
                -1,
                false
            );
        } else {
            cancelAnimation(scanPulse);
            cancelAnimation(pulse1);
            cancelAnimation(pulse2);
            cancelAnimation(pulse3);
            scanPulse.value = 0;
            pulse1.value = 0;
            pulse2.value = 0;
            pulse3.value = 0;
        }
    }, [isScanning]);

    const startSonarAnimation = () => {
        'worklet';
        // Reset
        pulse1.value = 0;
        pulse2.value = 0;
        pulse3.value = 0;

        // Continuous and staggered pulses
        pulse1.value = withRepeat(
            withTiming(1, {duration: 3000, easing: Easing.out(Easing.ease)}),
            -1,
            false
        );

        pulse2.value = withRepeat(
            withSequence(
                withTiming(0, {duration: 1000}),
                withTiming(1, {duration: 3000, easing: Easing.out(Easing.ease)})
            ),
            -1,
            false
        );

        pulse3.value = withRepeat(
            withSequence(
                withTiming(0, {duration: 2000}),
                withTiming(1, {duration: 3000, easing: Easing.out(Easing.ease)})
            ),
            -1,
            false
        );
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
            {translateX: actionTx.value},
            {translateY: actionTy.value},
            {scale: actionScale.value}
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
            {translateX: recenterTx.value},
            {translateY: recenterTy.value},
            {scale: recenterScale.value}
        ]
    }));

    const handlePlaceSelect = useCallback((data, details) => {
        if (!details?.geometry?.location) return;

        const {lat, lng} = details.geometry.location;
        const newRegion = {latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005};

        setRegion(newRegion);
        setManualLocation({latitude: lat, longitude: lng, address: details.formatted_address || data.description});
        setSelectedLocation(null);

        // Update location in store (will trigger fetch automatically)
        updateLocation({latitude: lat, longitude: lng}, 'map');

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }

        Keyboard.dismiss();
    }, [updateLocation]);

    const handleSavedLocationSelect = useCallback((savedLocation) => {
        const {coordinates} = savedLocation;
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
        // Update to zustand
        updateLocation({
            latitude: coordinates.lat,
            longitude: coordinates.lng,
        }, 'map');

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }
    }, []);

    const handleRecenter = useCallback(async () => {
        setRecenterLoading(true);
        try {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

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

            // Update location in store (will trigger fetch automatically)
            updateLocation(currentLocation.coords, 'map');

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
        // Close scan overlay
        setShowScanOverlay(false);

        if (result.success && result.count > 0) {
            // Show success toast
            toast.success(`Found ${result.count} order${result.count > 1 ? 's' : ''}!`);

            // Immediately open OrdersListModal to show results
            setTimeout(() => {
                setShowOrdersModal(true);
            }, 300); // Small delay for smooth transition
        } else {
            // Show info toast - no need to open modal for empty results
            toast.info(result.message || 'No orders found. Try adjusting your settings.');
        }
    }, []);

    const getActiveCenter = useCallback(() => {
        if (manualLocation) {
            return {
                latitude: manualLocation.latitude,
                longitude: manualLocation.longitude,
                label: manualLocation.address ?? 'selected point'
            };
        }
        if (selectedLocation) {
            return {
                latitude: selectedLocation.coordinates.lat,
                longitude: selectedLocation.coordinates.lng,
                label: selectedLocation.address ?? selectedLocation.locationType ?? 'saved location',
            };
        }
        if (location) {
            return {latitude: location.latitude, longitude: location.longitude, label: 'your current location'};
        }
        return null;
    }, [manualLocation, selectedLocation, location]);

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
                    container: {flex: 0},
                    textInput: {
                        height: 48,
                        fontSize: 15,
                        fontFamily: 'PoppinsRegular',
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 2},
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
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3
                    },
                    row: {padding: 13, minHeight: 60},
                    description: {fontFamily: 'PoppinsRegular', fontSize: 14},
                    poweredContainer: {display: 'none'},
                    separator: {height: 0.5, backgroundColor: '#E5E7EB'}
                }}
                textInputProps={{
                    autoCorrect: false,
                    autoCapitalize: 'none',
                    returnKeyType: 'search',
                    clearButtonMode: 'while-editing'
                }}
                onFail={(error) => console.log('Autocomplete error:', error)}
                onNotFound={() => console.log('No results')}
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

    if (!location) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366F1"/>
                <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
        );
    }

    // Create a wrapper component
    const SafeMarker = ({coordinate, children, ...props}) => {
        if (!isValidCoordinate(coordinate)) {
            console.log('Invalid marker coordinate:', coordinate);
            toast.info('Invalid marker cordinates')
            return null;
        }

        return (
            <Marker coordinate={coordinate} {...props}>
                {children}
            </Marker>
        );
    };

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

    if (!isValidCoordinate(location)) {
        console.log('Invalid location:', location);
        toast.info('Invalid location')
        return null;
    }

    // Reusable pulsating marker (continuous)
    const PulsatingMarker = React.memo(function PulsatingMarker({
                                                                    coordinate,
                                                                    color = '#6366F1',
                                                                    icon = 'location',
                                                                    size = 24
                                                                }) {
        const pulse = useSharedValue(0);
        const [isReady, setIsReady] = useState(false); // ADD THIS

        useEffect(() => {
            // ADD DELAY to ensure marker is mounted
            const timer = setTimeout(() => {
                setIsReady(true);
                pulse.value = withRepeat(
                    withTiming(1, {
                        duration: 2000,
                        easing: Easing.out(Easing.ease)
                    }),
                    -1,
                    false
                );
            }, 100); // 100ms delay

            return () => {
                clearTimeout(timer);
                cancelAnimation(pulse);
            };
        }, []);

        const pulseStyle = useAnimatedStyle(() => ({
            transform: [{scale: pulse.value * 2 + 1}],
            opacity: 1 - pulse.value
        }));

        const innerPulseStyle = useAnimatedStyle(() => ({
            transform: [{scale: pulse.value * 1.5 + 1}],
            opacity: 1 - pulse.value * 0.7
        }));

        // ADD SAFETY CHECK
        if (!coordinate || !isReady) {
            return null;
        }

        return (
            <Marker coordinate={coordinate} anchor={{x: 0.5, y: 0.5}}>
                <View style={styles.pulsatingContainer}>
                    <Animated.View style={[styles.pulseRing, pulseStyle, {borderColor: color}]}/>
                    <Animated.View style={[styles.pulseRing, innerPulseStyle, {borderColor: color}]}/>
                    <View style={[styles.markerCenter, {backgroundColor: color}]}>
                        <Ionicons name={icon} size={size} color="#FFFFFF"/>
                    </View>
                </View>
            </Marker>
        );
    });

    return (
        <>
            <View style={styles.container}>
                {/* Search */}
                <View style={styles.searchContainer}>
                    {AutocompleteComponent}
                    {savedLocations.length > 0 && (
                        <TouchableOpacity
                            style={styles.savedLocationsButton}
                            onPress={() => setSavedLocationsModal(true)}
                        >
                            <Ionicons name="bookmark" size={20} color="#6366F1"/>
                            <Text style={styles.savedLocationsText}>Saved Locations</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Map */}
                <MapErrorBoundary>
                    <View style={styles.mapContainer}>
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
                            {/* ADD VALIDATION for all markers */}
                            {location && location.latitude && location.longitude && (
                                <>
                                    {/* Accuracy Circle */}
                                    <Circle
                                        center={{latitude: location.latitude, longitude: location.longitude}}
                                        radius={location.accuracy || 50}
                                        strokeColor="rgba(99, 102, 241, 0.2)"
                                        fillColor="rgba(99, 102, 241, 0.1)"
                                    />

                                    {/* Current Location Marker */}
                                    <PulsatingMarker
                                        coordinate={{latitude: location.latitude, longitude: location.longitude}}
                                        color="#6366F1"
                                        icon="navigate"
                                        size={20}
                                    />

                                    {/* Sonar Animation */}
                                    <Marker
                                        coordinate={{latitude: location.latitude, longitude: location.longitude}}
                                        anchor={{x: 0.5, y: 0.5}}
                                    >
                                        <View style={styles.sonarContainer}>
                                            <Animated.View style={[styles.sonarPulse, pulse1Style]}/>
                                            <Animated.View style={[styles.sonarPulse, pulse2Style]}/>
                                            <Animated.View style={[styles.sonarPulse, pulse3Style]}/>
                                        </View>
                                    </Marker>
                                </>
                            )}

                            {/* Manual / Saved Location - ADD VALIDATION */}
                            {(manualLocation || selectedLocation) && (
                                (() => {
                                    const coord = manualLocation || {
                                        latitude: selectedLocation?.coordinates?.lat,
                                        longitude: selectedLocation?.coordinates?.lng
                                    };

                                    // Validate coordinates exist
                                    if (!coord.latitude || !coord.longitude) return null;

                                    return (
                                        <PulsatingMarker
                                            coordinate={coord}
                                            color="#EF4444"
                                            icon={selectedLocation ? getLocationIcon(selectedLocation.locationType) : 'location'}
                                            size={22}
                                        />
                                    );
                                })()
                            )}
                        </MapView>


                        {/* Draggable Recenter Button with Order Count Badge */}
                        <GestureDetector gesture={recenterDragGesture}>
                            <Animated.View style={[styles.recenterButton, recenterButtonStyle]}>
                                    { recenterLoading ? <ActivityIndicator size="large" color="#6366F1"/> :
                                        <TouchableOpacity
                                            style={styles.recenterTouchable}
                                            onPress={handleRecenter}
                                            activeOpacity={0.8}
                                            disabled={recenterLoading}
                                        >
                                            <Ionicons name="locate" size={24} color="#6366F1"/>
                                        </TouchableOpacity>
                                    }
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
                                <Ionicons name="settings" size={20} color="#6366F1"/>
                            </TouchableOpacity>

                            {/* Scan */}
                            <TouchableOpacity
                                style={styles.glassActionButton}
                                onPress={() => setShowScanOverlay(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="radio-sharp" size={22} color="#6366F1"/>
                            </TouchableOpacity>

                            {/* Orders List with Count */}
                            {/*<TouchableOpacity*/}
                            {/*    style={styles.ordersButton}*/}
                            {/*    onPress={() => setShowOrdersModal(true)}*/}
                            {/*>*/}
                            {/*    <Ionicons name="cube" size={20} color="#6366F1"/>*/}
                            {/*    {orderCount >= 0 && (*/}
                            {/*        <View style={styles.orderCountBadge}>*/}
                            {/*            <Text style={styles.orderCountText}>{orderCount}</Text>*/}
                            {/*        </View>*/}
                            {/*    )}*/}
                            {/*</TouchableOpacity>*/}

                            {/* Orders List with Count */}
                            <TouchableOpacity
                                style={styles.ordersButton}
                                onPress={() => setShowOrdersModal(true)}
                                disabled={isFetchingOrders}
                            >
                                <Ionicons name="cube" size={20} color="#6366F1"/>
                                {isFetchingOrders ? (
                                    <ActivityIndicator size="small" color="#6366F1" style={styles.loadingIndicator}/>
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
                                <Ionicons name="close" size={24} color="#111827"/>
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
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF"/>
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
        </>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#F9FAFB'},
    centerContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20},
    loadingText: {fontSize: 16, fontFamily: 'PoppinsRegular', color: '#6B7280', marginTop: 12},
    errorText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 16
    },
    retryButton: {backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8},
    retryButtonText: {color: '#fff', fontSize: 16, fontFamily: 'PoppinsSemiBold'},

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
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    savedLocationsText: {fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#6366F1'},

    mapContainer: {flex: 1, position: 'relative'},
    map: {width: '100%', height: '100%'},

    sonarContainer: {alignItems: 'center', justifyContent: 'center', width: 100, height: 100},
    sonarPulse: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.5)'
    },

    pulsatingContainer: {alignItems: 'center', justifyContent: 'center', width: 80, height: 80},
    pulseRing: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        backgroundColor: 'transparent'
    },
    markerCenter: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },

    // Draggable Recenter Button
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
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5
    },
    orderBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#fff'
    },
    orderBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold'
    },

    // Draggable Action Panel
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

    // Modal
    modalContainer: {flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 60 : 20},
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    modalTitle: {fontSize: 20, fontFamily: 'PoppinsSemiBold', color: '#111827'},
    modalContent: {flex: 1, padding: 20},
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
    locationDetails: {flex: 1},
    locationType: {fontSize: 16, fontFamily: 'PoppinsSemiBold', color: '#111827', marginBottom: 4},
    locationAddress: {fontSize: 14, fontFamily: 'PoppinsRegular', color: '#6B7280', marginBottom: 4},
    locationLandmark: {fontSize: 12, fontFamily: 'PoppinsRegular', color: '#9CA3AF'},
    loadingIndicator: {
        position: 'absolute',
        top: 8,
        right: 20,
        width: 18,
        height: 18,
    },
});

export default LogisticMap;
