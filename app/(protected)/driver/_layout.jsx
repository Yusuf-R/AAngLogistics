// app/(protected)/driver/_layout.jsx
import {Tabs, usePathname, useSegments} from 'expo-router';
import {TabNavigation} from "../../../components/Driver/TabNavigation/TabNavigation";
import {useMemo, useEffect, useCallback} from 'react';
import {socketClient} from '../../../lib/driver/SocketClient';
import {useSessionStore} from '../../../store/useSessionStore';
import {queryClient} from '../../../lib/queryClient';
import {useTCGuard} from "../../../hooks/useTCGuard";

export default function DriverTabsLayout() {
    const pathname = usePathname();
    const segments = useSegments();
    const user = useSessionStore(state => state.user);

    // 🔒 Enforce T&Cs globally for driver area
    const guard = useTCGuard({
        allowlist: ["/driver/tcs", "/driver/tcs-required", "/driver/dashboard", "/driver/support/resources"],
        restrictedPrefixes: ["/driver/account", "/driver/discover", "/driver/notifications"]
    });

    // ✅ Initialize Socket Connection
    useEffect(() => {
        if (!user?.id) return;

        console.log('🚀 Initializing driver socket connection...');

        // Connect socket
        socketClient.connect()
            .then(() => {
                console.log('✅ Driver socket connected successfully');
                setupSocketListeners();
            })
            .catch((error) => {
                console.error('❌ Driver socket connection failed:', error);
            });

        return () => {
            console.log('🧹 Cleaning up driver socket');
            cleanupSocketListeners();
            socketClient.disconnect();
        };
    }, [user?.id]);

    // ✅ Setup socket event listeners
    const setupSocketListeners = async () => {
        // Notifications
        socketClient.on('notification', async (notification) => {
            console.log('📬 Driver notification received');
            await queryClient.invalidateQueries({queryKey: ['GetNotifications']});
            await queryClient.invalidateQueries({queryKey: ['GetUnreadCount']});
            // Add to your notification store if you have one
        });

        // Order assignments
        socketClient.on('order-assignment', (orderData) => {
            console.log('📦 New order assigned to driver');
            queryClient.invalidateQueries({queryKey: ['GetActiveOrders']});
            queryClient.invalidateQueries({queryKey: ['GetOrders']});
            // Show in-app notification
        });

        // Order updates
        socketClient.on('order-status-updated', (orderUpdate) => {
            console.log('📦 Order status updated');
            queryClient.invalidateQueries({
                queryKey: ['GetOrder', orderUpdate.orderId]
            });
        });

        // Chat messages (for support chat)
        socketClient.on('chat-message-received', (message) => {
            console.log('💬 Chat message received');
            queryClient.invalidateQueries({
                queryKey: ['GetMessages', message.conversationId]
            });
        });

        // Connection status
        socketClient.on('disconnected', () => {
            console.log('❌ Socket disconnected');
        });

        socketClient.on('reconnected', () => {
            console.log('✅ Socket reconnected');
        });
    };

    // ✅ Cleanup socket listeners
    const cleanupSocketListeners = () => {
        socketClient.off('notification');
        socketClient.off('order-assignment');
        socketClient.off('order-status-updated');
        socketClient.off('chat-message-received');
        socketClient.off('disconnected');
        socketClient.off('reconnected');
    };

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
        '/driver/orders/details',
        '/driver/notifications/details',
        '/driver/support/chat', // ✅ Add support chat route
        '/driver/support/message',
        '/driver/support/resources',
        '/driver/tcs',
    ], []);

    // ⛔ Guard tab presses, so users can’t bypass via the tab bar
    const canAccess = useCallback((routeName) => {
        if (guard.isAccepted) return true;
        // map routeName to path prefix
        const routeToPrefix = {
            dashboard: '/driver/dashboard',
            discover: '/driver/discover',
            notifications: '/driver/notifications',
            account: '/driver/account',
        };
        const target = routeToPrefix[routeName] || '';
        const restrictedHit = ['/driver/account','/driver/discover','/driver/notifications']
            .some(p => target.startsWith(p));
        return !restrictedHit; // allow only non-restricted when not accepted
    }, [guard.isAccepted]);

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
        <>
            <Tabs
                tabBar={(props) => shouldHideTabBar ? null : <TabNavigation {...props} canAccess={canAccess} />}
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
        </>
    );
}