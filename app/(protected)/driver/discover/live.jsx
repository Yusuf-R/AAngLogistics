// app/(protected)/driver/discover/live.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LiveTrackingManager  from "../../../../components/Driver/Discover/LiveTrackingManager";
import { useSessionStore } from "../../../../store/useSessionStore";
import useLogisticStore, { DELIVERY_STAGES } from "../../../../store/Driver/useLogisticStore";
import { toast } from 'sonner-native';

function LiveTrackingScreen() {
    const router = useRouter();
    const userData = useSessionStore(state => state.user);
    const [isVerifying, setIsVerifying] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    // ✅ Get delivery state from store
    const {
        isOnActiveDelivery,
        activeOrder,
        deliveryStage
    } = useLogisticStore();

    // ✅ MULTI-LAYER SECURITY CHECK
    useEffect(() => {
        const verifyAccess = async () => {
            // Small delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ LAYER 1: Check user availability status
            const isDriverBusy = userData?.availabilityStatus === 'on-delivery';

            // ✅ LAYER 2: Check store delivery state
            const hasActiveDelivery = isOnActiveDelivery && activeOrder;

            // ✅ LAYER 3: Check delivery stage (not discovering/completed/cancelled)
            const isValidStage = deliveryStage !== DELIVERY_STAGES.DISCOVERING &&
                deliveryStage !== DELIVERY_STAGES.COMPLETED &&
                deliveryStage !== DELIVERY_STAGES.CANCELLED;

            // ✅ LAYER 4: Verify order ID matches (if available)
            const hasValidOrderId = userData?.operationalStatus?.currentOrderId &&
                activeOrder?._id &&
                userData.operationalStatus.currentOrderId.toString() === activeOrder._id.toString();

            // Combined security check
            const hasValidAccess = isDriverBusy && hasActiveDelivery && isValidStage;

            if (!hasValidAccess) {
                console.log('❌ Access denied to Live Tracking');
                setAccessDenied(true);
                toast.error('No active delivery found');

                // Redirect to discover after showing error
                setTimeout(() => {
                    router.replace('/driver/discover');
                }, 2000);
            } else {
                console.log('✅ Access granted to Live Tracking');
                setIsVerifying(false);
            }
        };

        verifyAccess();
    }, [userData, isOnActiveDelivery, activeOrder, deliveryStage]);

    // ✅ SECURITY: Prevent access when delivery completes
    useEffect(() => {
        // If delivery suddenly becomes inactive, redirect
        if (!isVerifying && !isOnActiveDelivery) {
            console.log('🔄 Delivery completed - redirecting to Discover');
            toast.info('Delivery completed');
            router.replace('/driver/discover');
        }
    }, [isOnActiveDelivery, isVerifying]);

    // ✅ Loading State
    if (isVerifying) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Verifying delivery status...</Text>
            </View>
        );
    }

    // ✅ Access Denied State
    if (accessDenied) {
        return (
            <View style={styles.deniedContainer}>
                <Ionicons name="lock-closed" size={64} color="#EF4444" />
                <Text style={styles.deniedTitle}>Access Denied</Text>
                <Text style={styles.deniedMessage}>
                    You don't have an active delivery.{'\n'}
                    Redirecting to discover...
                </Text>
                <ActivityIndicator size="large" color="#EF4444" style={{ marginTop: 20 }} />
            </View>
        );
    }

    // ✅ Render Live Tracking (access granted)
    return (
        <LiveTrackingManager userData={userData} />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        gap: 16
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    deniedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 40,
        gap: 12
    },
    deniedTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#EF4444',
        marginTop: 16
    },
    deniedMessage: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22
    }
});

export default LiveTrackingScreen;