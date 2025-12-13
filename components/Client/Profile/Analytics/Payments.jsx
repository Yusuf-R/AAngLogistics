// components/Client/Profile/Analytics/Payments.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    ActivityIndicator, Pressable
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomHeader from "../../../CustomHeader";
import { router } from "expo-router";
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const Payments = ({ paymentAnalytics, userData, refetch }) => {
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
        return type === 'wallet_deposit' ? 'arrow-down-circle' : 'arrow-up-circle';
    };

    const getTransactionColor = (type) => {
        return type === 'wallet_deposit' ? '#4CAF50' : '#2196F3';
    };

    if (!paymentAnalytics) {
        return (
            <>
                <CustomHeader title="Payments" onBackPress={() => router.back()} />
                <View style={styles.emptyContainer}>
                    <Ionicons name="card-outline" size={96} color="#E0E0E0" />
                    <Text style={styles.emptyTitle}>No Payment History</Text>
                    <Text style={styles.emptySubtitle}>
                        Your payment transactions will appear here
                    </Text>
                </View>
            </>
        );
    }
    const onBackPress = () => {
        router.back();
    };

    const { wallet, summary, trends, breakdown, transactions, pagination, lifetime, insights } = paymentAnalytics;

    return (
        <>

            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* HEADER SECTION */}
                <View style={styles.headerSection}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'start',
                        backgroundColor: '#fff',
                        gap: 15
                    }}>
                        <Pressable onPress={onBackPress} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFF"/>
                        </Pressable>
                        <View>
                            <Text style={styles.headerTitle}>Payment Analytics</Text>
                            <Text style={styles.headerSubtitle}>Track your spending and wallet activity</Text>
                        </View>
                    </View>

                </View>

                {/* WALLET CARD */}
                <View style={styles.walletCard}>
                    <View style={styles.walletHeader}>
                        <Ionicons name="wallet" size={32} color="#fff" />
                        <View style={styles.walletBadge}>
                            <Text style={styles.walletBadgeText}>Active</Text>
                        </View>
                    </View>

                    <Text style={styles.walletLabel}>Wallet Balance</Text>
                    <Text style={styles.walletAmount}>{formatCurrency(wallet.balance)}</Text>

                    <View style={styles.walletStats}>
                        <View style={styles.walletStatItem}>
                            <Ionicons name="arrow-down" size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.walletStatLabel}>Deposited</Text>
                            <Text style={styles.walletStatValue}>{formatCurrency(wallet.totalDeposited)}</Text>
                        </View>
                        <View style={styles.walletDivider} />
                        <View style={styles.walletStatItem}>
                            <Ionicons name="arrow-up" size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.walletStatLabel}>Spent from wallet</Text>
                            <Text style={styles.walletStatValue}>{formatCurrency(wallet.totalSpent)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.topUpButton}>
                        <Ionicons name="add-circle" size={20} color="#fff" />
                        <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
                    </TouchableOpacity>
                </View>

                {/* INSIGHTS */}
                {insights && insights.length > 0 && (
                    <View style={styles.insightsSection}>
                        {insights.map((insight, index) => (
                            <View key={index} style={[styles.insightCard, {
                                borderLeftColor:
                                    insight.type === 'warning' ? '#FF9800' :
                                        insight.type === 'success' ? '#4CAF50' :
                                            insight.type === 'tip' ? '#2196F3' : '#666'
                            }]}>
                                <Ionicons
                                    name={insight.icon}
                                    size={24}
                                    color={
                                        insight.type === 'warning' ? '#FF9800' :
                                            insight.type === 'success' ? '#4CAF50' :
                                                insight.type === 'tip' ? '#2196F3' : '#666'
                                    }
                                />
                                <View style={styles.insightContent}>
                                    <Text style={styles.insightTitle}>{insight.title}</Text>
                                    <Text style={styles.insightMessage}>{insight.message}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* PERIOD SUMMARY */}
                <View style={styles.summarySection}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="card" size={24} color="#2196F3" />
                            <Text style={styles.statValue}>{formatCurrency(summary.periodPayments)}</Text>
                            <Text style={styles.statLabel}>Order Payments</Text>
                            <Text style={styles.statCount}>{summary.paymentCount} transactions</Text>
                        </View>

                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="wallet-plus" size={24} color="#4CAF50" />
                            <Text style={styles.statValue}>{formatCurrency(summary.periodDeposits)}</Text>
                            <Text style={styles.statLabel}>Wallet Top-ups</Text>
                            <Text style={styles.statCount}>{summary.depositCount} deposits</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="receipt" size={24} color="#FF9800" />
                            <Text style={styles.statValue}>{formatCurrency(summary.avgPayment)}</Text>
                            <Text style={styles.statLabel}>Avg Payment</Text>
                        </View>

                        {/*<View style={styles.statCard}>*/}
                        {/*    <Ionicons name="pricetag" size={24} color="#F44336" />*/}
                        {/*    <Text style={styles.statValue}>{formatCurrency(summary.totalFees)}</Text>*/}
                        {/*    <Text style={styles.statLabel}>Total Fees</Text>*/}
                        {/*</View>*/}
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

                {/* SPENDING CHART */}
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>Spending Trend</Text>

                    <View style={styles.chartContainer}>
                        {selectedPeriod === 'week' && trends.daily && trends.daily.length > 0 && (
                            <BarChart
                                data={{
                                    labels: trends.daily.map(d => new Date(d._id).getDate().toString()),
                                    datasets: [{
                                        data: trends.daily.map(d => d.totalSpent || 100)
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
                                    barPercentage: 0.7,
                                    formatYLabel: (value) => `₦${(parseFloat(value) / 1000).toFixed(0)}k`
                                }}
                                style={styles.chart}
                                showValuesOnTopOfBars
                                fromZero
                            />
                        )}

                        {selectedPeriod === 'month' && trends.monthly && trends.monthly.length > 0 && (
                            <LineChart
                                data={{
                                    labels: trends.monthly.slice(-6).map(d => {
                                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                        return months[d._id.month - 1];
                                    }),
                                    datasets: [{
                                        data: trends.monthly.slice(-6).map(d => d.totalSpent || 100)
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

                {/* PAYMENT METHOD BREAKDOWN */}
                {breakdown.paymentMethods && breakdown.paymentMethods.length > 0 && (
                    <View style={styles.breakdownSection}>
                        <Text style={styles.sectionTitle}>Payment Methods</Text>
                        {breakdown.paymentMethods.map((method, index) => (
                            <View key={index} style={styles.methodCard}>
                                <View style={styles.methodIcon}>
                                    <Ionicons
                                        name={method.method === 'wallet' ? 'wallet' : 'card'}
                                        size={24}
                                        color="#2196F3"
                                    />
                                </View>
                                <View style={styles.methodInfo}>
                                    <Text style={styles.methodName}>
                                        {method.method === 'wallet' ? 'Wallet' : method.method.toUpperCase()}
                                    </Text>
                                    <Text style={styles.methodCount}>{method.count} transactions</Text>
                                </View>
                                <View style={styles.methodAmount}>
                                    <Text style={styles.methodValue}>{formatCurrency(method.totalAmount)}</Text>
                                    <Text style={styles.methodPercentage}>{method.percentage.toFixed(1)}%</Text>
                                </View>
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

                    {transactions.map((tx) => (
                        <TouchableOpacity
                            key={tx.id}
                            style={styles.transactionCard}
                            onPress={() => router.push(`/client/profile/analytics/payment/view/${tx.id}`)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.transactionIcon, {
                                backgroundColor: tx.type === 'wallet_deposit' ? '#E8F5E9' : '#E3F2FD'
                            }]}>
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
                                <View style={styles.transactionMeta}>
                                    <Text style={styles.transactionDate}>
                                        {formatDate(tx.date)}
                                    </Text>
                                    {tx.orderRef && (
                                        <>
                                            <Text style={styles.metaSeparator}>•</Text>
                                            <Text style={styles.transactionRef}>{tx.orderRef}</Text>
                                        </>
                                    )}
                                </View>
                            </View>

                            <View style={styles.transactionAmount}>
                                <Text style={[
                                    styles.transactionValue,
                                    { color: getTransactionColor(tx.type) }
                                ]}>
                                    {tx.type === 'wallet_deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
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
                                <ActivityIndicator color="#2196F3" />
                            ) : (
                                <>
                                    <Ionicons name="refresh" size={20} color="#2196F3" />
                                    <Text style={styles.loadMoreText}>Load More</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* LIFETIME STATS */}
                <View style={styles.lifetimeSection}>
                    <Text style={styles.sectionTitle}>Wallet Statistics</Text>

                    <View style={styles.lifetimeGrid}>
                        <View style={styles.lifetimeCard}>
                            <Ionicons name="cash" size={32} color="#2196F3" />
                            <Text style={styles.lifetimeValue}>{formatCurrency(lifetime.totalSpent)}</Text>
                            <Text style={styles.lifetimeLabel}>Total Spent from wallet</Text>
                        </View>

                        <View style={styles.lifetimeCard}>
                            <MaterialCommunityIcons name="wallet-plus" size={32} color="#4CAF50" />
                            <Text style={styles.lifetimeValue}>{formatCurrency(lifetime.totalDeposited)}</Text>
                            <Text style={styles.lifetimeLabel}>Total Deposited</Text>
                        </View>

                        <View style={styles.lifetimeCard}>
                            <Ionicons name="receipt" size={32} color="#FF9800" />
                            <Text style={styles.lifetimeValue}>{lifetime.transactionCount}</Text>
                            <Text style={styles.lifetimeLabel}>Total Transactions</Text>
                        </View>

                        {lifetime.totalRefunded > 0 && (
                            <View style={styles.lifetimeCard}>
                                <Ionicons name="return-up-back" size={32} color="#9C27B0" />
                                <Text style={styles.lifetimeValue}>{formatCurrency(lifetime.totalRefunded)}</Text>
                                <Text style={styles.lifetimeLabel}>Refunds Received</Text>
                            </View>
                        )}
                    </View>

                    {/*Client Deposits */}
                    <Text style={styles.depositSectionTitle}>Deposits Statistics</Text>

                    <View style={styles.lifetimeGrid}>
                        <View style={styles.lifetimeCard}>
                            <Ionicons name="cash" size={32} color="#2196F3" />
                            <Text style={styles.lifetimeValue}>{formatCurrency(summary.periodPayments)}</Text>
                            <Text style={styles.lifetimeLabel}>Client Payment</Text>
                        </View>

                        <View style={styles.lifetimeCard}>
                            <Ionicons name="receipt" size={32} color="#FF9800" />
                            <Text style={styles.lifetimeValue}>{summary.paymentCount}</Text>
                            <Text style={styles.lifetimeLabel}>Total Transactions</Text>
                        </View>

                        {lifetime.totalRefunded > 0 && (
                            <View style={styles.lifetimeCard}>
                                <Ionicons name="return-up-back" size={32} color="#9C27B0" />
                                <Text style={styles.lifetimeValue}>{formatCurrency(lifetime.totalRefunded)}</Text>
                                <Text style={styles.lifetimeLabel}>Refunds Received</Text>
                            </View>
                        )}
                    </View>

                    {lifetime.firstDepositAt && (
                        <View style={styles.lifetimeDates}>
                            <View style={styles.lifetimeDateItem}>
                                <Ionicons name="calendar" size={16} color="#666" />
                                <Text style={styles.lifetimeDateText}>
                                    Member since: {formatDate(lifetime.firstDepositAt)}
                                </Text>
                            </View>
                            {lifetime.lastActivityAt && (
                                <View style={styles.lifetimeDateItem}>
                                    <Ionicons name="time" size={16} color="#666" />
                                    <Text style={styles.lifetimeDateText}>
                                        Last activity: {formatDate(lifetime.lastActivityAt)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>


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

    // Header
    headerSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#666',
    },

    // Wallet Card
    walletCard: {
        backgroundColor: '#2196F3',
        margin: 16,
        padding: 24,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    walletBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    walletBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
    },
    walletLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 8,
    },
    walletAmount: {
        fontSize: 36,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },
    walletStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    walletStatItem: {
        alignItems: 'center',
        gap: 4,
    },
    walletStatLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'PoppinsRegular',
    },
    walletStatValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    walletDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    topUpButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    topUpButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },

    // Insights
    insightsSection: {
        paddingHorizontal: 16,
        marginBottom: 8,
        gap: 12,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#333',
        marginBottom: 4,
    },
    insightMessage: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#666',
        lineHeight: 18,
    },

    // Summary Section
    summarySection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
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
    statCount: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
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
        backgroundColor: '#2196F3',
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
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
        marginBottom: 12,
    },

    depositSectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
        marginBottom: 12,
        marginTop: 16,
    },
    chartContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    chart: {
        borderRadius: 16,
    },

    // Payment Method Breakdown
    breakdownSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        marginTop: 8,
        gap: 12,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    methodCount: {
        fontSize: 12,
        color: '#666',
    },
    methodAmount: {
        alignItems: 'flex-end',
    },
    methodValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    methodPercentage: {
        fontSize: 12,
        color: '#2196F3',
        marginTop: 2,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#333',
        marginBottom: 4,
    },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    transactionDate: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#666',
    },
    metaSeparator: {
        fontSize: 12,
        color: '#999',
    },
    transactionRef: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold',
        color: '#999',
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    transactionValue: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    transactionFee: {
        fontSize: 11,
        color: '#999',
        fontFamily: 'PoppinsSemiBold',
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
        color: '#2196F3',
    },

    // Lifetime Stats
    lifetimeSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 24,
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
        fontFamily: 'PoppinsSemiBold',
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
        fontFamily: 'PoppinsSemiBold',
        color: '#666',
    },
    backButton: {
        backgroundColor: '#4F628E',
        borderRadius: 5,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default Payments;