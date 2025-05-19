import {Tabs} from 'expo-router';
import {TabBar} from "../../../components/TabBar";


export default function DriverTabsLayout() {

    return (
        <>
            <Tabs
                tabBar={(props) => <TabBar {...props} />}
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
                    name="wallet"
                    options={{
                        title: 'Wallet',
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
