import {Stack} from 'expo-router';
import {Text} from "react-native";

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true, // Enable header
                headerBackTitleVisible: false, // Clean back button
                headerShadowVisible: false, // Clean look
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Profile',
                    headerShown: false // Hide only for main profile
                }}
            />

            <Stack.Screen
                name="security"
                options={{
                    title: 'Security',
                }}
            />

            <Stack.Screen
                name="verify-email"
                options={{
                    title: 'Verify Email',
                }}
            />

            <Stack.Screen
                name="update-password"
                options={{
                    title: 'Update Password',
                }}
            />

            <Stack.Screen
                name="activate-email"
                options={{
                    title: 'Activate Email',
                }}
            />

            {/* New screen for email code verification */}
            <Stack.Screen
                name="verify-email-code"
                options={{
                    title: 'Enter Verification Code',
                }}
            />

            <Stack.Screen
                name="auth-pin"
                options={{
                    title: 'Set Pin',
                }}
            />

            <Stack.Screen
                name="update-pin"
                options={{
                    title: 'Update Pin',
                }}
            />

            <Stack.Screen
                name="reset-pin"
                options={{
                    title: 'Reset Pin',
                }}
            />

            <Stack.Screen
                name="pin-email"
                options={{
                    title: 'Get Token',
                }}
            />

        </Stack>
    );
}