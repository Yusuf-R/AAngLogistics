import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

export default function Index() {
    const router = useRouter();
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        contentOpacity.value = withTiming(1, { duration: 1000 });
    }, [contentOpacity]);

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

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
                        Get Started
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
