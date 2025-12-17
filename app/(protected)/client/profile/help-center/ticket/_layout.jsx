import { Stack } from 'expo-router';

export default function ClientTicketLayout() {

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