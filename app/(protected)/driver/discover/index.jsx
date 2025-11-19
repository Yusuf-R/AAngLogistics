// app/(protected)/driver/discover/index.jsx
import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {useRouter} from 'expo-router';
import Discover from "/components/Driver/Discover/Discover"
import {useSessionStore} from "../../../../store/useSessionStore";
import useLogisticStore, {DELIVERY_STAGES} from "../../../../store/Driver/useLogisticStore";
import useNavigationStore from "../../../../store/Driver/useNavigationStore";

function DiscoverScreen() {
    const router = useRouter();
    const userData = useSessionStore(state => state.user);
    const [isChecking, setIsChecking] = useState(true);

    // ✅ Get delivery state from store
    const {isOnActiveDelivery, activeOrder, deliveryStage} = useLogisticStore();

    // ✅ Get navigation state
    const {isComingFromReview, shouldSkipLiveTracking, clearComingFromReview} = useNavigationStore();

    // ✅ SECURITY CHECK: Redirect if user has active delivery
    useEffect(() => {
        const checkDeliveryStatus = async () => {
            // Small delay for UX and store synchronization
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ CRITICAL: If coming from review, skip live tracking check entirely
            if (shouldSkipLiveTracking()) {
                console.log('🚩 Coming from review - forcing Discover access');
                clearComingFromReview(); // Clear the flag immediately
                setIsChecking(false);
                return;
            }

            // ✅ LAYER 1: Check user availability status
            const isDriverBusy = userData?.availabilityStatus === 'on-delivery';

            // ✅ LAYER 2: Check store delivery state
            const hasActiveDelivery = isOnActiveDelivery && activeOrder;


            // ✅ LAYER 4: Verify order ID matches (if available)
            const hasValidOrderId = userData?.operationalStatus?.currentOrderId &&
                activeOrder?._id &&
                userData.operationalStatus.currentOrderId.toString() === activeOrder._id.toString();

            // Combined security check - if user should be on live tracking instead
            const shouldRedirectToLive = isDriverBusy && hasActiveDelivery;

            if (shouldRedirectToLive) {
                console.log('🔄 Active delivery found - redirecting to Live Tracking');
                router.replace('/driver/discover/live');
            } else {
                console.log('✅ Access granted to Discover');
                setIsChecking(false);
            }
        };

        checkDeliveryStatus();
    }, [userData, isOnActiveDelivery, activeOrder, deliveryStage, shouldSkipLiveTracking]);

    // ✅ Loading State while checking
    if (isChecking) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F9FAFB'
            }}>
                <ActivityIndicator size="large" color="#6366F1"/>
            </View>
        );
    }

    // ✅ Render Discover (no active delivery)
    return (
        <Discover userData={userData}/>
    );
}

export default DiscoverScreen;