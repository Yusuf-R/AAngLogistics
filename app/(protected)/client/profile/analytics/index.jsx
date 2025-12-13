// app/(protected)/client/account/analytics/index.jsx
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import AnalyticsManagement from "../../../../../components/Client/Profile/Analytics/AnalyticsManagement";
import ClientUtils from "../../../../../utils/ClientUtilities";
import { useSessionStore } from "../../../../../store/useSessionStore";
import { useRouter } from 'expo-router';
import CustomHeader from "../../../../../components/CustomHeader";

function ClientAnalytics() {
    const router = useRouter();
    const userData = useSessionStore((state) => state.user);

    const { data, isLoading, error, isError, refetch } = useQuery({
        queryKey: ['ClientAnalytics'],
        queryFn: async () => {
            try {
                return await ClientUtils.getAnalytics();
            } catch (err) {
                // If it's a 404 error (no analytics found), return empty analytics
                if (err.response?.status === 404) {
                    return {
                        data: {
                            clientId: userData?._id || userData?.id,
                            lifetime: {
                                totalOrders: 0,
                                completedOrders: 0,
                                cancelledOrders: 0,
                                totalSpent: 0,
                                totalDistance: 0,
                                averageOrderValue: 0,
                                averageRating: 0
                            },
                            daily: [],
                            weekly: [],
                            monthly: [],
                            categories: {},
                            payments: {
                                totalPaid: 0,
                                wallet: { currentBalance: 0 }
                            },
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            isNewClient: true
                        }
                    };
                }
                throw err;
            }
        },
        retry: false,
        refetchOnWindowFocus: false,
    });

    // If loading, show loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading your analytics...</Text>
            </View>
        );
    }

    // Check if this is a new client with no analytics
    const isNewClient = data?.data?.lifetime?.totalOrders === 0 ||
        data?.data?.isNewClient ||
        (error?.response?.status === 404);

    // If new client, show onboarding state
    if (isNewClient) {
        return (
            <>
                <CustomHeader title="Analytics" onBackPress={() => router.back()} />
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.emptyAnalyticsContainer}>
                        <View style={styles.emptyIconContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="analytics" size={48} color="#4CAF50" />
                            </View>
                        </View>

                        <Text style={styles.emptyTitle}>No Analytics Yet</Text>

                        <Text style={styles.emptyDescription}>
                            Place your first order to unlock detailed analytics and track your spending patterns,
                            delivery insights, and ordering trends.
                        </Text>

                        <View style={styles.featuresList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.featureText}>Track spending over time</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.featureText}>Monitor order history</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.featureText}>View favorite categories</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.featureText}>Analyze delivery patterns</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.placeOrderButton}
                            onPress={() => router.push('/client/orders')}
                        >
                            <Ionicons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.placeOrderText}>Place Your First Order</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push('/client/profile/help-center')}
                        >
                            <Ionicons name="help-circle" size={18} color="#4CAF50" />
                            <Text style={styles.secondaryButtonText}>Learn How It Works</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </>
        );
    }

    // If real error (not 404), show error state
    if (isError && error?.response?.status !== 404) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <View style={styles.errorIconContainer}>
                        <Ionicons name="alert-circle" size={48} color="#DC2626" />
                    </View>
                    <Text style={styles.errorTitle}>Connection Error</Text>
                    <Text style={styles.errorSubtext}>
                        Unable to load analytics. Please check your internet connection.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetch()}
                    >
                        <Ionicons name="refresh" size={18} color="#fff" />
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Pass analytics and userData to child
    return <AnalyticsManagement analytics={data?.analytics} orders={data?.orders} wallet={data?.wallet} userData={userData} refetch={refetch} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    emptyAnalyticsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    featuresList: {
        width: '100%',
        marginBottom: 32,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    featureText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    placeOrderButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginBottom: 16,
        width: '100%',
        maxWidth: 300,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    placeOrderText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    secondaryButtonText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorIconContainer: {
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
});

export default ClientAnalytics;