import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import SessionManager from "../lib/SessionManager";
import SecureStorage from "../lib/SecureStorage";
import { refreshAccessToken } from "../lib/TokenManager";

export default function Index() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [loadingText, setLoadingText] = useState("Initializing...");
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        const resolve = async () => {
            setLoadingText("Checking session...");

            // Give time for SecureStorage to settle after sign-in
            await new Promise((res) => setTimeout(res, 200));

            const token = await SecureStorage.getAccessToken();
            const role = await SecureStorage.getRole();
            const isExpired = await SecureStorage.isAccessTokenExpired();
            const onboarded = await SecureStorage.hasOnboarded();

            console.log("[Index] 🔍 Role:", role, "| Expired:", isExpired, "| Onboarded:", onboarded);

            // Contextual loading text
            if (role && !isExpired) {
                setLoadingText("Setting up your dashboard...");
            } else if (!role && onboarded) {
                setLoadingText("Redirecting to login...");
            } else if (!onboarded) {
                setLoadingText("Launching onboarding...");
            }

            // 👇 Add this block: Attempt refresh if expired and refreshToken exists
            if (token && isExpired) {
                const refreshed = await refreshAccessToken();
                if (!refreshed) {
                    return router.replace("/(authentication)/login");
                }
            }

            const target = await SessionManager.resolveRoute();

            if (target && target !== "/") {
                console.log("[Index] 🚀 Routing to:", target);
                // Short delay to show the loading message
                setTimeout(() => {
                    router.replace(target);
                }, 600);
            } else {
                setChecking(false);
                contentOpacity.value = withTiming(1, { duration: 1000 });
            }
        };

        resolve();
    }, []);

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    if (checking) {
        return (
            <View className="flex-1 justify-center items-center bg-[#3b82f6]">
                <ActivityIndicator size="large" color="#fff" />
                <Text className="text-white text-base mt-4 font-['PoppinsRegular']">
                    {loadingText}
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#3b82f6] justify-center items-center px-4">
            <Animated.View style={contentStyle} className="w-full items-center">
                <Text className="text-3xl font-['PoppinsSemiBold'] text-white mb-2">
                    AAng Logistics
                </Text>
                <Text className="text-lg font-['PoppinsItalic'] text-white/80 mb-8">
                    Delivering Excellence Worldwide
                </Text>
                <TouchableOpacity
                    className="bg-white w-full py-4 rounded-lg mb-4"
                    onPress={() => router.push("/(authentication)/login")}
                >
                    <Text className="text-[#3b82f6] text-center text-lg font-['PoppinsRegular']">
                        Login Page
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
