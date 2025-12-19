// components/Client/Profile/Analytics/AnalyticsManagement.jsx
import React, {useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    Image, Pressable
} from 'react-native';
import {Ionicons, FontAwesome6, MaterialIcons} from '@expo/vector-icons';
import CustomHeader from "../../../CustomHeader";
import {router} from "expo-router";
import {LineChart} from 'react-native-chart-kit';

const {width} = Dimensions.get('window');

function AnalyticsManagement({analytics, orders, wallet, refetch, userData}) {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week');

    console.log({wallet})

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch?.();
        setRefreshing(false);
    };

    const hasData = analytics?.lifetime?.totalOrders > 0;

    if (!hasData) {
        return (
            <>
                <CustomHeader title="Analytics" onBackPress={() => router.back()}/>
                <View style={styles.emptyContainer}>
                    <Ionicons name="analytics-outline" size={96} color="#E0E0E0"/>
                    <Text style={styles.emptyTitle}>No Analytics Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Place your first order to start tracking your activity
                    </Text>
                </View>
            </>
        );
    }

    const getPeriodData = () => {
        if (!analytics) return {};

        if (selectedPeriod === 'week') {
            const currentWeek = analytics.weekly?.[analytics.weekly.length - 1];
            return currentWeek || {};
        }

        if (selectedPeriod === 'month') {
            const currentMonth = analytics.monthly?.[analytics.monthly.length - 1];
            return currentMonth || {};
        }

        return analytics.lifetime || {};
    };

    const periodData = getPeriodData();
    const formatCurrency = (amount) => `₦${(amount || 0).toLocaleString()}`;

    const navigateToAllOrders = () => {
        router.push("/client/profile/analytics/orders");
    };

    const navigateToAllPayments = () => {
        router.push("/client/profile/analytics/payment");
    };

    // Get top 3 categories
    const getTopCategories = () => {
        if (!analytics?.categories) return [];
        const categories = Object.entries(analytics.categories)
            .map(([name, data]) => ({name, ...data}))
            .filter(cat => cat.count > 0)
            .sort((a, b) => b.spent - a.spent)
            .slice(0, 3);
        return categories;
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

    const extractLocation = (fullAddress) => {
        if (!fullAddress) return 'Unknown';
        const parts = fullAddress.split(',');
        return parts[0].trim();
    };

    const getOrderStatusIcon = (status) => {
        const icons = {
            'delivered': 'checkmark-circle',
            'cancelled': 'close-circle',
            'confirmed': 'checkmark-done-circle',
            'picked_up': 'cube',
            'en_route_pickup': 'arrow-forward',
            'en_route_dropoff': 'rocket',
            'assigned': 'car',
            'pending': 'time',
            'admin_review': 'shield-checkmark',
            'draft': 'create',
            'submitted': 'paper-plane',
            'admin_approved': 'checkmark-circle',
            'admin_rejected': 'close-circle',
            'failed': 'alert-circle',
            'returned': 'return-up-back'
        };
        return icons[status] || 'ellipse';
    };

    const getOrderStatusColor = (status) => {
        const colors = {
            'delivered': '#4CAF50',
            'cancelled': '#F44336',
            'confirmed': '#4CAF50',
            'picked_up': '#2196F3',
            'en_route_pickup': '#FF9800',
            'en_route_dropoff': '#FF9800',
            'assigned': '#2196F3',
            'pending': '#FF9800',
            'admin_review': '#9C27B0',
            'draft': '#666',
            'submitted': '#2196F3',
            'admin_approved': '#4CAF50',
            'admin_rejected': '#F44336',
            'failed': '#F44336',
            'returned': '#FF9800'
        };
        return colors[status] || '#666';
    };

    const formatOrderStatus = (status) => {
        const statusMap = {
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
            'confirmed': 'Confirmed',
            'picked_up': 'Picked Up',
            'en_route_pickup': 'En Route to Pickup',
            'en_route_dropoff': 'En Route to Dropoff',
            'assigned': 'Driver Assigned',
            'pending': 'Pending',
            'admin_review': 'Under Review',
            'draft': 'Draft',
            'submitted': 'Submitted',
            'admin_approved': 'Approved',
            'admin_rejected': 'Rejected',
            'failed': 'Failed',
            'returned': 'Returned'
        };
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    };

    const formatCategoryName = (category) => {
        if (!category) return 'Package';
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
    };

    const formatDistance = (km) => {
        if (!km) return '0 km';
        return `${km.toFixed(1)} km`;
    };

    const calculateDeliveryTime = (start, end) => {
        if (!start || !end) return 'N/A';
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diffHours = (endTime - startTime) / (1000 * 60 * 60);

        if (diffHours < 1) {
            return `${Math.round(diffHours * 60)} min`;
        } else if (diffHours < 24) {
            return `${Math.round(diffHours)} hours`;
        } else {
            return `${Math.round(diffHours / 24)} days`;
        }
    };

    const onBackPress = () => {
        router.replace('/client/profile');
    };

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
            >
                {/* CLIENT PROFILE HEADER */}
                <View style={styles.profileHeader}>
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
                        <View style={styles.headerTitleSection}>
                            <Text style={styles.headerMainTitle}>Analytics Center</Text>
                            <Text style={styles.headerSubtitle}>
                                Track your orders, spending, and delivery insights
                            </Text>
                        </View>
                    </View>


                    <View style={styles.avatarSection}>
                        <Image
                            source={{uri: userData.avatar}}
                            style={styles.avatarLarge}
                            defaultSource={require('../../../../assets/images/avatar-1.jpg')}
                        />
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Ionicons name="person" size={18} color="#4CAF50"/>
                                <Text style={styles.infoText}>{userData.fullName}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="mail" size={18} color="#4CAF50"/>
                                <Text style={styles.infoText} numberOfLines={1}>
                                    {userData.email}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRowSecond}>
                            <View style={styles.infoItem}>
                                <Ionicons name="call" size={18} color="#4CAF50"/>
                                <Text style={styles.infoText}>{userData.phoneNumber}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="calendar" size={18} color="#4CAF50"/>
                                <Text style={styles.infoText}>
                                    Since {new Date(userData.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric'
                                })}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* QUICK STATS OVERVIEW */}
                <View style={styles.quickStats}>
                    <View style={styles.quickStatItem}>
                        <FontAwesome6 name="boxes-stacked" size={20} color="#666"/>
                        <Text style={styles.quickStatLabel}>Total Orders</Text>
                        <Text style={styles.quickStatValue}>
                            {analytics.lifetime.totalOrders}
                        </Text>
                    </View>
                    <View style={styles.quickStatDivider}/>
                    <View style={styles.quickStatItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50"/>
                        <Text style={styles.quickStatLabel}>Success Rate</Text>
                        <Text style={styles.quickStatValue}>
                            {analytics.lifetime.totalOrders > 0
                                ? Math.round((analytics.lifetime.completedOrders / analytics.lifetime.totalOrders) * 100)
                                : 0}%
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

                {/* KEY METRICS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'Lifetime'} Overview
                    </Text>

                    {/* Spending Card */}
                    <View style={styles.spendingCard}>
                        <View style={styles.spendingHeader}>
                            <View>
                                <Text style={styles.spendingLabel}>Total Spent</Text>
                                <Text style={styles.spendingAmount}>
                                    {formatCurrency(
                                        selectedPeriod === 'week' ? periodData.spending?.gross || 0 :
                                            selectedPeriod === 'month' ? periodData.spending?.gross || 0 :
                                                analytics?.lifetime?.totalSpent || 0
                                    )}
                                </Text>
                            </View>
                            <View style={styles.spendingIcon}>
                                <Ionicons name="wallet" size={32} color="#FF9800"/>
                            </View>
                        </View>

                        {selectedPeriod !== 'year' && analytics?.trends?.spending && (
                            <View style={styles.trendIndicator}>
                                <Ionicons
                                    name={analytics.trends.spending.trend === 'increasing' ? 'trending-up' : 'trending-down'}
                                    size={16}
                                    color={analytics.trends.spending.trend === 'increasing' ? '#FF9800' : '#4CAF50'}
                                />
                                <Text style={[
                                    styles.trendText,
                                    {color: analytics.trends.spending.trend === 'increasing' ? '#FF9800' : '#4CAF50'}
                                ]}>
                                    {analytics.trends.spending.changePercent}% vs last {selectedPeriod}
                                </Text>
                            </View>
                        )}

                        <View style={styles.spendingBreakdown}>
                            <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>Avg Order</Text>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(analytics?.lifetime?.averageOrderValue || 0)}
                                </Text>
                            </View>
                            <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>Wallet Balance</Text>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(analytics?.payments?.wallet?.currentBalance || 0)}
                                </Text>
                            </View>
                            <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>Total Fees</Text>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(analytics?.payments?.totalFees || 0)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Orders & Distance Grid */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metricBox}>
                            <View style={styles.metricIconContainer}>
                                <FontAwesome6 name="boxes-stacked" size={24} color="#2196F3"/>
                            </View>
                            <Text style={styles.metricValue}>
                                {selectedPeriod === 'week' ? periodData.orders?.total || 0 :
                                    selectedPeriod === 'month' ? periodData.orders?.total || 0 :
                                        analytics?.lifetime?.totalOrders || 0}
                            </Text>
                            <Text style={styles.metricLabel}>Orders</Text>
                        </View>

                        <View style={styles.metricBox}>
                            <View style={styles.metricIconContainer}>
                                <Ionicons name="speedometer" size={24} color="#9C27B0"/>
                            </View>
                            <Text style={styles.metricValue}>
                                {Math.round(selectedPeriod === 'week' ? periodData.distance || 0 :
                                    selectedPeriod === 'month' ? periodData.distance || 0 :
                                        analytics?.lifetime?.totalDistance || 0)} km
                            </Text>
                            <Text style={styles.metricLabel}>Distance</Text>
                        </View>
                    </View>

                    <View style={styles.metricsRow}>
                        <View style={styles.metricBox}>
                            <View style={styles.metricIconContainer}>
                                <Ionicons name="checkmark-done" size={24} color="#4CAF50"/>
                            </View>
                            <Text style={styles.metricValue}>
                                {analytics?.lifetime?.completedOrders || 0}
                            </Text>
                            <Text style={styles.metricLabel}>Completed</Text>
                        </View>

                        <View style={styles.metricBox}>
                            <View style={styles.metricIconContainer}>
                                <Ionicons name="close-circle" size={24} color="#F44336"/>
                            </View>
                            <Text style={styles.metricValue}>
                                {analytics?.lifetime?.cancelledOrders || 0}
                            </Text>
                            <Text style={styles.metricLabel}>Cancelled</Text>
                        </View>
                    </View>
                </View>

                {/* SPENDING CHART */}
                {analytics?.daily?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Spending Trend</Text>
                        <View style={styles.chartContainer}>
                            <LineChart
                                data={{
                                    labels: getChartLabels(selectedPeriod, analytics),
                                    datasets: [{
                                        data: getChartData(selectedPeriod, analytics)
                                    }]
                                }}
                                width={width - 48}
                                height={200}
                                chartConfig={{
                                    backgroundColor: '#fff',
                                    backgroundGradientFrom: '#fff',
                                    backgroundGradientTo: '#fff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: {borderRadius: 16},
                                    propsForDots: {
                                        r: '4',
                                        strokeWidth: '2',
                                        stroke: '#FF9800'
                                    }
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    </View>
                )}

                {/* TOP CATEGORIES */}
                {getTopCategories().length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Top Categories</Text>
                        {getTopCategories().map((category, index) => (
                            <View key={category.name} style={styles.categoryCard}>
                                <View style={styles.categoryRank}>
                                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                                </View>
                                <View style={styles.categoryIcon}>
                                    <Ionicons
                                        name={getCategoryIcon(category.name)}
                                        size={24}
                                        color="#4CAF50"
                                    />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryName}>
                                        {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                                    </Text>
                                    <Text style={styles.categoryStats}>
                                        {category.count} orders • {formatCurrency(category.spent)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* RECENT ORDERS */}
                {orders?.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.recentTrxSectionTitle}>Recent Orders</Text>
                            <TouchableOpacity onPress={navigateToAllOrders}>
                                <Ionicons name="open" size={24} color="#4CAF50"/>
                            </TouchableOpacity>
                        </View>

                        {orders.slice(0, 5).map((order) => (
                            <TouchableOpacity
                                key={order._id}
                                style={styles.orderCard}
                                onPress={() => router.push(`/client/profile/analytics/orders/view/${order._id}`)}

                                activeOpacity={0.7}
                            >
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderStatus}>
                                        <Ionicons
                                            name={getOrderStatusIcon(order.status)}
                                            size={20}
                                            color={getOrderStatusColor(order.status)}
                                        />
                                        <Text style={styles.orderRef}>{order.orderRef}</Text>
                                        <Text
                                            style={[styles.orderStatusText, {color: getOrderStatusColor(order.status)}]}>
                                            {formatOrderStatus(order.status)}
                                        </Text>
                                    </View>
                                    <Text style={styles.orderAmount}>
                                        {formatCurrency(order.pricing?.totalAmount || 0)}
                                    </Text>
                                </View>

                                {/* Package Info */}
                                <View style={styles.packageInfo}>
                                    <Ionicons
                                        name={getCategoryIcon(order.package?.category)}
                                        size={16}
                                        color="#666"
                                    />
                                    <Text style={styles.packageText} numberOfLines={1}>
                                        {order.package?.description || formatCategoryName(order.package?.category)}
                                    </Text>
                                </View>

                                {/* Route */}
                                <View style={styles.orderRoute}>
                                    <View style={styles.routeRow}>
                                        <Ionicons name="ellipse" size={10} color="#4CAF50" style={styles.routeIcon}/>
                                        <View style={styles.routeContent}>
                                            <Text style={styles.routeText}>
                                                {extractLocation(order.location?.pickUp?.address)}
                                            </Text>
                                            {order.location?.pickUp?.landmark && (
                                                <Text style={styles.landmarkText}>
                                                    {order.location.pickUp.landmark}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.verticalLineSmall}/>

                                    <View style={styles.routeRow}>
                                        <Ionicons name="location" size={10} color="#F44336" style={styles.routeIcon}/>
                                        <View style={styles.routeContent}>
                                            <Text style={styles.routeText}>
                                                {extractLocation(order.location?.dropOff?.address)}
                                            </Text>
                                            {order.location?.dropOff?.landmark && (
                                                <Text style={styles.landmarkText}>
                                                    {order.location.dropOff.landmark}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Delivery Info */}
                                <View style={styles.deliveryInfo}>
                                    {order.driverAssignment?.driverInfo?.name && (
                                        <View style={styles.driverInfo}>
                                            <Ionicons name="person" size={12} color="#666"/>
                                            <Text
                                                style={styles.driverText}>{order.driverAssignment.driverInfo.name}</Text>
                                        </View>
                                    )}

                                    {order.driverAssignment?.distance?.total && (
                                        <View style={styles.distanceInfo}>
                                            <Ionicons name="speedometer" size={12} color="#666"/>
                                            <Text style={styles.distanceText}>
                                                {formatDistance(order.driverAssignment.distance.total)}
                                            </Text>
                                        </View>
                                    )}

                                    {order.rating?.driverRating?.stars && (
                                        <View style={styles.ratingInfo}>
                                            <Ionicons name="star" size={12} color="#FFC107"/>
                                            <Text style={styles.ratingText}>{order.rating.driverRating.stars}.0</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Order Date & Time */}
                                <View style={styles.orderDateTime}>
                                    <Ionicons name="time" size={12} color="#999"/>
                                    <Text style={styles.orderDateText}>
                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                    <Text style={styles.orderDateText}>
                                        {new Date(order.createdAt).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>

                                {/* View Details Indicator */}

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: 8
                                }}>
                                    <View>
                                        {order.status === 'delivered' && order.driverAssignment?.actualTimes?.deliveredAt && (
                                            <Text style={styles.completedText}>
                                                Completed
                                                in {calculateDeliveryTime(order.createdAt, order.driverAssignment.actualTimes.deliveredAt)}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.viewDetails}>
                                        <Text style={styles.viewDetailsText}>View details</Text>
                                        <Ionicons name="chevron-forward" size={16} color="#4CAF50"/>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}


                {/* WALLET TRANSACTIONS */}
                {wallet?.recentTransactions?.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.recentTrxSectionTitle}>Recent Transactions</Text>
                            <TouchableOpacity onPress={navigateToAllPayments}>
                                <Ionicons name="open" size={24} color="#4CAF50"/>
                            </TouchableOpacity>
                        </View>

                        {wallet.recentTransactions.slice(0, 5).map((transaction, index) => (
                            <View key={index} style={styles.transactionCard}>
                                <View style={styles.transactionIcon}>
                                    <Ionicons
                                        name={transaction.type === 'deposit' ? 'arrow-down' : 'arrow-up'}
                                        size={20}
                                        color={transaction.type === 'deposit' ? '#4CAF50' : '#F44336'}
                                    />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionDesc}>{transaction.description}</Text>
                                    <Text style={styles.transactionDate}>
                                        {new Date(transaction.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.transactionAmount,
                                    {color: transaction.type === 'deposit' ? '#4CAF50' : '#F44336'}
                                ]}>
                                    {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
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
                {analytics?.geographic?.topDropoffAreas?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Top Delivery Areas</Text>
                        {analytics.geographic.topDropoffAreas.slice(0, 3).map((area, index) => (
                            <View key={index} style={styles.locationCard}>
                                <View style={styles.locationRank}>
                                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                                </View>
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationName}>{area.lga}, {area.state}</Text>
                                    <Text style={styles.locationStats}>
                                        {area.orderCount} orders • {formatCurrency(area.totalSpent)}
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

const getChartData = (period, analytics) => {
    if (period === 'week') {
        const last7Days = analytics.daily?.slice(-7) || [];
        const data = last7Days.map(d => d.spending.gross);
        return data.length > 0 ? data : [0];
    }
    if (period === 'month') {
        const last4Weeks = analytics.weekly?.slice(-4) || [];
        const data = last4Weeks.map(w => w.spending.gross);
        return data.length > 0 ? data : [0];
    }
    const monthly = analytics.monthly || [];
    const data = monthly.map(m => m.spending.gross);
    return data.length > 0 ? data : [0];
};


const styles = StyleSheet.create({
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
    earningsBreakdown: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
        gap: 16,
    },

    // Metrics Grid
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

    // Avatar Section

    // Info Card
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
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    profileHeader: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitleSection: {
        marginBottom: 20,
    },
    headerMainTitle: {
        fontSize: 28,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#666',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#4CAF50',
    },
    infoCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoRowSecond: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'PoppinsMono',
        marginLeft: 8,
        flex: 1,
    },
    quickStats: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    quickStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatLabel: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'PoppinsRegular',
        marginTop: 8,
        marginBottom: 4,
    },
    quickStatValue: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
    },
    quickStatDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 16,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
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
        fontFamily: 'PoppinsRegular',
        color: '#666',
    },
    periodTabTextActive: {
        color: '#fff',
        fontFamily: 'PoppinsSemiBold',
    },
    section: {
        marginTop: 16,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    recentTrxSectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 22,
    },
    spendingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    spendingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    spendingLabel: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    spendingAmount: {
        fontSize: 32,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
    },
    spendingIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    trendText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        marginLeft: 4,
    },
    spendingBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    breakdownItem: {
        flex: 1,
    },
    breakdownLabel: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'PoppinsMedium',
        marginBottom: 4,
    },
    breakdownValue: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    metricBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginRight: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },


    scrollContent: {
        paddingBottom: 24,
    },
    // Category Card
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    categoryRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    categoryStats: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#666',
    },

    // Order Card

    orderRef: {
        fontSize: 14,

        color: '#1A1A1A',
        marginLeft: 6,
    },

    orderDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },

    // Transaction Card
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
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
        fontSize: 18,
        fontWeight: '600',
        color: '#DC2626',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },

    emptyIconContainer: {
        marginBottom: 24,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
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
        gap: 8,
    },
    orderStatusText: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        marginLeft: 4,
    },
    orderAmount: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#4CAF50',
    },
    packageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    packageText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#333',
        flex: 1,
    },
    routeLine: {
        width: 2,
        height: 12,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
        marginVertical: 2,
    },
    deliveryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 16,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    driverText: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#666',
    },
    distanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    distanceText: {
        fontSize: 12,
        fontFamily: 'PoppinsMono',
        color: '#666',
    },
    ratingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
    },
    orderDateTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    orderDateText: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#999',
    },
    completedText: {
        fontSize: 12,
        color: '#4CAF50',
        fontFamily: 'PoppinsMedium',
    },
    viewDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    viewDetailsText: {
        fontSize: 12,
        color: '#4CAF50',
        fontFamily: 'PoppinsMedium',
    },


    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        minHeight: 40,
    },
    iconContainer: {
        width: 24,
        alignItems: 'center',
        paddingTop: 2,
    },
    routeDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    verticalLineContainer: {
        width: 24,
        alignItems: 'center',
        height: 12,
    },
    verticalLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E0E0E0',
    },


    orderRoute: {
        marginBottom: 12,
        marginLeft: 4,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeIcon: {
        marginTop: 3,
        marginRight: 10,
        width: 20,
    },
    routeContent: {
        flex: 1,
    },
    routeText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        lineHeight: 18,
    },
    landmarkText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        lineHeight: 16,
        marginTop: 1,
    },
    verticalLineSmall: {
        width: 2,
        height: 25,
        backgroundColor: '#000',
        marginLeft: 4,
        marginBottom: 10,
    },

    backButton: {
        backgroundColor: '#4F628E',
        borderRadius: 5,
        padding: 2,
    }

});

export default AnalyticsManagement;