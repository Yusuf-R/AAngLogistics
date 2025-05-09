// /app/(authentication)/post-auth-loading.jsx
import {useEffect} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import { useRouter } from 'expo-router';
import SecureStorage from '../../lib/SecureStorage';

export default function PostAuthLoading() {
    const router = useRouter();

    useEffect(() => {
        const proceed = async () => {
            console.log('[AuthLoading] ⏳ Started loading...');

            try {
                const role = await SecureStorage.getRole();
                const expired = await SecureStorage.isAccessTokenExpired();
                const onboarded = await SecureStorage.hasOnboarded();

                console.log('[AuthLoading] 🧾 Role:', role);
                console.log('[AuthLoading] ⏱ Token expired:', expired);
                console.log('[AuthLoading] ✅ Onboarded:', onboarded);

                if (!role || expired || !onboarded) {
                    console.log('[AuthLoading] 🔐 Missing or invalid data. Redirecting to login.');
                    return router.replace('/(authentication)/login');
                }

                setTimeout(() => {
                    console.log(`[AuthLoading] 🚀 Routing to dashboard: /${role}/dashboard`);
                    router.replace(`/(protected)/${role}/dashboard`);
                }, 1500);

            } catch (error) {
                console.error('[AuthLoading] ❌ Unexpected error:', error);
                router.replace('/(fallback)/error');
            }
        };

        proceed();
    }, []);

    return (
        <>
            <View className="flex-1 justify-center items-center bg-[#3b82f6]">
                <ActivityIndicator size="large" color="#fff" />
                <Text className="text-white text-base mt-4 font-['PoppinsRegular']">
                    Setting up your dashboard...
                </Text>
            </View>
        </>
    )
}
