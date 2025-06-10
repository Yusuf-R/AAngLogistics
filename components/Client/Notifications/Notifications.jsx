import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Header from "./Header";
import NotificationList from "./NotificationList";
import {Text, View }  from "react-native"; // ✅ NEW: import reusable component

const Tab = createMaterialTopTabNavigator();

function Notifications({ userData }) {
    return (
        <>
            <Header userData={userData} />

            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarLabel: ({ focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'PoppinsSemiBold',
                                    color: focused ? '#3B82F6' : '#6B7280',
                                }}
                            >
                                {route.name}
                            </Text>
                            {focused && (
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#3B82F6',
                                        marginTop: 1,
                                    }}
                                />
                            )}
                        </View>
                    ),
                    tabBarStyle: {
                        backgroundColor: '#FFFFFF',
                        elevation: 0,
                    },
                    tabBarIndicatorStyle: {
                        height: 0, // hide the default line
                    },
                    tabBarPressColor: 'transparent',
                })}
            >
                {/* ✅ "All" tab – no filter */}
                <Tab.Screen
                    name="All"
                    children={() => (
                        <NotificationList />
                    )}
                />

                {/* ✅ "Orders" tab */}
                <Tab.Screen
                    name="Orders"
                    children={() => (
                        <NotificationList category="ORDER" />
                    )}
                />

                {/* ✅ "System" tab – category filter */}
                <Tab.Screen
                    name="System"
                    children={() =>
                        <NotificationList category="SYSTEM" />}
                />

                {/* ✅ "Security" tab */}
                <Tab.Screen
                    name="Security"
                    children={() => <NotificationList category="SECURITY" />}
                />
            </Tab.Navigator>
        </>
    );
}

export default Notifications;
