// /app/(fallback)/network-error.jsx
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import SessionManager from "./../../lib/SessionManager";
import { useCallback } from "react";

export default function NetworkError() {
    const handleRetry = useCallback(() => {
        SessionManager.check();
    }, []);

    return (
        <View className="flex-1 justify-center items-center bg-white px-6">
            <Text className="text-2xl font-['PoppinsSemiBold'] text-red-600 mb-2">
                No Internet Connection
            </Text>
            <Text className="text-base text-gray-700 text-center mb-6">
                Please check your connection and try again.
            </Text>

            <TouchableOpacity
                onPress={handleRetry}
                className="bg-blue-600 px-6 py-3 rounded-lg"
            >
                <Text className="text-white text-base font-['PoppinsRegular']">
                    Retry
                </Text>
            </TouchableOpacity>
        </View>
    );
}