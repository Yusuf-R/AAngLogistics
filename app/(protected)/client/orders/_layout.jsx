import {Stack} from 'expo-router';

export default function OrdersLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerBackTitleVisible: false,
                headerShadowVisible: false,
                headerTitleStyle: {
                    fontFamily: 'PoppinsSemiBold',
                    fontSize: 19,
                    color: '#000',
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="create"
                options={{
                    // only show the back button
                    headerTitle: "Create Order",
                    headerBackTitleVisible: false,
                    headerShadowVisible: false,
                }}
            />
        </Stack>
    );
}