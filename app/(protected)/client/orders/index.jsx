import React, { useState, useEffect } from 'react';
import {
    Text,
    StyleSheet,
    View,
    SafeAreaView,
    Alert,
    StatusBar,
    ActivityIndicator,
    Pressable
} from "react-native";
import OrdersHub from "../../../../components/Client/Orders/OrdersHub";
import { useSessionStore } from "../../../../store/useSessionStore";
import { useQuery } from "@tanstack/react-query";
import ClientUtils from "../../../../utils/ClientUtilities";
import SessionManager from "../../../../lib/SessionManager";
import {useSafeAreaInsets} from "react-native-safe-area-context";


function OrdersScreen() {
    const userData = useSessionStore((state) => state.user);
    const insets = useSafeAreaInsets()

    const allOrderData = useSessionStore((state) => state.allOrderData);
    const orderStatistics = useSessionStore((state) => state.orderStatistics);

    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["GetAllClientOrder"],
        queryFn: ClientUtils.GetAllClientOrders,
        enabled: !allOrderData,
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 2,
    });

    useEffect(() => {
        if (data?.order?.orders && data?.order?.statistics) {
            SessionManager.updateAllOrderData(data.order.orders);
            SessionManager.updateOrderStatistics(data.order.statistics);
        }
    }, [data]);
    // Manual refresh (used by OrdersHub when e.g. a new draft is saved)
    const handleManualRefresh = async () => {
        try {
            const updated = await ClientUtils.GetAllClientOrders();
            if (updated?.order) {
                await SessionManager.updateAllOrderData(updated.order.orders);
                await SessionManager.updateOrderStatistics(updated.order.statistics);
            }
        } catch (err) {
            console.log("🔁 Manual refresh failed:", err);
        }
    };


    if (isLoading || !userData ||  !allOrderData) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading your orders...</Text>
            </SafeAreaView>
        );
    }

    if (isError && !allOrderData) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <Text style={styles.errorTitle}>😓 Something went wrong</Text>
                <Text style={styles.errorMessage}>
                    {error?.message || "Unable to load your orders. Please check your connection."}
                </Text>
                <Pressable style={styles.retryButton} onPress={handleManualRefresh}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{flex:1, backgroundColor: '#FFF', paddingTop: insets.top}}>
            <StatusBar barStyle="dark-content" />
            <OrdersHub
                userData={userData}
                allOrderData={allOrderData}
                orderStatistics={orderStatistics}
                onRefresh={handleManualRefresh}
                isRefreshing={isLoading && !!allOrderData}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#333',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#dc2626',
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#555',
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default OrdersScreen;
