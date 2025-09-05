// app/(protected)/client/orders/success.jsx
import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOrderStore } from '../../../../store/useOrderStore';

export default function PaymentSuccess() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderId = params.orderId;
    const { clearDraft } = useOrderStore();

    useEffect(() => {
        // Clear the draft order data immediately
        clearDraft();

        // Hard redirect to orders page after 3 seconds
        const timer = setTimeout(() => {
            // Use replace to prevent going back
            router.replace('/(protected)/client/orders');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="green" />
            <Text style={{ marginTop: 20, fontSize: 18 }}>
                Payment successful! Redirecting to orders...
            </Text>
        </View>
    );
}