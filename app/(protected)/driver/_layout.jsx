// app/(protected)/driver/_layout.jsx
import {Tabs, usePathname, useSegments} from 'expo-router';
import {TabNavigation} from "../../../components/Driver/TabNavigation/TabNavigation";
import {useMemo, useEffect, useCallback} from 'react';
import {socketClient} from '../../../lib/driver/SocketClient';
import {useSessionStore} from '../../../store/useSessionStore';
import {queryClient} from '../../../lib/queryClient';
import {useTCGuard} from "../../../hooks/useTCGuard";
import {useNotificationStore} from "../../../store/Driver/useNotificationStore";
import {toast} from "sonner-native";

export default function DriverTabsLayout() {
    const pathname = usePathname();
    const segments = useSegments();
    const user = useSessionStore(state => state.user);

    // ✅ Initialize notification system
    const {
        fetchNotificationStats,
        incrementBadge,
        decrementBadge
    } = useNotificationStore();

    // 🔒 Enforce T&Cs globally for driver area
    const guard = useTCGuard({
        allowlist: ["/driver/tcs", "/driver/tcs-required", "/driver/dashboard", "/driver/support/resources"],
        restrictedPrefixes: ["/driver/account", "/driver/discover", "/driver/notifications"]
    });

    // ✅ Initialize Socket Connection
    useEffect(() => {
        if (!user?.id) return;

        console.log('🚀 Initializing driver socket connection...');

        // ✅ Fetch notification stats when user loads the app
        fetchNotificationStats();

        // Connect socket
        socketClient.connect()
            .then(() => {
                console.log('✅ Driver socket connected successfully');
                setupSocketListeners();

                // 🔥 NEW: Subscribe to important notification categories
                socketClient.subscribeToCategories(['ORDER', 'DELIVERY', 'SECURITY']);
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

    // ✅ Enhanced socket event listeners with badge support
    const setupSocketListeners = async () => {
        // 🔥 ENHANCED: Real-time badge-specific events
        socketClient.on('badge-increment', (data) => {
            console.log('➕ Real-time badge increment');
            incrementBadge();

            // Optional: Show subtle notification
            // toast.info(`New ${data.category} notification`);
        });

        socketClient.on('badge-decrement', (data) => {
            console.log('➖ Real-time badge decrement');
            decrementBadge();
        });

        socketClient.on('badge-sync', (data) => {
            console.log('🔄 Badge sync received');
            // Force refresh stats to ensure accuracy
            fetchNotificationStats();
        });

        // Connection quality monitoring
        socketClient.on('connection-quality', (stats) => {
            if (stats.quality === 'poor') {
                console.warn('📶 Poor connection quality');
                // You could show a subtle indicator to the user
                toast.info('Poor connection quality');
            }
        });

        // 🔥 ENHANCED: Use the existing 'notification' event for full data when needed
        socketClient.on('notification', async (notification) => {
            console.log('📬 Full notification received:', notification);

            // Increment badge for any new notification
            incrementBadge();

            // Invalidate queries to refresh data
            await queryClient.invalidateQueries({queryKey: ['GetNotifications']});
            await queryClient.invalidateQueries({queryKey: ['GetUnreadCount']});
        });

        // Order assignments - also trigger badge updates
        socketClient.on('order-assignment', (orderData) => {
            console.log('📦 New order assigned to driver');

            // 🔥 NEW: Increment badge for new orders
            incrementBadge();

            queryClient.invalidateQueries({queryKey: ['GetActiveOrders']});
            queryClient.invalidateQueries({queryKey: ['GetOrders']});
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
            // 🔥 NEW: Re-subscribe to categories after reconnection
            socketClient.subscribeToCategories(['ORDER', 'DELIVERY', 'SECURITY']);
        });

        // 🔥 NEW: Handle reconnect attempts
        socketClient.on('reconnect-attempt', (data) => {
            console.log(`🔄 Reconnect attempt ${data.attemptNumber}`);
        });
    };

    // ✅ Enhanced cleanup socket listeners
    const cleanupSocketListeners = () => {
        // Remove badge-specific events
        socketClient.off('badge-increment');
        socketClient.off('badge-decrement');
        socketClient.off('badge-sync');
        socketClient.off('connection-quality');
        socketClient.off('reconnect-attempt');

        // Remove existing events
        socketClient.off('notification');
        socketClient.off('order-assignment');
        socketClient.off('order-status-updated');
        socketClient.off('chat-message-received');
        socketClient.off('disconnected');
        socketClient.off('reconnected');
    };

    // 🔥 NEW: Monitor socket connection status
    useEffect(() => {
        const checkConnection = () => {
            if (socketClient.getConnectionStatus()) {
                console.log('✅ Socket is connected');
            } else {
                console.log('❌ Socket is disconnected');
            }
        };

        // Check initially
        checkConnection();

        // Set up interval to monitor connection
        const interval = setInterval(checkConnection, 60000); // Every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // 🔥 NEW: Request badge sync when component mounts
    useEffect(() => {
        if (socketClient.getConnectionStatus()) {
            // Request initial badge sync to ensure accuracy
            socketClient.requestBadgeSync();
        }
    }, [socketClient.getConnectionStatus()]);

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
        '/driver/support/chat',
        '/driver/support/message',
        '/driver/support/resources',
        '/driver/tcs',
    ], []);

    // ⛔ Guard tab presses
    const canAccess = useCallback((routeName) => {
        if (guard.isAccepted) return true;
        const routeToPrefix = {
            dashboard: '/driver/dashboard',
            discover: '/driver/discover',
            notifications: '/driver/notifications',
            account: '/driver/account',
        };
        const target = routeToPrefix[routeName] || '';
        const restrictedHit = ['/driver/account','/driver/discover','/driver/notifications']
            .some(p => target.startsWith(p));
        return !restrictedHit;
    }, [guard.isAccepted]);

    // ✅ Check if current route should hide tab bar
    const shouldHideTabBar = useMemo(() => {
        if (hideTabBarRoutes.includes(pathname)) {
            return true;
        }

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