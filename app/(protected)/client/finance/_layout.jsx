// app/(protected)/client/finance/_layout.jsx
import {Stack} from 'expo-router';
import { PaystackProvider } from 'react-native-paystack-webview';

export default function FinanceLayout() {
    const publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;

    console.log('🔑 Paystack Public Key:', publicKey ? 'Present' : 'MISSING!');

    if (!publicKey) {
        console.error('❌ PAYSTACK_PUBLIC_KEY is missing!');
    }
    return (
        <>
            <PaystackProvider
                publicKey={publicKey}
            >
                <Stack
                    screenOptions={{
                        headerShown: false,
                        headerBackTitleVisible: false,
                        headerShadowVisible: false,
                    }}
                >
                    <Stack.Screen
                        name="index"
                        options={{
                            headerShown: false
                        }}
                    />
                </Stack>
            </PaystackProvider>
        </>
    );
}