// FE: DriverAnalytics.jsx
import React from 'react';
import {useQuery} from "@tanstack/react-query";
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from '@expo/vector-icons';
import AnalyticsManagement from "../../../../../components/Driver/Account/Analytics/AnalyticsManagement";
import DriverUtils from "../../../../../utils/DriverUtilities";
import {useSessionStore} from "../../../../../store/useSessionStore";
import {useRouter} from 'expo-router';
import CustomHeader from "../../../../../components/CustomHeader";

function DriverAnalytics() {
    const router = useRouter();
    const userData = useSessionStore((state) => state.user);

    const {data, isLoading, error, isError, refetch} = useQuery({
        queryKey: ['DriverAnalytics'],
        queryFn: async () => {
            try {
                return await DriverUtils.getAnalytics();
            } catch (err) {
                // If it's a 404 error (no analytics found), return empty analytics
                if (err.response?.status === 404) {
                    return {
                        data: {
                            driverId: userData?._id || userData?.id,
                            totalDeliveries: 0,
                            completedDeliveries: 0,
                            cancelledDeliveries: 0,
                            totalEarnings: 0,
                            averageRating: 0,
                            totalDistance: 0,
                            weeklyStats: [],
                            monthlyStats: [],
                            categoryBreakdown: [],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            isNewDriver: true
                        }
                    };
                }
                throw err;
            }
        },
        retry: false, // Don't retry 404 errors
        refetchOnWindowFocus: false,
    });

    // If loading, show loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4A90E2"/>
                <Text style={styles.loadingText}>Loading your analytics...</Text>
            </View>
        );
    }

    // Check if this is a new driver with no analytics
    const isNewDriver = data?.data?.totalDeliveries === 0 ||
        data?.data?.isNewDriver ||
        (error?.response?.status === 404);

    // If new driver, show onboarding state
    if (isNewDriver) {
        return (
            <>
                <CustomHeader title="Analytics" onBackPress={() => router.back()}/>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.emptyAnalyticsContainer}>
                        <View style={styles.emptyIconContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="analytics" size={48} color="#3B82F6"/>
                            </View>
                        </View>

                        <Text style={styles.emptyTitle}>No Analytics Yet</Text>

                        <Text style={styles.emptyDescription}>
                            Complete your first delivery to unlock detailed analytics and track your performance
                            metrics,
                            earnings trends, and delivery insights.
                        </Text>

                        <View style={styles.featuresList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981"/>
                                <Text style={styles.featureText}>Track earnings over time</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981"/>
                                <Text style={styles.featureText}>Monitor delivery performance</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981"/>
                                <Text style={styles.featureText}>Analyze category preferences</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981"/>
                                <Text style={styles.featureText}>Identify peak earning periods</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.startDeliveringButton}
                            onPress={() => router.push('/driver/discover')}
                        >
                            <Ionicons name="flash" size={20} color="#fff"/>
                            <Text style={styles.startDeliveringText}>Start Your First Delivery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push('/driver/account/support/faq')}
                        >
                            <Ionicons name="school" size={18} color="#3B82F6"/>
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
                        <Ionicons name="alert-circle" size={48} color="#DC2626"/>
                    </View>
                    <Text style={styles.errorTitle}>Connection Error</Text>
                    <Text style={styles.errorSubtext}>
                        Unable to load analytics. Please check your internet connection.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetch()}
                    >
                        <Ionicons name="refresh" size={18} color="#fff"/>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Pass analytics and userData to child
    return <AnalyticsManagement analytics={data?.data} userData={userData} refetch={refetch}/>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },

    // Empty Analytics State
    emptyAnalyticsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    emptyIconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#DBEAFE',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
        fontFamily: 'PoppinsBold',
    },
    emptyDescription: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontFamily: 'PoppinsRegular',
    },
    featuresList: {
        width: '100%',
        marginBottom: 32,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingVertical: 8,
    },
    featureText: {
        fontSize: 15,
        color: '#374151',
        fontFamily: 'PoppinsMedium',
        flex: 1,
    },
    startDeliveringButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#3B82F6',
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#3B82F6',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    startDeliveringText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        fontFamily: 'PoppinsSemiBold',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#3B82F6',
        fontFamily: 'PoppinsMedium',
    },

    // Error State
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorIconContainer: {
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#DC2626',
        marginBottom: 8,
        fontFamily: 'PoppinsSemiBold',
    },
    errorSubtext: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'PoppinsRegular',
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#DC2626',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        fontSize: 15,
        color: '#fff',
        fontFamily: 'PoppinsMedium',
    },
});

export default DriverAnalytics;