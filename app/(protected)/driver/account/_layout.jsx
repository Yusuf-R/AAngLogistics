import {Redirect, Stack, usePathname} from 'expo-router';
import {useSessionStore} from "../../../../store/useSessionStore";

export default function AccountLayout() {
    const userData = useSessionStore((state) => state.user);
    const isAccepted = !!userData?.tcs?.isAccepted;

    // allowlist so you don't get loops if you ever show T&Cs inside /driver
    const pathname = usePathname();
    const allowlist = ['/driver/tcs', '/driver/tcs-required'];
    const isAllowlisted = allowlist.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (!isAccepted && !isAllowlisted) {
        return <Redirect href="/driver/tcs-required" />;
    }
    return (
        <Stack
            screenOptions={{
                headerShown: false,
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

            <Stack.Screen
                name="profile"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="verification"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="utility"
                options={{
                    title: 'Developer Utilities',
                }}
            />

            <Stack.Screen
                name="support"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="policy"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="payment"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="security"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="location"
                options={{
                    headerShown: false
                }}
            />

        </Stack>
    );
}