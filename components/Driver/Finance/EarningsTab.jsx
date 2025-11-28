// components/Driver/Finance/EarningsTab.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Modal,
    StyleSheet
} from 'react-native';
import {
    Search,
    Filter,
    ChevronDown,
    Calendar,
    TrendingUp,
    Package,
    TrendingDown,
    X,
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react-native';
import DriverUtils from "../../../utils/DriverUtilities";

function EarningsTab({
                         userData,
                         earningsHistory,
                         earningsPagination,
                         isLoading,
                         onLoadMore,
                         onRefresh,
                         currentPage
                     }) {
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'earnings', 'withdrawals'
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [detailsModal, setDetailsModal] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalWithdrawals: 0,
        availableCount: 0,
        withdrawnCount: 0
    });

    useEffect(() => {
        calculateStats();
    }, [earningsHistory]);

    const calculateStats = () => {
        if (!earningsHistory || earningsHistory.length === 0) return;

        const earnings = earningsHistory.filter(t => t.transactionType === 'driver_earning');
        const withdrawals = earningsHistory.filter(t => t.transactionType === 'driver_payout');

        const newStats = {
            totalEarnings: earnings.reduce((sum, e) => sum + (e.amount?.net || 0), 0),
            totalWithdrawals: withdrawals.reduce((sum, w) => sum + (w.amount?.net || 0), 0),
            availableCount: earnings.filter(e => e.status === 'completed').length,
            withdrawnCount: withdrawals.filter(w => w.status === 'completed').length
        };
        setStats(newStats);
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₦0.00';
        return `₦${amount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };

    const getFilteredTransactions = () => {
        let filtered = earningsHistory || [];

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(t =>
                typeFilter === 'earnings'
                    ? t.transactionType === 'driver_earning'
                    : t.transactionType === 'driver_payout'
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(t =>
                t.orderId?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                t._id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.gateway?.reference?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'completed':
                return {
                    icon: CheckCircle2,
                    color: '#10b981',
                    bg: '#f0fdf4',
                    text: '#065f46',
                    label: 'Completed'
                };
            case 'processing':
            case 'pending':
                return {
                    icon: Clock,
                    color: '#3b82f6',
                    bg: '#eff6ff',
                    text: '#1e40af',
                    label: status === 'processing' ? 'Processing' : 'Pending'
                };
            case 'failed':
                return {
                    icon: XCircle,
                    color: '#ef4444',
                    bg: '#fef2f2',
                    text: '#991b1b',
                    label: 'Failed'
                };
            default:
                return {
                    icon: Clock,
                    color: '#6b7280',
                    bg: '#f9fafb',
                    text: '#374151',
                    label: status
                };
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Title */}
            <View style={styles.headerTitleSection}>
                <Text style={styles.headerMainTitle}>Transaction History</Text>
                <Text style={styles.headerSubtitle}>
                    Track your earnings and withdrawals
                </Text>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statsScrollContent}
                >
                    <View style={[styles.statCard, styles.statCardGreen]}>
                        <View style={styles.statIconContainer}>
                            <TrendingUp size={16} color="#10b981" />
                        </View>
                        <Text style={styles.statLabel}>Total Earned</Text>
                        <Text style={styles.statValueGreen}>
                            {formatCurrency(stats.totalEarnings)}
                        </Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardBlue]}>
                        <View style={styles.statIconContainerBlue}>
                            <TrendingDown size={16} color="#3b82f6" />
                        </View>
                        <Text style={styles.statLabel}>Total Withdrawn</Text>
                        <Text style={styles.statValueBlue}>
                            {formatCurrency(stats.totalWithdrawals)}
                        </Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardPurple]}>
                        <View style={styles.statIconContainerPurple}>
                            <Package size={16} color="#8b5cf6" />
                        </View>
                        <Text style={styles.statLabel}>Deliveries</Text>
                        <Text style={styles.statValuePurple}>
                            {stats.availableCount}
                        </Text>
                    </View>
                </ScrollView>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Search size={18} color="#6b7280" />
                    <TextInput
                        placeholder="Search by order ID or reference..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            {/* Filter Chips */}
            <View style={styles.filtersContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersScrollContent}
                >
                    {/* Type Filters */}
                    {['all', 'earnings', 'withdrawals'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setTypeFilter(type)}
                            style={[
                                styles.filterChip,
                                typeFilter === type && styles.filterChipActive
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                typeFilter === type && styles.filterChipTextActive
                            ]}>
                                {type === 'all' ? 'All' :
                                    type === 'earnings' ? 'Earnings' : 'Withdrawals'}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.filterDivider} />

                    {/* Status Filters */}
                    {['all', 'completed', 'processing', 'failed'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setStatusFilter(status)}
                            style={[
                                styles.filterChip,
                                statusFilter === status && styles.filterChipActive
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                statusFilter === status && styles.filterChipTextActive
                            ]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderTransactionItem = (transaction, index) => {
        const isEarning = transaction.transactionType === 'driver_earning';
        const statusConfig = getStatusConfig(transaction.status);
        const StatusIcon = statusConfig.icon;

        return (
            <TouchableOpacity
                key={transaction._id}
                onPress={() => {
                    setSelectedTransaction(transaction);
                    setDetailsModal(true);
                }}
                style={[
                    styles.transactionCard,
                    index !== 0 && styles.transactionCardMarginTop
                ]}
                activeOpacity={0.7}
            >
                <View style={styles.transactionHeader}>
                    <View style={styles.transactionIconContainer}>
                        {isEarning ? (
                            <View style={styles.earningIcon}>
                                <TrendingUp size={20} color="#10b981" />
                            </View>
                        ) : (
                            <View style={styles.withdrawalIcon}>
                                <TrendingDown size={20} color="#3b82f6" />
                            </View>
                        )}
                    </View>

                    <View style={styles.transactionInfo}>
                        <Text style={styles.transactionType}>
                            {isEarning ? 'Delivery Earning' : 'Withdrawal'}
                        </Text>
                        <Text style={styles.transactionReference}>
                            {isEarning
                                ? `Order: ${transaction.orderId?.toString().slice(-8) || 'N/A'}`
                                : `Ref: ${transaction.gateway?.reference?.slice(-12) || 'N/A'}`
                            }
                        </Text>
                    </View>

                    <View style={styles.transactionRight}>
                        <Text style={[
                            styles.transactionAmount,
                            isEarning ? styles.transactionAmountPositive : styles.transactionAmountNegative
                        ]}>
                            {isEarning ? '+' : '-'}{formatCurrency(transaction.amount?.net || 0)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                            <StatusIcon size={12} color={statusConfig.color} />
                            <Text style={[styles.statusText, { color: statusConfig.text }]}>
                                {statusConfig.label}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.transactionFooter}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.transactionDate}>
                        {formatDate(transaction.createdAt)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDetailsModal = () => {
        if (!selectedTransaction) return null;

        const isEarning = selectedTransaction.transactionType === 'driver_earning';
        const statusConfig = getStatusConfig(selectedTransaction.status);
        const StatusIcon = statusConfig.icon;

        return (
            <Modal
                visible={detailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Transaction Details</Text>
                            <TouchableOpacity
                                onPress={() => setDetailsModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {/* Status Section */}
                            <View style={styles.modalStatusSection}>
                                <View style={[styles.modalStatusIcon, { backgroundColor: statusConfig.bg }]}>
                                    <StatusIcon size={32} color={statusConfig.color} />
                                </View>
                                <Text style={styles.modalStatusLabel}>{statusConfig.label}</Text>
                                <Text style={styles.modalTransactionType}>
                                    {isEarning ? 'Delivery Earning' : 'Withdrawal Request'}
                                </Text>
                            </View>

                            {/* Amount Card */}
                            <View style={styles.modalAmountCard}>
                                <Text style={styles.modalAmountLabel}>
                                    {isEarning ? 'Earned Amount' : 'Net Amount'}
                                </Text>
                                <Text style={[
                                    styles.modalAmountValue,
                                    isEarning ? styles.modalAmountPositive : styles.modalAmountNegative
                                ]}>
                                    {isEarning ? '+' : ''}{formatCurrency(selectedTransaction.amount?.net || 0)}
                                </Text>
                            </View>

                            {/* Breakdown */}
                            <View style={styles.modalBreakdownCard}>
                                <Text style={styles.modalSectionTitle}>Breakdown</Text>
                                <View style={styles.modalBreakdownRow}>
                                    <Text style={styles.modalBreakdownLabel}>
                                        {isEarning ? 'Gross Amount' : 'Requested Amount'}
                                    </Text>
                                    <Text style={styles.modalBreakdownValue}>
                                        {formatCurrency(selectedTransaction.amount?.gross || 0)}
                                    </Text>
                                </View>
                                {selectedTransaction.amount?.fees > 0 && (
                                    <View style={styles.modalBreakdownRow}>
                                        <Text style={styles.modalBreakdownLabel}>
                                            {isEarning ? 'Platform Fee' : 'Transfer Fee'}
                                        </Text>
                                        <Text style={styles.modalBreakdownValueRed}>
                                            -{formatCurrency(selectedTransaction.amount?.fees || 0)}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.modalBreakdownDivider}>
                                    <View style={styles.modalBreakdownTotal}>
                                        <Text style={styles.modalBreakdownTotalLabel}>Net Amount</Text>
                                        <Text style={styles.modalBreakdownTotalValue}>
                                            {formatCurrency(selectedTransaction.amount?.net || 0)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Reference Info */}
                            <View style={styles.modalInfoCard}>
                                <Text style={styles.modalSectionTitle}>Transaction Info</Text>
                                {isEarning && selectedTransaction.orderId && (
                                    <View style={styles.modalInfoRow}>
                                        <Text style={styles.modalInfoLabel}>Order ID</Text>
                                        <Text style={styles.modalInfoValue}>
                                            {selectedTransaction.orderId.toString()}
                                        </Text>
                                    </View>
                                )}
                                {!isEarning && selectedTransaction.gateway?.reference && (
                                    <View style={styles.modalInfoRow}>
                                        <Text style={styles.modalInfoLabel}>Reference</Text>
                                        <Text style={styles.modalInfoValue}>
                                            {selectedTransaction.gateway.reference}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.modalInfoRow}>
                                    <Text style={styles.modalInfoLabel}>Transaction ID</Text>
                                    <Text style={styles.modalInfoValue}>
                                        {selectedTransaction._id.toString()}
                                    </Text>
                                </View>
                                <View style={styles.modalInfoRow}>
                                    <Text style={styles.modalInfoLabel}>Date</Text>
                                    <Text style={styles.modalInfoValue}>
                                        {formatDate(selectedTransaction.createdAt)}
                                    </Text>
                                </View>
                                {selectedTransaction.processedAt && (
                                    <View style={styles.modalInfoRow}>
                                        <Text style={styles.modalInfoLabel}>Processed At</Text>
                                        <Text style={styles.modalInfoValue}>
                                            {formatDate(selectedTransaction.processedAt)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Bank Details for Withdrawals */}
                            {!isEarning && selectedTransaction.payout?.bankDetails && (
                                <View style={styles.modalBankCard}>
                                    <Text style={styles.modalSectionTitle}>Bank Details</Text>
                                    <Text style={styles.modalBankName}>
                                        {selectedTransaction.payout.bankDetails.accountName}
                                    </Text>
                                    <Text style={styles.modalBankInfo}>
                                        {selectedTransaction.payout.bankDetails.bankName}
                                    </Text>
                                    <Text style={styles.modalBankAccount}>
                                        {selectedTransaction.payout.bankDetails.accountNumber}
                                    </Text>
                                </View>
                            )}

                            <View style={{ height: 50 }} />
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                onPress={() => setDetailsModal(false)}
                                style={styles.modalCloseFooterButton}
                            >
                                <Text style={styles.modalCloseFooterText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    if (isLoading && (!earningsHistory || earningsHistory.length === 0)) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
        );
    }

    const filteredTransactions = getFilteredTransactions();

    return (
        <View style={styles.container}>
            {renderHeader()}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onMomentumScrollEnd={(event) => {
                    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                    if (isCloseToBottom && earningsPagination?.hasNext) {
                        onLoadMore();
                    }
                }}
            >
                {filteredTransactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <TrendingUp size={48} color="#d1d5db" />
                        </View>
                        <Text style={styles.emptyTitle}>No Transactions Found</Text>
                        <Text style={styles.emptyMessage}>
                            {searchQuery
                                ? 'No results match your search'
                                : typeFilter !== 'all' || statusFilter !== 'all'
                                    ? 'No transactions match your filters'
                                    : 'Your transaction history will appear here'}
                        </Text>
                    </View>
                ) : (
                    <>
                        {filteredTransactions.map((transaction, index) =>
                            renderTransactionItem(transaction, index)
                        )}

                        {isLoading && (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator color="#10b981" />
                                <Text style={styles.loadingMoreText}>Loading more...</Text>
                            </View>
                        )}

                        {!earningsPagination?.hasNext && filteredTransactions.length > 0 && (
                            <View style={styles.endMessage}>
                                <Text style={styles.endMessageText}>
                                    You've reached the end
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Details Modal */}
            {renderDetailsModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'PoppinsSemiBold',
    },
    headerContainer: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitleSection: {
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 12,
    },
    headerMainTitle: {
        fontSize: 24,
        color: '#1A1A1A',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#666',
    },
    statsContainer: {
        paddingVertical: 16,
    },
    statsScrollContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    statCard: {
        borderRadius: 16,
        padding: 16,
        minWidth: 160,
    },
    statCardGreen: {
        backgroundColor: '#f0fdf4',
    },
    statCardBlue: {
        backgroundColor: '#eff6ff',
    },
    statCardPurple: {
        backgroundColor: '#faf5ff',
    },
    statIconContainer: {
        backgroundColor: '#d1fae5',
        alignSelf: 'flex-start',
        borderRadius: 20,
        padding: 8,
        marginBottom: 8,
    },
    statIconContainerBlue: {
        backgroundColor: '#dbeafe',
        alignSelf: 'flex-start',
        borderRadius: 20,
        padding: 8,
        marginBottom: 8,
    },
    statIconContainerPurple: {
        backgroundColor: '#f3e8ff',
        alignSelf: 'flex-start',
        borderRadius: 20,
        padding: 8,
        marginBottom: 8,
    },
    statLabel: {
        color: '#6b7280',
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    statValueGreen: {
        color: '#065f46',
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
    },
    statValueBlue: {
        color: '#1e40af',
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
    },
    statValuePurple: {
        color: '#6b21a8',
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
    },
    filtersContainer: {
        paddingBottom: 16,
    },
    filtersScrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    filterChipActive: {
        backgroundColor: '#10b981',
    },
    filterChipText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    filterDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#e5e7eb',
        alignSelf: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    transactionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    transactionCardMarginTop: {
        marginTop: 12,
    },
    transactionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    transactionIconContainer: {
        marginRight: 12,
    },
    earningIcon: {
        backgroundColor: '#d1fae5',
        borderRadius: 20,
        padding: 8,
    },
    withdrawalIcon: {
        backgroundColor: '#dbeafe',
        borderRadius: 20,
        padding: 8,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 2,
    },
    transactionReference: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 6,
    },
    transactionAmountPositive: {
        color: '#10b981',
    },
    transactionAmountNegative: {
        color: '#3b82f6',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold',
    },
    transactionFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 6,
    },
    transactionDate: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        backgroundColor: '#f3f4f6',
        borderRadius: 40,
        padding: 24,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        textAlign: 'center',
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    loadingMoreText: {
        marginTop: 8,
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'PoppinsSemiBold',
    },
    endMessage: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    endMessageText: {
        fontSize: 14,
        color: '#9ca3af',
        fontFamily: 'PoppinsRegular',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalScroll: {
        padding: 24,
    },
    modalStatusSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalStatusIcon: {
        borderRadius: 50,
        padding: 16,
        marginBottom: 12,
    },
    modalStatusLabel: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    modalTransactionType: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
    },
    modalAmountCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
    },
    modalAmountLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginBottom: 6,
    },
    modalAmountValue: {
        fontSize: 28,
        fontFamily: 'PoppinsBold',
    },
    modalAmountPositive: {
        color: '#065f46',
    },
    modalAmountNegative: {
        color: '#1e40af',
    },
    modalBreakdownCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    modalSectionTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 16,
    },
    modalBreakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    modalBreakdownLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
    },
    modalBreakdownValue: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    modalBreakdownValueRed: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#ef4444',
    },
    modalBreakdownDivider: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    modalBreakdownTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalBreakdownTotalLabel: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    modalBreakdownTotalValue: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    modalInfoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    modalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
    },
    // modalInfoRow: {
    //     flexDirection: 'row',
    //     justifyContent: 'space-between',
    //     paddingVertical: 8,
    // },
    modalInfoLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        flex: 1,
    },
    modalInfoValue: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        textAlign: 'right',
        flex: 1,
        marginLeft: 12,
        flexShrink: 1,
    },
    modalBankCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    modalBankName: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#065f46',
        marginBottom: 4,
    },
    modalBankInfo: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#1f2937',
        marginBottom: 2,
    },
    modalBankAccount: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    modalFooter: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#ffffff',
        padding: 16,
    },
    modalCloseFooterButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalCloseFooterText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#ffffff',
    },
});

export default EarningsTab;