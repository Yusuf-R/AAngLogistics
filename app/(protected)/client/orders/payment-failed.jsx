// app/(protected)/client/orders/failed.jsx
import { View, Text, Button } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PaymentFailed() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderId = params.orderId;
    const reason = params.reason;

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'red', marginBottom: 20 }}>
                ❌ Payment Failed
            </Text>

            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 10 }}>
                {reason || 'Your payment could not be processed.'}
            </Text>

            <View style={{ gap: 15, width: '100%', marginTop: 30 }}>
                <Button
                    title="Retry Payment"
                    onPress={() => router.back()} // Goes back to payment screen
                />

                <Button
                    title="Cancel and Return to Orders"
                    onPress={() => router.replace('/(protected)/client/orders')}
                    color="gray"
                />
            </View>
        </View>
    );
}