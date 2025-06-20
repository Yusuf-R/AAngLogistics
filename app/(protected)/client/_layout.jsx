import {Tabs} from 'expo-router';
import {TabBar} from "../../../components/TabBar";
import { usePathname } from 'expo-router';
import { TAB_BAR_VISIBLE_ROUTES } from '../../../utils/Constant';
import { TAB_BAR_HIDDEN_EXCEPTIONS } from '../../../utils/Constant';
import ClientUtils from "../../../utils/ClientUtilities";
import { useQuery} from "@tanstack/react-query";
import {useEffect, useRef} from "react";
import {useNotificationStore} from "../../../store/useNotificationStore";
import {useSessionStore} from "../../../store/useSessionStore";
import useSocket from "../../../hooks/useSocket";

export default function ClientTabsLayout() {
    const pathname = usePathname();
    const user = useSessionStore(state => state.user);
    const hasInitializedRef = useRef(false);

    useSocket(user?.id);

    const {
        isInitialized,
        initializeNotifications,
    } = useNotificationStore();

    // 🔍 Should show TabBar?
    const shouldShowTabBar =
        TAB_BAR_VISIBLE_ROUTES.some(route => pathname.startsWith(route)) &&
        !TAB_BAR_HIDDEN_EXCEPTIONS.some(route => pathname.startsWith(route));

    // 📦 Fetch full notification dataset once
    const { data, isSuccess, isLoading } = useQuery({
        queryKey: ['GetNotifications'],
        queryFn: ClientUtils.GetNotifications,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        // Only fetch if we haven't initialized yet
        enabled: !isInitialized && !hasInitializedRef.current,
    });

    // ✅ Initialize notifications only once when data is first loaded
    useEffect(() => {
        if (isSuccess && data && !hasInitializedRef.current && !isInitialized) {
            console.log('🔄 Initializing notifications for the first time');
            initializeNotifications(data.notifications || [], data.stats || null);
            hasInitializedRef.current = true;
        }
    }, [isSuccess, data, isInitialized, initializeNotifications]);

    // Debug logging
    useEffect(() => {
        console.log('Layout render:', {
            isLoading,
            isSuccess,
            isInitialized,
            hasInitialized: hasInitializedRef.current,
            dataLength: data?.notifications?.length
        });
    }, [isLoading, isSuccess, isInitialized, data?.notifications?.length]);

    return (
        <>
            <Tabs
                tabBar={shouldShowTabBar ? (props) => <TabBar {...props} /> : () => null}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Home',
                    }}
                />
                <Tabs.Screen
                    name="orders"
                    options={{
                        title: 'Order',
                    }}
                />
                <Tabs.Screen
                    name="notifications"
                    options={{
                        title: 'Notifications',
                    }}
                />
                <Tabs.Screen
                    name="wallet"
                    options={{
                        title: 'Wallets',
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                    }}
                />
            </Tabs>
        </>
    );
}