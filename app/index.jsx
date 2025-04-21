// /app/index.jsx
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import SessionManager from "../lib/SessionManager";

export default function Index() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        const resolve = async () => {
            const target = await SessionManager.resolveRoute();
            if (target && target !== "/") {
                // Delay before routing to make indicator feel more natural
                setTimeout(() => {
                    router.replace(target);
                }, 2000);
            } else {
                setChecking(false); // Stay on index.jsx
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
                    Initializing...
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
                        Login
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
