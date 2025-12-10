// ============================================
// TOP-UP TAB COMPONENT
// components/Client/Finance/TopUpTab.jsx
// ============================================

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
    Plus,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    ArrowDownRight,
    Calendar,
    TrendingUp
} from 'lucide-react-native';
import TopUpModal from './TopUpModal';
import TransactionDetailsModal from './TransactionDetailsModal';

function TopUpTab({
                      topUpHistory,
                      topUpPagination,
                      userData,
                      walletBalance,
                      isLoading,
                      dataRefresh,
                      currentFilter,
                      onFilterChange
                  }) {
    const [refreshing, setRefreshing] = useState(false);
    const [topUpModal, setTopUpModal] = useState(false);
    const [detailsModal, setDetailsModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const onRefresh = async () => {
        setRefreshing(true);
        await dataRefresh();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₦0.00';
        return `₦${amount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'completed':
                return {
                    icon: CheckCircle2,
                    bg: '#dcfce7',
                    text: '#166534',
                    border: '#bbf7d0',
                    iconColor: '#10b981',
                    label: 'Completed'
                };
            case 'pending':
                return {
                    icon: Clock,
                    bg: '#fef3c7',
                    text: '#92400e',
                    border: '#fde68a',
                    iconColor: '#f59e0b',
                    label: 'Pending'
                };
            case 'failed':
                return {
                    icon: XCircle,
                    bg: '#fee2e2',
                    text: '#991b1b',
                    border: '#fecaca',
                    iconColor: '#ef4444',
                    label: 'Failed'
                };
            default:
                return {
                    icon: Clock,
                    bg: '#f3f4f6',
                    text: '#374151',
                    border: '#e5e7eb',
                    iconColor: '#6b7280',
                    label: status
                };
        }
    };

    // Calculate stats from history
    const calculateStats = () => {
        const total = topUpHistory.length;
        const completed = topUpHistory.filter(t => t.status === 'completed').length;
        const pending = topUpHistory.filter(t => t.status === 'pending').length;
        const failed = topUpHistory.filter(t => t.status === 'failed').length;
        const abandoned = topUpHistory.filter(t => t.status === 'abandoned').length;
        const cancelled = topUpHistory.filter(t => t.status === 'cancelled').length;
        const totalDeposited = topUpHistory
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.amount.net || 0), 0);

        return { total, completed, pending, failed, totalDeposited, abandoned, cancelled };
    };

    const stats = calculateStats();

    const renderTopUpItem = ({ item, index }) => {
        const statusConfig = getStatusConfig(item.status);
        const StatusIcon = statusConfig.icon;

        return (
            <TouchableOpacity
                style={[styles.topUpCard, index !== 0 && styles.topUpCardMargin]}
                activeOpacity={0.7}
                onPress={() => {
                    setSelectedTransaction(item);
                    setDetailsModal(true);
                }}
            >
                <View style={styles.topUpHeader}>
                    <View style={styles.topUpHeaderLeft}>
                        <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.bg }]}>
                            <StatusIcon size={20} color={statusConfig.iconColor} />
                        </View>
                        <View style={styles.topUpHeaderText}>
                            <Text style={styles.topUpTitle}>Wallet Top-Up</Text>
                            <Text style={styles.topUpSubtitle}>
                                {item.gateway?.reference || item._id}
                            </Text>
                        </View>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        {
                            backgroundColor: statusConfig.bg,
                            borderColor: statusConfig.border,
                        }
                    ]}>
                        <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.amountSection}>
                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Deposited</Text>
                        <Text style={styles.amountValue}>
                            {formatCurrency(item.amount.gross || 0)}
                        </Text>
                    </View>
                    {item.amount.fees > 0 && (
                        <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>Fee</Text>
                            <Text style={styles.amountValueRed}>
                                -{formatCurrency(item.amount.fees || 0)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.amountDivider}>
                        <View style={styles.amountTotal}>
                            <Text style={styles.amountTotalLabel}>Credited</Text>
                            <Text style={styles.amountTotalValue}>
                                {formatCurrency(item.amount.net || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.topUpFooter}>
                    <View style={styles.topUpDate}>
                        <Calendar size={14} color="#6b7280" />
                        <Text style={styles.topUpDateText}>{formatDate(item.createdAt)}</Text>
                    </View>
                    {item.status === 'completed' && (
                        <View style={styles.successTag}>
                            <CheckCircle2 size={14} color="#10b981" />
                            <Text style={styles.successTagText}>Success</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Header Title */}
            <View style={styles.headerTitleSection}>
                <Text style={styles.headerMainTitle}>Wallet Manager</Text>
                <Text style={styles.headerSubtitle}>
                    Add funds to your wallet instantly 🚀
                </Text>
            </View>

            <View style={styles.headerPadding}>
                {/* Balance & Top-Up Section */}
                <View style={styles.balanceTopUpSection}>
                    <View style={styles.balanceCard}>
                        <View style={styles.balanceContent}>
                            <View style={styles.balanceHeader}>
                                <View style={styles.walletIconContainer}>
                                    <Wallet size={20} color="#3b82f6" />
                                </View>
                                <Text style={styles.balanceLabel}>Current Balance</Text>
                            </View>
                            <Text style={styles.balanceAmount}>
                                {formatCurrency(walletBalance)}
                            </Text>
                            <Text style={styles.balanceSubtext}>
                                Available for orders
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setTopUpModal(true)}
                            style={styles.topUpButton}
                        >
                            <Plus size={20} color="#ffffff" />
                            <Text style={styles.topUpButtonText}>Top Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsSection}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <View style={styles.summaryIconContainer}>
                                <ArrowDownRight size={20} color="#10b981" />
                            </View>
                            <Text style={styles.summaryTitle}>Total Deposited</Text>
                        </View>
                        <Text style={styles.summaryAmount}>
                            {formatCurrency(stats.totalDeposited)}
                        </Text>
                        <Text style={styles.summarySubtext}>
                            {stats.completed} successful {stats.completed === 1 ? 'deposit' : 'deposits'}
                        </Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, styles.statCardOrange]}>
                            <View style={styles.statIconOrange}>
                                <Clock size={14} color="#f59e0b" />
                            </View>
                            <Text style={styles.statLabelOrange}>Pending</Text>
                            <Text style={styles.statValueOrange}>{stats.pending}</Text>
                        </View>

                        <View style={[styles.statCard, styles.statCardRed]}>
                            <View style={styles.statIconRed}>
                                <XCircle size={14} color="#ef4444" />
                            </View>
                            <Text style={styles.statLabelRed}>Failed</Text>
                            <Text style={styles.statValueRed}>{stats.failed}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Filter Section */}
            <View style={styles.filterSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {['all', 'completed', 'pending', 'failed', 'abandoned', 'cancelled'].map((status) => {
                        const count = status === 'all' ? stats.total : stats[status] || 0;
                        const isActive = currentFilter === status;

                        return (
                            <TouchableOpacity
                                key={status}
                                onPress={() => onFilterChange(status)}
                                style={[
                                    styles.filterChip,
                                    isActive && styles.filterChipActive
                                ]}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    isActive && styles.filterChipTextActive
                                ]}>
                                    {status}
                                </Text>
                                {count > 0 && (
                                    <View style={[
                                        styles.filterBadge,
                                        isActive && styles.filterBadgeActive
                                    ]}>
                                        <Text style={[
                                            styles.filterBadgeText,
                                            isActive && styles.filterBadgeTextActive
                                        ]}>
                                            {count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );

    if (isLoading && topUpHistory.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading top-up history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {topUpHistory.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateContent}>
                            <View style={styles.emptyIconContainer}>
                                <Wallet size={48} color="#d1d5db" />
                            </View>
                            <Text style={styles.emptyTitle}>Wallet Empty</Text>
                            <Text style={styles.emptyMessage}>
                                {currentFilter !== 'all'
                                    ? `No ${currentFilter} top-ups found`
                                    : 'Add funds to your wallet to get started'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setTopUpModal(true)}
                                style={styles.emptyStateButton}
                            >
                                <Plus size={20} color="#ffffff" />
                                <Text style={styles.emptyStateButtonText}>Top Up Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <FlatList
                        data={topUpHistory}
                        renderItem={renderTopUpItem}
                        keyExtractor={(item) => item._id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </ScrollView>

            {/* Top-Up Modal */}
            <TopUpModal
                visible={topUpModal}
                onClose={() => setTopUpModal(false)}
                onSuccess={() => {
                    setTopUpModal(false);
                    onRefresh();
                }}
                userData={userData}
                currentBalance={walletBalance}
            />

            {/* Transaction Details Modal */}
            <TransactionDetailsModal
                visible={detailsModal}
                onClose={() => {
                    setDetailsModal(false);
                    setSelectedTransaction(null);
                }}
                transaction={selectedTransaction}
                onSuccess={() => {
                    setDetailsModal(false);
                    setSelectedTransaction(null);
                    onRefresh();
                }}
            />
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
        color: '#6b7280',
    },

    // Header
    headerContainer: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitleSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerMainTitle: {
        fontSize: 24,
        color: '#111827',
        fontFamily:'PoppinsSemiBold',
        // marginTop: 35,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily:'PoppinsSemiBold',
        color: '#6b7280',
    },
    headerPadding: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },

    // Balance & Top-Up Section
    balanceTopUpSection: {
        marginBottom: 20,
    },
    balanceCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    balanceContent: {
        marginBottom: 16,
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    walletIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'PoppinsSemiBold'
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    balanceSubtext: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#9ca3af',
    },
    topUpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    topUpButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },

    // Stats Section
    statsSection: {
        gap: 12,
        flexDirection: 'row',
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    summaryIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTitle: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'PoppinsSemiBold',
    },
    summaryAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    summarySubtext: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#9ca3af',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
        flex: 1
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statCardOrange: {
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
    },
    statCardRed: {
        borderLeftWidth: 3,
        borderLeftColor: '#ef4444',
    },
    statIconOrange: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statIconRed: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabelOrange: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    statLabelRed: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
        marginBottom: 4,
    },
    statValueOrange: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#f59e0b',
    },
    statValueRed: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#ef4444',
    },

    // Filter Section
    filterSection: {
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    filterScrollContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: '#3b82f6',
    },
    filterChipText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
        textTransform: 'capitalize',
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    filterBadge: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    filterBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    filterBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    filterBadgeTextActive: {
        color: '#ffffff',
    },

    // Scroll View
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    listContent: {
        gap: 12,
    },

    // Top-Up Card
    topUpCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    topUpCardMargin: {
        // Handled by FlatList gap
    },
    topUpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    topUpHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    topUpHeaderText: {
        flex: 1,
    },
    topUpTitle: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 2,
    },
    topUpSubtitle: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9ca3af',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
    },

    // Amount Section
    amountSection: {
        marginBottom: 12,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    amountLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
    },
    amountValue: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    amountValueRed: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
    amountDivider: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        marginTop: 8,
        paddingTop: 8,
    },
    amountTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amountTotalLabel: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    amountTotalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10b981',
    },

    // Footer
    topUpFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topUpDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    topUpDateText: {
        fontSize: 13,
        color: '#6b7280',
    },
    successTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    successTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#166534',
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateContent: {
        alignItems: 'center',
        maxWidth: 300,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#9ca3af',
        fontFamily: 'PoppinsSemiBold',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    emptyStateButtonText: {
        color: '#ffffff',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TopUpTab;