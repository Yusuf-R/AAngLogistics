import { Stack } from 'expo-router';
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
        </Stack>
    );
}