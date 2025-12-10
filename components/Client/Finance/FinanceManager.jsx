// components/Client/Finance/FinanceManager.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
    FlatList
} from 'react-native';
import {
    Wallet,
    TrendingUp,
    Package,
    CheckCircle,
    Eye,
    EyeOff,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Clock,
    XCircle
} from 'lucide-react-native';

function FinanceManager({
                            userData,
                            financialSummary,
                            refetch,
                            isLoading,
                            onNavigateToTopUp
                        }) {
    const [refreshing, setRefreshing] = useState(false);
    const [showBalance, setShowBalance] = useState(true);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₦0.00';
        return `₦ ${amount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-NG');
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'client_payment':
                return { icon: Package, color: '#3b82f6' };
            case 'wallet_deposit':
                return { icon: ArrowDownRight, color: '#10b981' };
            case 'wallet_deduction':
                return { icon: ArrowUpRight, color: '#f59e0b' };
            case 'refund':
                return { icon: CheckCircle, color: '#8b5cf6' };
            default:
                return { icon: Wallet, color: '#6b7280' };
        }
    };

    const getTransactionTitle = (type) => {
        switch (type) {
            case 'client_payment':
                return 'Order Payment';
            case 'wallet_deposit':
                return 'Wallet Top-Up';
            case 'wallet_deduction':
                return 'Wallet Used';
            case 'refund':
                return 'Refund Received';
            default:
                return 'Transaction';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#10b981';
            case 'pending':
                return '#f59e0b';
            case 'failed':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const renderTransactionItem = ({ item, index }) => {
        const { icon: Icon, color } = getTransactionIcon(item.transactionType);
        const statusColor = getStatusColor(item.status);

        return (
            <TouchableOpacity
                style={[styles.transactionItem, index !== 0 && styles.transactionItemMargin]}
                activeOpacity={0.7}
            >
                <View style={[styles.transactionIcon, { backgroundColor: `${color}15` }]}>
                    <Icon size={20} color={color} />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>
                        {getTransactionTitle(item.transactionType)}
                    </Text>
                    <View style={styles.transactionMeta}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={styles.transactionStatus}>
                            {item.status}
                        </Text>
                        <Text style={styles.transactionDate}>
                            • {formatDate(item.createdAt)}
                        </Text>
                    </View>
                </View>
                <Text style={[
                    styles.transactionAmount,
                    item.transactionType === 'wallet_deposit' && styles.transactionAmountPositive,
                    item.transactionType === 'wallet_deduction' && styles.transactionAmountNegative
                ]}>
                    {item.transactionType === 'wallet_deduction' ? '-' : ''}
                    {formatCurrency(item.amount.net)}
                </Text>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading financial data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerTitleSection}>
                <Text style={styles.headerMainTitle}>Finance Manager</Text>
                <Text style={styles.headerSubtitle}>
                    Track your spending, orders, and wallet activity
                </Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Wallet Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceHeader}>
                        <View style={styles.balanceContent}>
                            <Text style={styles.balanceLabel}>Wallet Balance</Text>
                            <View style={styles.balanceAmountContainer}>
                                {showBalance ? (
                                    <Text style={styles.balanceAmount}>
                                        {formatCurrency(financialSummary.currentBalance || 0)}
                                    </Text>
                                ) : (
                                    <Text style={styles.balanceAmount}>••••••••</Text>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowBalance(!showBalance)}
                                    style={styles.eyeButton}
                                >
                                    {showBalance ? (
                                        <Eye size={22} color="#ffffff" />
                                    ) : (
                                        <EyeOff size={22} color="#ffffff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.walletIconContainer}>
                            <Wallet size={28} color="#ffffff" />
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.cardStatLabel}>Total Deposited</Text>
                            <Text style={styles.cardStatValue}>
                                {formatCurrency(financialSummary.totalDeposited || 0)}
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.cardStatLabel}>Used from Wallet</Text>
                            <Text style={styles.cardStatValue}>
                                {formatCurrency(financialSummary.totalUsedFromWallet || 0)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={onNavigateToTopUp}
                        style={styles.topUpButton}
                        activeOpacity={0.8}
                    >
                        <Plus size={20} color="#3b82f6" />
                        <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Row 1 */}
                    <View style={styles.statsRow}>
                        {/* Total Spent */}
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIcon, styles.spentIcon]}>
                                    <TrendingUp size={18} color="#ffffff" />
                                </View>
                                <Text style={styles.statLabel}>Total Spent</Text>
                            </View>
                            <Text style={styles.statValue}>
                                {formatCurrency(financialSummary.totalSpent || 0)}
                            </Text>
                            <Text style={styles.statSubtext}>
                                {financialSummary.totalOrders || 0} orders
                            </Text>
                        </View>

                        {/* Completed Orders */}
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIcon, styles.completedIcon]}>
                                    <CheckCircle size={18} color="#ffffff" />
                                </View>
                                <Text style={styles.statLabel}>Completed</Text>
                            </View>
                            <Text style={styles.statValue}>
                                {financialSummary.completedOrders || 0}
                            </Text>
                            <Text style={styles.statSubtext}>Delivered</Text>
                        </View>
                    </View>

                    {/* Row 2 */}
                    <View style={styles.statsRow}>
                        {/* Pending Orders */}
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIcon, styles.pendingIcon]}>
                                    <Clock size={18} color="#ffffff" />
                                </View>
                                <Text style={styles.statLabel}>Pending</Text>
                            </View>
                            <Text style={styles.statValue}>
                                {financialSummary.pendingOrders || 0}
                            </Text>
                            <Text style={styles.statSubtext}>In Progress</Text>
                        </View>

                        {/* Average Order */}
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIcon, styles.avgIcon]}>
                                    <Package size={18} color="#ffffff" />
                                </View>
                                <Text style={styles.statLabel}>Avg Order</Text>
                            </View>
                            <Text style={styles.statValue}>
                                {formatCurrency(financialSummary.averageOrderValue || 0)}
                            </Text>
                            <Text style={styles.statSubtext}>Per Order</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.transactionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {financialSummary.recentTransactions &&
                    financialSummary.recentTransactions.length > 0 ? (
                        <View style={styles.transactionsList}>
                            <FlatList
                                data={financialSummary.recentTransactions.slice(0, 8)}
                                renderItem={renderTransactionItem}
                                keyExtractor={(item) => item._id}
                                scrollEnabled={false}
                            />
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Wallet size={48} color="#d1d5db" />
                            </View>
                            <Text style={styles.emptyTitle}>No transactions yet</Text>
                            <Text style={styles.emptyMessage}>
                                Your financial activity will appear here
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
    },
    headerTitleSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerMainTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#6b7280',
    },
    scrollView: {
        flex: 1,
    },

    // Balance Card
    balanceCard: {
        backgroundColor: '#3b82f6',
        borderRadius: 20,
        padding: 24,
        margin: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    balanceContent: {
        flex: 1,
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        marginBottom: 8,
    },
    balanceAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    balanceAmount: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '700',
    },
    eyeButton: {
        padding: 4,
    },
    walletIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 16,
    },
    topUpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    topUpButtonText: {
        color: '#3b82f6',
        fontSize: 16,
        fontWeight: '600',
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    statCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statCardIconBlue: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    statCardIconGreen: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    statCardIconOrange: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    statCardIconPurple: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    statCardLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    statCardValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    statCardSubtext: {
        fontSize: 12,
        color: '#9ca3af',
    },

    // Transactions Section
    transactionsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    seeAllText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
    transactionsList: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    transactionItemMargin: {
        // No additional margin needed
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    transactionStatus: {
        fontSize: 13,
        color: '#6b7280',
        textTransform: 'capitalize',
    },
    transactionDate: {
        fontSize: 13,
        color: '#9ca3af',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    transactionAmountPositive: {
        color: '#10b981',
    },
    transactionAmountNegative: {
        color: '#f59e0b',
    },

    // Empty State
    emptyState: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 48,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },

    // Stats Grid - 2x2 Layout
    statsGrid: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 120,
        justifyContent: 'space-between',
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spentIcon: {
        backgroundColor: '#3b82f6', // Blue
    },
    completedIcon: {
        backgroundColor: '#10b981', // Green
    },
    pendingIcon: {
        backgroundColor: '#f59e0b', // Orange
    },
    avgIcon: {
        backgroundColor: '#8b5cf6', // Purple
    },
    statLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'PoppinsMedium',
        flex: 1,
    },
    statValue: {
        fontSize: 22,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    statSubtext: {
        fontSize: 12,
        color: '#9ca3af',
        fontFamily: 'PoppinsRegular',
    },


    cardStatLabel: {
        fontSize: 13,
        color: '#FFF',
        fontFamily: 'PoppinsMedium',
        flex: 1,
    },
    cardStatValue: {
        fontSize: 22,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    cardSubtext: {
        fontSize: 12,
        color: '#9ca3af',
        fontFamily: 'PoppinsRegular',
    },
});

export default FinanceManager;