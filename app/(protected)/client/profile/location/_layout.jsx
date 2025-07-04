import {Stack} from 'expo-router';
import Ionicons from "@expo/vector-icons/Ionicons";
import {TouchableOpacity} from "react-native";
import {router} from "expo-router";

export default function  LocationLayout() {

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
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="[action]"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="map-picker-edit"
                options={{
                    headerShown: false,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ paddingHorizontal: 10 }}
                        >
                            <Ionicons name="chevron-back" size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen
                name="map-picker"
                options={{
                    headerShown: false,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ paddingHorizontal: 10 }}
                        >
                            <Ionicons name="chevron-back" size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                }}
            />
        </Stack>
    );
}