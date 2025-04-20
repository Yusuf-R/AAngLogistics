// /app/(fallback)/error.jsx
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import SessionManager from "./../../lib/SessionManager";
import { useCallback } from "react";

export default function ErrorFallback() {
    const handleTryAgain = useCallback(() => {
        SessionManager.check();
    }, []);

    return (
        <View className="flex-1 justify-center items-center bg-white px-6">
            <Text className="text-2xl font-['PoppinsSemiBold'] text-red-600 mb-2">
                Something went wrong
            </Text>
            <Text className="text-base text-gray-700 text-center mb-6">
                We couldn't complete the last operation due to an internal issue.
                Please try again or contact support if this persists.
            </Text>

            <TouchableOpacity
                onPress={handleTryAgain}
                className="bg-blue-600 px-6 py-3 rounded-lg"
            >
                <Text className="text-white text-base font-['PoppinsRegular']">
                    Try Again
                </Text>
            </TouchableOpacity>
        </View>
    );
}