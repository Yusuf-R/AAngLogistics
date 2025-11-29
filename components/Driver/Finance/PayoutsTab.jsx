// components/Driver/FinanceManager/PayoutsTab.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    StyleSheet
} from 'react-native';
import {
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    CreditCard,
    TrendingDown,
    Calendar,
    ChevronRight,
    X,
    Plus,
    Wallet
} from 'lucide-react-native';
import DriverUtils from "../../../utils/DriverUtilities";
import WithdrawalModal from './WithdrawalModal';
import socketClient from '../../../lib/driver/SocketClient';
import StatusModal from "components/StatusModal/StatusModal";
import { invalidateFinanceQueries } from "../../../lib/queryUtils";

function PayoutsTab({
                        initialData,
                        initialPagination,
                        formatDate,
                        userData,
                        financialSummary,
                        dataRefresh
                    }) {
    const [payouts, setPayouts] = useState(initialData || []);
    const [pagination, setPagination] = useState(initialPagination || {});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [detailsModal, setDetailsModal] = useState(false);
    const [withdrawalModal, setWithdrawalModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        processing: 0,
        failed: 0,
        totalAmount: 0
    });

    const [verifyingPayoutId, setVerifyingPayoutId] = useState(null);

    const [statusModal, setStatusModal] = useState({
        visible: false,
        status: 'loading', // 'loading', 'success', 'error'
        message: '',
        onRetry: null,
        onClose: null,
    });

    const authPinEnabled = userData?.authPin?.isEnabled;
    const authPinLocked = userData?.authPin?.lockedUntil && new Date(userData.authPin.lockedUntil) > new Date();

    useEffect(() => {
        calculateStats();
    }, [payouts]);

    useEffect(() => {
        // Add payout event listeners
        socketClient.on('payout-status-updated', handlePayoutUpdate);
        socketClient.on('payout-completed', handlePayoutCompleted);
        socketClient.on('payout-failed', handlePayoutFailed);

        return () => {
            // Cleanup listeners when component unmounts
            socketClient.off('payout-status-updated', handlePayoutUpdate);
            socketClient.off('payout-completed', handlePayoutCompleted);
            socketClient.off('payout-failed', handlePayoutFailed);
        };
    }, []);

    const handlePayoutUpdate = async (data) => {
        console.log('💰 Real-time payout update:', data);

        // Update local state immediately (no API call needed)
        setPayouts(prevPayouts =>
            prevPayouts.map(payout =>
                payout._id === data.payoutId
                    ? { ...payout, status: data.status }
                    : payout
            )
        );

        await invalidateFinanceQueries();

        // Show beautiful status modal instead of Alert
        if (data.status === 'completed') {
            setStatusModal({
                visible: true,
                status: 'success',
                message: 'Withdrawal successfully!\n\n Your bank account has been credited.🎉',
                onClose: () => setStatusModal(prev => ({ ...prev, visible: false }))
            });
        }

        if (data.status === 'failed') {
            setStatusModal({
                visible: true,
                status: 'error',
                message: 'Withdrawal failed!',
                onClose: () => setStatusModal(prev => ({ ...prev, visible: false }))
            });
        }
    };

    const handlePayoutCompleted = (data) => {
        console.log('✅ Payout completed via WebSocket:', data);
        handlePayoutUpdate(data);
        calculateStats();
    };

    const handlePayoutFailed = (data) => {
        console.log('❌ Payout failed via WebSocket:', data);
        handlePayoutUpdate(data);
        calculateStats();
    };

    const calculateStats = () => {
        const newStats = {
            total: payouts.length,
            completed: payouts.filter(p => p.status === 'completed').length,
            processing: payouts.filter(p => p.status === 'processing').length,
            failed: payouts.filter(p => p.status === 'failed').length,
            totalAmount: payouts.reduce((sum, p) =>
                p.status === 'completed' ? sum + (p.amount?.net || 0) : sum, 0
            )
        };
        setStats(newStats);
    };

    const handleVerifyPayout = async (payoutId) => {
        try {
            setVerifyingPayoutId(payoutId);

            // Show loading state
            setStatusModal({
                visible: true,
                status: 'loading',
                message: 'Checking status...'
            });

            const result = await DriverUtils.getPayoutStatus(payoutId);
            console.log('Payout status result:', result);

            if (result.success) {
                // Your backend returns: result.payout.status and result.payout.paystackStatus
                // Map to what we need for UI
                let displayStatus;
                const payoutStatus = result.payout?.status;
                const paystackStatus = result.payout?.paystackStatus;

                if (payoutStatus === 'success' || paystackStatus === 'success') {
                    displayStatus = 'completed';
                } else if (payoutStatus === 'completed') {
                    displayStatus = 'completed';
                } else if (payoutStatus === 'failed' || paystackStatus === 'failed') {
                    displayStatus = 'failed';
                } else if (payoutStatus === 'reversed' || paystackStatus === 'reversed') {
                    displayStatus = 'reversed';
                } else {
                    displayStatus = payoutStatus || 'processing';
                }

                // Update local state
                setPayouts(prev => prev.map(payout =>
                    payout._id === payoutId
                        ? { ...payout, status: displayStatus }
                        : payout
                ));

                // Refresh data
                await invalidateFinanceQueries();
                await dataRefresh();
                await onRefresh();

                // Handle different statuses
                if (displayStatus === 'completed') {
                    // Success - auto close
                    setStatusModal({
                        visible: true,
                        status: 'success',
                        message: 'Withdrawal Complete!🎉\n\nFunds sent to your bank.🚀',
                        autoClose: true,
                        autoCloseDelay: 2000,
                        onClose: () => {
                            setStatusModal(prev => ({ ...prev, visible: false }));
                            setDetailsModal(false);
                        }
                    });
                } else if (displayStatus === 'failed' || displayStatus === 'reversed') {
                    setStatusModal({
                        visible: true,
                        status: 'error',
                        message: 'Withdrawal failed. Funds returned to balance.🗃️',
                        onClose: () => {
                            setStatusModal(prev => ({ ...prev, visible: false }));
                            setDetailsModal(false);
                        }
                    });
                } else {
                    // Still processing - show close button
                    setStatusModal({
                        visible: true,
                        status: 'loading',
                        message: 'Still processing. Check back later.🕚',
                        onClose: () => {
                            setStatusModal(prev => ({ ...prev, visible: false }));
                        }
                    });
                }
            }
        } catch (error) {
            console.log('Verification error:', error);
            setStatusModal({
                visible: true,
                status: 'error',
                message: 'Could not verify status🧐\n\nPlease try again.',
                showRetryOnError: true,
                onRetry: () => {
                    setStatusModal(prev => ({ ...prev, visible: false }));
                    setTimeout(() => handleVerifyPayout(payoutId), 300);
                },
                onClose: () => setStatusModal(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setVerifyingPayoutId(null);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₦0.00';
        return `₦${amount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const loadPayouts = async (filters = {}) => {
        try {
            setLoading(true);
            const result = await DriverUtils.getPayoutHistory(filters);
            setPayouts(result.payouts);
            setPagination(result.pagination);
        } catch (error) {
            console.log('Load payouts error:', error);
            setStatusModal({
                visible: true,
                status: 'error',
                message: 'Failed to load payout history. Please check your connection and try again.',
                onRetry: () => {
                    setStatusModal(prev => ({ ...prev, visible: false }));
                    loadPayouts(filters);
                },
                onClose: () => setStatusModal(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPayouts({
            status: statusFilter !== 'all' ? statusFilter : undefined
        });
    };

    const handleStatusFilter = async (status) => {
        setStatusFilter(status);
        await loadPayouts({
            status: status !== 'all' ? status : undefined
        });
    };

    const handleViewDetails = (payout) => {
        setSelectedPayout(payout);
        setDetailsModal(true);
    };

    const handleWithdrawalSuccess = async () => {
        setWithdrawalModal(false);
        await invalidateFinanceQueries();
        await onRefresh(); // Refresh to show new payout
        console.log('✅ All queries invalidated after successful withdrawal');
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'completed':
                return {
                    icon: CheckCircle2,
                    bg: styles.statusCompletedBg,
                    text: styles.statusCompletedText,
                    border: styles.statusCompletedBorder,
                    iconColor: '#10b981',
                    label: 'Completed'
                };
            case 'processing':
                return {
                    icon: Clock,
                    bg: styles.statusProcessingBg,
                    text: styles.statusProcessingText,
                    border: styles.statusProcessingBorder,
                    iconColor: '#3b82f6',
                    label: 'Processing'
                };
            case 'failed':
                return {
                    icon: XCircle,
                    bg: styles.statusFailedBg,
                    text: styles.statusFailedText,
                    border: styles.statusFailedBorder,
                    iconColor: '#ef4444',
                    label: 'Failed'
                };
            case 'pending':
                return {
                    icon: AlertCircle,
                    bg: styles.statusPendingBg,
                    text: styles.statusPendingText,
                    border: styles.statusPendingBorder,
                    iconColor: '#f59e0b',
                    label: 'Pending'
                };
            default:
                return {
                    icon: Clock,
                    bg: styles.statusDefaultBg,
                    text: styles.statusDefaultText,
                    border: styles.statusDefaultBorder,
                    iconColor: '#6b7280',
                    label: status
                };
        }
    };

    const renderHeader = () => {
        const availableBalance = financialSummary?.availableBalance || 0;
        const hasBankAccount = userData?.verification?.basicVerification?.bankAccounts?.some(acc => acc.verified);

        return (
            <View style={styles.headerContainer}>
                {/* Header Title */}
                <View style={styles.headerTitleSection}>
                    <Text style={styles.headerMainTitle}>Payout Manager</Text>
                    <Text style={styles.headerSubtitle}>
                        Instant withdrawal to your bank account
                    </Text>
                </View>

                <View style={styles.headerPadding}>
                    {/* Balance & Withdrawal Section */}
                    <View style={styles.balanceWithdrawalSection}>
                        <View style={styles.balanceCard}>
                            <View style={styles.balanceContent}>
                                <View style={styles.balanceHeader}>
                                    <View style={styles.walletIconContainer}>
                                        <Wallet size={20} color="#10b981" />
                                    </View>
                                    <Text style={styles.balanceLabel}>Available Balance</Text>
                                </View>
                                <Text style={styles.balanceAmount}>
                                    {formatCurrency(availableBalance)}
                                </Text>
                                <Text style={styles.balanceSubtext}>
                                    Ready for withdrawal
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setWithdrawalModal(true)}
                                disabled={availableBalance < 1000 || !hasBankAccount || !authPinEnabled || authPinLocked}
                                style={[
                                    styles.withdrawButton,
                                    (availableBalance < 1000 || !hasBankAccount) && styles.withdrawButtonDisabled
                                ]}
                            >
                                <Plus size={20} color="#ffffff" />
                                <Text style={styles.withdrawButtonText}>Withdraw</Text>
                            </TouchableOpacity>
                        </View>

                        {(!hasBankAccount || availableBalance < 1000 || !authPinEnabled || authPinLocked) && (
                            <View style={styles.alertBanner}>
                                <AlertCircle size={16} color="#f59e0b" />
                                <Text style={styles.alertText}>
                                    {!hasBankAccount
                                        ? 'Add bank account to withdraw funds'
                                        : availableBalance < 1000
                                            ? `Minimum withdrawal: ${formatCurrency(1000)}`
                                            : !authPinEnabled
                                                ? 'Set up Authorization PIN in Security section'
                                                : 'Authorization PIN is temporarily locked'
                                    }
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Stats Cards */}
                    <View style={styles.statsSection}>
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                                <View style={styles.summaryIconContainer}>
                                    <TrendingDown size={20} color="#8b5cf6" />
                                </View>
                                <Text style={styles.summaryTitle}>Total Withdrawn</Text>
                            </View>
                            <Text style={styles.summaryAmount}>
                                {formatCurrency(financialSummary.totalWithdrawn)}
                            </Text>
                            <Text style={styles.summarySubtext}>
                                {stats.completed} successful {stats.completed === 1 ? 'withdrawal' : 'withdrawals'}
                            </Text>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, styles.statCardBlue]}>
                                <View style={styles.statIconBlue}>
                                    <Clock size={14} color="#3b82f6" />
                                </View>
                                <Text style={styles.statLabelBlue}>Processing</Text>
                                <Text style={styles.statValueBlue}>{stats.processing}</Text>
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
                        {['all', 'completed', 'processing', 'failed', 'pending'].map((status) => {
                            const count = status === 'all' ? stats.total : stats[status] || 0;
                            const isActive = statusFilter === status;

                            return (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => handleStatusFilter(status)}
                                    style={[
                                        styles.filterChip,
                                        isActive ? styles.filterChipActive : styles.filterChipInactive
                                    ]}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        isActive ? styles.filterChipTextActive : styles.filterChipTextInactive
                                    ]}>
                                        {status}
                                    </Text>
                                    {count > 0 && (
                                        <View style={[
                                            styles.filterBadge,
                                            isActive ? styles.filterBadgeActive : styles.filterBadgeInactive
                                        ]}>
                                            <Text style={[
                                                styles.filterBadgeText,
                                                isActive ? styles.filterBadgeTextActive : styles.filterBadgeTextInactive
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
    };

    const renderPayoutItem = (payout, index) => {
        const statusConfig = getStatusConfig(payout.status);
        const StatusIcon = statusConfig.icon;

        return (
            <TouchableOpacity
                key={payout._id}
                onPress={() => handleViewDetails(payout)}
                style={[styles.payoutCard, index !== 0 && styles.payoutCardMarginTop]}
                activeOpacity={0.7}
            >
                <View style={styles.payoutHeader}>
                    <View style={styles.payoutHeaderLeft}>
                        <View style={styles.payoutHeaderRow}>
                            <View style={[styles.statusIconContainer, statusConfig.bg]}>
                                <StatusIcon size={16} color={statusConfig.iconColor} />
                            </View>
                            <View style={styles.payoutHeaderText}>
                                <Text style={styles.payoutTitle}>Withdrawal Request</Text>
                                <Text style={styles.payoutSubtitle}>
                                    {payout.gateway?.reference || payout._id}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, statusConfig.bg, statusConfig.border]}>
                        <Text style={[styles.statusBadgeText, statusConfig.text]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.amountBreakdown}>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Requested</Text>
                        <Text style={styles.breakdownValue}>
                            {formatCurrency(payout.payout?.requestedAmount || payout.amount?.gross || 0)}
                        </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Fee</Text>
                        <Text style={styles.breakdownValueRed}>
                            -{formatCurrency(payout.payout?.transferFee || payout.amount?.fees || 0)}
                        </Text>
                    </View>
                    <View style={styles.breakdownDivider}>
                        <View style={styles.breakdownTotal}>
                            <Text style={styles.breakdownTotalLabel}>Received</Text>
                            <Text style={styles.breakdownTotalValue}>
                                {formatCurrency(payout.payout?.netAmount || payout.amount?.net || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {payout.payout?.bankDetails && (
                    <View style={styles.bankDetailsRow}>
                        <View style={styles.bankIconContainer}>
                            <CreditCard size={14} color="#3b82f6" />
                        </View>
                        <View style={styles.bankDetailsText}>
                            <Text style={styles.bankAccountName}>
                                {payout.payout.bankDetails.accountName}
                            </Text>
                            <Text style={styles.bankAccountDetails}>
                                {payout.payout.bankDetails.bankName} • {payout.payout.bankDetails.accountNumber}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.payoutFooter}>
                    <View style={styles.payoutDate}>
                        <Calendar size={14} color="#6b7280" />
                        <Text style={styles.payoutDateText}>{formatDate(payout.createdAt)}</Text>
                    </View>
                    <View style={styles.payoutAction}>
                        <Text style={styles.payoutActionText}>View Details</Text>
                        <ChevronRight size={16} color="#10b981" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };


    const renderDetailsModal = () => {
        if (!selectedPayout) return null;

        const statusConfig = getStatusConfig(selectedPayout.status);
        const StatusIcon = statusConfig.icon;
        const isPending = selectedPayout.status === 'pending' || selectedPayout.status === 'processing';

        return (
            <Modal
                visible={detailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payout Details</Text>
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
                                <View style={[styles.modalStatusIcon, statusConfig.bg]}>
                                    <StatusIcon size={32} color={statusConfig.iconColor} />
                                </View>
                                <View style={[styles.modalStatusBadge, statusConfig.bg, statusConfig.border]}>
                                    <Text style={[styles.modalStatusText, statusConfig.text]}>
                                        {statusConfig.label}
                                    </Text>
                                </View>
                            </View>

                            {/* Amount Card */}
                            <View style={styles.modalAmountCard}>
                                <Text style={styles.modalAmountLabel}>Amount Received</Text>
                                <Text style={styles.modalAmountValue}>
                                    {formatCurrency(selectedPayout.payout?.netAmount || 0)}
                                </Text>
                            </View>

                            {/* Breakdown */}
                            <View style={styles.modalBreakdownCard}>
                                <Text style={styles.modalSectionTitle}>Breakdown</Text>
                                <View style={styles.modalBreakdownRow}>
                                    <Text style={styles.modalBreakdownLabel}>Requested Amount</Text>
                                    <Text style={styles.modalBreakdownValue}>
                                        {formatCurrency(selectedPayout.payout?.requestedAmount || 0)}
                                    </Text>
                                </View>
                                <View style={styles.modalBreakdownRow}>
                                    <Text style={styles.modalBreakdownLabel}>Processing Fee</Text>
                                    <Text style={styles.modalBreakdownValueRed}>
                                        -{formatCurrency(selectedPayout.payout?.transferFee || 0)}
                                    </Text>
                                </View>
                                <View style={styles.modalBreakdownDivider}>
                                    <View style={styles.modalBreakdownTotal}>
                                        <Text style={styles.modalBreakdownTotalLabel}>Net Amount</Text>
                                        <Text style={styles.modalBreakdownTotalValue}>
                                            {formatCurrency(selectedPayout.payout?.netAmount || 0)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Transfer Reference */}
                            {selectedPayout.gateway?.reference && (
                                <View style={styles.modalReferenceCard}>
                                    <Text style={styles.modalSectionTitle}>Transfer Reference</Text>
                                    <Text style={styles.modalReferenceText}>
                                        {selectedPayout.gateway.reference}
                                    </Text>
                                    <Text style={styles.modalReferenceHint}>
                                        Use this reference if you need to contact support
                                    </Text>
                                </View>
                            )}

                            {/* Bank Details */}
                            {selectedPayout.payout?.bankDetails && (
                                <View style={styles.modalBankCard}>
                                    <Text style={styles.modalSectionTitle}>Bank Details</Text>
                                    <View style={styles.modalBankInfo}>
                                        <Text style={styles.modalBankName}>
                                            {selectedPayout.payout.bankDetails.accountName}
                                        </Text>
                                        <Text style={styles.modalBankDetails}>
                                            {selectedPayout.payout.bankDetails.bankName}
                                        </Text>
                                        <Text style={styles.modalBankAccount}>
                                            Account: {selectedPayout.payout.bankDetails.accountNumber}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Status-specific alerts */}
                            {isPending && (
                                <>
                                    <View style={styles.modalAlert}>
                                        <AlertCircle size={20} color="#3b82f6" style={styles.modalAlertIcon} />
                                        <View style={styles.modalAlertText}>
                                            <Text style={styles.modalAlertTitle}>Processing</Text>
                                            <Text style={styles.modalAlertMessage}>
                                                Your withdrawal is being processed. Funds typically arrive within 10 minutes, but may take up to 24 hours.
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Verify Button */}
                                    <TouchableOpacity
                                        onPress={() => handleVerifyPayout(selectedPayout._id)}
                                        disabled={verifyingPayoutId === selectedPayout._id}
                                        style={styles.verifyButton}
                                    >
                                        {verifyingPayoutId === selectedPayout._id ? (
                                            <ActivityIndicator size="small" color="#3b82f6" />
                                        ) : (
                                            <>
                                                <AlertCircle size={20} color="#3b82f6" />
                                                <Text style={styles.verifyButtonText}>
                                                    Check Status Now
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            {selectedPayout.status === 'failed' && (
                                <View style={styles.modalAlert}>
                                    <XCircle size={20} color="#ef4444" style={styles.modalAlertIcon} />
                                    <View style={styles.modalAlertText}>
                                        <Text style={styles.modalAlertTitle}>Transfer Failed</Text>
                                        <Text style={styles.modalAlertMessage}>
                                            Your funds have been returned to your available balance. You can try withdrawing again or contact support with the reference number above.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {selectedPayout.status === 'completed' && (
                                <View style={styles.modalAlert}>
                                    <CheckCircle2 size={20} color="#10b981" style={styles.modalAlertIcon} />
                                    <View style={styles.modalAlertText}>
                                        <Text style={styles.modalAlertTitle}>Transfer Completed</Text>
                                        <Text style={styles.modalAlertMessage}>
                                            Your withdrawal was successful! Funds have been sent to your bank account.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={{ height: 50 }} />
                        </ScrollView>

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

    if (loading && payouts.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading payouts...</Text>
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
                {payouts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateContent}>
                            <View style={styles.emptyIconContainer}>
                                <TrendingDown size={48} color="#d1d5db" />
                            </View>
                            <Text style={styles.emptyTitle}>No Payouts Yet</Text>
                            <Text style={styles.emptyMessage}>
                                {statusFilter !== 'all'
                                    ? `No ${statusFilter} payouts found`
                                    : 'Request your first withdrawal to see payout history'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setWithdrawalModal(true)}
                                style={styles.emptyStateButton}
                            >
                                <Text style={styles.emptyStateButtonText}>Make First Withdrawal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    payouts.map((payout, index) => renderPayoutItem(payout, index))
                )}
            </ScrollView>

            {/* Details Modal */}
            {renderDetailsModal()}

            {/* Withdrawal Modal */}
            <WithdrawalModal
                visible={withdrawalModal}
                onClose={() => setWithdrawalModal(false)}
                onSuccess={handleWithdrawalSuccess}
                financialSummary={financialSummary}
                userData={userData}
                formatCurrency={formatCurrency}
            />
            {/* Beautiful Status Modal */}
            <StatusModal
                visible={statusModal.visible}
                status={statusModal.status}
                message={statusModal.message}
                onFinish={() => statusModal.onClose?.()}
                onRetry={statusModal.onRetry}
                onClose={statusModal.onClose}
                showRetryOnError={!!statusModal.onRetry}
                autoClose={statusModal.autoClose}
                autoCloseDelay={statusModal.autoCloseDelay}
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
        backgroundColor: '#f9fafb'
    },
    loadingText: {
        marginTop: 16,
        color: '#6b7280'
    },
    headerContainer: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    headerPadding: {
        paddingHorizontal: 16,
        paddingVertical: 16
    },
    headerTitleSection: {
        alignItems: 'flex-start',
        marginTop: 60,
        paddingHorizontal: 16,
        paddingVertical: 12
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
    summaryCard: {
        backgroundColor: '#faf5ff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    summaryIconContainer: {
        backgroundColor: '#e9d5ff',
        borderRadius: 20,
        padding: 8,
        marginRight: 12
    },
    summaryTitle: {
        color: '#581c87',
        fontWeight: 'bold',
        fontSize: 18
    },
    summaryAmount: {
        color: '#581c87',
        fontSize: 30,
        fontWeight: 'bold'
    },
    summarySubtext: {
        color: '#9333ea',
        fontSize: 14,
        marginTop: 4
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 12
    },
    statCardBlue: {
        backgroundColor: '#eff6ff'
    },
    statCardRed: {
        backgroundColor: '#fef2f2'
    },
    statIconBlue: {
        backgroundColor: '#dbeafe',
        alignSelf: 'flex-start',
        borderRadius: 12,
        padding: 6,
        marginBottom: 8
    },
    statIconRed: {
        backgroundColor: '#fee2e2',
        alignSelf: 'flex-start',
        borderRadius: 12,
        padding: 6,
        marginBottom: 8
    },
    statLabelBlue: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4
    },
    statLabelRed: {
        color: '#dc2626',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4
    },
    statValueBlue: {
        color: '#1e3a8a',
        fontSize: 18,
        fontWeight: 'bold'
    },
    statValueRed: {
        color: '#7f1d1d',
        fontSize: 18,
        fontWeight: 'bold'
    },
    filterSection: {
        paddingHorizontal: 16,
        paddingBottom: 16
    },
    filterScrollContent: {
        gap: 8
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    filterChipActive: {
        backgroundColor: '#10b981'
    },
    filterChipInactive: {
        backgroundColor: '#f3f4f6'
    },
    filterChipText: {
        textTransform: 'capitalize',
        fontWeight: '600'
    },
    filterChipTextActive: {
        color: '#ffffff'
    },
    filterChipTextInactive: {
        color: '#4b5563'
    },
    filterBadge: {
        marginLeft: 8,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2
    },
    filterBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)'
    },
    filterBadgeInactive: {
        backgroundColor: '#e5e7eb'
    },
    filterBadgeText: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    filterBadgeTextActive: {
        color: '#ffffff'
    },
    filterBadgeTextInactive: {
        color: '#374151'
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        paddingBottom: 16
    },
    payoutCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    payoutCardMarginTop: {
        marginTop: 12
    },
    payoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    payoutHeaderLeft: {
        flex: 1,
        marginRight: 12
    },
    payoutHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    statusIconContainer: {
        borderRadius: 20,
        padding: 8,
        marginRight: 8
    },
    payoutHeaderText: {
        flex: 1
    },
    payoutTitle: {
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 16
    },
    payoutSubtitle: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600'
    },
    statusCompletedBg: {
        backgroundColor: '#d1fae5'
    },
    statusCompletedText: {
        color: '#047857'
    },
    statusCompletedBorder: {
        borderColor: '#a7f3d0'
    },
    statusProcessingBg: {
        backgroundColor: '#dbeafe'
    },
    statusProcessingText: {
        color: '#1d4ed8'
    },
    statusProcessingBorder: {
        borderColor: '#bfdbfe'
    },
    statusFailedBg: {
        backgroundColor: '#fee2e2'
    },
    statusFailedText: {
        color: '#dc2626'
    },
    statusFailedBorder: {
        borderColor: '#fecaca'
    },
    statusPendingBg: {
        backgroundColor: '#fef3c7'
    },
    statusPendingText: {
        color: '#d97706'
    },
    statusPendingBorder: {
        borderColor: '#fde68a'
    },
    statusDefaultBg: {
        backgroundColor: '#f3f4f6'
    },
    statusDefaultText: {
        color: '#374151'
    },
    statusDefaultBorder: {
        borderColor: '#e5e7eb'
    },
    amountBreakdown: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    breakdownLabel: {
        color: '#6b7280',
        fontSize: 14
    },
    breakdownValue: {
        color: '#111827',
        fontWeight: '600'
    },
    breakdownValueRed: {
        color: '#dc2626',
        fontWeight: '600'
    },
    breakdownDivider: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
        marginTop: 4
    },
    breakdownTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    breakdownTotalLabel: {
        color: '#111827',
        fontWeight: 'bold'
    },
    breakdownTotalValue: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 18
    },
    bankDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    bankIconContainer: {
        backgroundColor: '#eff6ff',
        borderRadius: 20,
        padding: 8,
        marginRight: 8
    },
    bankDetailsText: {
        flex: 1
    },
    bankAccountName: {
        color: '#111827',
        fontWeight: '500',
        fontSize: 14
    },
    bankAccountDetails: {
        color: '#6b7280',
        fontSize: 12
    },
    payoutFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    payoutDate: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    payoutDateText: {
        color: '#6b7280',
        fontSize: 12,
        marginLeft: 6
    },
    payoutAction: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    payoutActionText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4
    },
    emptyState: {
        paddingVertical: 80,
        paddingHorizontal: 16
    },
    emptyStateContent: {
        alignItems: 'center'
    },
    emptyIconContainer: {
        backgroundColor: '#f3f4f6',
        borderRadius: 48,
        padding: 24,
        marginBottom: 16
    },
    emptyTitle: {
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 8
    },
    emptyMessage: {
        color: '#6b7280',
        textAlign: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    modalTitle: {
        color: '#111827',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 18
    },
    modalCloseButton: {
        padding: 4
    },
    modalScroll: {
        padding: 20
    },
    modalStatusSection: {
        alignItems: 'center',
        marginBottom: 20
    },
    modalStatusIcon: {
        borderRadius: 40,
        padding: 16,
        marginBottom: 12
    },
    modalStatusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1
    },
    modalStatusText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        fontWeight: '600'
    },
    modalAmountCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16
    },
    modalAmountLabel: {
        color: '#065f46',
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        marginBottom: 8
    },
    modalAmountValue: {
        color: '#065f46',
        fontSize: 24,
        fontWeight: 'bold'
    },
    modalBreakdownCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },
    modalSectionTitle: {
        color: '#111827',
        fontFamily: 'PoppinsMedium',
        fontSize: 16,
        marginBottom: 12
    },
    modalBreakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    modalBreakdownLabel: {
        color: '#6b7280',
        fontFamily: 'PoppinsMedium',
        fontSize: 14
    },
    modalBreakdownValue: {
        color: '#111827',
        fontWeight: '600'
    },
    modalBreakdownValueRed: {
        color: '#dc2626',
        fontWeight: '600'
    },
    modalBreakdownDivider: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
        marginTop: 8
    },
    modalBreakdownTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    modalBreakdownTotalLabel: {
        color: '#111827',
        fontFamily: 'PoppinsMedium',
    },
    modalBreakdownTotalValue: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 16
    },
    modalBankCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },
    modalBankInfo: {
        marginTop: 8
    },
    modalBankName: {
        color: '#111827',
        fontFamily: 'PoppinsMedium',
        fontSize: 16,
        marginBottom: 4
    },
    modalBankDetails: {
        color: '#374151',
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        marginBottom: 2
    },
    modalBankAccount: {
        color: '#6b7280',
        fontFamily: 'PoppinsMedium',
        fontSize: 14
    },
    modalInfoCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },
    modalInfoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    modalInfoLabel: {
        color: '#6b7280',
        fontFamily: 'PoppinsMedium',
        fontSize: 14
    },
    modalInfoValue: {
        color: '#111827',
        fontWeight: '500',
        fontSize: 14
    },
    modalInfoValueText: {
        color: '#111827',
        fontSize: 14
    },
    modalAlert: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    modalAlertError: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    modalAlertIcon: {
        marginRight: 12,
        marginTop: 2
    },
    modalAlertText: {
        flex: 1
    },
    modalAlertTitle: {
        color: '#1e40af',
        fontFamily: 'PoppinsMedium',
        fontSize: 14,
        marginBottom: 4
    },
    modalAlertMessage: {
        color: '#374151',
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        lineHeight: 20
    },
    modalAlertTitleError: {
        color: '#dc2626',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4
    },
    modalAlertMessageError: {
        color: '#374151',
        fontSize: 14,
        lineHeight: 20
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
    },
    modalCloseFooterButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center'
    },
    modalCloseFooterText: {
        color: '#ffffff',
        fontFamily: 'PoppinsMedium',
        fontSize: 16
    },




    balanceWithdrawalSection: {
        marginBottom: 16,
    },
    balanceCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    balanceContent: {
        flex: 1,
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    walletIconContainer: {
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        padding: 6,
        marginRight: 8,
    },
    balanceLabel: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
    },
    balanceAmount: {
        color: '#111827',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    balanceSubtext: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '500',
    },
    withdrawButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    withdrawButtonDisabled: {
        backgroundColor: '#d1d5db',
    },
    withdrawButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    alertBanner: {
        backgroundColor: '#fffbeb',
        borderColor: '#fef3c7',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alertText: {
        color: '#92400e',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    statsSection: {
        gap: 12,
    },
    emptyStateButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 16,
    },
    emptyStateButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Add to PayoutsTab styles
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 24,
        marginTop: 16,
        gap: 8,
    },
    verifyButtonText: {
        color: '#3b82f6',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    modalReferenceCard: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 24,
        marginBottom: 16,
    },
    modalReferenceText: {
        fontFamily: 'Courier',
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    modalReferenceHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
        fontFamily: 'PoppinsSemiBold',
    },
});

export default PayoutsTab;