import {Stack} from 'expo-router';

export default function DashboardLayout() {
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
                    headerShown: false // Hide only for main profile
                }}
            />
        </Stack>
    );
}