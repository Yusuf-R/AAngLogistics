import { useEffect } from "react";
import {ActivityIndicator, SafeAreaView, Text, StyleSheet, Pressable} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {queryClient} from "../../../../lib/queryClient"
import { useSessionStore } from "../../../../store/useSessionStore";
import ClientUtils from "../../../../utils/ClientUtilities";
import SessionManager from "../../../../lib/SessionManager";
import OrderCreationFlow from "../../../../components/Client/Orders/OrderCreation";
import {useOrderStore} from "../../../../store/useOrderStore";

function CreateOrder() {

    const {
        data,
        isSuccess,
        isError,
        isLoading,
        refetch,
        error
    } = useQuery({
        queryKey: ["InstantiateOrder"],
        queryFn: ClientUtils.InstantiateOrder,
    });

    useEffect(() => {
        const syncUserSession = async () => {
            if (isSuccess && data) {
                const { order } = data;
                // Update user session
                await SessionManager.updateAllOrderData(order.orders);
                await SessionManager.updateOrderStatistics(order.statistics);
                useOrderStore.getState().initDraft(order.orderData);
                // could we have instead even store this orderData in our zustand useOrderStore?
                console.log('✅ Order data cache cleared - fresh data will be fetched on next manage screen visit');
            }
        };
        syncUserSession();
    }, [isSuccess, data, ]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Setting up your order workspace...</Text>
            </SafeAreaView>
        );
    }

    if (isError) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <Text style={styles.errorTitle}>😓 Something went wrong</Text>
                <Text style={styles.errorMessage}>
                    {error?.message || "Unable to start your order. Please check your internet or try again later."}
                </Text>

                <Pressable style={styles.retryButton} onPress={refetch}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <OrderCreationFlow/>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff"
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#4B5563",
        fontFamily: "PoppinsMedium"
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#EF4444",
        marginBottom: 8
    },
    errorMessage: {
        textAlign: "center",
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 20,
        fontFamily: "PoppinsRegular"
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: "#3B82F6"
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "PoppinsSemiBold"
    }
});

export default CreateOrder;