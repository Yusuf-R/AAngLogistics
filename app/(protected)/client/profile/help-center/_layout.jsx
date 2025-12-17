import { Stack } from 'expo-router';


export default function HelpCenterLayout() {
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