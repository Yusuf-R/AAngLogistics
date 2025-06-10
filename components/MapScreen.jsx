import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationPermission, setLocationPermission] = useState(false);
    const mapRef = useRef(null);

    // Request location permissions
    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setError('Location permission is required to show your current location');
                setLocationPermission(false);
                return false;
            }

            setLocationPermission(true);
            return true;
        } catch (err) {
            setError('Failed to request location permission');
            return false;
        }
    };

    // Get current location
    const getCurrentLocation = async () => {
        try {
            setLoading(true);

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 15000,
                maximumAge: 10000,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setCurrentLocation(coords);

            // Set region with appropriate zoom level
            const newRegion = {
                ...coords,
                latitudeDelta: 0.01, // Closer zoom
                longitudeDelta: 0.01,
            };

            setRegion(newRegion);
            setError(null);

        } catch (err) {
            console.error('Location error:', err);
            setError('Could not get your current location. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Initialize location on component mount
    useEffect(() => {
        const initializeLocation = async () => {
            const hasPermission = await requestLocationPermission();
            if (hasPermission) {
                await getCurrentLocation();
            } else {
                setLoading(false);
            }
        };

        initializeLocation();
    }, []);

    // Center map on user location
    const centerOnUser = () => {
        if (currentLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                ...currentLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    };

    // Refresh location
    const refreshLocation = async () => {
        if (locationPermission) {
            await getCurrentLocation();
        } else {
            const hasPermission = await requestLocationPermission();
            if (hasPermission) {
                await getCurrentLocation();
            }
        }
    };

    // Error state
    if (error && !locationPermission) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={refreshLocation}
                >
                    <Text style={styles.retryButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
        );
    }

    // Error state with retry
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={refreshLocation}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={region}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={true}
                loadingEnabled={true}
                mapType="standard"
                onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
            >
                {currentLocation && (
                    <Marker
                        coordinate={currentLocation}
                        title="Your Current Location"
                        description="You are here"
                        pinColor="blue"
                    />
                )}
            </MapView>

            {/* Control buttons */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={centerOnUser}
                >
                    <Text style={styles.controlButtonText}>📍</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={refreshLocation}
                >
                    <Text style={styles.controlButtonText}>🔄</Text>
                </TouchableOpacity>
            </View>

            {/* Location info */}
            {currentLocation && (
                <View style={styles.locationInfo}>
                    <Text style={styles.locationText}>
                        Lat: {currentLocation.latitude.toFixed(6)}
                    </Text>
                    <Text style={styles.locationText}>
                        Lng: {currentLocation.longitude.toFixed(6)}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    map: {
        width: width,
        height: height - 100, // Leave space for other UI elements
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    controls: {
        position: 'absolute',
        right: 16,
        bottom: 100,
        flexDirection: 'column',
        gap: 12,
    },
    controlButton: {
        backgroundColor: 'white',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    controlButtonText: {
        fontSize: 20,
    },
    locationInfo: {
        position: 'absolute',
        top: 50,
        left: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    locationText: {
        fontSize: 12,
        color: '#333',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});