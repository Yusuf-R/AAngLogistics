import { Text, View, KeyboardAvoidingView, Platform } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import ResetPassword from "../../components/Landing/ResetPassword";

function ResetPasswordScreen() {
    const { email } = useLocalSearchParams();
    const isValidEmail = typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email);

    if (!isValidEmail) {
        return (
            <View className="flex-1 justify-center items-center px-5 bg-white">
                <Text className="text-base text-gray-600 text-center font-medium">
                    Unknown operation. Please use a valid password reset link.
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
        >
            <ResetPassword email={email} />
        </KeyboardAvoidingView>
    );
}

export default ResetPasswordScreen;
