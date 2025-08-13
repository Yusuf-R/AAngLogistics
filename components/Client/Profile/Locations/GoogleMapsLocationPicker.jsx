import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Image, DeviceEventEmitter
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import {useSavedLocationStore} from '../../../../store/useSavedLocationStore';
import {useRouter} from 'expo-router';

const {width, height} = Dimensions.get('window');

const COLORS = {
    primary: '#4361EE',
    secondary: '#3A0CA3',
    accent: '#7209B7',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#212529',
    muted: '#6C757D',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    border: '#DEE2E6',
    light: '#F8F9FA',
    dark: '#495057',
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function GoogleMapsLocationPicker({mode = 'create', onLocationSelected}) {
    const router = useRouter();
    const mapRef = useRef(null);
    const {
        setMapLocation,
        currentEditLocation,
        clearMapLocation,
        updateCurrentEditLocationCoordinates
    } = useSavedLocationStore();

    const [currentRegion, setCurrentRegion] = useState({
        latitude: 6.5158, // Lagos, Nigeria
        longitude: 3.3898, // Lagos, Nigeria
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [markerPosition, setMarkerPosition] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
    const [mapReady, setMapReady] = React.useState(false);

    useEffect(() => {
        if (mode === 'edit' && currentEditLocation && currentEditLocation.coordinates) {
            const {coordinates, address} = currentEditLocation;
            if (coordinates?.lat && coordinates?.lng) {
                const location = {
                    latitude: coordinates.lat,
                    longitude: coordinates.lng
                };
                setMarkerPosition(location);
                setCurrentRegion({
                    ...location,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
                if (mapRef.current) {
                    // Animate after a tiny delay to ensure the map is ready
                    setTimeout(() => {
                        mapRef.current.animateToRegion({
                            ...location,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }, 800);
                    }, 300);
                }
                setSelectedAddress(address);
                setIsLocationConfirmed(true);
            }
        } else {
            getCurrentLocation();
        }
    }, [mode, currentEditLocation]);

    const getCurrentLocation = async () => {
        try {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to use this feature.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };
            setCurrentRegion(newRegion);

            // Optionally set initial marker at current location
            const initialMarker = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setMarkerPosition(initialMarker);
            if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 1000);
            }
        } catch (error) {
            console.log('Error getting current location:', error);
        }
    };

    const handlePlaceSelect = (data, details = null) => {
        if (details && details.geometry && details.geometry.location) {
            const {geometry, formatted_address, place_id} = details;
            const location = {
                latitude: geometry.location.lat,
                longitude: geometry.location.lng
            };


            setMarkerPosition(location);
            setSelectedAddress(formatted_address);
            setIsLocationConfirmed(true);

            const newRegion = {
                ...location,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            setCurrentRegion(newRegion);

            if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 1000);
            }
        } else {
            console.log('Invalid details received from place select:', details);
        }
    };

    const handleMapPress = async (event) => {
        const {coordinate} = event.nativeEvent;
        setMarkerPosition(coordinate);

        try {
            // Reverse geocode to get address from coordinates
            const addressResult = await Location.reverseGeocodeAsync({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
            });

            if (addressResult.length > 0) {
                const address = addressResult[0];
                const formattedAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim();
                setSelectedAddress(formattedAddress);
                setIsLocationConfirmed(true);
            }
        } catch (error) {
            console.log('Error reverse geocoding:', error);
        }
    };

    const handleConfirmLocation = () => {
        if (!markerPosition || !selectedAddress) {
            Alert.alert('Error', 'Please select a location first');
            return;
        }

        const locationData = {
            address: selectedAddress,
            latitude: markerPosition.latitude,
            longitude: markerPosition.longitude,
            formattedAddress: selectedAddress
        };

        // Store in Zustand
        setMapLocation(locationData);

        // Call callback if provided
        if (onLocationSelected) {
            onLocationSelected(locationData);
        }
        // Navigate to form
        if (mode === 'create') {
            router.push('/client/profile/location/create');
        } else {
            updateCurrentEditLocationCoordinates(locationData);
            router.replace('/client/profile/location/edit');
        }
    };

    const handleCancel = () => {
        clearMapLocation();
        router.back();
    };

    useEffect(() => {
        const t = setTimeout(() => setMapReady(true), 100);
        return () => {
            setMapReady(false);
            clearTimeout(t);
        };
    }, []);

    useEffect(() => {
        const errorHandler = (error) => {
            console.log('Map Error:', error);
        };

        const subscription = DeviceEventEmitter.addListener(
            'onError',
            errorHandler
        );

        return () => subscription.remove();
    }, []);

    return (
        <>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark}/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {mode === 'edit' ? 'Update Location' : 'Select Location'}
                    </Text>
                    <View style={styles.headerSpacer}/>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <GooglePlacesAutocomplete
                        placeholder="Search for address..."
                        onPress={handlePlaceSelect}
                        fetchDetails={true}
                        query={{
                            key: GOOGLE_MAPS_API_KEY,
                            language: 'en',
                        }}
                        styles={{
                            container: styles.autocompleteContainer,
                            textInput: styles.searchInput,
                            listView: styles.suggestionsList,
                            row: styles.suggestionRow,
                            description: styles.suggestionText,
                        }}
                        enablePoweredByContainer={false}
                        minLength={1}
                        timeout={1000}
                        autoFillOnNotFound={false}
                        currentLocation={true}
                        currentLocationLabel="Current location"
                        disableScroll={false}
                        enableHighAccuracyLocation={true}
                        filterReverseGeocodingByTypes={[]}
                        GooglePlacesDetailsQuery={{}}
                        GoogleReverseGeocodingQuery={{}}
                        isRowScrollable={true}
                        keyboardShouldPersistTaps="always"
                        listUnderlayColor="#c8c7cc"
                        listViewDisplayed="auto"
                        keepResultsAfterBlur={false}
                        nearbyPlacesAPI="GooglePlacesSearch"
                        numberOfLines={1}
                        onFail={(error) => {
                            console.warn('Google Places Autocomplete failed:', error);
                        }}
                        onNotFound={() => console.log('No results found')}
                        onTimeout={() => console.warn('Google Places request timeout')}
                        predefinedPlaces={[]}
                        predefinedPlacesAlwaysVisible={false}
                        suppressDefaultStyles={false}
                        textInputHide={false}
                        textInputProps={{}}
                    />
                </View>

                {/* Map View */}
                {mapReady && (
                    <>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            initialRegion={currentRegion}
                            onPress={handleMapPress}
                            provider={PROVIDER_GOOGLE}
                            showsMyLocationButton={false}
                            showsUserLocation={false}
                            zoomControlEnabled={true}
                            showsCompass={true}
                            showsScale={true}
                            loadingEnabled={false}
                            mapType="standard"
                            removeClippedSubviews={false}
                            onMapReady={() => {
                                console.log('Map is ready');
                            }}
                            onRegionChangeComplete={(region) => {
                                console.log('A');
                            }}
                        >
                            {markerPosition && (
                                <Marker
                                    coordinate={markerPosition}
                                    title="Selected Location"
                                    pinColor={COLORS.success}
                                    identifier="selectedLocation"
                                    description={selectedAddress || "Selected location"}
                                    draggable={true}
                                    onDragStart={() => {
                                        console.log('Marker drag started');
                                    }}
                                    onDragEnd={(e) => {
                                        const newCoordinate = e.nativeEvent.coordinate;
                                        setMarkerPosition(newCoordinate);
                                        setCurrentRegion({
                                            ...currentRegion,
                                            latitude: newCoordinate.latitude,
                                            longitude: newCoordinate.longitude
                                        });
                                        // Reverse geocode to get address from new coordinates
                                        Location.reverseGeocodeAsync({
                                            latitude: newCoordinate.latitude,
                                            longitude: newCoordinate.longitude,
                                        }).then((addressResult) => {
                                            if (addressResult.length > 0) {
                                                const address = addressResult[0];
                                                const formattedAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim();
                                                setSelectedAddress(formattedAddress);
                                                setIsLocationConfirmed(true);
                                            }
                                        }).catch((error) => {
                                            console.log('Error reverse geocoding:', error);
                                        });
                                    }}

                                >
                                </Marker>

                            )}
                        </MapView>

                    </>
                )}

                {/* Selected Address Display */}
                {selectedAddress && (
                    <View style={styles.addressContainer}>
                        <View style={styles.addressInfo}>
                            <Ionicons name="location" size={20} color={COLORS.primary}/>
                            <Text style={styles.addressText} numberOfLines={2}>
                                {selectedAddress}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            !isLocationConfirmed && styles.confirmButtonDisabled
                        ]}
                        onPress={handleConfirmLocation}
                        disabled={!isLocationConfirmed}
                    >
                        <Text style={styles.confirmButtonText}>
                            {mode === 'edit' ? 'Update Location' : 'Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingTop: Platform.OS === 'ios' ? 50 : 12,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        color: COLORS.text,
        textAlign: 'center',
        fontFamily: 'PoppinsSemiBold',
    },
    headerSpacer: {
        width: 40,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    autocompleteContainer: {
        flex: 0,
        width: '100%',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 14,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
        height: 48,
    },
    suggestionsList: {
        backgroundColor: COLORS.card,
        borderRadius: 8,
        marginTop: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    suggestionRow: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    suggestionText: {
        fontSize: 14,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
    },
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    debugContainer: {
        backgroundColor: '#ffeb3b',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    debugText: {
        fontSize: 12,
        color: '#000',
        textAlign: 'center',
    },
    addressContainer: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    addressInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        marginLeft: 8,
        fontFamily: 'PoppinsRegular',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.card,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    cancelButton: {
        flex: 0.45,
        paddingVertical: 12,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: COLORS.dark,
    },
    confirmButton: {
        flex: 0.45,
        paddingVertical: 12,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.muted,
    },
    confirmButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: 'white',
    },
});

export default GoogleMapsLocationPicker;