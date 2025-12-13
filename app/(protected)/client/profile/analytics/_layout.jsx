import { Stack } from 'expo-router';


export default function ClientAnalyticsLayout() {

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerBackTitleVisible: false,
                headerShadowVisible: false,
            }}
        />
    );
}