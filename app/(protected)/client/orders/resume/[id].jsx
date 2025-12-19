import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, StyleSheet, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import ClientUtils from "../../../../../utils/ClientUtilities";
import { useOrderStore } from "../../../../../store/useOrderStore";
import OrderCreationFlow from "../../../../../components/Client/Orders/OrderCreation";

function ResumeDraftOrder() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { resumeDraft } = useOrderStore();

    const {
        data,
        isSuccess,
        isError,
        isLoading,
        refetch,
        error
    } = useQuery({
        queryKey: ["ResumeDraftOrder"],
        queryFn: () => ClientUtils.ResumeDraftOrder(id),
        enabled: !!id,
        retry: 2
    });

    useEffect(() => {
        if (isSuccess && data?.orderData) {
            const order = data.orderData;

            // Validate it's actually a draft
            if (order.status !== 'draft') {
                router.replace('/(protected)/client/orders/manage');
                return;
            }

            // Load into store with resume mode
            resumeDraft(order);

            console.log('✅ Order draft loaded for resumption', {
                orderId: order._id,
                currentStep: order.metadata?.draftProgress?.step,
                completedSteps: order.metadata?.draftProgress?.completedSteps
            });
        }
    }, [isSuccess, data, resumeDraft, router]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading your draft order...</Text>
            </SafeAreaView>
        );
    }

    if (isError) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <Text style={styles.errorTitle}>😓 Unable to load draft</Text>
                <Text style={styles.errorMessage}>
                    {error?.message || "This draft may no longer be available."}
                </Text>

                <Pressable style={styles.retryButton} onPress={refetch}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>

                <Pressable
                    style={[styles.retryButton, styles.backButton]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    // Render the same OrderCreationFlow component
    return <OrderCreationFlow />;
}

const styles = StyleSheet.create({
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280'
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8
    },
    errorMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8
    },
    backButton: {
        backgroundColor: '#6b7280'
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});

export default ResumeDraftOrder;

