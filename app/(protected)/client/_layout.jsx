import {Tabs} from 'expo-router';
import {TabBar} from "../../../components/TabBar";
import { usePathname } from 'expo-router';
import { TAB_BAR_VISIBLE_ROUTES } from '../../../utils/Constant';
import { TAB_BAR_HIDDEN_EXCEPTIONS } from '../../../utils/Constant';
import ClientUtils from "../../../utils/ClientUtilities";
import { useQuery} from "@tanstack/react-query";
import { useEffect } from "react";
import {useNotificationStore} from "../../../store/useNotificationStore";
import {useSessionStore} from "../../../store/useSessionStore";
import useSocket from "../../../hooks/useSocket";
import * as WebBrowser from 'expo-web-browser';




export default function ClientTabsLayout() {
    const pathname = usePathname();
    const user = useSessionStore(state => state.user);

    WebBrowser.maybeCompleteAuthSession();

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
    const { data, isSuccess } = useQuery({
        queryKey: ['GetNotifications'],
        queryFn: ClientUtils.GetNotifications,
        staleTime: Infinity,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: false,
    });

    useEffect(() => {
        if (isSuccess && data) {
            console.log('🔄 Setting notifications data');
            initializeNotifications(data.notifications || [], data.stats || null);
        }
    }, [isSuccess, data, initializeNotifications]);

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