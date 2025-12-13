// app/(protected)/driver/account/analytics/deliveries/index.jsx
import Orders from "components/Client/Profile/Analytics/Orders"
import {ActivityIndicator, StyleSheet, Text, View} from "react-native";
import {useSessionStore} from "../../../../../../store/useSessionStore";
import {useQuery} from "@tanstack/react-query";
import React from "react";
import ClientUtils from "../../../../../../utils/ClientUtilities";


function AllOrders() {
    const userData = useSessionStore((state) => state.user);
    const { data, isLoading, error, isError, refetch } = useQuery({
        queryKey: ['ClientDeliveryAnalytics'],
        queryFn: ClientUtils.getDeliveryAnalytics,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchInterval: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
    });

    // Handle all loading and error states in parent
    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading your analytics...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.errorText}>Failed to load analytics</Text>
                    <Text style={styles.errorSubtext}>
                        Please check your connection and try again
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <>
            <Orders
                orderAnalytics={data?.data}
                userData={userData}
                refetch={refetch}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F7FA',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default AllOrders;