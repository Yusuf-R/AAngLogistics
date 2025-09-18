//client/orders/track.jsx
import {Text, View, Alert} from "react-native";
import {router} from 'expo-router';
import {useOrderStore} from "../../../../store/useOrderStore";
import React, {useEffect} from "react";
import TrackOrder from "../../../../components/Client/Orders/TrackOrder";

// /client/orders/track.jsx - Enhanced version
function TrackOrderScreen() {
    const { trackingOrder, liveTrackingData, driverLocations } = useOrderStore();

    useEffect(() => {
        if (!trackingOrder) {
            Alert.alert("Missing orderRef", "Redirecting to orders");
            router.replace('/client/orders');
        }
    }, [trackingOrder]);

    if (!trackingOrder) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text>Redirecting...</Text>
            </View>
        );
    }

    // Get live data for this order
    const liveData = liveTrackingData.get(trackingOrder._id);
    const driverLocation = driverLocations.get(trackingOrder._id);

    return (
        <TrackOrder
            trackingOrder={trackingOrder}
            liveData={liveData}
            driverLocation={driverLocation}
        />
    );
}

export default TrackOrderScreen;