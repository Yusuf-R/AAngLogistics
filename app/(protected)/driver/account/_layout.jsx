import {Stack} from 'expo-router';

export default function AccountLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
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

            <Stack.Screen
                name="profile"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="verification"
                options={{
                    headerShown: false
                }}
            />
        </Stack>
    );
}