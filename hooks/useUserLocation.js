// hooks/useUserLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useUserLocation = () => {
    const [location, setLocation] = useState(null);
    const [permission, setPermission] = useState(null);

    const getLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermission(status);
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                });
            }
        } catch (err) {
            console.error('Location error:', err);
        }
    };

    useEffect(() => { getLocation(); }, []);

    return { location, permission, refreshLocation: getLocation };
};
