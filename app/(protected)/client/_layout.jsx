import {Tabs} from 'expo-router';
import {TabBar} from "../../../components/TabBar";
import { usePathname } from 'expo-router';
import { TAB_BAR_VISIBLE_ROUTES } from '../../../utils/Constant';

export default function ClientTabsLayout() {
    const pathname = usePathname();

    // Check if current route should show Tab Bar
    const shouldShowTabBar = TAB_BAR_VISIBLE_ROUTES.includes(pathname);

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
