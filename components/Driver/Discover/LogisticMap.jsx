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
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
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
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useSessionStore } from '../../../store/useSessionStore';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { toast } from 'sonner-native';

// ---------- CONSTANTS (file scope) ----------
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Panel size
const ACTION_PANEL_W = 200;
const ACTION_PANEL_H = 60;
// Layout guards
const EDGE_MARGIN = 16;
// const SAFE_TOP = (Platform.OS === 'ios' ? 100 : 150) + 8;
const SAFE_TOP = EDGE_MARGIN + 50; // Below search bar
// Protect the bottom area so the panel never sits under your bottom tab bar.
const BOTTOM_UI_GUARD = 110;
const SAFE_BOTTOM = SCREEN_H - ACTION_PANEL_H - EDGE_MARGIN - 50; // Above tab bar

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

    tx.value = withSpring(nearest, { damping: 18, stiffness: 220 });
    ty.value = withSpring(Math.min(Math.max(ty.value, SAFE_TOP), SAFE_BOTTOM), {
        damping: 18,
        stiffness: 220
    });
}

// ---------- COMPONENT ----------
function LogisticMap() {
    const userData = useSessionStore((state) => state.user);

    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [region, setRegion] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [savedLocationsModal, setSavedLocationsModal] = useState(false);
    const [manualLocation, setManualLocation] = useState(null);

    // --- Action panel SVs (start bottom-right, snapped & clamped) ---
    // const actionTx = useSharedValue(SCREEN_W - ACTION_PANEL_W - EDGE_MARGIN);
    const actionTx = useSharedValue(EDGE_MARGIN);
    const actionTy = useSharedValue(SAFE_BOTTOM);
    const actionPickedUp = useSharedValue(0);
    const actionScale = useSharedValue(1);

    // --- Sonar SVs (continuous pulses) ---
    const pulse1 = useSharedValue(0);
    const pulse2 = useSharedValue(0);
    const pulse3 = useSharedValue(0);

    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);

    const savedLocations = userData?.savedLocations || [];

    useEffect(() => {
        initializeMap();
    }, []);

    // Start sonar animation when location is available
    useEffect(() => {
        if (location) {
            startSonarAnimation();
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

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLocation.coords;

            setLocation(currentLocation.coords);
            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421
            });

            const subscriber = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10
                },
                (newLocation) => {
                    setLocation(newLocation.coords);
                }
            );

            return () => subscriber.remove();
        } catch (error) {
            console.log('Map init error:', error);
            setErrorMsg('Failed to get location');
        }
    };

    const startSonarAnimation = () => {
        'worklet';
        // Reset
        pulse1.value = 0;
        pulse2.value = 0;
        pulse3.value = 0;

        // Continuous and staggered pulses
        pulse1.value = withRepeat(
            withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );

        pulse2.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 1000 }),
                withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) })
            ),
            -1,
            false
        );

        pulse3.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 2000 }),
                withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) })
            ),
            -1,
            false
        );
    };

    // Pulses style (visible spread)
    const pulse1Style = useAnimatedStyle(() => ({
        transform: [{ scale: pulse1.value * 15 }],
        opacity: 1 - pulse1.value
    }));
    const pulse2Style = useAnimatedStyle(() => ({
        transform: [{ scale: pulse2.value * 15 }],
        opacity: 1 - pulse2.value
    }));
    const pulse3Style = useAnimatedStyle(() => ({
        transform: [{ scale: pulse3.value * 15 }],
        opacity: 1 - pulse3.value
    }));

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
                clampWithinScreen(actionTx, actionTy); // live clamp
            })
            .onEnd(() => {
                clampWithinScreen(actionTx, actionTy); // final clamp
                snapActionPanel(actionTx, actionTy);   // then dock to L/C/R
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

    const handlePlaceSelect = useCallback((data, details) => {
        if (!details?.geometry?.location) return;

        const { lat, lng } = details.geometry.location;
        const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005
        };

        setRegion(newRegion);
        setManualLocation({
            latitude: lat,
            longitude: lng,
            address: details.formatted_address || data.description
        });
        setSelectedLocation(null);

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }

        Keyboard.dismiss();
    }, []);

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

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }
    }, []);

    const handleRecenter = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
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

            if (mapRef.current) {
                mapRef.current.animateToRegion(userRegion, 1000);
            }
        } catch (error) {
            console.log('Recenter error:', error);
            toast.error('Location Error');
        }
    }, []);

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
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
        );
    }

    // Reusable pulsating marker (continuous)
    const PulsatingMarker = React.memo(function PulsatingMarker({
                                                                    coordinate,
                                                                    color = '#6366F1',
                                                                    icon = 'location',
                                                                    size = 24
                                                                }) {
        const pulse = useSharedValue(0);

        useEffect(() => {
            pulse.value = withRepeat(
                withTiming(1, {
                    duration: 2000,
                    easing: Easing.out(Easing.ease)
                }),
                -1,
                false
            );
            return () => cancelAnimation(pulse);
        }, []);

        const pulseStyle = useAnimatedStyle(() => ({
            transform: [{ scale: pulse.value * 2 + 1 }], // 1x -> 3x
            opacity: 1 - pulse.value
        }));

        const innerPulseStyle = useAnimatedStyle(() => ({
            transform: [{ scale: pulse.value * 1.5 + 1 }], // 1x -> 2.5x
            opacity: 1 - pulse.value * 0.7
        }));

        return (
            <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.pulsatingContainer}>
                    <Animated.View style={[styles.pulseRing, pulseStyle, { borderColor: color }]} />
                    <Animated.View style={[styles.pulseRing, innerPulseStyle, { borderColor: color }]} />
                    <View style={[styles.markerCenter, { backgroundColor: color }]}>
                        <Ionicons name={icon} size={size} color="#FFFFFF" />
                    </View>
                </View>
            </Marker>
        );
    });

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
                    {/* Accuracy Circle */}
                    <Circle
                        center={{ latitude: location.latitude, longitude: location.longitude }}
                        radius={location.accuracy || 50}
                        strokeColor="rgba(99, 102, 241, 0.2)"
                        fillColor="rgba(99, 102, 241, 0.1)"
                    />

                    {/* Current Location: continuous pulsation + sonar spread */}
                    <PulsatingMarker
                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                        color="#6366F1"
                        icon="navigate"
                        size={20}
                    />
                    <Marker
                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.sonarContainer}>
                            <Animated.View style={[styles.sonarPulse, pulse1Style]} />
                            <Animated.View style={[styles.sonarPulse, pulse2Style]} />
                            <Animated.View style={[styles.sonarPulse, pulse3Style]} />
                        </View>
                    </Marker>

                    {/* Manual / Saved Location */}
                    {(manualLocation || selectedLocation) && (
                        <PulsatingMarker
                            coordinate={
                                manualLocation || {
                                    latitude: selectedLocation.coordinates.lat,
                                    longitude: selectedLocation.coordinates.lng
                                }
                            }
                            color="#EF4444"
                            icon={selectedLocation ? getLocationIcon(selectedLocation.locationType) : 'location'}
                            size={22}
                        />
                    )}
                </MapView>

                {/* Recenter */}
                <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
                    <Ionicons name="locate" size={24} color="#6366F1" />
                </TouchableOpacity>
            </View>

            {/* Draggable Action Panel (bottom-right, never lost) */}
            <GestureDetector gesture={actionDragGesture}>
                <Animated.View style={[styles.draggableActionPanel, actionPanelStyle]}>
                    <BlurView intensity={85} tint="light" style={styles.glassActionPanel}>
                        <TouchableOpacity style={styles.glassActionButton}>
                            <Ionicons name="settings" size={20} color="#6366F1" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.glassActionButton}>
                            <Ionicons name="radio-sharp" size={20} color="#6366F1" />
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

    // Sonar spread (under the main pulsating center)
    sonarContainer: { alignItems: 'center', justifyContent: 'center', width: 100, height: 100 },
    sonarPulse: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.5)'
    },

    // Reusable pulsating marker visuals
    pulsatingContainer: { alignItems: 'center', justifyContent: 'center', width: 80, height: 80 },
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },

    recenterButton: {
        position: 'absolute',
        right: 16,
        bottom: 120,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5
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
    glassActionButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Modal
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
    locationLandmark: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#9CA3AF' }
});

export default LogisticMap;
