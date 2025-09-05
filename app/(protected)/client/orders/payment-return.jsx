// app/(protected)/client/orders/payments-return.jsx
import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentReturn() {
    const router = useRouter();
    const { status, reference, orderId, reason } = useLocalSearchParams();

    useEffect(() => {
        // Optional: call your BE to fetch latest payment status by reference/orderId
        // and trust BE as source of truth.
        if (!status) return;

        if (status === 'success') {
            // Navigate to a simple confirmation screen or inline message
            router.replace({
                pathname: '/(protected)/client/orders/payment-success',
                params: { reference, orderId },
            });
        } else if (status === 'failed' || status === 'cancelled') {
            router.replace({
                pathname: '/(protected)/client/orders/payment-failed',
                params: { reference, orderId, reason },
            });
        } else {
            // Unknown status → show fallback
            router.replace('/(protected)/client/orders');
        }
    }, [status]);

    return (
        <View style={{ flex: 1, alignItems:'center', justifyContent:'center' }}>
            <ActivityIndicator />
            <Text>Finalizing payment…</Text>
        </View>
    );
}
