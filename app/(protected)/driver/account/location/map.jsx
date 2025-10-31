// app/(protected)/driver/account/location/map.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useLocationStore } from '../../../../../store/Driver/useLocationStore';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { toast } from "sonner-native";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function LocationMapScreen() {
    const router = useRouter();
    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);
    const { mode, editingLocation, setMapData } = useLocationStore();

    const [region, setRegion] = useState({
        latitude: 6.5158,
        longitude: 3.3898,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const [markerCoordinate, setMarkerCoordinate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState('');
    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState(false);
    const [gettingAddress, setGettingAddress] = useState(false);

    const pendingAnimationRef = useRef(null);
    const addressCacheRef = useRef(new Map());

    // Initialize map on mount
    useEffect(() => {
        initializeMap();
    }, []);

    // Execute pending animation when map becomes ready
    useEffect(() => {
        if (mapReady && pendingAnimationRef.current && mapRef.current) {
            const animationTimeout = setTimeout(() => {
                try {
                    mapRef.current?.animateToRegion(pendingAnimationRef.current, 1000);
                    pendingAnimationRef.current = null;
                } catch (error) {
                    console.log('Animation error:', error);
                }
            }, 300);

            return () => clearTimeout(animationTimeout);
        }
    }, [mapReady]);

    const initializeMap = async () => {
        try {
            setLoading(true);
            setMapError(false);

            // Edit mode
            if (mode === 'edit' && editingLocation) {
                const coords = editingLocation.coordinates;
                const initialRegion = {
                    latitude: coords.lat,
                    longitude: coords.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                };

                setRegion(initialRegion);
                setMarkerCoordinate({ latitude: coords.lat, longitude: coords.lng });
                setAddress(editingLocation.address);
                pendingAnimationRef.current = initialRegion;
                setLoading(false);
                return;
            }

            // New location - get current position
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                toast.error('Location permission denied');
                setLoading(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000
            });

            const userRegion = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            };

            setRegion(userRegion);
            setMarkerCoordinate({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            });

            // Get address
            const addressResult = await reverseGeocode(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
            );
            setAddress(addressResult);

            pendingAnimationRef.current = userRegion;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.log('Map init error:', error);
            toast.info('Using default location');
            setMapError(true);
        } finally {
            setLoading(false);
        }
    };

    const reverseGeocode = useCallback(async (lat, lng) => {
        const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

        // Check cache first
        if (addressCacheRef.current.has(cacheKey)) {
            return addressCacheRef.current.get(cacheKey);
        }

        try {
            const addressResult = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng,
            });

            if (addressResult.length > 0) {
                const address = addressResult[0];
                const formattedAddress = [
                    address.name,
                    address.street,
                    address.city,
                    address.region,
                    address.country
                ].filter(Boolean).join(', ');

                const result = formattedAddress || 'Address not found';
                addressCacheRef.current.set(cacheKey, result);
                return result;
            }
            return 'Address not found';
        } catch (error) {
            console.log('Reverse geocode error:', error);
            return 'Address not found';
        }
    }, []);

    const handleMapPress = useCallback(async (event) => {
        const { coordinate } = event.nativeEvent;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMarkerCoordinate(coordinate);

        const newRegion = {
            ...coordinate,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        };
        setRegion(newRegion);

        setGettingAddress(true);
        const newAddress = await reverseGeocode(coordinate.latitude, coordinate.longitude);
        setAddress(newAddress);
        setGettingAddress(false);

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 500);
        }
    }, [reverseGeocode]);

    const handleMarkerDragEnd = useCallback(async (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkerCoordinate({ latitude, longitude });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setGettingAddress(true);
        const newAddress = await reverseGeocode(latitude, longitude);
        setAddress(newAddress);
        setGettingAddress(false);
    }, [reverseGeocode]);

    const handlePlaceSelect = useCallback((data, details) => {
        if (!details?.geometry?.location) return;

        const { lat, lng } = details.geometry.location;
        const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        };

        setRegion(newRegion);
        setMarkerCoordinate({ latitude: lat, longitude: lng });
        setAddress(details.formatted_address || data.description);

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
    }, []);

    const handleNext = useCallback(() => {
        if (!markerCoordinate) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setMapData({
            coordinates: {
                lat: markerCoordinate.latitude,
                lng: markerCoordinate.longitude
            },
            address: address,
            isReady: true
        });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/driver/account/location/form');
    }, [markerCoordinate, address, setMapData, router]);

    const handleRecenter = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        try {
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            const userRegion = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            };

            setRegion(userRegion);
            setMarkerCoordinate({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            });

            setGettingAddress(true);
            const newAddress = await reverseGeocode(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
            );
            setAddress(newAddress);
            setGettingAddress(false);

            if (mapRef.current) {
                mapRef.current.animateToRegion(userRegion, 1000);
            }
        } catch (error) {
            console.log('Recenter error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [reverseGeocode]);

    // Memoize GooglePlacesAutocomplete to prevent re-renders
    const AutocompleteComponent = useMemo(() => (
        <GooglePlacesAutocomplete
            ref={autocompleteRef}
            placeholder="Search for location..."
            fetchDetails={true}
            onPress={handlePlaceSelect}
            query={{
                key: GOOGLE_MAPS_API_KEY,
                language: 'en',
                components: 'country:ng',
            }}
            debounce={400}
            keyboardShouldPersistTaps="handled"
            styles={{
                container: {
                    flex: 0,
                },
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
                    elevation: 3,
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
                    elevation: 3,
                },
                row: {
                    padding: 13,
                    minHeight: 60,
                },
                description: {
                    fontFamily: 'PoppinsRegular',
                    fontSize: 14,
                },
                poweredContainer: {
                    display: 'none'
                },
                separator: {
                    height: 0.5,
                    backgroundColor: '#E5E7EB',
                }
            }}
            textInputProps={{
                autoCorrect: false,
                autoCapitalize: 'none',
                returnKeyType: 'search',
                clearButtonMode: 'while-editing',
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
    ), [handlePlaceSelect]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {mode === 'edit' ? 'Edit Location' : 'Add Location'}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Search Box - Memoized */}
            <View style={styles.searchContainer}>
                {AutocompleteComponent}
            </View>

            {/* Map Container */}
            <View style={styles.mapContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text style={styles.loadingText}>Loading map...</Text>
                    </View>
                ) : mapError ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={48} color="#EF4444" />
                        <Text style={styles.errorTitle}>Map Loading Error</Text>
                        <Text style={styles.errorText}>
                            Unable to load map. Please check your connection.
                        </Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={initializeMap}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            provider={PROVIDER_GOOGLE}
                            initialRegion={region}
                            showsUserLocation={true}
                            showsMyLocationButton={false}
                            onPress={handleMapPress}
                            onMapReady={() => setMapReady(true)}
                            onError={() => setMapError(true)}
                            zoomControlEnabled={true}
                            showsCompass={true}
                            mapType="standard"
                            moveOnMarkerPress={false}
                            pitchEnabled={false}
                            rotateEnabled={false}
                        >
                            {markerCoordinate && (
                                <Marker
                                    coordinate={markerCoordinate}
                                    draggable
                                    onDragStart={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    onDragEnd={handleMarkerDragEnd}
                                >
                                    <View style={styles.customMarker}>
                                        <Ionicons name="location" size={40} color="#EF4444" />
                                    </View>
                                </Marker>
                            )}
                        </MapView>

                        {/* Address Loading Indicator */}
                        {gettingAddress && (
                            <View style={styles.addressLoading}>
                                <ActivityIndicator size="small" color="#6366F1" />
                                <Text style={styles.addressLoadingText}>Getting address...</Text>
                            </View>
                        )}

                        {/* Recenter Button */}
                        <TouchableOpacity
                            style={styles.recenterButton}
                            onPress={handleRecenter}
                        >
                            <Ionicons name="locate" size={24} color="#6366F1" />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Address Display */}
            {address && !gettingAddress && (
                <View style={styles.addressContainer}>
                    <View style={styles.addressHeader}>
                        <Ionicons name="location-outline" size={20} color="#6366F1" />
                        <Text style={styles.addressLabel}>Selected Location</Text>
                    </View>
                    <Text style={styles.addressText}>{address}</Text>
                </View>
            )}

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <View style={styles.instructionCard}>
                    <Ionicons name="information-circle" size={20} color="#6366F1" />
                    <Text style={styles.instructionText}>
                        Drag the pin or search to adjust location
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        (!markerCoordinate || gettingAddress) && styles.nextButtonDisabled
                    ]}
                    onPress={handleNext}
                    disabled={!markerCoordinate || gettingAddress}
                >
                    <Text style={styles.nextButtonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'ios' ? 50 : 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    headerSpacer: {
        width: 40,
    },
    searchContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 100 : 80,
        left: 16,
        right: 16,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#F9FAFB',
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    errorTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressLoading: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addressLoadingText: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    recenterButton: {
        position: 'absolute',
        right: 10,
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
        elevation: 5,
    },
    addressContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    addressLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1',
    },
    addressText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        lineHeight: 20,
    },
    bottomActions: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    instructionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    instructionText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#4F46E5',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    nextButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    nextButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },
});

export default LocationMapScreen;