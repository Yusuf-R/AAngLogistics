// components/Driver/Account/Analytics/EarningDetails.jsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import CustomHeader from '../../../../components/CustomHeader';
import { Ionicons } from '@expo/vector-icons';

function EarningDetails({data, refetch}) {
    const formatCurrency = (amount) => `₦${(amount || 0).toLocaleString()}`;

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const transaction = data?.data;
    const isEarning = transaction?.transactionType === 'driver_earning';
    const isPayout = transaction?.transactionType === 'driver_payout';

    return (
        <>
            <CustomHeader title="Transaction Details" onBackPress={() => router.back()} />

            <ScrollView style={styles.scrollView}>
                {/* AMOUNT HEADER */}
                <View style={[styles.amountHeader, {
                    backgroundColor: isEarning ? '#4CAF50' : '#F44336'
                }]}>
                    <Ionicons
                        name={isEarning ? "arrow-down-circle" : "arrow-up-circle"}
                        size={48}
                        color="#fff"
                    />
                    <Text style={styles.amountLabel}>
                        {isEarning ? 'Earnings' : 'Withdrawal'}
                    </Text>
                    <Text style={styles.amountValue}>
                        {isEarning ? '+' : '-'}{formatCurrency(transaction.amount.net)}
                    </Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {transaction.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* TRANSACTION INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transaction Information</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Type</Text>
                        <Text style={styles.infoValue}>
                            {isEarning ? 'Delivery Earnings' : 'Account Withdrawal'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date</Text>
                        <Text style={styles.infoValue}>
                            {formatDate(transaction.processedAt || transaction.createdAt)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Transaction ID</Text>
                        <Text style={[styles.infoValue, styles.monoText]}>
                            {transaction._id}
                        </Text>
                    </View>

                    {transaction.orderId && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Order Reference</Text>
                            <Text style={styles.infoValue}>
                                {transaction.orderId.orderRef || 'N/A'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* AMOUNT BREAKDOWN */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Amount Breakdown</Text>

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Gross Amount</Text>
                        <Text style={styles.breakdownValue}>
                            {formatCurrency(transaction.amount.gross)}
                        </Text>
                    </View>

                    {transaction.amount.fees > 0 && (
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>
                                {isPayout ? 'Transfer Fee' : 'Processing Fee'}
                            </Text>
                            <Text style={[styles.breakdownValue, styles.feeText]}>
                                -{formatCurrency(transaction.amount.fees)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabelBold}>Net Amount</Text>
                        <Text style={styles.breakdownValueBold}>
                            {formatCurrency(transaction.amount.net)}
                        </Text>
                    </View>
                </View>

                {/* PAYOUT DETAILS */}
                {isPayout && transaction.payout && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payout Details</Text>

                        {transaction.payout.bankDetails && (
                            <>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Bank Name</Text>
                                    <Text style={styles.infoValue}>
                                        {transaction.payout.bankDetails.bankName}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Account Number</Text>
                                    <Text style={[styles.infoValue, styles.monoText]}>
                                        {transaction.payout.bankDetails.accountNumber}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Account Name</Text>
                                    <Text style={styles.infoValue}>
                                        {transaction.payout.bankDetails.accountName}
                                    </Text>
                                </View>
                            </>
                        )}

                        {transaction.payout.paystackTransferRef && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Transfer Reference</Text>
                                <Text style={[styles.infoValue, styles.monoText]}>
                                    {transaction.payout.paystackTransferRef}
                                </Text>
                            </View>
                        )}

                        {transaction.payout.transferStatus && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Transfer Status</Text>
                                <View style={styles.statusPill}>
                                    <Text style={styles.statusPillText}>
                                        {transaction.payout.transferStatus.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* ORDER DETAILS (for earnings) */}
                {isEarning && transaction.orderId && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Details</Text>

                        <View style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Ionicons name="cube" size={24} color="#4CAF50" />
                                <Text style={styles.orderRef}>
                                    {transaction.orderId.orderRef}
                                </Text>
                            </View>

                            {transaction.orderId.pricing && (
                                <View style={styles.orderInfo}>
                                    <View style={styles.orderInfoRow}>
                                        <Text style={styles.orderInfoLabel}>Total Order Value</Text>
                                        <Text style={styles.orderInfoValue}>
                                            {formatCurrency(transaction.orderId.pricing.totalAmount)}
                                        </Text>
                                    </View>
                                    <View style={styles.orderInfoRow}>
                                        <Text style={styles.orderInfoLabel}>Your Earnings (70%)</Text>
                                        <Text style={[styles.orderInfoValue, styles.earningsText]}>
                                            {formatCurrency(transaction.amount.net)}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {transaction.orderId.location && (
                                <View style={styles.routeInfo}>
                                    <View style={styles.routePoint}>
                                        <Ionicons name="ellipse" size={12} color="#4CAF50" />
                                        <Text style={styles.routeText} numberOfLines={2}>
                                            {transaction.orderId.location.pickUp?.address}
                                        </Text>
                                    </View>
                                    <View style={styles.routeLine} />
                                    <View style={styles.routePoint}>
                                        <Ionicons name="location" size={12} color="#F44336" />
                                        <Text style={styles.routeText} numberOfLines={2}>
                                            {transaction.orderId.location.dropOff?.address}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* METADATA */}
                {transaction.metadata?.description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Information</Text>
                        <Text style={styles.metadataText}>
                            {transaction.metadata.description}
                        </Text>
                        {transaction.metadata.notes && (
                            <Text style={styles.metadataNote}>
                                {transaction.metadata.notes}
                            </Text>
                        )}
                    </View>
                )}

                {/* PROCESSED BY */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Processed by: {transaction.processedBy}
                    </Text>
                    <Text style={styles.footerText}>
                        {formatDate(transaction.createdAt)}
                    </Text>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F7FA',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F44336',
        marginTop: 16,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },

    // Amount Header
    amountHeader: {
        alignItems: 'center',
        padding: 32,
    },
    amountLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 12,
    },
    amountValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    statusBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // Sections
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },

    // Info Rows
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F7FA',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 2,
        textAlign: 'right',
    },
    monoText: {
        fontFamily: 'monospace',
        fontSize: 12,
    },

    // Breakdown
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#666',
    },
    breakdownValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    breakdownLabelBold: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    breakdownValueBold: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    feeText: {
        color: '#F44336',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },

    // Status Pill
    statusPill: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // Order Card
    orderCard: {
        backgroundColor: '#F5F7FA',
        padding: 16,
        borderRadius: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    orderRef: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    orderInfo: {
        marginBottom: 16,
    },
    orderInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    orderInfoLabel: {
        fontSize: 14,
        color: '#666',
    },
    orderInfoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    earningsText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },

    // Route Info
    routeInfo: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 16,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    routeText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
        marginVertical: 4,
    },

    // Metadata
    metadataText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 22,
    },
    metadataNote: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
    },

    // Footer
    footer: {
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
});

export default EarningDetails;