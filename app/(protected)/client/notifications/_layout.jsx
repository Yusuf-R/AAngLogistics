import {Stack} from 'expo-router';
import Ionicons from "@expo/vector-icons/Ionicons";
import {TouchableOpacity} from "react-native";
import {router} from "expo-router";

export default function NotificationLayout() {
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
            <Stack.Screen
                name="details"
                options={{
                    headerTitle: 'Notification Details',
                    headerBackTitleVisible: false,
                    headerTitleAlign: 'center',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} >
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                    ),
                }}
            />
        </Stack>
    );
}