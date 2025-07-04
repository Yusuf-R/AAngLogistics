// components/LocationSelector.js
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Animated,
    Dimensions,
    Alert, StyleSheet
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import Ionicons from "@expo/vector-icons/Ionicons";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LocationSelector = ({
                                     pickup,
                                     dropoff,
                                     onPickupUpdate,
                                     onDropoffUpdate,
                                     userLocation,
                                     savedLocations = [],
                                     validationErrors = {}
                                 }) => {
    const [activeLocation, setActiveLocation] = useState('pickup'); // 'pickup' or 'dropoff'
    const [mapRegion, setMapRegion] = useState({
        latitude: userLocation?.lat || 6.5244,
        longitude: userLocation?.lng || 3.3792,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const mapRef = useRef(null);
    const searchTimeout = useRef(null);

    const LocationCard = ({ type, data, onUpdate, isActive, onActivate }) => (
        <Pressable
            style={[
                styles.locationCard,
                isActive && styles.locationCardActive,
                validationErrors[`${type}.address`] && styles.locationCardError
            ]}
            onPress={onActivate}
        >
            <View style={styles.locationHeader}>
                <View style={[styles.locationTypeIndicator, isActive && styles.locationTypeActive]}>
                    <Ionicons
                        name={type === 'pickup' ? 'location' : 'flag'}
                        size={16}
                        color={isActive ? '#fff' : '#667eea'}
                    />
                </View>
                <Text style={[styles.locationTypeText, isActive && styles.locationTypeTextActive]}>
                    {type === 'pickup' ? 'Pickup Location' : 'Delivery Location'}
                </Text>
            </View>

            <TextInput
                style={[styles.locationInput, validationErrors[`${type}.address`] && styles.inputError]}
                value={data.address}
                onChangeText={(text) => {
                    onUpdate({ address: text });
                    handleAddressSearch(text, type);
                }}
                placeholder={`Enter ${type} address`}
                placeholderTextColor="#9ca3af"
                multiline
            />

            {validationErrors[`${type}.address`] && (
                <Text style={styles.errorText}>{validationErrors[`${type}.address`]}</Text>
            )}

            <View style={styles.locationDetails}>
                <TextInput
                    style={styles.contactInput}
                    value={data.contactPerson?.name || ''}
                    onChangeText={(text) => onUpdate({
                        contactPerson: { ...data.contactPerson, name: text }
                    })}
                    placeholder="Contact name"
                    placeholderTextColor="#9ca3af"
                />
                <TextInput
                    style={styles.contactInput}
                    value={data.contactPerson?.phone || ''}
                    onChangeText={(text) => onUpdate({
                        contactPerson: { ...data.contactPerson, phone: text }
                    })}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            <TextInput
                style={styles.instructionsInput}
                value={data.instructions}
                onChangeText={(text) => onUpdate({ instructions: text })}
                placeholder="Special instructions (gate code, floor, etc.)"
                placeholderTextColor="#9ca3af"
                multiline
            />
        </Pressable>
    );

    const handleAddressSearch = async (query, locationType) => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Use your geocoding service here
                const results = await geocodeAddress(query);
                setSearchResults(results.slice(0, 5)); // Limit to 5 results
            } catch (error) {
                console.error('Geocoding error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);
    };

    const selectSearchResult = (result, locationType) => {
        const updateFn = locationType === 'pickup' ? onPickupUpdate : onDropoffUpdate;
        updateFn({
            address: result.formatted_address,
            coordinates: {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng
            }
        });

        setSearchResults([]);

        // Update map region to show the selected location
        setMapRegion({
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    };

    const handleMapPress = (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        const updateFn = activeLocation === 'pickup' ? onPickupUpdate : onDropoffUpdate;

        // Reverse geocode the coordinates
        reverseGeocode(latitude, longitude).then(address => {
            updateFn({
                address: address,
                coordinates: { lat: latitude, lng: longitude }
            });
        });
    };

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to use this feature.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const address = await reverseGeocode(location.coords.latitude, location.coords.longitude);

            const updateFn = activeLocation === 'pickup' ? onPickupUpdate : onDropoffUpdate;
            updateFn({
                address: address,
                coordinates: {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude
                }
            });

            setMapRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        } catch (error) {
            Alert.alert('Error', 'Unable to get current location');
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Where should we pick up and deliver?</Text>

            {/* Location Cards */}
            <LocationCard
                type="pickup"
                data={pickup}
                onUpdate={onPickupUpdate}
                isActive={activeLocation === 'pickup'}
                onActivate={() => setActiveLocation('pickup')}
            />

            <LocationCard
                type="dropoff"
                data={dropoff}
                onUpdate={onDropoffUpdate}
                isActive={activeLocation === 'dropoff'}
                onActivate={() => setActiveLocation('dropoff')}
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                    <Text style={styles.searchResultsTitle}>Suggestions</Text>
                    {searchResults.map((result, index) => (
                        <Pressable
                            key={index}
                            style={styles.searchResultItem}
                            onPress={() => selectSearchResult(result, activeLocation)}
                        >
                            <Ionicons name="location-outline" size={20} color="#667eea" />
                            <View style={styles.searchResultText}>
                                <Text style={styles.searchResultTitle} numberOfLines={1}>
                                    {result.name}
                                </Text>
                                <Text style={styles.searchResultAddress} numberOfLines={2}>
                                    {result.formatted_address}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}

            {/* Saved Locations */}
            {savedLocations.length > 0 && (
                <View style={styles.savedLocations}>
                    <Text style={styles.sectionSubtitle}>Saved Locations</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {savedLocations.map((location, index) => (
                            <Pressable
                                key={index}
                                style={styles.savedLocationChip}
                                onPress={() => selectSearchResult(location, activeLocation)}
                            >
                                <Ionicons name="bookmark" size={16} color="#667eea" />
                                <Text style={styles.savedLocationText}>{location.name}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Interactive Map */}
            <View style={styles.mapContainer}>
                <Text style={styles.sectionSubtitle}>Tap on map to set location</Text>
                <View style={styles.mapWrapper}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        region={mapRegion}
                        onPress={handleMapPress}
                        showsUserLocation
                        showsMyLocationButton={false}
                    >
                        {pickup.coordinates.lat && (
                            <Marker
                                coordinate={{
                                    latitude: pickup.coordinates.lat,
                                    longitude: pickup.coordinates.lng
                                }}
                                title="Pickup Location"
                                pinColor="#667eea"
                            />
                        )}
                        {dropoff.coordinates.lat && (
                            <Marker
                                coordinate={{
                                    latitude: dropoff.coordinates.lat,
                                    longitude: dropoff.coordinates.lng
                                }}
                                title="Delivery Location"
                                pinColor="#f59e0b"
                            />
                        )}
                    </MapView>

                    {/* Current Location Button */}
                    <Pressable style={styles.currentLocationButton} onPress={getCurrentLocation}>
                        <Ionicons name="locate" size={24} color="#667eea" />
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, padding: 20},
    sectionTitle: {fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8},
    sectionSubtitle: {fontSize: 16, color: '#6b7280', marginBottom: 20},

    // Order Type Styles
    typeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 30},
    typeCardContainer: {flex: 1, minWidth: '45%'},
    typeCard: {borderRadius: 16, overflow: 'hidden', position: 'relative'},
    typeGradient: {padding: 20, minHeight: 120},
    typeHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
    typeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    popularBadge: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    popularText: {fontSize: 10, fontWeight: 'bold', color: '#111827'},
    typeContent: {marginTop: 'auto'},
    typeTitle: {fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4},
    typeSubtitle: {fontSize: 14, color: 'rgba(255,255,255,0.8)'},
    selectionBorder: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16},

    // Quick Reorder Styles
    quickReorderSection: {marginTop: 30},
    quickReorderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2
    },
    reorderIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    reorderContent: {flex: 1},
    reorderTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
    reorderSubtitle: {fontSize: 14, color: '#6b7280', marginTop: 2},
    reorderPrice: {alignItems: 'flex-end'},
    priceText: {fontSize: 16, fontWeight: 'bold', color: '#667eea'},

    // Package Form Styles
    categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24},
    categoryCard: {
        flex: 1,
        minWidth: '30%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: 'white',
        alignItems: 'center'
    },
    categorySelected: {backgroundColor: '#f8fafc'},
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    categoryTitle: {fontSize: 14, fontWeight: '600', textAlign: 'center'},
    popularDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f59e0b'
    },

    inputContainer: {marginBottom: 20},
    inputLabel: {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8},
    textInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 16
    },
    multilineInput: {minHeight: 80, textAlignVertical: 'top'},
    inputError: {borderColor: '#ef4444'},
    errorText: {fontSize: 14, color: '#ef4444', marginTop: 4},

    dimensionsContainer: {marginBottom: 20},
    dimensionsRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    dimensionInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16
    },
    dimensionSeparator: {fontSize: 18, color: '#6b7280', fontWeight: 'bold'},
    unitText: {fontSize: 14, color: '#6b7280', marginLeft: 8},

    weightContainer: {marginBottom: 20},
    weightRow: {flexDirection: 'row', alignItems: 'center'},
    weightInput: {flex: 1, marginRight: 8},

    specialHandlingContainer: {marginBottom: 20},
    toggleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12},
    toggleInfo: {flex: 1},
    toggleTitle: {fontSize: 16, fontWeight: '600', color: '#374151'},
    toggleSubtitle: {fontSize: 14, color: '#6b7280', marginTop: 2},

    advancedToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: '#e5e7eb'
    },
    advancedToggleText: {fontSize: 16, fontWeight: '600', color: '#667eea'},
    advancedContainer: {overflow: 'hidden'},

    // Location Styles
    locationCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb'
    },
    locationCardActive: {borderColor: '#667eea', backgroundColor: '#f8fafc'},
    locationCardError: {borderColor: '#ef4444'},
    locationHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 16},
    locationTypeIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    locationTypeActive: {backgroundColor: '#667eea'},
    locationTypeText: {fontSize: 16, fontWeight: '600', color: '#374151'},
    locationTypeTextActive: {color: '#667eea'},
    locationInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 12
    },
    locationDetails: {flexDirection: 'row', gap: 12, marginBottom: 12},
    contactInput: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        fontSize: 14
    },
    instructionsInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 50,
        textAlignVertical: 'top'
    },

    searchResults: {backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 4},
    searchResultsTitle: {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12},
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    searchResultText: {flex: 1, marginLeft: 12},
    searchResultTitle: {fontSize: 16, fontWeight: '500', color: '#111827'},
    searchResultAddress: {fontSize: 14, color: '#6b7280', marginTop: 2},

    savedLocations: {marginBottom: 20},
    savedLocationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        elevation: 2
    },
    savedLocationText: {fontSize: 14, color: '#374151', marginLeft: 8},

    mapContainer: {marginBottom: 20},
    mapWrapper: {position: 'relative', height: 200, borderRadius: 16, overflow: 'hidden'},
    map: {flex: 1},
    currentLocationButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4
    },

    // Vehicle Styles
    recommendedSection: {marginBottom: 24},
    recommendedTitle: {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12},
    recommendedChips: {flexDirection: 'row', gap: 8},
    recommendedChip: {backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20},
    recommendedChipText: {fontSize: 14, fontWeight: '500', color: 'white'},

    vehicleGrid: {gap: 16, marginBottom: 24},
    vehicleCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        position: 'relative'
    },
    vehicleCardSelected: {borderColor: '#667eea', backgroundColor: '#f8fafc'},
    vehicleCardRecommended: {borderColor: '#f59e0b'},
    vehicleHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16},
    vehicleIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    vehicleBadges: {gap: 4},
    ecoBadge: {backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
    recommendedBadge: {backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
    badgeText: {fontSize: 10, fontWeight: 'bold', color: 'white'},
    vehicleName: {fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12},
    vehicleNameSelected: {color: '#667eea'},
    vehicleSpecs: {gap: 8, marginBottom: 16},
    specRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    specTextSelected: {color: 'white'},
    vehiclePrice: {alignItems: 'center', marginBottom: 12},
    priceTextSelected: {color: 'white'},
    selectedIndicator: {position: 'absolute', top: 16, right: 16},

    // Price Estimate Styles
    priceEstimate: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        elevation: 4
    },
    estimateTitle: {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8},
    estimateAmount: {fontSize: 32, fontWeight: 'bold', color: '#667eea', marginBottom: 8},
    estimateNote: {fontSize: 14, color: '#6b7280', textAlign: 'center'},

    // Suggestions Styles
    suggestionsContainer: {
        marginTop: 8,
        maxHeight: 40
    },
    suggestionChip: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8
    },
    suggestionText: {fontSize: 14, color: '#374151'},

    // Order Summary Styles
    summaryContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        margin: 20,
        elevation: 4
    },
    summaryTitle: {fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16},
    summarySection: {marginBottom: 20},
    summaryLabel: {fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 4},
    summaryValue: {fontSize: 16, color: '#111827', marginBottom: 8},
    summaryDivider: {height: 1, backgroundColor: '#e5e7eb', marginVertical: 16},

    // Pricing Breakdown
    pricingRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
    pricingLabel: {fontSize: 14, color: '#6b7280'},
    pricingValue: {fontSize: 14, fontWeight: '500', color: '#111827'},
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
    },
    totalLabel: {fontSize: 16, fontWeight: 'bold', color: '#111827'},
    totalValue: {fontSize: 18, fontWeight: 'bold', color: '#667eea'},

    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center'
    },
    primaryButton: {
        flex: 2,
        backgroundColor: '#667eea',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center'
    },
    buttonText: {fontSize: 16, fontWeight: '600', color: '#111827'},
    primaryButtonText: {fontSize: 16, fontWeight: '600', color: 'white'},

    // Loading and Error States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {fontSize: 16, color: '#6b7280', marginTop: 16},
    errorContainer: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 16,
        margin: 20,
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    retryButton: {
        backgroundColor: '#dc2626',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 12,
        alignSelf: 'center'
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    }
});
