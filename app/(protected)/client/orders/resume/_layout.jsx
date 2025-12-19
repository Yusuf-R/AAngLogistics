import {Stack} from 'expo-router';

export default function ResumeOrdersLayout() {
    return (
        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                    headerBackTitleVisible: false,
                    headerShadowVisible: false,
                }}
            />
        </>
    );
}