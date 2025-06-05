import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, PermissionsAndroid } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function MapScreen() {
    const [origin, setOrigin] = useState(null);
    const [region, setRegion] = useState(null);

    // Hardcoded destination for now
    const destination = {
        latitude: 6.4531,    // Lekki
        longitude: 3.3958,
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const coords = location.coords;

            setOrigin({
                latitude: coords.latitude,
                longitude: coords.longitude,
            });

            setRegion({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        })();
    }, []);

    if (!region || !origin) return <View style={styles.loadingContainer} />;

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                region={region}
                showsUserLocation={true}
                loadingEnabled={true}
                provider={PROVIDER_GOOGLE}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
            >
                <Marker coordinate={origin} title="Your Location" />
                <Marker coordinate={destination} title="Drop-off" />

                <MapViewDirections
                    origin={origin}
                    destination={destination}
                    apikey={GOOGLE_MAPS_APIKEY}
                    strokeWidth={4}
                    strokeColor="#1E90FF"
                    onReady={result => {
                        console.log(`Distance: ${result.distance} km`);
                        console.log(`Duration: ${result.duration} min`);
                    }}
                    onError={err => console.error(err)}
                />
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});


export default MapScreen;