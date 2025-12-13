// components/Client/Profile/Analytics/PaymentDetails.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import CustomHeader from '../../../CustomHeader';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function PaymentDetails({ data, refetch }) {
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

    const transaction = data;
    const isDeposit = transaction?.transactionType === 'wallet_deposit';
    const isPayment = transaction?.transactionType === 'client_payment';

    return (
        <>
            <CustomHeader title="Transaction Details" onBackPress={() => router.back()} />

            <ScrollView style={styles.scrollView}>
                {/* AMOUNT HEADER */}
                <View style={[styles.amountHeader, {
                    backgroundColor: isDeposit ? '#4CAF50' : '#2196F3'
                }]}>
                    <Ionicons
                        name={isDeposit ? "arrow-down-circle" : "arrow-up-circle"}
                        size={48}
                        color="#fff"
                    />
                    <Text style={styles.amountLabel}>
                        {isDeposit ? 'Wallet Top-up' : 'Order Payment'}
                    </Text>
                    <Text style={styles.amountValue}>
                        {isDeposit ? '+' : '-'}{formatCurrency(transaction.amount.gross)}
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
                            {isDeposit ? 'Wallet Deposit' : 'Order Payment'}
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

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Payment Method</Text>
                        <View style={styles.paymentMethodBadge}>
                            <Ionicons
                                name={transaction.gateway?.provider === 'wallet' ? 'wallet' : 'card'}
                                size={14}
                                color="#2196F3"
                            />
                            <Text style={styles.paymentMethodText}>
                                {transaction.gateway?.provider?.toUpperCase() || 'WALLET'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* AMOUNT BREAKDOWN */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Amount Breakdown</Text>

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>
                            {isDeposit ? 'Deposit Amount' : 'Order Total'}
                        </Text>
                        <Text style={styles.breakdownValue}>
                            {formatCurrency(transaction.amount.net)}
                        </Text>
                    </View>

                    {transaction.amount.fees > 0 && (
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Processing Fee</Text>
                            <Text style={[styles.breakdownValue, styles.feeText]}>
                                +{formatCurrency(transaction.amount.fees)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabelBold}>Total Charged</Text>
                        <Text style={styles.breakdownValueBold}>
                            {formatCurrency(transaction.amount.gross)}
                        </Text>
                    </View>
                </View>

                {/* WALLET USAGE */}
                {transaction.wallet && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Wallet Usage</Text>

                        <View style={styles.walletUsageCard}>
                            {transaction.wallet.used ? (
                                <>
                                    <View style={styles.walletUsedIcon}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                    </View>
                                    <View style={styles.walletUsageInfo}>
                                        <Text style={styles.walletUsageText}>
                                            Wallet was used for this transaction
                                        </Text>
                                        <Text style={styles.walletUsageAmount}>
                                            Amount: {formatCurrency(transaction.wallet.amount)}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.walletNotUsedIcon}>
                                        <Ionicons name="close-circle" size={24} color="#999" />
                                    </View>
                                    <Text style={styles.walletUsageText}>
                                        Wallet was not used for this transaction
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* GATEWAY DETAILS */}
                {transaction.gateway && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Gateway Details</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Provider</Text>
                            <Text style={styles.infoValue}>
                                {transaction.gateway.provider?.toUpperCase()}
                            </Text>
                        </View>

                        {transaction.gateway.reference && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Reference</Text>
                                <Text style={[styles.infoValue, styles.monoText]}>
                                    {transaction.gateway.reference}
                                </Text>
                            </View>
                        )}

                        {transaction.gateway.metadata?.paystackTransactionId && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Gateway Transaction ID</Text>
                                <Text style={[styles.infoValue, styles.monoText]}>
                                    {transaction.gateway.metadata.paystackTransactionId}
                                </Text>
                            </View>
                        )}

                        {transaction.gateway.metadata?.channel && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Payment Channel</Text>
                                <Text style={styles.infoValue}>
                                    {transaction.gateway.metadata.channel.toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ORDER DETAILS (for payments) */}
                {isPayment && transaction.orderId && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Details</Text>

                        <View style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <MaterialCommunityIcons name="package-variant" size={24} color="#2196F3" />
                                <Text style={styles.orderRef}>
                                    {transaction.orderId.orderRef}
                                </Text>
                                {transaction.orderId.status && (
                                    <View style={styles.orderStatusBadge}>
                                        <Text style={styles.orderStatusText}>
                                            {transaction.orderId.status.toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {transaction.orderId.pricing && (
                                <View style={styles.orderPricing}>
                                    <View style={styles.pricingRow}>
                                        <Text style={styles.pricingLabel}>Delivery Fee</Text>
                                        <Text style={styles.pricingValue}>
                                            {formatCurrency(transaction.orderId.pricing.basePrice)}
                                        </Text>
                                    </View>
                                    {transaction.orderId.pricing.distanceCharge > 0 && (
                                        <View style={styles.pricingRow}>
                                            <Text style={styles.pricingLabel}>Distance Charge</Text>
                                            <Text style={styles.pricingValue}>
                                                {formatCurrency(transaction.orderId.pricing.distanceCharge)}
                                            </Text>
                                        </View>
                                    )}
                                    {transaction.orderId.pricing.platformFee > 0 && (
                                        <View style={styles.pricingRow}>
                                            <Text style={styles.pricingLabel}>Platform Fee</Text>
                                            <Text style={styles.pricingValue}>
                                                {formatCurrency(transaction.orderId.pricing.platformFee)}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.pricingDivider} />
                                    <View style={styles.pricingRow}>
                                        <Text style={styles.pricingLabelBold}>Total</Text>
                                        <Text style={styles.pricingValueBold}>
                                            {formatCurrency(transaction.orderId.pricing.totalAmount)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* METADATA */}
                {transaction.metadata && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Information</Text>

                        {transaction.metadata.description && (
                            <View style={styles.metadataItem}>
                                <Ionicons name="information-circle" size={20} color="#2196F3" />
                                <Text style={styles.metadataText}>
                                    {transaction.metadata.description}
                                </Text>
                            </View>
                        )}

                        {transaction.metadata.channel && (
                            <View style={styles.metadataItem}>
                                <Ionicons name="phone-portrait" size={20} color="#2196F3" />
                                <Text style={styles.metadataText}>
                                    Initiated via {transaction.metadata.channel}
                                </Text>
                            </View>
                        )}

                        {transaction.metadata.notes && (
                            <View style={styles.metadataItem}>
                                <Ionicons name="document-text" size={20} color="#999" />
                                <Text style={styles.metadataNote}>
                                    {transaction.metadata.notes}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* RECEIPT INFO */}
                <View style={styles.receiptSection}>
                    <View style={styles.receiptHeader}>
                        <Ionicons name="receipt-outline" size={24} color="#666" />
                        <Text style={styles.receiptTitle}>Transaction Receipt</Text>
                    </View>

                    <View style={styles.receiptDetails}>
                        <Text style={styles.receiptText}>
                            This is an official receipt for your transaction.
                        </Text>
                        <Text style={styles.receiptText}>
                            Transaction ID: {transaction._id}
                        </Text>
                        <Text style={styles.receiptText}>
                            Processed by: {transaction.processedBy}
                        </Text>
                        <Text style={styles.receiptText}>
                            Date: {formatDate(transaction.createdAt)}
                        </Text>
                    </View>
                </View>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Need help with this transaction?
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Contact our support team for assistance
                    </Text>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },

    // Amount Header
    amountHeader: {
        alignItems: 'center',
        padding: 32,
    },
    amountLabel: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 12,
    },
    amountValue: {
        fontSize: 36,
        fontFamily: 'PoppinsSemiBold',
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
        fontFamily: 'PoppinsSemiBold',
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
        fontFamily: 'PoppinsSemiBold',
        color: '#333',
        marginBottom: 16,
    },

    // Info Rows
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F7FA',
    },
    infoLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#666',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#333',
        fontWeight: '500',
        flex: 2,
        textAlign: 'right',
    },
    monoText: {
                fontFamily: 'PoppinsRegular',
        fontSize: 12,
    },
    paymentMethodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    paymentMethodText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#2196F3',
    },

    // Breakdown
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    breakdownLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#666',
    },
    breakdownValue: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'PoppinsRegular',
        fontWeight: '500',
    },
    breakdownLabelBold: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#333',
    },
    breakdownValueBold: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    feeText: {
        color: '#F44336',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },

    // Wallet Usage
    walletUsageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        gap: 12,
    },
    walletUsedIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    walletNotUsedIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    walletUsageInfo: {
        flex: 1,
    },
    walletUsageText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#333',
        marginBottom: 4,
    },
    walletUsageAmount: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        fontWeight: 'bold',
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
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    orderStatusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    orderStatusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4CAF50',
    },
    orderPricing: {
        gap: 8,
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pricingLabel: {
        fontSize: 13,
        color: '#666',
    },
    pricingValue: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    pricingDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 8,
    },
    pricingLabelBold: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    pricingValueBold: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2196F3',
    },

    // Metadata
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 8,
    },
    metadataText: {
        flex: 1,
        fontFamily: 'PoppinsMedium',
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    metadataNote: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#666',
        fontStyle: 'italic',
        lineHeight: 18,
    },

    // Receipt Section
    receiptSection: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    receiptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    receiptTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#333',
    },
    receiptDetails: {
        gap: 6,
    },
    receiptText: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#666',
        lineHeight: 18,
    },

    // Footer
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#666',
        fontWeight: '500',
    },
    footerSubtext: {
        fontSize: 12,
        color: '#999',
        fontFamily: 'PoppinsMedium',
        marginTop: 4,
    },
});

export default PaymentDetails;