// components/Driver/Account/Analytics/Earnings.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import CustomHeader from "../../../CustomHeader";
import { router } from "expo-router";
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const Earnings = ({ earningAnalytics, userData, refetch }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [loadingMore, setLoadingMore] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch?.();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => `₦${(amount || 0).toLocaleString()}`;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getTransactionIcon = (type) => {
        return type === 'driver_earning' ? 'arrow-down-circle' : 'arrow-up-circle';
    };

    const getTransactionColor = (type) => {
        return type === 'driver_earning' ? '#4CAF50' : '#F44336';
    };

    if (!earningAnalytics) {
        return (
            <>
                <CustomHeader title="Earnings" onBackPress={() => router.back()} />
                <View style={styles.emptyContainer}>
                    <Ionicons name="wallet-outline" size={96} color="#E0E0E0" />
                    <Text style={styles.emptyTitle}>No Earnings Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Complete deliveries to start earning
                    </Text>
                </View>
            </>
        );
    }

    const { balance, summary, charts, breakdown, transactions, pagination, filters, lifetime, recentActivity, withdrawalSettings } = earningAnalytics;

    return (
        <>
            <CustomHeader title="" onBackPress={() => router.back()} />

            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Earning Analytics</Text>
                    <Text style={styles.sectionSubtitle}>Your financial performance</Text>
                </View>
                {/* BALANCE CARD */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(balance.available)}</Text>

                    <View style={styles.balanceBreakdown}>
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceItemLabel}>Pending</Text>
                            <Text style={styles.balanceItemValue}>{formatCurrency(balance.pending)}</Text>
                        </View>
                        <View style={styles.balanceDivider} />
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceItemLabel}>Withdrawn</Text>
                            <Text style={styles.balanceItemValue}>{formatCurrency(balance.withdrawn)}</Text>
                        </View>
                    </View>

                    {withdrawalSettings.bankDetails && (
                        <TouchableOpacity style={styles.withdrawButton}>
                            <Ionicons name="cash-outline" size={20} color="#fff" />
                            <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* PERIOD SUMMARY */}
                <View style={styles.summarySection}>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="trending-up" size={24} color="#4CAF50" />
                            <Text style={styles.statValue}>{formatCurrency(summary.periodEarnings)}</Text>
                            <Text style={styles.statLabel}>Period Earnings</Text>
                            {summary.earningsGrowth !== 0 && (
                                <View style={[styles.growthBadge, {
                                    backgroundColor: summary.earningsGrowth > 0 ? '#E8F5E9' : '#FFEBEE'
                                }]}>
                                    <Ionicons
                                        name={summary.earningsGrowth > 0 ? "arrow-up" : "arrow-down"}
                                        size={12}
                                        color={summary.earningsGrowth > 0 ? "#4CAF50" : "#F44336"}
                                    />
                                    <Text style={[styles.growthText, {
                                        color: summary.earningsGrowth > 0 ? "#4CAF50" : "#F44336"
                                    }]}>
                                        {Math.abs(summary.earningsGrowth)}%
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.statCard}>
                            <FontAwesome6 name="boxes-stacked" size={24} color="#2196F3" />
                            <Text style={styles.statValue}>{summary.periodDeliveries}</Text>
                            <Text style={styles.statLabel}>Deliveries</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="stats-chart" size={24} color="#FF9800" />
                            <Text style={styles.statValue}>{formatCurrency(summary.avgEarningsPerDelivery)}</Text>
                            <Text style={styles.statLabel}>Avg/Delivery</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="wallet" size={24} color="#9C27B0" />
                            <Text style={styles.statValue}>{formatCurrency(summary.netChange)}</Text>
                            <Text style={styles.statLabel}>Net Change</Text>
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

                {/* EARNINGS CHART */}
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>
                        {selectedPeriod === 'week' ? 'Last 7 Days' : selectedPeriod === 'month' ? 'Monthly Trend' : 'Yearly Overview'}
                    </Text>

                    <View style={styles.chartContainer}>
                        {selectedPeriod === 'week' && charts.weekly && (
                            <BarChart
                                data={{
                                    labels: charts.weekly.map(d => d.dayName),
                                    datasets: [{
                                        data: charts.weekly.map(d => d.earnings || 100)
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
                                    barPercentage: 0.7,
                                    formatYLabel: (value) => `₦${(parseFloat(value) / 1000).toFixed(0)}k`
                                }}
                                style={styles.chart}
                                showValuesOnTopOfBars
                                fromZero
                            />
                        )}

                        {selectedPeriod === 'month' && charts.monthly && (
                            <LineChart
                                data={{
                                    labels: charts.monthly.map(d => d.month),
                                    datasets: [{
                                        data: charts.monthly.map(d => d.earnings || 100)
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
                                    },
                                    formatYLabel: (value) => `₦${(parseFloat(value) / 1000).toFixed(0)}k`
                                }}
                                bezier
                                style={styles.chart}
                            />
                        )}
                    </View>
                </View>

                {/* TOP EARNING DAYS */}
                {charts.topDays && charts.topDays.length > 0 && (
                    <View style={styles.topDaysSection}>
                        <Text style={styles.sectionTitle}>Top Earning Days</Text>
                        {charts.topDays.slice(0, 3).map((day, index) => (
                            <View key={index} style={styles.topDayCard}>
                                <View style={styles.topDayRank}>
                                    <Text style={styles.topDayRankText}>#{index + 1}</Text>
                                </View>
                                <View style={styles.topDayInfo}>
                                    <Text style={styles.topDayDate}>{formatDate(day.date)}</Text>
                                    <Text style={styles.topDayDeliveries}>{day.deliveries} deliveries</Text>
                                </View>
                                <Text style={styles.topDayEarnings}>{formatCurrency(day.earnings)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* TRANSACTIONS LIST */}
                <View style={styles.transactionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <Text style={styles.transactionCount}>
                            {pagination.total} total
                        </Text>
                    </View>

                    {transactions.map((tx, index) => (
                        <TouchableOpacity
                            key={tx.id}
                            style={styles.transactionCard}
                            onPress={() => {
                                if (tx.orderId) {
                                    router.push(`/driver/account/analytics/deliveries/view/${tx.orderId}`);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.transactionIcon}>
                                <Ionicons
                                    name={getTransactionIcon(tx.type)}
                                    size={24}
                                    color={getTransactionColor(tx.type)}
                                />
                            </View>

                            <View style={styles.transactionInfo}>
                                <Text style={styles.transactionDescription} numberOfLines={1}>
                                    {tx.description}
                                </Text>
                                <Text style={styles.transactionDate}>
                                    {formatDate(tx.date)}
                                </Text>
                                {tx.orderRef && (
                                    <Text style={styles.transactionRef}>{tx.orderRef}</Text>
                                )}
                            </View>

                            <View style={styles.transactionAmount}>
                                <Text style={[
                                    styles.transactionValue,
                                    { color: getTransactionColor(tx.type) }
                                ]}>
                                    {tx.type === 'driver_earning' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </Text>
                                {tx.fees > 0 && (
                                    <Text style={styles.transactionFee}>
                                        Fee: {formatCurrency(tx.fees)}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}

                    {pagination.hasMore && (
                        <TouchableOpacity
                            style={styles.loadMoreButton}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <ActivityIndicator color="#4CAF50" />
                            ) : (
                                <>
                                    <Ionicons name="refresh" size={20} color="#4CAF50" />
                                    <Text style={styles.loadMoreText}>Load More</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* LIFETIME STATS */}
                <View style={styles.lifetimeSection}>
                    <Text style={styles.sectionTitle}>Lifetime Statistics</Text>
                    <View style={styles.lifetimeGrid}>
                        <View style={styles.lifetimeCard}>
                            <Ionicons name="cash" size={32} color="#4CAF50" />
                            <Text style={styles.lifetimeValue}>{formatCurrency(lifetime.totalEarned)}</Text>
                            <Text style={styles.lifetimeLabel}>Total Earned</Text>
                        </View>

                        <View style={styles.lifetimeCard}>
                            <Ionicons name="wallet" size={32} color="#F44336" />
                            <Text style={styles.lifetimeValue}>{formatCurrency(lifetime.totalWithdrawn)}</Text>
                            <Text style={styles.lifetimeLabel}>Total Withdrawn</Text>
                        </View>

                        <View style={styles.lifetimeCard}>
                            <FontAwesome6 name="boxes-stacked" size={28} color="#2196F3" />
                            <Text style={styles.lifetimeValue}>{lifetime.totalDeliveries}</Text>
                            <Text style={styles.lifetimeLabel}>Total Deliveries</Text>
                        </View>

                        <View style={styles.lifetimeCard}>
                            <Ionicons name="stats-chart" size={32} color="#FF9800" />
                            <Text style={styles.lifetimeValue}>{formatCurrency(lifetime.averagePerDelivery)}</Text>
                            <Text style={styles.lifetimeLabel}>Avg/Delivery</Text>
                        </View>
                    </View>

                    {lifetime.firstEarningDate && (
                        <View style={styles.lifetimeDates}>
                            <View style={styles.lifetimeDateItem}>
                                <Ionicons name="calendar" size={16} color="#666" />
                                <Text style={styles.lifetimeDateText}>
                                    Started: {formatDate(lifetime.firstEarningDate)}
                                </Text>
                            </View>
                            {lifetime.lastWithdrawalDate && (
                                <View style={styles.lifetimeDateItem}>
                                    <Ionicons name="cash-outline" size={16} color="#666" />
                                    <Text style={styles.lifetimeDateText}>
                                        Last Withdrawal: {formatDate(lifetime.lastWithdrawalDate)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* BANK DETAILS */}
                {withdrawalSettings.bankDetails && (
                    <View style={styles.bankSection}>
                        <Text style={styles.sectionTitle}>Withdrawal Account</Text>
                        <View style={styles.bankCard}>
                            <View style={styles.bankIcon}>
                                <Ionicons name="business" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.bankInfo}>
                                <Text style={styles.bankName}>{withdrawalSettings.bankDetails.bankName}</Text>
                                <Text style={styles.bankAccount}>{withdrawalSettings.bankDetails.accountNumber}</Text>
                            </View>
                            {withdrawalSettings.bankDetails.verified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                                    <Text style={styles.verifiedText}>Verified</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.minWithdrawal}>
                            Minimum withdrawal: {formatCurrency(withdrawalSettings.minimumAmount)}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#F5F7FA',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },

    // Balance Card
    balanceCard: {
        backgroundColor: '#4CAF50',
        margin: 16,
        padding: 24,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    balanceBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    balanceItem: {
        alignItems: 'center',
    },
    balanceItemLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    balanceItemValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    balanceDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    withdrawButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    withdrawButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#666',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F5F7FA',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        textAlign: 'center',
    },
    growthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
        gap: 4,
    },
    growthText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Period Selector
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        gap: 8,
        marginBottom: 8,
    },
    periodTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#F5F7FA',
        alignItems: 'center',
    },
    periodTabActive: {
        backgroundColor: '#4CAF50',
    },
    periodTabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    periodTabTextActive: {
        color: '#fff',
    },

    // Chart Section
    chartSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    chartContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    chart: {
        borderRadius: 16,
    },

    // Top Days
    topDaysSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    topDayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        marginTop: 8,
        gap: 12,
    },
    topDayRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topDayRankText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    topDayInfo: {
        flex: 1,
    },
    topDayDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    topDayDeliveries: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    topDayEarnings: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },

    // Transactions
    transactionsSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    transactionCount: {
        fontSize: 12,
        color: '#666',
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        marginBottom: 8,
        gap: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        color: '#666',
    },
    transactionRef: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    transactionValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionFee: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        marginTop: 8,
        gap: 8,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4CAF50',
    },

    // Lifetime Stats
    lifetimeSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    lifetimeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    lifetimeCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F5F7FA',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    lifetimeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
        marginBottom: 4,
    },
    lifetimeLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        textAlign: 'center',
    },
    lifetimeDates: {
        marginTop: 16,
        gap: 8,
    },
    lifetimeDateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    lifetimeDateText: {
        fontSize: 12,
        color: '#666',
    },

    // Bank Section
    bankSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 24,
    },
    bankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        marginTop: 12,
        gap: 12,
    },
    bankIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bankInfo: {
        flex: 1,
    },
    bankName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    bankAccount: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'monospace',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },
    minWithdrawal: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
    },
});

export default Earnings;