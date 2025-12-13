import {Stack} from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true, // Enable header
                headerBackTitleVisible: false,
                headerShadowVisible: false,
                headerTitleAlign: 'center',
                headerTitleStyle: {
                    fontFamily: 'PoppinsSemiBold',
                    fontSize: 19,
                },

            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Profile',
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="edit-profile"
                options={{
                    title: 'Edit Profile',
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="analytics"
                options={{
                    title: 'Analytics',
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="location"
                options={{
                    title: 'Location Settings',
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="security"
                options={{
                    title: 'Security',
                }}
            />

            <Stack.Screen
                name="utility"
                options={{
                    title: 'Developer Utilities',
                }}
            />

            <Stack.Screen
                name="tcs"
                options={{
                    title: 'Terms & Conditions',
                    // make it at the center
                    headerTitleAlign: 'center',
                }}
            />

            <Stack.Screen
                name="privacy-policy"
                options={{
                    title: 'Privacy Policy',
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

            <Stack.Screen
                name="update-avatar"
                options={{
                    title: 'Update Avatar',
                }}
            />



            <Stack.Screen
                name="payment"
                options={{
                    title: 'Payment',
                }}
            />



            <Stack.Screen
                name="help-center"
                options={{
                    title: 'Help & Support',
                }}
            />

            <Stack.Screen
                name="nin-verification"
                options={{
                    title: 'NIN Verification',
                }}
            />

        </Stack>
    );
}