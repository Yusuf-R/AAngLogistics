// app/(protected)/driver/_layout.jsx
import { Tabs, usePathname, useSegments } from 'expo-router';
import { TabNavigation } from "../../../components/Driver/TabNavigation/TabNavigation";
import { useMemo } from 'react';

export default function DriverTabsLayout() {
    const pathname = usePathname();
    const segments = useSegments();

    // ✅ Define routes where tab bar should be hidden
    const hideTabBarRoutes = useMemo(() => [
        '/driver/account/edit',
        '/driver/account/security',
        '/driver/account/saved-locations',
        '/driver/account/payment',
        '/driver/account/update-avatar',
        '/driver/account/verify-email',
        '/driver/account/nin-verification',
        '/driver/account/auth-pin',
        '/driver/account/update-password',
        '/driver/account/privacy-policy',
        '/driver/account/terms-conditions',
        '/driver/account/utility',
        '/driver/account/help-center',
        // Add other nested routes here
        '/driver/orders/details',
        '/driver/notifications/details',
    ], []);

    // ✅ Check if current route should hide tab bar
    const shouldHideTabBar = useMemo(() => {
        // Check exact matches
        if (hideTabBarRoutes.includes(pathname)) {
            return true;
        }

        // Check if it's a nested route (more than 3 segments means nested)
        // e.g., ['(protected)', 'driver', 'account', 'edit'] = 4 segments
        const driverSegmentIndex = segments.findIndex(s => s === 'driver');
        if (driverSegmentIndex !== -1 && segments.length > driverSegmentIndex + 2) {
            return true;
        }

        return false;
    }, [pathname, segments, hideTabBarRoutes]);

    return (
        <Tabs
            tabBar={(props) => shouldHideTabBar ? null : <TabNavigation {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Home',
                    href: '/driver/dashboard/index',
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    title: 'Discover',
                    href: '/driver/discover/index',
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Notifications',
                    href: '/driver/notifications/index',
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    href: '/driver/account/index',
                }}
            />
        </Tabs>
    );
}