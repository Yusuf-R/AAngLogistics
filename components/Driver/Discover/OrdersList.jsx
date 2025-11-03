// components/Driver/Discover/OrdersList.jsx
import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Platform,
    Modal,
    ScrollView,
    Dimensions,
    RefreshControl
} from 'react-native';
import * as Location from 'expo-location';
import {Ionicons} from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {useSessionStore} from '../../../store/useSessionStore';
import * as Haptics from 'expo-haptics';
import {BlurView} from 'expo-blur';
import {toast} from 'sonner-native';
import useLogisticStore from '../../../store/Driver/useLogisticStore';
import ScanOverlay from "./ScanOverlay";
import ScanSettingsModal from "./ScanSettingsModal";
import OrdersListModal from "./OrdersListModal";

const {width: SCREEN_W} = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function OrdersList() {
    const userData = useSessionStore((state) => state.user);
    const firstName = userData?.fullName?.split?.(' ')?.[0] || 'Driver';

    const {
        currentLocation: storeLocation,
        fetchAvailableOrders,
        updateLocation,
        isOnActiveDelivery,
        resetStore,
        tabOrders
    } = useLogisticStore();

// Get orders-specific data
    const {availableOrders, orderCount, isFetchingOrders} = tabOrders.orders;

    const [location, setLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [savedLocationsModal, setSavedLocationsModal] = useState(false);
    const [manualLocation, setManualLocation] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [showScanOverlay, setShowScanOverlay] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);

    // Animation values
    const pulse1 = useSharedValue(0);
    const pulse2 = useSharedValue(0);
    const pulse3 = useSharedValue(0);

    const autocompleteRef = useRef(null);
    const savedLocations = userData?.savedLocations || [];

    useEffect(() => {
        useLogisticStore.getState().setCurrentTabContext('orders');
        initializeLocation();
    }, []);

    // Sonar animation for current location indicator
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
        } else {
            // Stop animations if no location
            cancelAnimation(pulse1);
            cancelAnimation(pulse2);
            cancelAnimation(pulse3);
        }

        return () => {
            cancelAnimation(pulse1);
            cancelAnimation(pulse2);
            cancelAnimation(pulse3);
        };
    }, [location]);

    const initializeLocation = async () => {
        try {
            setErrorMsg(null);
            setLocationLoading(true); // Start loading

            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                setErrorMsg('Location access needed for better results');
                setLocationLoading(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                timeout: 10000, // 10 second timeout
            });
            const {latitude, longitude} = currentLocation.coords;

            setLocation(currentLocation.coords);
            updateLocation(currentLocation.coords, 'orders');

            // Fetch orders for current location (non-blocking)
            fetchAvailableOrders({
                lat: latitude,
                lng: longitude,
            }, true, 'orders').catch(error => {
                console.log('Background order fetch failed:', error);
            });

            // Watch position updates in background
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced, // Lower accuracy for performance
                    timeInterval: 15000, // 15 seconds
                    distanceInterval: 50 // 50 meters
                },
                (newLocation) => {
                    setLocation(newLocation.coords);
                    updateLocation(newLocation.coords, 'orders');
                }
            ).catch(error => {
                console.log('Location watching failed:', error);
            });

        } catch (error) {
            console.log('Location init error:', error);
            setErrorMsg('Location temporarily unavailable');
        } finally {
            setLocationLoading(false); // Always stop loading
        }
    };

    const handlePlaceSelect = useCallback((data, details) => {
        if (!details?.geometry?.location) return;

        const {lat, lng} = details.geometry.location;

        setManualLocation({
            latitude: lat,
            longitude: lng,
            address: details.formatted_address || data.description
        });
        setSelectedLocation(null);

        updateLocation({latitude: lat, longitude: lng}, 'orders');
        Keyboard.dismiss();

        toast.success('Location updated');
    }, [updateLocation]);

    const handleSavedLocationSelect = useCallback((savedLocation) => {
        const {coordinates} = savedLocation;

        setSelectedLocation(savedLocation);
        setManualLocation(null);
        setSavedLocationsModal(false);
        setLocationLoading(false);

        updateLocation({
            latitude: coordinates.lat,
            longitude: coordinates.lng,
        }, 'orders');

        toast.success('Location updated');
    }, [updateLocation]);

    const handleCurrentLocation = useCallback(async () => {
        setLocationLoading(true);
        try {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });
            setLocationLoading(false);

            setLocation(currentLocation.coords);
            setSelectedLocation(null);
            setManualLocation(null);
            updateLocation(currentLocation.coords, 'orders');

            toast.success('Using current location');
        } catch (error) {
            setLocationLoading(false);
            console.log('Location error:', error);
            toast.error('Failed to get location');
            // update the UI since the location is not available
            setLocation(null);
            setSelectedLocation(null);
            setManualLocation(null);
            useLogisticStore.getState().clearTabOrders('orders');
        }
    }, [updateLocation]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        await fetchAvailableOrders(null, false, 'orders');


        setRefreshing(false);
    }, [fetchAvailableOrders]);

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

    const getActiveLocationDisplay = () => {
        if (manualLocation) {
            return {
                label: 'Selected Location',
                address: manualLocation.address,
                icon: 'location',
                color: '#EF4444',
                status: 'ready'
            };
        }
        if (selectedLocation) {
            return {
                label: selectedLocation.locationType.charAt(0).toUpperCase() +
                    selectedLocation.locationType.slice(1),
                address: selectedLocation.address,
                icon: getLocationIcon(selectedLocation.locationType),
                color: '#F59E0B',
                status: 'ready'
            };
        }
        if (location) {
            return {
                label: 'Current Location',
                address: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
                icon: 'navigate',
                color: '#6366F1',
                status: 'ready'
            };
        }
        if (locationLoading) {
            return {
                label: 'Finding Location',
                address: 'Searching for your current position...',
                icon: 'location',
                color: '#6B7280',
                status: 'loading'
            };
        }
        return {
            label: 'Location Needed',
            address: 'Enable location for better results',
            icon: 'flash-off',
            color: '#EF4444',
            status: 'error'
        };
    };

    // Pulse animations
    const pulse1Style = useAnimatedStyle(() => ({
        transform: [{scale: pulse1.value * 2 + 1}],
        opacity: 1 - pulse1.value
    }));
    const pulse2Style = useAnimatedStyle(() => ({
        transform: [{scale: pulse2.value * 2 + 1}],
        opacity: 1 - pulse2.value
    }));
    const pulse3Style = useAnimatedStyle(() => ({
        transform: [{scale: pulse3.value * 2 + 1}],
        opacity: 1 - pulse3.value
    }));

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


    const activeLocation = getActiveLocationDisplay();

    return (
        <>
            <View style={styles.container}>
                <ScrollView
                    style={styles.mainScrollView}
                    contentContainerStyle={styles.mainScrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#6366F1"
                        />
                    }
                >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.heroContent}>
                            <Text style={styles.heroTitle}>
                                Hi, {firstName} 👋
                            </Text>
                            <Text style={styles.heroDescription}>
                                Pick a location or scan your current area to discover delivery requests near you.
                            </Text>
                        </View>

                        {/* Animated illustration */}
                        <View style={styles.heroIllustration}>
                            <View style={styles.illustrationCircle}>
                                <Ionicons name="cube-sharp" size={32} color="#6366F1"/>
                            </View>
                            {/* Only show pulses when location is ready */}
                            {location && (
                                <>
                                    <Animated.View style={[styles.illustrationPulse, pulse1Style]}/>
                                    <Animated.View style={[styles.illustrationPulse, pulse2Style]}/>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Search Section */}
                    <View style={styles.searchSection}>
                        <Text style={styles.sectionLabel}>Search Location</Text>
                        {AutocompleteComponent}

                        <View style={styles.locationActionsRow}>
                            {savedLocations.length > 0 && (
                                <TouchableOpacity
                                    style={styles.savedLocationsButton}
                                    onPress={() => setSavedLocationsModal(true)}
                                >
                                    <Ionicons name="bookmark" size={18} color="#6366F1"/>
                                    <Text style={styles.savedLocationsText}>Saved</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.currentLocationButton,
                                    locationLoading && styles.buttonDisabled
                                ]}
                                onPress={handleCurrentLocation}
                                disabled={locationLoading}
                            >
                                <Ionicons
                                    name={locationLoading ? "hourglass" : "navigate"}
                                    size={18}
                                    color={locationLoading ? "#9CA3AF" : "#6366F1"}
                                />
                                <Text style={[
                                    styles.currentLocationText,
                                    locationLoading && styles.textDisabled
                                ]}>
                                    {locationLoading ? 'Finding...' : 'Current'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Active Location Display */}
                    <View style={[
                        styles.activeLocationCard,
                        activeLocation.status === 'error' && styles.locationCardError,
                        activeLocation.status === 'loading' && styles.locationCardLoading
                    ]}>
                        <View style={styles.locationIndicator}>
                            <View style={[
                                styles.locationIconContainer,
                                {backgroundColor: `${activeLocation.color}15`}
                            ]}>
                                {activeLocation.status === 'loading' ? (
                                    <ActivityIndicator size="small" color={activeLocation.color}/>
                                ) : (
                                    <Ionicons
                                        name={activeLocation.icon}
                                        size={20}
                                        color={activeLocation.color}
                                    />
                                )}
                            </View>

                        </View>

                        <View style={styles.locationInfo}>
                            <Text style={styles.locationLabel}>{activeLocation.label}</Text>
                            <Text style={styles.locationAddress} numberOfLines={2}>
                                {activeLocation.address}
                            </Text>
                            {activeLocation.status === 'error' && (
                                <TouchableOpacity
                                    style={styles.retryLocationButton}
                                    onPress={initializeLocation}
                                >
                                    <Text style={styles.retryLocationText}>Try Again</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Orders Summary Card */}
                    <TouchableOpacity
                        style={styles.ordersSummaryCard}
                        onPress={() => setShowOrdersModal(true)}
                        activeOpacity={0.7}
                        disabled={isFetchingOrders}
                    >
                        <View style={styles.summaryLeft}>
                            <View style={styles.ordersIconContainer}>
                                <Ionicons name="cube" size={28} color="#6366F1"/>
                                {isFetchingOrders ? (
                                    <ActivityIndicator size="small" color="#6366F1" style={styles.loadingBadge}/>
                                ) : orderCount > 0 ? (
                                    <View style={styles.summaryBadge}>
                                        <Text style={styles.summaryBadgeText}>{orderCount}</Text>
                                    </View>
                                ) : null}
                            </View>

                            <View>
                                <Text style={styles.summaryTitle}>Available Orders</Text>
                                <Text style={styles.summarySubtitle}>
                                    {isFetchingOrders
                                        ? 'Searching...'
                                        : orderCount > 0
                                            ? `${orderCount} order${orderCount > 1 ? 's' : ''} nearby`
                                            : 'No orders found'
                                    }
                                </Text>
                            </View>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={isFetchingOrders ? "#D1D5DB" : "#9CA3AF"}
                        />
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowSettingsModal(true)}
                        >
                            <Ionicons name="settings-outline" size={24} color="#6366F1"/>
                            <Text style={styles.actionButtonText}>Scan Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.scanButton]}
                            onPress={() => setShowScanOverlay(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="radio" size={24} color="#fff"/>
                            <Text style={styles.scanButtonText}>Start Scan</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Orders List Preview */}
                    <ScrollView
                        style={styles.ordersPreview}
                        contentContainerStyle={styles.ordersPreviewContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor="#6366F1"
                            />
                        }
                    >
                        <View style={styles.previewHeader}>
                            <Text style={styles.previewTitle}>Nearby Orders</Text>
                            <TouchableOpacity onPress={handleRefresh} disabled={isFetchingOrders}>
                                <Ionicons
                                    name="refresh"
                                    size={20}
                                    color={isFetchingOrders ? "#D1D5DB" : "#6366F1"}
                                />
                            </TouchableOpacity>
                        </View>

                        {isFetchingOrders ? (
                            <View style={styles.loadingOrders}>
                                <ActivityIndicator size="small" color="#6366F1"/>
                                <Text style={styles.loadingOrdersText}>Searching for orders...</Text>
                            </View>
                        ) : availableOrders.length === 0 ? (
                            <View style={styles.emptyOrders}>
                                <Ionicons name="cube-outline" size={48} color="#D1D5DB"/>
                                <Text style={styles.emptyOrdersTitle}>No Orders Available</Text>
                                <Text style={styles.emptyOrdersText}>
                                    Try scanning or adjusting your location
                                </Text>
                            </View>
                        ) : (
                            availableOrders.slice(0, 3).map((order) => (
                                <TouchableOpacity
                                    key={order._id}
                                    style={styles.orderPreviewCard}
                                    onPress={() => setShowOrdersModal(true)}
                                >
                                    <View style={styles.orderPreviewHeader}>
                                        <Text style={styles.orderRef}>{order.orderRef}</Text>
                                        <View style={styles.distanceBadge}>
                                            <Ionicons name="location" size={12} color="#6B7280"/>
                                            <Text style={styles.distanceText}>{order.distance}km</Text>
                                        </View>
                                    </View>

                                    <View style={styles.orderPreviewRoute}>
                                        <Ionicons name="ellipse" size={10} color="#10B981"/>
                                        <Text style={styles.orderPreviewAddress} numberOfLines={1}>
                                            {order.location.pickUp.address}
                                        </Text>
                                    </View>

                                    <View style={styles.orderPreviewRoute}>
                                        <Ionicons name="location" size={10} color="#EF4444"/>
                                        <Text style={styles.orderPreviewAddress} numberOfLines={1}>
                                            {order.location.dropOff.address}
                                        </Text>
                                    </View>

                                    <View style={styles.orderPreviewFooter}>
                                        <Text style={styles.orderEarnings}>
                                            ₦{order.pricing.totalAmount.toLocaleString()}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF"/>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}

                        {availableOrders.length > 3 && (
                            <TouchableOpacity
                                style={styles.viewAllButton}
                                onPress={() => setShowOrdersModal(true)}
                            >
                                <Text style={styles.viewAllText}>
                                    View All {orderCount} Orders
                                </Text>
                                <Ionicons name="arrow-forward" size={16} color="#6366F1"/>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </ScrollView>

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
                                        <Text style={styles.savedLocationAddress} numberOfLines={2}>
                                            {savedLocation.address}
                                        </Text>
                                        {savedLocation.landmark && (
                                            <Text style={styles.locationLandmark}>
                                                📍 {savedLocation.landmark}
                                            </Text>
                                        )}
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF"/>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </Modal>

                {/* Modals */}
                <ScanOverlay
                    visible={showScanOverlay}
                    onClose={() => setShowScanOverlay(false)}
                    onScanComplete={handleScanComplete}
                    targetTab="orders"
                />

                <ScanSettingsModal
                    visible={showSettingsModal}
                    onClose={() => setShowSettingsModal(false)}
                    targetTab="orders"
                />

                <OrdersListModal
                    visible={showOrdersModal}
                    onClose={() => setShowOrdersModal(false)}
                    sourceTab="orders"
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    mainScrollView: {
        flex: 1
    },
    mainScrollContent: {
        flexGrow: 1
    },

    // Hero Section styles
    heroSection: {
        paddingHorizontal: 16,
        paddingVertical: 64,
        marginBottom: 8
    },
    heroContent: {
        marginBottom: 20
    },
    heroGreeting: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 4
    },
    heroTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 8
    },
    heroDescription: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        lineHeight: 20
    },
    heroIllustration: {
        alignSelf: 'center',
        position: 'relative',
        marginTop: 20
    },
    illustrationCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2
    },
    illustrationPulse: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#6366F1',
        backgroundColor: 'transparent',
        zIndex: 1
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 8
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: Platform.OS === 'ios' ? 60 : 20
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F9FAFB'
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginTop: 12
    },
    errorText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 16
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold'
    },

    // Search Section
    searchSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12
    },
    locationActionsRow: {
        flexDirection: 'row',
        gap: 12
    },
    savedLocationsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    savedLocationsText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },
    currentLocationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    currentLocationText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },

    // Active Location Card
    activeLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    locationIndicator: {
        position: 'relative',
        marginRight: 16
    },
    locationIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2
    },
    pulseContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
    },
    pulse: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        backgroundColor: 'transparent'
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 4
    },
    locationAddress: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        lineHeight: 20
    },

    // Orders Summary Card
    ordersSummaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    summaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1
    },
    ordersIconContainer: {
        position: 'relative'
    },
    summaryBadge: {
        position: 'absolute',
        top: -8,
        right: -10,
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
    summaryBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold'
    },
    summaryTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4
    },
    summarySubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },

    // Action Buttons
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 12
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    actionButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },
    scanButton: {
        backgroundColor: '#6366F1'
    },
    scanButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },

    // Orders Preview
    ordersPreview: {
        flex: 1
    },
    ordersPreviewContent: {
        paddingHorizontal: 16,
        paddingBottom: 20
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    previewTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    loadingOrders: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 40
    },
    loadingOrdersText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    emptyOrders: {
        alignItems: 'center',
        paddingVertical: 40
    },
    emptyOrdersTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginTop: 12,
        marginBottom: 4
    },
    emptyOrdersText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center'
    },

    // Order Preview Card
    orderPreviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2
    },
    orderPreviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    orderRef: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    distanceText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    orderPreviewRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6
    },
    orderPreviewAddress: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#374151'
    },
    orderPreviewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    orderEarnings: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#10B981'
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#EEF2FF',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 4
    },
    viewAllText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },

    // Saved Locations Modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 60 : 20
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    modalContent: {
        flex: 1,
        padding: 20
    },
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
    locationDetails: {
        flex: 1
    },
    locationType: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4
    },
    savedLocationAddress: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 4
    },
    locationLandmark: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9CA3AF'
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    textDisabled: {
        color: '#9CA3AF',
    },
    locationCardError: {
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    locationCardLoading: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    retryLocationButton: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    retryLocationText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#EF4444',
    },
    loadingOverlay: {
        position: 'absolute',
    },
    loadingBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
    },
});

export default OrdersList;