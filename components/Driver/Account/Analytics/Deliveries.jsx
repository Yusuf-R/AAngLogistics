// components/Driver/Account/Analytics/Deliveries.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
    Modal
} from 'react-native';
import {FontAwesome6, Ionicons} from '@expo/vector-icons';
import CustomHeader from "../../../CustomHeader";
import { router } from "expo-router";
import { LineChart, BarChart } from 'react-native-chart-kit';
import { toast } from "sonner-native";

const { width } = Dimensions.get('window');

const Deliveries = ({ deliveryAnalytics, userData, refetch }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch?.();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => `₦${(amount || 0).toLocaleString()}`;
    const formatDistance = (km) => `${(km || 0).toFixed(2)} km`;
    const formatDuration = (minutes) => {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const getStatusColor = (status) => {
        const colors = {
            delivered: '#4CAF50',
            cancelled: '#F44336',
            'en_route_pickup': '#FF9800',
            'en_route_dropoff': '#2196F3',
            'picked_up': '#9C27B0'
        };
        return colors[status] || '#9E9E9E';
    };

    const getStatusIcon = (status) => {
        const icons = {
            delivered: 'checkmark-circle',
            cancelled: 'close-circle',
            'en_route_pickup': 'arrow-forward',
            'en_route_dropoff': 'rocket',
            'picked_up': 'cube'
        };
        return icons[status] || 'ellipse';
    };

    const getCategoryIcon = (category) => {
        const icons = {
            laptop: 'laptop',
            document: 'document-text',
            food: 'fast-food',
            electronics: 'hardware-chip',
            clothing: 'shirt',
            furniture: 'cube',
            medicine: 'medical',
            gift: 'gift',
            other: 'cube-outline'
        };
        return icons[category] || 'cube-outline';
    };

    const extractLocation = (address) => {
        if (!address) return 'Unknown';
        const parts = address.split(',');
        return parts[0].trim();
    };

    const navigateToDeliveryDetails = (orderId) => {
        router.push(`/driver/account/analytics/deliveries/view/${orderId}`);
    };

    const handleLoadMore = async () => {
        // Implementation for loading more deliveries
        setLoadingMore(true);
        // Call API with new offset
        setLoadingMore(false);
    };

    if (!deliveryAnalytics) {
        return (
            <>
                <CustomHeader title="Delivery Analytics" onBackPress={() => router.back()} />
                <View style={styles.emptyContainer}>
                    <Ionicons name="bicycle-outline" size={96} color="#E0E0E0" />
                    <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Your delivery history will appear here once you complete your first order
                    </Text>
                </View>
            </>
        );
    }

    const { summary, charts, deliveries, pagination, filters, lifetimeStats } = deliveryAnalytics;
    console.log({
        summary
    })

    return (
        <>
            <CustomHeader title="" onBackPress={() => router.back()} />

            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* SUMMARY STATS */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Delivery Analytics</Text>
                    <Text style={styles.headerSubtitle}>
                        Track your delivery performance and insights
                    </Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <FontAwesome6 name="boxes-stacked" size={24} color="#2196F3" />
                            <Text style={styles.statValue}>{summary.totalDeliveries}</Text>
                            <Text style={styles.statLabel}>Total Deliveries</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="wallet" size={28} color="#2196F3" />
                            <Text style={styles.statValue}>{formatCurrency(summary.totalEarnings)}</Text>
                            <Text style={styles.statLabel}>Earnings</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="speedometer" size={28} color="#FF9800" />
                            <Text style={styles.statValue}>{formatDistance(summary.totalDistance)}</Text>
                            <Text style={styles.statLabel}>Distance</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="checkmark-done" size={28} color="#9C27B0" />
                            <Text style={styles.statValue}>{summary.completionRate}%</Text>
                            <Text style={styles.statLabel}>Success Rate</Text>
                        </View>
                    </View>

                    {/* Additional Stats Row */}
                    <View style={styles.additionalStats}>
                        <View style={styles.additionalStatItem}>
                            <Text style={styles.additionalStatLabel}>Avg Earnings</Text>
                            <Text style={styles.additionalStatValue}>{formatCurrency(summary.avgEarnings)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.additionalStatItem}>
                            <Text style={styles.additionalStatLabel}>Avg Distance</Text>
                            <Text style={styles.additionalStatValue}>{formatDistance(summary.avgDistance)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.additionalStatItem}>
                            <Text style={styles.additionalStatLabel}>Avg Duration</Text>
                            <Text style={styles.additionalStatValue}>{formatDuration(summary.avgDuration)}</Text>
                        </View>
                    </View>
                </View>

                {/* PERIOD SELECTOR */}
                <View style={styles.periodSelector}>
                    {['week', 'month', 'year'].map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.periodTab,
                                selectedPeriod === period && styles.periodTabActive
                            ]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text style={[
                                styles.periodTabText,
                                selectedPeriod === period && styles.periodTabTextActive
                            ]}>
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* CHART SECTION */}
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>
                        {selectedPeriod === 'week' ? 'Last 7 Days' : selectedPeriod === 'month' ? 'Monthly Overview' : 'Yearly Overview'}
                    </Text>

                    <View style={styles.chartContainer}>
                        {selectedPeriod === 'week' && charts.weekly && (
                            <BarChart
                                data={{
                                    labels: charts.weekly.map(d => d.dayName),
                                    datasets: [{
                                        data: charts.weekly.map(d => d.deliveries || 0.1)
                                    }]
                                }}
                                width={width - 48}
                                height={220}
                                chartConfig={{
                                    backgroundColor: '#fff',
                                    backgroundGradientFrom: '#fff',
                                    backgroundGradientTo: '#fff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    barPercentage: 0.7
                                }}
                                style={styles.chart}
                                showValuesOnTopOfBars
                            />
                        )}

                        {selectedPeriod === 'month' && charts.monthly && (
                            <LineChart
                                data={{
                                    labels: charts.monthly.map(d => d.month),
                                    datasets: [{
                                        data: charts.monthly.map(d => d.deliveries || 0.1)
                                    }]
                                }}
                                width={width - 48}
                                height={220}
                                chartConfig={{
                                    backgroundColor: '#fff',
                                    backgroundGradientFrom: '#fff',
                                    backgroundGradientTo: '#fff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: {
                                        r: '4',
                                        strokeWidth: '2',
                                        stroke: '#2196F3'
                                    }
                                }}
                                bezier
                                style={styles.chart}
                            />
                        )}
                    </View>
                </View>

                {/* FILTER SECTION */}
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Text style={styles.sectionTitle}>Delivery History</Text>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setShowFilterModal(true)}
                        >
                            <Ionicons name="filter" size={20} color="#4CAF50" />
                            <Text style={styles.filterButtonText}>
                                {filters.currentMonth}/{filters.currentYear}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.resultsInfo}>
                        <Text style={styles.resultsText}>
                            Showing {deliveries.length} of {pagination.total} deliveries
                        </Text>
                    </View>
                </View>

                {/* DELIVERIES LIST */}
                <View style={styles.deliveriesSection}>
                    {deliveries.map((delivery, index) => (
                        <TouchableOpacity
                            key={delivery.id}
                            style={styles.deliveryCard}
                            onPress={() => navigateToDeliveryDetails(delivery.id)}
                            activeOpacity={0.7}
                        >
                            {/* Header */}
                            <View style={styles.deliveryHeader}>
                                <View style={styles.deliveryStatus}>
                                    <Ionicons
                                        name={getStatusIcon(delivery.status)}
                                        size={20}
                                        color={getStatusColor(delivery.status)}
                                    />
                                    <Text style={styles.deliveryRef}>{delivery.orderRef}</Text>
                                </View>
                                <Text style={styles.deliveryEarnings}>{formatCurrency(delivery.earnings)}</Text>
                            </View>

                            {/* Package Info */}
                            <View style={styles.packageInfo}>
                                <Ionicons
                                    name={getCategoryIcon(delivery.packageCategory)}
                                    size={18}
                                    color="#666"
                                />
                                <Text style={styles.packageText} numberOfLines={1}>
                                    {delivery.packageDescription || delivery.packageCategory}
                                </Text>
                            </View>

                            {/* Route */}
                            <View style={styles.routeContainer}>
                                <View style={styles.routePoint}>
                                    <Ionicons name="ellipse" size={10} color="#4CAF50" />
                                    <Text style={styles.routeText} numberOfLines={1}>
                                        {extractLocation(delivery.pickupLocation.address)}
                                    </Text>
                                </View>
                                <View style={styles.routeLine} />
                                <View style={styles.routePoint}>
                                    <Ionicons name="location" size={10} color="#F44336" />
                                    <Text style={styles.routeText} numberOfLines={1}>
                                        {extractLocation(delivery.dropoffLocation.address)}
                                    </Text>
                                </View>
                            </View>

                            {/* Stats Row */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="speedometer-outline" size={14} color="#999" />
                                    <Text style={styles.statText}>{formatDistance(delivery.distance)}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={14} color="#999" />
                                    <Text style={styles.statText}>{formatDuration(delivery.duration)}</Text>
                                </View>
                                {delivery.rating && (
                                    <View style={styles.statItem}>
                                        <Ionicons name="star" size={14} color="#FFC107" />
                                        <Text style={styles.statText}>{delivery.rating}.0</Text>
                                    </View>
                                )}
                            </View>

                            {/* Proof Indicators */}
                            <View style={styles.proofIndicators}>
                                {delivery.hasPickupPhotos && (
                                    <View style={styles.proofBadge}>
                                        <Ionicons name="camera" size={12} color="#4CAF50" />
                                        <Text style={styles.proofText}>Pickup</Text>
                                    </View>
                                )}
                                {delivery.hasDeliveryPhotos && (
                                    <View style={styles.proofBadge}>
                                        <Ionicons name="camera" size={12} color="#2196F3" />
                                        <Text style={styles.proofText}>Delivery</Text>
                                    </View>
                                )}
                                {delivery.tokenVerified && (
                                    <View style={styles.proofBadge}>
                                        <Ionicons name="shield-checkmark" size={12} color="#9C27B0" />
                                        <Text style={styles.proofText}>Verified</Text>
                                    </View>
                                )}
                            </View>

                            {/* Date */}
                            <Text style={styles.deliveryDate}>
                                {new Date(delivery.completedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>

                            {/* View Details Arrow */}
                            <View style={styles.viewDetailsIndicator}>
                                <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* LOAD MORE BUTTON */}
                {pagination.hasMore && (
                    <TouchableOpacity
                        style={styles.loadMoreButton}
                        onPress={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <ActivityIndicator color="#4CAF50" />
                        ) : (
                            <>
                                <Ionicons name="refresh" size={20} color="#4CAF50" />
                                <Text style={styles.loadMoreText}>Load More Deliveries</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* LIFETIME STATS */}
                <View style={styles.lifetimeSection}>
                    <Text style={styles.sectionTitle}>Lifetime Statistics</Text>
                    <View style={styles.lifetimeGrid}>
                        <View style={styles.lifetimeItem}>
                            <Text style={styles.lifetimeValue}>{lifetimeStats.totalDeliveries}</Text>
                            <Text style={styles.lifetimeLabel}>Total Deliveries</Text>
                        </View>
                        <View style={styles.lifetimeItem}>
                            <Text style={styles.lifetimeValue}>{formatCurrency(lifetimeStats.totalEarnings)}</Text>
                            <Text style={styles.lifetimeLabel}>Total Earnings</Text>
                        </View>
                        <View style={styles.lifetimeItem}>
                            <Text style={styles.lifetimeValue}>{formatDistance(lifetimeStats.totalDistance)}</Text>
                            <Text style={styles.lifetimeLabel}>Total Distance</Text>
                        </View>
                        <View style={styles.lifetimeItem}>
                            <Text style={styles.lifetimeValue}>{lifetimeStats.averageRating.toFixed(1)} ⭐</Text>
                            <Text style={styles.lifetimeLabel}>Average Rating</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* FILTER MODAL */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Deliveries</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {filters.availablePeriods.map((period, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.periodOption}
                                    onPress={() => {
                                        // Handle period selection
                                        toast.info('In progress');
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Text style={styles.periodOptionText}>{period.label}</Text>
                                    <Text style={styles.periodOptionCount}>{period.count} deliveries</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#F8F9FA'
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },

    // Summary Section
    summarySection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
        marginBottom: 1,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        textAlign: 'left',
        lineHeight: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 15
    },
    statCard: {
        flex: 1,
        minWidth: (width - 56) / 2,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    additionalStats: {
        flexDirection: 'row',
        backgroundColor: '#F0F7FF',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    additionalStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    additionalStatLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
    },
    additionalStatValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2196F3',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#D0E7FF',
        marginHorizontal: 8,
    },

    // Period Selector
    periodSelector: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    periodTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    periodTabActive: {
        backgroundColor: '#4CAF50',
    },
    periodTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    periodTabTextActive: {
        color: '#fff',
    },

    // Chart Section
    chartSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
    },
    chartContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },

    // Filter Section
    filterSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4CAF50',
    },
    resultsInfo: {
        paddingVertical: 8,
    },
    resultsText: {
        fontSize: 13,
        color: '#666',
    },

    // Deliveries Section
    deliveriesSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    deliveryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        position: 'relative',
    },
    deliveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    deliveryStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deliveryRef: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    deliveryEarnings: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    packageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    packageText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    routeContainer: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeText: {
        fontSize: 13,
        color: '#333',
        flex: 1,
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#E0E0E0',
        marginLeft: 4,
        marginVertical: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#666',
    },
    proofIndicators: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    proofBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    proofText: {
        fontSize: 11,
        color: '#666',
    },
    deliveryDate: {
        fontSize: 11,
        color: '#999',
    },
    viewDetailsIndicator: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10,
    },

    // Load More
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    loadMoreText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // Lifetime Section
    lifetimeSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    lifetimeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    lifetimeItem: {
        flex: 1,
        minWidth: (width - 56) / 2,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    lifetimeValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    lifetimeLabel: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    modalBody: {
        padding: 16,
    },
    periodOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 8,
    },
    periodOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    periodOptionCount: {
        fontSize: 13,
        color: '#666',
    },
});

export default Deliveries;