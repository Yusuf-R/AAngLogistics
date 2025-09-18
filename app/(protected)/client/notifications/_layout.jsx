import {Stack} from 'expo-router';
import Ionicons from "@expo/vector-icons/Ionicons";
import {TouchableOpacity} from "react-native";
import {router} from "expo-router";

export default function NotificationLayout() {
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
            {/*<Stack.Screen*/}
            {/*    name="details"*/}
            {/*    options={{*/}
            {/*        headerTitle: 'Notification Details',*/}
            {/*        headerBackTitleVisible: false,*/}
            {/*        headerTitleAlign: 'center',*/}
            {/*        headerLeft: () => (*/}
            {/*            <TouchableOpacity onPress={() => router.back()} >*/}
            {/*                <Ionicons name="arrow-back" size={24} color="#111827" />*/}
            {/*            </TouchableOpacity>*/}
            {/*        ),*/}
            {/*    }}*/}
            {/*/>*/}
            <Stack.Screen
                name="details"
                options={{
                    headerShown: false
                }}
            />
        </Stack>
    );
}