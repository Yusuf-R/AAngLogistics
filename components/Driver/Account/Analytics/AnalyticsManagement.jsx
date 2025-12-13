// components/Driver/Account/Analytics/AnalyticsManagement.jsx

import React, {useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    Image
} from 'react-native';
import {Ionicons, FontAwesome6, MaterialIcons, FontAwesome5, Octicons } from '@expo/vector-icons';
import CustomHeader from "../../../CustomHeader";
import {router} from "expo-router";
import {LineChart} from 'react-native-chart-kit';
import {toast} from "sonner-native";

const {width} = Dimensions.get('window');

const AnalyticsManagement = ({analytics, refetch, userData}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch?.();
        setRefreshing(false);
    };

    // Check if user has any data
    const hasData = userData?.performance?.totalDeliveries > 0;

    if (!hasData) {
        return (
            <>
                <CustomHeader title="Analytics" onBackPress={() => router.back()}/>
                <View style={styles.emptyContainer}>
                    <Ionicons name="analytics-outline" size={96} color="#E0E0E0"/>
                    <Text style={styles.emptyTitle}>No Analytics Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Complete your first delivery to start tracking your performance
                    </Text>
                </View>
            </>
        );
    }

    // Get period data
    // Get period data from analytics instead of userData
    const getPeriodData = () => {
        if (!analytics) return {};

        if (selectedPeriod === 'week') {
            // Get current week from analytics.weekly
            const currentWeek = analytics.weekly?.[analytics.weekly.length - 1];
            return currentWeek || {};
        }

        if (selectedPeriod === 'month') {
            // Get current month from analytics.monthly
            const currentMonth = analytics.monthly?.[analytics.monthly.length - 1];
            return currentMonth || {};
        }

        // For 'year' or all time, return lifetime data
        return analytics.lifetime || {};
    };


    const periodData = getPeriodData();
    const formatCurrency = (amount) => `₦${(amount || 0).toLocaleString()}`;

    const navigateToAllDeliveries = () => {
        router.push("/driver/account/analytics/deliveries");
    };

    const navigateToAllEarnings = () => {
        router.push("/driver/account/analytics/earnings");
    };


    const vehicleIcons = {
        bicycle: <FontAwesome6 name="bicycle" size={18} color="#FF9800"/>,
        motorcycle: <FontAwesome6 name="motorcycle" size={18} color="#FF9800"/>,
        tricycle: <MaterialIcons name="electric-rickshaw" size={18} color="#FF9800"/>,
        car: <FontAwesome6 name="car" size={18} color="#FF9800"/>,
        van: <FontAwesome6 name="truck" size={18} color="#FF9800"/>,
        truck: <FontAwesome6 name="truck" size={18} color="#FF9800"/>
    };

    return (
        <>
            <CustomHeader title="" onBackPress={() => router.back()}/>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
            >
                {/* DRIVER PROFILE HEADER */}
                <View style={styles.profileHeader}>
                    {/* Header Title */}
                    <View style={styles.headerTitleSection}>
                        <Text style={styles.headerMainTitle}>Analytics Center</Text>
                        <Text style={styles.headerSubtitle}>
                            Track your performance, earnings, and delivery insights
                        </Text>
                    </View>

                    {/* Avatar - Centered & Larger */}
                    <View style={styles.avatarSection}>
                        <Image
                            source={{uri: userData.avatar}}
                            style={styles.avatarLarge}
                            defaultSource={require('../../../../assets/images/avatar-1.jpg')}
                        />
                    </View>

                    {/* Driver Info Card - Centered */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Ionicons name="person" size={18} color="#4A90E2"/>
                                <Text style={styles.infoText}>{userData.fullName}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="mail" size={18} color="#4A90E2"/>
                                <Text style={styles.infoText} numberOfLines={1}>
                                    {userData.email}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRowSecond}>
                            <View style={styles.infoItem}>
                                <Ionicons name="call" size={18} color="#4A90E2"/>
                                <Text style={styles.infoText}>{userData.phoneNumber}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <View style={[styles.statusIndicator, {
                                    backgroundColor: userData.availabilityStatus === 'online' ? '#4CAF50' : '#9E9E9E'
                                }]}/>
                                <Text style={[styles.infoText, {
                                    color: userData.availabilityStatus === 'online' ? '#4CAF50' : '#9E9E9E',
                                    fontWeight: '600'
                                }]}>
                                    {userData.availabilityStatus === 'online' ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Vehicle Info Card - Centered */}
                    <View style={styles.vehicleInfoCard}>
                        <View style={styles.vehicleRow}>
                            <View style={styles.vehicleItem}>
                                {vehicleIcons[userData.vehicleDetails.type] || vehicleIcons.car}
                                <Text style={styles.vehicleItemText}>
                                    {userData.vehicleDetails.type.charAt(0).toUpperCase() + userData.vehicleDetails.type.slice(1)}
                                </Text>
                            </View>
                            <View style={styles.vehicleDivider}/>
                            <View style={styles.vehicleItem}>
                                <Ionicons name="construct" size={18} color="#FF9800"/>
                                <Text style={styles.vehicleItemText}>{userData.vehicleDetails.model}</Text>
                            </View>
                            <View style={styles.vehicleDivider}/>
                            <View style={styles.vehicleItem}>
                                <Ionicons name="color-palette" size={18} color="#FF9800"/>
                                <Text style={styles.vehicleItemText}>{userData.vehicleDetails.color}</Text>
                            </View>
                            {userData.vehicleDetails.plateNumber && (
                                <>
                                    <View style={styles.vehicleDivider}/>
                                    <View style={styles.vehicleItem}>
                                        <Ionicons name="card" size={18} color="#FF9800"/>
                                        <Text
                                            style={styles.vehicleItemText}>{userData.vehicleDetails.plateNumber}</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* QUICK STATS OVERVIEW */}
                <View style={styles.quickStats}>
                    <View style={styles.quickStatItem}>
                        <Ionicons name="calendar" size={20} color="#666"/>
                        <Text style={styles.quickStatLabel}>Member Since</Text>
                        <Text style={styles.quickStatValue}>
                            {new Date(userData.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric'
                            })}
                        </Text>
                    </View>
                    <View style={styles.quickStatDivider}/>
                    <View style={styles.quickStatItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50"/>
                        <Text style={styles.quickStatLabel}>Completion Rate</Text>
                        <Text style={styles.quickStatValue}>
                            {userData.performance.completionRate || 100}%
                        </Text>
                    </View>
                </View>

                {/* PERIOD SELECTOR */}
                <View style={styles.periodSelector}>
                    {[
                        {key: 'week', label: 'This Week'},
                        {key: 'month', label: 'This Month'},
                        {key: 'year', label: 'All Time'}
                    ].map((period) => (
                        <TouchableOpacity
                            key={period.key}
                            style={[
                                styles.periodTab,
                                selectedPeriod === period.key && styles.periodTabActive
                            ]}
                            onPress={() => setSelectedPeriod(period.key)}
                        >
                            <Text style={[
                                styles.periodTabText,
                                selectedPeriod === period.key && styles.periodTabTextActive
                            ]}>
                                {period.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* KEY METRICS - MAIN CARDS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'Lifetime'} Performance
                    </Text>

                    {/* Earnings Card - LARGE */}
                    <View style={styles.earningsCard}>
                        <View style={styles.earningsHeader}>
                            <View>
                                <Text style={styles.earningsLabel}>Total Earnings</Text>
                                <Text style={styles.earningsAmount}>
                                    {formatCurrency(
                                        selectedPeriod === 'week' ? periodData.earnings?.gross || 0 :
                                            selectedPeriod === 'month' ? periodData.earnings?.gross || 0 :
                                                analytics?.lifetime?.totalEarnings || 0
                                    )}
                                </Text>
                            </View>
                            <View style={styles.earningsIcon}>
                                <Ionicons name="wallet" size={32} color="#4CAF50"/>
                            </View>
                        </View>

                        {selectedPeriod !== 'year' && analytics?.trends?.earnings && (
                            <View style={styles.trendIndicator}>
                                <Ionicons
                                    name={analytics.trends.earnings.trend === 'increasing' ? 'trending-up' : 'trending-down'}
                                    size={16}
                                    color={analytics.trends.earnings.trend === 'increasing' ? '#4CAF50' : '#F44336'}
                                />
                                <Text style={[
                                    styles.trendText,
                                    {color: analytics.trends.earnings.trend === 'increasing' ? '#4CAF50' : '#F44336'}
                                ]}>
                                    {analytics.trends.earnings.changePercent}% vs last {selectedPeriod}
                                </Text>
                            </View>
                        )}

                        <View style={styles.earningsBreakdown}>
                            <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>Available</Text>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(analytics?.lifetime?.totalEarnings)}
                                </Text>
                            </View>
                            <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>Withdrawn</Text>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(analytics?.lifetime?.totalWithdrawn || 0)}
                                </Text>
                            </View>
                            <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>Fees Paid</Text>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(analytics?.lifetime?.totalFees || 0)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Trips & Performance Grid */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metricBox}>
                            <View style={styles.metricIconContainer}>
                                <FontAwesome6 name="boxes-stacked" size={24} color="#2196F3"/>
                            </View>
                            <Text style={styles.metricValue}>
                                {selectedPeriod === 'week' ? periodData.deliveries?.total || 0 :
                                    selectedPeriod === 'month' ? periodData.deliveries?.total || 0 :
                                        analytics?.lifetime?.totalDeliveries || 0}
                            </Text>
                            <Text style={styles.metricLabel}>Deliveries</Text>
                        </View>

                        <View style={styles.metricBox}>
                            <View style={styles.metricIconContainer}>
                                <Ionicons name="star" size={24} color="#FFC107"/>
                            </View>
                            <Text style={styles.metricValue}>
                                {analytics?.ratings?.overall?.average?.toFixed(1) || '0.0'}
                            </Text>
                            <Text style={styles.metricLabel}>Rating</Text>
                            <Text style={styles.metricSubtext}>
                                {analytics?.ratings?.overall?.total || 0} reviews
                            </Text>
                        </View>
                    </View>

                    <View style={styles.metricsRow}>
                        <View style={styles.metricBox}>
                            <View style={styles.metricIconContainer}>
                                <Ionicons name="speedometer" size={24} color="#2196F3"/>
                            </View>
                            <Text style={styles.metricValue}>
                                {Math.round(selectedPeriod === 'week' ? periodData.distance?.total || 0 :
                                    selectedPeriod === 'month' ? periodData.distance?.total || 0 :
                                        analytics?.lifetime?.totalDistance || 0)} km
                            </Text>
                            <Text style={styles.metricLabel}>Distance</Text>
                        </View>

                        <View style={styles.metricBox}>
                            <View style={styles.metricIconContainer}>
                                <Ionicons name="time" size={24} color="#9C27B0"/>
                            </View>
                            <Text style={styles.metricValue}>
                                {Math.round(selectedPeriod === 'week' ? periodData.timeMetrics?.hoursOnline || 0 :
                                    selectedPeriod === 'month' ? periodData.timeMetrics?.hoursOnline || 0 :
                                        analytics?.lifetime?.totalHours || 0)}h
                            </Text>
                            <Text style={styles.metricLabel}>Online Time</Text>
                        </View>
                    </View>


                </View>

                {/* EARNINGS CHART */}
                {analytics?.daily?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Earnings Trend</Text>
                        <View style={styles.chartContainer}>
                            <LineChart
                                data={{
                                    labels: getChartLabels(selectedPeriod, analytics),
                                    datasets: [{
                                        data: getChartData(selectedPeriod, analytics, userData)
                                    }]
                                }}
                                width={width - 48}
                                height={200}
                                chartConfig={{
                                    backgroundColor: '#fff',
                                    backgroundGradientFrom: '#fff',
                                    backgroundGradientTo: '#fff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: {borderRadius: 16},
                                    propsForDots: {
                                        r: '4',
                                        strokeWidth: '2',
                                        stroke: '#4CAF50'
                                    }
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    </View>
                )}

                {/* RATING BREAKDOWN */}
                {analytics?.ratings?.overall?.total > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Rating Overview</Text>

                        {/* Star Distribution */}
                        <View style={styles.ratingCard}>
                            <View style={styles.ratingOverview}>
                                <View style={styles.ratingScore}>
                                    <Text style={styles.ratingNumber}>
                                        {analytics.ratings.overall.average.toFixed(1)}
                                    </Text>
                                    <View style={styles.stars}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                                key={star}
                                                name={star <= Math.round(analytics.ratings.overall.average) ? 'star' : 'star-outline'}
                                                size={20}
                                                color="#FFC107"
                                            />
                                        ))}
                                    </View>
                                    <Text style={styles.ratingCount}>
                                        {analytics.ratings.overall.total} ratings
                                    </Text>
                                </View>

                                <View style={styles.ratingBars}>
                                    {[5, 4, 3, 2, 1].map((stars) => {
                                        const count = analytics.ratings.overall.distribution[`${getStarKey(stars)}Star`] || 0;
                                        const percentage = analytics.ratings.overall.total > 0
                                            ? (count / analytics.ratings.overall.total) * 100
                                            : 0;

                                        return (
                                            <View key={stars} style={styles.ratingBarRow}>
                                                <Text style={styles.starLabel}>{stars}★</Text>
                                                <View style={styles.barTrack}>
                                                    <View style={[styles.barFill, {width: `${percentage}%`}]}/>
                                                </View>
                                                <Text style={styles.barCount}>{count}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        {/* Category Ratings */}
                        {Object.entries(analytics.ratings.categories).some(([_, data]) => data.total > 0) && (
                            <View style={styles.categoriesCard}>
                                <Text style={styles.cardSubtitle}>Performance by Category</Text>
                                {Object.entries(analytics.ratings.categories).map(([category, data]) => {
                                    if (data.total === 0) return null;
                                    return (
                                        <View key={category} style={styles.categoryRow}>
                                            <Text style={styles.categoryName}>
                                                {category.charAt(0).toUpperCase() + category.slice(1)}
                                            </Text>
                                            <View style={styles.categoryRating}>
                                                <View style={styles.categoryBar}>
                                                    <View style={[
                                                        styles.categoryBarFill,
                                                        {width: `${(data.average / 5) * 100}%`}
                                                    ]}/>
                                                </View>
                                                <Text style={styles.categoryScore}>{data.average.toFixed(1)}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {/* RECENT Deliveries */}
                {userData.orderData?.recentOrders?.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Deliveries</Text>
                            <TouchableOpacity
                                onPress={navigateToAllDeliveries}
                            >
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="open" size={24} color="#4CAF50" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {userData.orderData.recentOrders.slice(0, 5).map((order) => (
                            <View key={order.id} style={styles.tripCard}>
                                <View style={styles.tripHeader}>
                                    <View style={styles.tripStatus}>
                                        <Ionicons
                                            name={order.status === 'delivered' ? 'checkmark-circle' : 'time'}
                                            size={20}
                                            color={order.status === 'delivered' ? '#4CAF50' : '#FF9800'}
                                        />
                                        <Text style={styles.tripRef}>{order.orderRef}</Text>
                                    </View>
                                    <Text style={styles.tripEarnings}>{formatCurrency(order.earnings)}</Text>
                                </View>

                                <View style={styles.tripRoute}>
                                    <View style={styles.routePoint}>
                                        <Ionicons name="ellipse" size={12} color="#4CAF50"/>
                                        <Text style={styles.routeText} numberOfLines={1}>
                                            {extractLocation(order.pickupLocation)}
                                        </Text>
                                    </View>
                                    <View style={styles.routeLine}/>
                                    <View style={styles.routePoint}>
                                        <Ionicons name="location" size={12} color="#F44336"/>
                                        <Text style={styles.routeText} numberOfLines={1}>
                                            {extractLocation(order.dropoffLocation)}
                                        </Text>
                                    </View>
                                </View>

                                {order.rating && (
                                    <View style={styles.tripRating}>
                                        <Ionicons name="star" size={14} color="#FFC107"/>
                                        <Text style={styles.tripRatingText}>{order.rating}.0</Text>
                                        {order.clientFeedback && (
                                            <Text style={styles.tripFeedback} numberOfLines={1}>
                                                • "{order.clientFeedback}"
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <Text style={styles.tripDate}>
                                    {new Date(order.completedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* RECENT TRANSACTIONS */}
                {userData.wallet?.recentTransactions?.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Transactions</Text>
                            <TouchableOpacity
                                onPress={() => navigateToAllEarnings()}
                            >
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="open" size={24} color="#4CAF50" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {userData.wallet.recentTransactions.slice(0, 5).map((transaction, index) => (
                            <View key={index} style={styles.transactionCard}>
                                <View style={styles.transactionIcon}>
                                    <Ionicons
                                        name={transaction.type === 'earning' ? 'arrow-down' : 'arrow-up'}
                                        size={20}
                                        color={transaction.type === 'earning' ? '#4CAF50' : '#F44336'}
                                    />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionDesc}>{transaction.description}</Text>
                                    <Text style={styles.transactionDate}>
                                        {new Date(transaction.timestamp).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.transactionAmount,
                                    {color: transaction.type === 'earning' ? '#4CAF50' : '#F44336'}
                                ]}>
                                    {transaction.type === 'earning' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ACHIEVEMENTS */}
                {analytics?.achievements?.milestones?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Achievements 🏆</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
                            {analytics.achievements.milestones.map((achievement, index) => (
                                <View key={index} style={styles.achievementBadge}>
                                    <Text style={styles.achievementEmoji}>{achievement.badge}</Text>
                                    <Text style={styles.achievementTitle}>{achievement.description}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* TOP LOCATIONS */}
                {analytics?.geographic?.topAreas?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Top Delivery Areas</Text>
                        {analytics.geographic.topAreas.slice(0, 3).map((area, index) => (
                            <View key={index} style={styles.locationCard}>
                                <View style={styles.locationRank}>
                                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                                </View>
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationName}>{area.lga}, {area.state}</Text>
                                    <Text style={styles.locationStats}>
                                        {area.deliveryCount} deliveries • {formatCurrency(area.totalEarnings)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Last updated: {new Date().toLocaleString()}
                    </Text>
                </View>
            </ScrollView>
        </>
    );
};

// Helper Functions
const extractLocation = (fullAddress) => {
    if (!fullAddress) return 'Unknown';
    const parts = fullAddress.split(',');
    return parts[0].trim();
};

const getStarKey = (stars) => {
    const map = {5: 'five', 4: 'four', 3: 'three', 2: 'two', 1: 'one'};
    return map[stars];
};

const getChartLabels = (period, analytics) => {
    if (period === 'week') {
        const last7Days = analytics.daily?.slice(-7) || [];
        return last7Days.map(d => {
            const date = new Date(d.period);
            return date.toLocaleDateString('en-US', {weekday: 'short'}).substring(0, 3);
        });
    }
    if (period === 'month') {
        const last4Weeks = analytics.weekly?.slice(-4) || [];
        return last4Weeks.map((_, i) => `W${i + 1}`);
    }
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
};

const getChartData = (period, analytics, userData) => {
    if (period === 'week') {
        const last7Days = analytics.daily?.slice(-7) || [];
        const data = last7Days.map(d => d.earnings.gross);
        return data.length > 0 ? data : [0];
    }
    if (period === 'month') {
        const last4Weeks = analytics.weekly?.slice(-4) || [];
        const data = last4Weeks.map(w => w.earnings.gross);
        return data.length > 0 ? data : [0];
    }
    const monthly = analytics.monthly || [];
    const data = monthly.map(m => m.earnings.gross);
    return data.length > 0 ? data : [0];
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
    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E0E0E0',
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    driverName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    driverPhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F7FF',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    vehicleText: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '500',
    },

    // Quick Stats
    quickStats: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    quickStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        marginTop: 8,
        marginBottom: 4,
    },
    quickStatValue: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
    },
    quickStatDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 16,
    },

    // Period Selector
    periodSelector: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
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
        fontFamily: 'PoppinsMedium',
        color: '#666',
    },
    periodTabTextActive: {
        color: '#fff',
    },

    // Section
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    seeAllText: {
        fontSize: 16,
        color: '#4CAF50',
        fontFamily: 'PoppinsMedium',
        marginRight: 5
    },

    // Earnings Card
    earningsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    earningsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    earningsLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontFamily: 'PoppinsSemiBold'
    },
    earningsAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    earningsIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 4,
    },
    trendText: {
        fontSize: 13,
        fontWeight: '600',
    },
    earningsBreakdown: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
        gap: 16,
    },
    breakdownItem: {
        flex: 1,
    },
    breakdownLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#999',
        marginBottom: 4,
    },
    breakdownValue: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#333',
    },

    // Metrics Grid
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    metricBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    metricIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        textAlign: 'center',
    },
    metricSubtext: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },

    // Chart
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },

    // Rating Card
    ratingCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    ratingOverview: {
        flexDirection: 'row',
        gap: 20,
    },
    ratingScore: {
        alignItems: 'center',
        paddingRight: 20,
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
    },
    ratingNumber: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 8,
    },
    ratingCount: {
        fontSize: 12,
        color: '#999',
    },
    ratingBars: {
        flex: 1,
        justifyContent: 'center',
    },
    ratingBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    starLabel: {
        fontSize: 13,
        color: '#666',
        width: 24,
    },
    barTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#FFC107',
        borderRadius: 4,
    },
    barCount: {
        fontSize: 13,
        color: '#666',
        width: 28,
        textAlign: 'right',
    },

    // Category Ratings
    categoriesCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardSubtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    categoryRow: {
        marginBottom: 16,
    },
    categoryName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    categoryRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    categoryBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    categoryScore: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        width: 32,
    },

    // Trip Card
    tripCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tripStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tripRef: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        fontWeight: '600',
        color: '#666',
    },
    tripEarnings: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#4CAF50',
    },
    tripRoute: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#333',
        flex: 1,
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
        marginVertical: 2,
    },
    tripRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    tripRatingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    tripFeedback: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        flex: 1,
        marginLeft: 4,
    },
    tripDate: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#999',
    },

    // Transaction Card
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionDesc: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: '#999',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Achievements
    achievementsScroll: {
        marginTop: 8,
    },
    achievementBadge: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 140,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    achievementEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    achievementTitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },

    // Location Card
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    locationRank: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    locationInfo: {
        flex: 1,
    },
    locationName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    locationStats: {
        fontSize: 13,
        color: '#666',
    },

    // Footer
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
    profileHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 16,
        marginTop: -10,
    },

    // Header Title Section
    headerTitleSection: {
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    headerMainTitle: {
        fontSize: 24,
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: -2,
        fontFamily: 'PoppinsSemiBold'
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Avatar Section
    avatarSection: {
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarLarge: {
        width: 170,
        height: 170,
        borderRadius: 150,
        borderWidth: 4,
        borderColor: '#fff',
        backgroundColor: '#E0E0E0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },

    // Info Card
    infoCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,

    },
    infoRowSecond: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'PoppinsRegular',
        flex: 1,
    },
    infoDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 8,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    // Vehicle Info Card
    vehicleInfoCard: {
        backgroundColor: '#F0F7FF',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    vehicleItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    vehicleItemText: {
        fontSize: 13,
        color: '#4A90E2',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
    },
    vehicleDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#D1E3F8',
        marginHorizontal: 4,
    },
});

export default AnalyticsManagement;