import React, {useState, useEffect, useCallback} from 'react';
import {Text, StyleSheet, View, SafeAreaView, Alert, StatusBar} from "react-native";
import OrdersHub from "../../../../components/Client/Orders/OrdersHub";
import {useSessionStore} from "../../../../store/useSessionStore";

function OrdersScreen() {
    const userData = useSessionStore((state) => state.user);

    // Recent Order Mocks
    const [recentOrders, setRecentOrders] = useState([
        {
            id: '1',
            orderType: 'instant',
            package: {category: 'document', description: 'Legal documents'},
            pickup: {address: 'Home'},
            dropoff: {address: 'Law Office'},
            createdAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
            id: '2',
            orderType: 'scheduled',
            package: {category: 'parcel', description: 'Birthday gift'},
            pickup: {address: 'Shopping Mall'},
            dropoff: {address: 'Friend\'s House'},
            createdAt: new Date(Date.now() - 172800000) // 2 days ago
        }
    ]);

    return (
        <>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content"/>
                <OrdersHub
                    userData={userData}
                    recentOrders={recentOrders}
                    onRecentOrdersChange={setRecentOrders}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
});

export default OrdersScreen;