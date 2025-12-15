// components/Client/Account/Analytics/Orders.jsx
import React, {useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
    Modal, Pressable
} from 'react-native';
import {FontAwesome6, Ionicons} from '@expo/vector-icons';
import CustomHeader from "../../../CustomHeader";
import {router} from "expo-router";
import {LineChart, BarChart} from 'react-native-chart-kit';
import {toast} from "sonner-native";

const {width} = Dimensions.get('window');

const Orders = ({orderAnalytics, userData, refetch}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week');
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
            'picked_up': '#9C27B0',
            pending: '#FFC107',
            confirmed: '#00BCD4'
        };
        return colors[status] || '#9E9E9E';
    };

    const getStatusIcon = (status) => {
        const icons = {
            delivered: 'checkmark-circle',
            cancelled: 'close-circle',
            'en_route_pickup': 'arrow-forward',
            'en_route_dropoff': 'rocket',
            'picked_up': 'cube',
            pending: 'time',
            confirmed: 'shield-checkmark'
        };
        return icons[status] || 'ellipse';
    };

    const getCategoryIcon = (category) => {
        const icons = {
            laptop: 'laptop',
            document: 'document-text',
            food: 'fast-food',
            electronics: 'hardware-chip',
            mobilePhone: 'phone-portrait',
            clothing: 'shirt',
            furniture: 'cube',
            medicine: 'medical',
            gifts: 'gift',
            cake: 'cafe',
            books: 'book',
            others: 'cube-outline'
        };
        return icons[category] || 'cube-outline';
    };

    const extractLocation = (address) => {
        if (!address) return 'Unknown';
        const parts = address.split(',');
        return parts[0].trim();
    };

    const navigateToOrderDetails = (orderId) => {
        router.push(`/client/profile/analytics/orders/view/${orderId}`);
    };

    const handleLoadMore = async () => {
        setLoadingMore(true);
        // Implementation for loading more orders
        setLoadingMore(false);
    };

    if (!orderAnalytics) {
        return (
            <>
                <CustomHeader title="Order History" onBackPress={() => router.back()}/>
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={96} color="#E0E0E0"/>
                    <Text style={styles.emptyTitle}>No Orders Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Your order history will appear here once you place your first order
                    </Text>
                    <TouchableOpacity
                        style={styles.createOrderButton}
                        onPress={() => router.push('/client/orders/create')}
                    >
                        <Ionicons name="add-circle" size={20} color="#fff"/>
                        <Text style={styles.createOrderText}>Create Order</Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    }

    const {summary, charts, orders, pagination, filters, lifetimeStats} = orderAnalytics;
    const onBackPress = () => {
        router.push('/client/profile/analytics');
    };

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
            >
                {/* SUMMARY STATS */}
                <View style={styles.summarySection}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'start',
                        backgroundColor: '#fff',
                        marginBottom: 16,
                        gap: 15
                    }}>
                        <Pressable onPress={onBackPress} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFF"/>
                        </Pressable>
                        <View>
                            <Text style={styles.sectionTitle}>Order Analytics</Text>
                            <Text style={styles.headerSubtitle}>
                                Track your order history and spending insights
                            </Text>
                        </View>
                    </View>


                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <FontAwesome6 name="boxes-stacked" size={24} color="#2196F3"/>
                            <Text style={styles.statValue}>{summary.totalOrders}</Text>
                            <Text style={styles.statLabel}>Total Orders</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="wallet" size={28} color="#FF9800"/>
                            <Text style={styles.statValue}>{formatCurrency(summary.totalSpent)}</Text>
                            <Text style={styles.statLabel}>Total Spent</Text>
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
                                        data: charts.weekly.map(d => d.orders || 0.1)
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
                                    style: {borderRadius: 16},
                                    barPercentage: 0.7
                                }}
                                style={styles.chart}
                                showValuesOnTopOfBars
                                yAxisLabel=""
                            />
                        )}

                        {selectedPeriod === 'month' && charts.monthly && (
                            <LineChart
                                data={{
                                    labels: charts.monthly.map(d => d.month),
                                    datasets: [{
                                        data: charts.monthly.map(d => d.orders || 0.1)
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
                                    style: {borderRadius: 16},
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
                        <Text style={styles.sectionTitle}>Order History</Text>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setShowFilterModal(true)}
                        >
                            <Ionicons name="filter" size={20} color="#4CAF50"/>
                            <Text style={styles.filterButtonText}>
                                {filters.currentMonth}/{filters.currentYear}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.resultsInfo}>
                        <Text style={styles.resultsText}>
                            Showing {orders.length} of {pagination.total} orders
                        </Text>
                    </View>
                </View>

                {/* ORDERS LIST */}
                <View style={styles.ordersSection}>
                    {orders.map((order) => (
                        <TouchableOpacity
                            key={order.id}
                            style={styles.orderCard}
                            onPress={() => navigateToOrderDetails(order.id)}
                            activeOpacity={0.7}
                        >
                            {/* Header */}
                            <View style={styles.orderHeader}>
                                <View style={styles.orderStatus}>
                                    <Ionicons
                                        name={getStatusIcon(order.status)}
                                        size={20}
                                        color={getStatusColor(order.status)}
                                    />
                                    <Text style={styles.orderRef}>{order.orderRef}</Text>
                                </View>
                                <Text style={styles.orderAmount}>{formatCurrency(order.amount)}</Text>
                            </View>

                            {/* Package Info */}
                            <View style={styles.packageInfo}>
                                <Ionicons
                                    name={getCategoryIcon(order.packageCategory)}
                                    size={18}
                                    color="#666"
                                />
                                <Text style={styles.packageText} numberOfLines={1}>
                                    {order.packageDescription || order.packageCategory}
                                </Text>
                            </View>

                            {/* Route */}
                            <View style={styles.routeContainer}>
                                <View style={styles.routePoint}>
                                    <Ionicons name="ellipse" size={10} color="#4CAF50"/>
                                    <Text style={styles.routeText} numberOfLines={1}>
                                        {extractLocation(order.pickupLocation.address)}
                                    </Text>
                                </View>
                                <View style={styles.routeLine}/>
                                <View style={styles.routePoint}>
                                    <Ionicons name="location" size={10} color="#F44336"/>
                                    <Text style={styles.routeText} numberOfLines={1}>
                                        {extractLocation(order.dropoffLocation.address)}
                                    </Text>
                                </View>
                            </View>

                            {/* Stats Row */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="speedometer-outline" size={14} color="#999"/>
                                    <Text style={styles.statText}>{formatDistance(order.distance)}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={14} color="#999"/>
                                    <Text style={styles.statText}>{formatDuration(order.duration)}</Text>
                                </View>
                                {order.rating && (
                                    <View style={styles.statItem}>
                                        <Ionicons name="star" size={14} color="#FFC107"/>
                                        <Text style={styles.statText}>{order.rating}.0</Text>
                                    </View>
                                )}
                            </View>

                            {/* Driver Info */}
                            {order.driverName && (
                                <View style={styles.driverInfo}>
                                    <Ionicons name="person" size={14} color="#666"/>
                                    <Text style={styles.driverName}>Driver: {order.driverName}</Text>
                                </View>
                            )}

                            {/* Date */}
                            <Text style={styles.orderDate}>
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>

                            {/* View Details Arrow */}
                            <View style={styles.viewDetailsIndicator}>
                                <Ionicons name="chevron-forward" size={20} color="#4CAF50"/>
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
                            <ActivityIndicator color="#4CAF50"/>
                        ) : (
                            <>
                                <Ionicons name="refresh" size={20} color="#4CAF50"/>
                                <Text style={styles.loadMoreText}>Load More Orders</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* LIFETIME STATS */}
                <View style={styles.lifetimeSection}>
                    <Text style={styles.sectionTitle}>Lifetime Statistics</Text>
                    <View style={styles.lifetimeGrid}>
                        <View style={styles.lifetimeItem}>
                            <Text style={styles.lifetimeValue}>{lifetimeStats.totalOrders}</Text>
                            <Text style={styles.lifetimeLabel}>Total Orders</Text>
                        </View>
                        <View style={styles.lifetimeItem}>
                            <Text style={styles.lifetimeValue}>{formatCurrency(lifetimeStats.totalSpent)}</Text>
                            <Text style={styles.lifetimeLabel}>Total Spent</Text>
                        </View>
                        <View style={styles.lifetimeItem}>
                            <Text style={styles.lifetimeValue}>{formatDistance(lifetimeStats.totalDistance)}</Text>
                            <Text style={styles.lifetimeLabel}>Total Distance</Text>
                        </View>
                        <View style={styles.lifetimeItem}>
                            <Text style={styles.lifetimeValue}>{formatCurrency(lifetimeStats.averageOrderValue)}</Text>
                            <Text style={styles.lifetimeLabel}>Avg Order Value</Text>
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
                            <Text style={styles.modalTitle}>Filter Orders</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#333"/>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {filters.availablePeriods.map((period, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.periodOption}
                                    onPress={() => {
                                        toast.info('Filtering in progress');
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Text style={styles.periodOptionText}>{period.label}</Text>
                                    <Text style={styles.periodOptionCount}>{period.count} orders</Text>
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
        backgroundColor: '#F5F5F5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    createOrderButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#4CAF50',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    createOrderText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    summarySection: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#666',
        marginBottom: 10,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        margin: '1%',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
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
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
    },
    additionalStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    additionalStatLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    additionalStatValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 12,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
        fontFamily:'PoppinsRegular',
        color: '#666',
        fontWeight: '500',
    },
    periodTabTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    chartSection: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    chart: {
        borderRadius: 16,
    },
    filterSection: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#4CAF50',
        marginLeft: 6,
        fontWeight: '600',
    },
    resultsInfo: {
        marginTop: 8,
    },
    resultsText: {
        fontSize: 14,
        fontFamily:'PoppinsRegular',
        color: '#666',
    },
    ordersSection: {
        marginHorizontal: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderRef: {
        fontSize: 15,
        fontFamily:'PoppinsSemiBold',
        color: '#1A1A1A',
        marginLeft: 8,
    },
    orderAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4CAF50',
    },
    packageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    packageText: {
        fontSize: 14,
        fontFamily:'PoppinsSemiBold',
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    routeContainer: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#E0E0E0',
        marginLeft: 4,
        marginVertical: 2,
    },
    routeText: {
        fontSize: 13,
        color: '#666',
        fontFamily:'PoppinsRegular',
        marginLeft: 10,
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    statText: {
        fontSize: 13,
        color: '#999',
        marginLeft: 4,
        fontFamily:'PoppinsSemiBold',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    driverName: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
        fontFamily:'PoppinsSemiBold',
    },
    orderDate: {
        fontSize: 12,
        fontFamily:'PoppinsSemiBold',
        color: '#999',
    },
    viewDetailsIndicator: {
        position: 'absolute',
        right: 16,
        bottom: 16,
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    loadMoreText: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 8,
    },
    lifetimeSection: {
        marginHorizontal: 16,
        marginVertical: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    lifetimeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginTop: 12,
    },
    lifetimeItem: {
        width: '48%',
        margin: '1%',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        alignItems: 'center',
    },
    lifetimeValue: {
        fontSize: 18,
        fontFamily:'PoppinsSemiBold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    lifetimeLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontFamily:'PoppinsSemiBold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    modalBody: {
        padding: 20,
    },
    periodOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 12,
    },
    periodOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    periodOptionCount: {
        fontSize: 14,
        color: '#666',
    },
    backButton: {
        backgroundColor: '#4F628E',
        borderRadius: 5,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
    }

});

export default Orders;