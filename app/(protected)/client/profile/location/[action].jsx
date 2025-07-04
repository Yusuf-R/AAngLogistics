import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LocationForm from '../../../../../components/Client/Profile/Locations/LocationForm';
import { useSavedLocationStore } from '../../../../../store/useSavedLocationStore';

function LocationActionScreen() {
    const { action } = useLocalSearchParams();
    const router = useRouter();

    const currentEditLocation = useSavedLocationStore((state) => state.currentEditLocation);
    const clearEditLocation = useSavedLocationStore((state) => state.clearEditLocation);

    const [mode, setMode] = useState('create');
    const [initialData, setInitialData] = useState(null);

    useEffect(() => {
        if (action === 'edit') {
            setMode('edit');
            setInitialData(currentEditLocation);
        } else {
            setMode('create');
            setInitialData(null);
        }
    }, [action, currentEditLocation]);

    // Clean up when component unmounts or navigation changes
    useEffect(() => {
        return () => {
            if (action === 'edit') {
                clearEditLocation();
            }
        };
    }, [action, clearEditLocation]);


    const handleFormCancel = () => {
        // Clear the stored location and navigate back
        if (action === 'edit') {
            clearEditLocation();
        }
        router.replace('/client/profile/location');
    };

    return (
        <LocationForm
            mode={mode}
            initialData={initialData}
            onCancel={handleFormCancel}
            isLoading={false}
        />
    );
}

export default LocationActionScreen;