import {Redirect, Stack, usePathname} from 'expo-router';
import {useSessionStore} from "../../../../store/useSessionStore";

export default function NotificationLayout() {
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
        </Stack>
    );
}