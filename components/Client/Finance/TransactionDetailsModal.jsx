// ============================================
// TRANSACTION DETAILS MODAL
// components/Client/Finance/TransactionDetailsModal.jsx
// ============================================

import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Clipboard
} from 'react-native';
import {
    X,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Copy,
    RefreshCw,
    Calendar,
    CreditCard,
    Receipt,
    Info
} from 'lucide-react-native';
import ClientUtils from '../../../utils/ClientUtilities';
import { invalidateClientFinanceQueries } from '../../../lib/queryUtils';

function TransactionDetailsModal({
                                     visible,
                                     onClose,
                                     transaction,
                                     onSuccess
                                 }) {
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    if (!transaction) return null;

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₦0.00';
        return `₦${parseFloat(amount).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                    label: 'Completed',
                    description: 'This transaction was successful and your wallet has been credited.'
                };
            case 'pending':
                return {
                    icon: Clock,
                    bg: '#fef3c7',
                    text: '#92400e',
                    border: '#fde68a',
                    iconColor: '#f59e0b',
                    label: 'Pending',
                    description: 'Payment is being processed. This usually completes within a few minutes.'
                };
            case 'failed':
                return {
                    icon: XCircle,
                    bg: '#fee2e2',
                    text: '#991b1b',
                    border: '#fecaca',
                    iconColor: '#ef4444',
                    label: 'Failed',
                    description: 'This transaction failed. If you were charged, the amount will be refunded.'
                };
            default:
                return {
                    icon: Clock,
                    bg: '#f3f4f6',
                    text: '#374151',
                    border: '#e5e7eb',
                    iconColor: '#6b7280',
                    label: status,
                    description: 'Transaction status is being verified.'
                };
        }
    };

    const statusConfig = getStatusConfig(transaction.status);
    const StatusIcon = statusConfig.icon;
    const isPending = transaction.status === 'pending';
    const isFailed = transaction.status === 'failed';
    const isCompleted = transaction.status === 'completed';

    const handleCopyReference = () => {
        Clipboard.setString(transaction.gateway?.reference || transaction._id);
        alert('Reference copied to clipboard');
    };

    const handleVerifyPayment = async () => {
        try {
            setVerifying(true);
            setError('');

            console.log('🔄 Verifying transaction:', transaction.gateway?.reference);

            const result = await ClientUtils.checkPendingTopUp(
                transaction.gateway?.reference
            );

            if (result.success && result.status === 'completed') {
                // Invalidate queries and refresh
                await invalidateClientFinanceQueries();

                alert('Success! Your wallet has been credited.');

                if (onSuccess) {
                    onSuccess();
                }

                onClose();
            } else if (result.status === 'failed') {
                console.log({result})
                await invalidateClientFinanceQueries();
                setError(`Transaction failed: ${result.error || 'Unknown error'}`);
            } else {
                await invalidateClientFinanceQueries();
                setError('Transaction is still pending. Please try again in a moment or contact support.');
            }

        } catch (err) {
            console.log('❌ Verification error:', err);
            await invalidateClientFinanceQueries();
            setError(err.response?.data?.error || err.message || 'Failed to verify transaction');
        } finally {
            await invalidateClientFinanceQueries();
            setVerifying(false);
        }
    };

    const handleContactSupport = () => {
        const reference = transaction.gateway?.reference || transaction._id;
        const message = `Hello, I need help with my wallet top-up transaction.\n\nReference: ${reference}\nStatus: ${transaction.status}\nAmount: ${formatCurrency(transaction.amount.gross)}`;
        alert('Support Feature: ' + message);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Transaction Details</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            disabled={verifying}
                        >
                            <X size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Status Section */}
                        <View style={styles.statusSection}>
                            <View style={[styles.statusIconLarge, { backgroundColor: statusConfig.bg }]}>
                                <StatusIcon size={48} color={statusConfig.iconColor} />
                            </View>
                            <View style={[styles.statusBadgeLarge, {
                                backgroundColor: statusConfig.bg,
                                borderColor: statusConfig.border
                            }]}>
                                <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
                                    {statusConfig.label}
                                </Text>
                            </View>
                            <Text style={styles.statusDescription}>
                                {statusConfig.description}
                            </Text>
                        </View>

                        {/* Amount Card */}
                        <View style={styles.amountCard}>
                            <View style={styles.amountRow}>
                                <Text style={styles.amountLabel}>Amount Paid</Text>
                                <Text style={styles.amountValue}>
                                    {formatCurrency(transaction.amount.gross)}
                                </Text>
                            </View>
                            {transaction.amount.fees > 0 && (
                                <View style={styles.amountRow}>
                                    <Text style={styles.amountLabel}>Processing Fee</Text>
                                    <Text style={styles.amountValueRed}>
                                        -{formatCurrency(transaction.amount.fees)}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.amountDivider} />
                            <View style={styles.amountRow}>
                                <Text style={styles.amountLabelTotal}>Wallet Credited</Text>
                                <Text style={styles.amountValueTotal}>
                                    {formatCurrency(transaction.amount.net)}
                                </Text>
                            </View>
                        </View>

                        {/* Transaction Info */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardTitle}>Transaction Information</Text>

                            {/* Reference */}
                            <View style={styles.infoItem}>
                                <View style={styles.infoItemHeader}>
                                    <Receipt size={16} color="#6b7280" />
                                    <Text style={styles.infoItemLabel}>Reference</Text>
                                </View>
                                <View style={styles.referenceRow}>
                                    <Text style={styles.infoItemValue}>
                                        {transaction.gateway?.reference || transaction._id}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleCopyReference}
                                        style={styles.copyButton}
                                    >
                                        <Copy size={16} color="#3b82f6" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Date */}
                            <View style={styles.infoItem}>
                                <View style={styles.infoItemHeader}>
                                    <Calendar size={16} color="#6b7280" />
                                    <Text style={styles.infoItemLabel}>Date & Time</Text>
                                </View>
                                <Text style={styles.infoItemValue}>
                                    {formatDate(transaction.createdAt)}
                                </Text>
                            </View>

                            {/* Payment Method */}
                            <View style={styles.infoItem}>
                                <View style={styles.infoItemHeader}>
                                    <CreditCard size={16} color="#6b7280" />
                                    <Text style={styles.infoItemLabel}>Payment Method</Text>
                                </View>
                                <Text style={styles.infoItemValue}>
                                    {transaction.gateway?.provider || 'PayStack'}
                                </Text>
                            </View>

                            {/* Transaction ID */}
                            {transaction._id && (
                                <View style={styles.infoItem}>
                                    <View style={styles.infoItemHeader}>
                                        <Info size={16} color="#6b7280" />
                                        <Text style={styles.infoItemLabel}>Transaction ID</Text>
                                    </View>
                                    <Text style={styles.infoItemValueSmall}>
                                        {transaction._id}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Status-specific alerts */}
                        {isPending && (
                            <View style={styles.alertCard}>
                                <AlertCircle size={20} color="#f59e0b" />
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertTitle}>Payment Pending</Text>
                                    <Text style={styles.alertText}>
                                        Your payment is being processed. This usually takes a few minutes.
                                        You can verify the status now or wait for automatic processing.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {isFailed && (
                            <View style={styles.alertCard}>
                                <XCircle size={20} color="#ef4444" />
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertTitle}>Transaction Failed</Text>
                                    <Text style={styles.alertText}>
                                        This transaction could not be completed. If you were charged,
                                        the amount will be automatically refunded within 5-7 business days.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {isCompleted && (
                            <View style={styles.alertCard}>
                                <CheckCircle2 size={20} color="#10b981" />
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertTitle}>Transaction Successful</Text>
                                    <Text style={styles.alertText}>
                                        Your wallet has been credited successfully. The funds are now available for use.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorCard}>
                                <AlertCircle size={20} color="#ef4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        {isPending && (
                            <TouchableOpacity
                                onPress={handleVerifyPayment}
                                disabled={verifying}
                                style={[
                                    styles.actionButton,
                                    styles.verifyButton,
                                    verifying && styles.actionButtonDisabled
                                ]}
                            >
                                {verifying ? (
                                    <>
                                        <ActivityIndicator size="small" color="#ffffff" />
                                        <Text style={styles.actionButtonText}>Verifying...</Text>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={20} color="#ffffff" />
                                        <Text style={styles.actionButtonText}>Verify Payment</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {/*{isFailed && (*/}
                        {/*    <TouchableOpacity*/}
                        {/*        onPress={handleContactSupport}*/}
                        {/*        style={[styles.actionButton, styles.supportButton]}*/}
                        {/*    >*/}
                        {/*        <AlertCircle size={20} color="#ffffff" />*/}
                        {/*        <Text style={styles.actionButtonText}>Contact Support</Text>*/}
                        {/*    </TouchableOpacity>*/}
                        {/*)}*/}

                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeFooterButton}
                            disabled={verifying}
                        >
                            <Text style={styles.closeFooterText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
    },
    closeButton: {
        padding: 8,
    },
    scrollView: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },

    // Status Section
    statusSection: {
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 20,
    },
    statusIconLarge: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadgeLarge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        marginBottom: 12,
    },
    statusBadgeText: {
        fontSize: 16,
        fontWeight: '700',
    },
    statusDescription: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'PoppinsMedium',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },

    // Amount Card
    amountCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    amountLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#6b7280',
    },
    amountValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    amountValueRed: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
    amountDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    amountLabelTotal: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    amountValueTotal: {
        fontSize: 20,
        fontWeight: '700',
        color: '#10b981',
    },

    // Info Card
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    infoCardTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',

        color: '#111827',
        marginBottom: 16,
    },
    infoItem: {
        marginBottom: 16,
    },
    infoItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    infoItemLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsBold',
        color: '#6b7280',
    },
    infoItemValue: {
        fontSize: 15,
        color: '#111827',
        fontFamily: 'PoppinsMedium',
    },
    infoItemValueSmall: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'PoppinsMono',
    },
    referenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    copyButton: {
        padding: 8,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 8,
    },

    // Alert Cards
    alertCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    alertText: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'PoppinsSemiBold',
        lineHeight: 18,
    },
    errorCard: {
        flexDirection: 'row',
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        gap: 12,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#991b1b',
        fontFamily: 'PoppinsSemiBold',
    },

    // Footer
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    verifyButton: {
        backgroundColor: '#3b82f6',
    },
    supportButton: {
        backgroundColor: '#f59e0b',
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    closeFooterButton: {
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    closeFooterText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
    },
});

export default TransactionDetailsModal;