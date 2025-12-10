// components/Client/Finance/TopUpModal.jsx
import React, {useState, useMemo, useRef, useEffect} from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import {
    X,
    Wallet,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Info,
    Percent,
    Receipt,
    Shield
} from 'lucide-react-native';
import {usePaystack} from 'react-native-paystack-webview';
import ClientUtils from '../../../utils/ClientUtilities';
import {invalidateClientFinanceQueries} from '../../../lib/queryUtils';
import StatusModal from '../../../components/StatusModal/StatusModal';
import { toast } from "sonner-native";

// PayStack fee calculation

const calculatePaystackFees = (amount) => {
    if (!amount || amount <= 0) return null;

    const PRICING_CONFIG = {
        paymentProcessing: {
            decimalFee: 0.015,      // 1.5%
            flatFee: 100,           // ₦100
            feeCap: 2000,           // ₦2,000 maximum
            flatFeeThreshold: 2500, // ₦100 fee waived under ₦2,500
            currency: 'NGN'
        }
    };

    const {decimalFee, flatFee, feeCap, flatFeeThreshold} = PRICING_CONFIG.paymentProcessing;

    // Convert amount to number - this is what user wants in wallet
    const walletAmount = parseFloat(amount);

    // Determine if flat fee applies (based on what USER PAYS, not wallet amount)
    // We need to estimate first, then refine

    // Initial estimate for flat fee check
    const initialEstimate = walletAmount * 1.015; // Simple 1.5% estimate
    const hasFlatFee = initialEstimate >= flatFeeThreshold;
    const effectiveFlatFee = hasFlatFee ? flatFee : 0;

    // ============================================
    // CORRECT CALCULATION (PayStack's actual formula)
    // ============================================

    // We need to calculate what user should pay to get EXACT wallet amount
    // Formula: walletAmount = userPays - fee
    // Where fee = ceil(userPays × 1.5%) + flatFee

    let userPays;
    if (hasFlatFee) {
        // For amounts with flat fee: userPays = (walletAmount + 100) / 0.985
        userPays = (walletAmount + effectiveFlatFee) / (1 - decimalFee);
    } else {
        // For amounts without flat fee: userPays = walletAmount / 0.985
        userPays = walletAmount / (1 - decimalFee);
    }

    // PayStack ROUNDS UP the percentage fee to nearest kobo
    let percentageFee = Math.ceil(userPays * decimalFee * 100) / 100;

    // Add flat fee
    let totalFee = percentageFee + effectiveFlatFee;

    // Apply fee cap
    if (totalFee > feeCap) {
        totalFee = feeCap;
        userPays = walletAmount + feeCap;
    }

    // Recalculate with capped fee if needed
    if (totalFee === feeCap) {
        percentageFee = Math.ceil(userPays * decimalFee * 100) / 100;
        totalFee = percentageFee + (hasFlatFee ? flatFee : 0);
        if (totalFee > feeCap) totalFee = feeCap;
    }

    // Round user pays UP to nearest kobo
    userPays = Math.ceil(userPays * 100) / 100;

    // Recalculate final fee with rounded userPays
    percentageFee = Math.ceil(userPays * decimalFee * 100) / 100;
    totalFee = percentageFee + effectiveFlatFee;
    if (totalFee > feeCap) totalFee = feeCap;

    // Verify the math
    const walletReceives = userPays - totalFee;
    const discrepancy = Math.abs(walletReceives - walletAmount);

    // If discrepancy > 1 kobo, adjust
    if (discrepancy > 0.01) {
        userPays += discrepancy;
        userPays = Math.ceil(userPays * 100) / 100;
        percentageFee = Math.ceil(userPays * decimalFee * 100) / 100;
        totalFee = percentageFee + effectiveFlatFee;
        if (totalFee > feeCap) totalFee = feeCap;
    }

    // ============================================
    // Return in SAME FORMAT as before
    // ============================================

    // Fee breakdown description (keeping your exact format)
    let feeDescription = '';
    if (effectiveFlatFee > 0) {
        feeDescription = `${(decimalFee * 100)}% + ₦${effectiveFlatFee}`;
    } else {
        feeDescription = `${(decimalFee * 100)}% (flat fee waived under ₦${flatFeeThreshold})`;
    }

    return {
        // Keeping all the same property names
        amount: walletAmount,
        processingFee: Math.ceil(totalFee * 100) / 100, // Keep as number with decimals
        totalAmount: Math.ceil(userPays), // This is what shows in your UI: "Pay ${formatCurrency(feeCalculation?.totalAmount)}"
        walletReceives: Math.ceil(walletReceives), // This should equal walletAmount

        // Additional accurate fields (you can use these for debugging)
        _accurate: {
            userPaysExact: userPays, // Exact amount user should pay
            feeExact: totalFee, // Exact fee
            walletReceivesExact: walletReceives, // Should equal walletAmount
            discrepancy: Math.abs(walletReceives - walletAmount),
            matchesPayStack: Math.abs(walletReceives - walletAmount) < 0.01
        },

        breakdown: {
            description: `Processing fee (${feeDescription})`,
            percentage: `${(decimalFee * 100)}%`,
            flatFee: effectiveFlatFee,
            feeCap: totalFee >= feeCap ? `Capped at ₦${feeCap}` : null,
            // Add note about rounding
            roundingNote: 'Fees rounded UP to nearest kobo (₦0.01)'
        }
    };
};


function TopUpModal({
                        visible,
                        onClose,
                        onSuccess,
                        userData,
                        currentBalance
                    }) {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [paymentReference, setPaymentReference] = useState(null);
    const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
    const [statusModal, setStatusModal] = useState({
        visible: false,
        status: 'loading',
        message: '',
    });

    const paystackHook = usePaystack();
    const popup = paystackHook?.popup;
    const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

    const feeCalculation = useMemo(() => {
        if (!amount || parseFloat(amount) <= 0) return null;
        return calculatePaystackFees(amount);
    }, [amount]);

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '₦0.00';
        const numValue = parseFloat(value);
        return `₦${numValue.toLocaleString('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`;
    };

    const handleAmountChange = (text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        setAmount(numericValue);
        setError('');
        setShowBreakdown(false);
    };

    const handleQuickAmount = (value) => {
        setAmount(value.toString());
        setError('');
        setShowBreakdown(false);
    };

    const validateAmount = () => {
        const numAmount = parseFloat(amount);

        if (!amount || numAmount <= 0) {
            setError('Please enter an amount');
            return false;
        }

        if (numAmount < 100) {
            setError('Minimum top-up amount is ₦100');
            return false;
        }

        if (numAmount > 1000000) {
            setError('Maximum top-up amount is ₦1,000,000');
            return false;
        }

        return true;
    };

    const handleShowBreakdown = () => {
        if (validateAmount()) {
            setShowBreakdown(!showBreakdown);
        }
    };



    // ✅ Manual verification (retry)
    const handleManualCheck = async () => {
        if (!paymentReference) return;

        setStatusModal({
            visible: true,
            status: 'loading',
            message: 'Checking payment status...',
        });

        try {
            const result = await ClientUtils.checkPendingTopUp(paymentReference);

            if (result.success && result.status === 'completed') {
                await invalidateClientFinanceQueries();

                setStatusModal({
                    visible: true,
                    status: 'success',
                    message: `Confirmed! ₦${result.wallet?.credited || 0} added to wallet.`,
                    autoClose: true,
                    autoCloseDelay: 2000,
                });
            } else if (result.status === 'pending') {
                setStatusModal({
                    visible: true,
                    status: 'loading',
                    message: 'Payment still processing.\n\nPlease wait a moment and try again.',
                    showRetryOnError: true,
                });
            } else {
                setStatusModal({
                    visible: true,
                    status: 'error',
                    message: result.error || 'Payment not confirmed.\n\nCheck transaction history for details.',
                    showRetryOnError: false,
                });
            }
        } catch (err) {
            console.log('❌ Manual check error:', err);
            setStatusModal({
                visible: true,
                status: 'error',
                message: 'Unable to check payment status.\n\nPlease contact support if charged.',
                showRetryOnError: false,
            });
        }
    };

    const handleInitiatePayment = async () => {
        if (isPaymentInProgress) {
            toast.info('⚠️ Payment already in progress, ignoring duplicate press')
            return;
        }
        if (!validateAmount()) return;

       try {
           setIsPaymentInProgress(true);
           setError('');

            // Show breakdown first if not showing
            if (!showBreakdown) {
                setShowBreakdown(true);
                return;
            }

            const numAmount = parseFloat(amount);
            const response = await ClientUtils.generateTopUpReference(numAmount);

            if (!response.success) {
                toast.info('Gateway error: Try again');
                setError(response.error || 'Failed to generate payment reference');
                return;
            }

            console.log('✅ Reference generated:', response.reference);
            setPaymentReference(response.reference);

            if (!popup?.checkout) {
                toast.error('Gateway error: Try again');
                setError('Paystack not initialized. Please restart the app.');
                return;
            }

            console.log('🚀 Opening Paystack...');

            popup.checkout({
                email: response.clientInfo.email,
                amount: response.amounts.totalAmount,
                reference: response.reference,
                metadata: {
                    type: 'wallet_topup',
                    clientId: userData.id,
                    walletAmount: response.amounts.walletAmount,
                    custom_fields: [
                        {
                            display_name: "Customer Name",
                            variable_name: "customer_name",
                            value: response.clientInfo.email
                        },
                        {
                            display_name: "Transaction ID",
                            variable_name: "transaction_id",
                            value: response.transactionId
                        }
                    ]
                },
                onSuccess: (res) => {
                    console.log('✅ Paystack Success:', res);
                    onClose();
                    handleVerifyPayment(response.reference);
                },
                onCancel: () => {
                    console.log('❌ Paystack Cancelled');
                    setIsPaymentInProgress(false);
                    onClose();
                    handleCancel(response.reference)
                },
                onError: (err) => {
                    console.log('❌ Paystack Error:', err);
                    setPaymentReference(null);
                    toast.error('Payment failed');
                    setError('Payment failed');
                    setIsPaymentInProgress(false);
                }
            });

            console.log('✅ Paystack checkout called');

        } catch (err) {
            console.log('❌ Initiate payment error:', err);
            setError('Failed to initiate payment');
            setIsPaymentInProgress(false); // ✅ Reset on error
        }
    };

    const resetModal = () => {
        setAmount('');
        setError('');
        setShowBreakdown(false);
        setPaymentReference(null);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleStatusModalClose = () => {
        setStatusModal({ visible: false, status: 'loading', message: '' });

        if (statusModal.status === 'success') {
            // Success: Fully reset and refresh parent
            setIsPaymentInProgress(false);
            setPaymentReference(null);
            setAmount('');
            setShowBreakdown(false);
            onSuccess(); // Refresh TopUpTab
        } else {
            setIsPaymentInProgress(false);
        }
    };

    const renderPaymentBreakdown = () => {
        if (!feeCalculation || !showBreakdown) return null;

        return (
            <View style={styles.breakdownContainer}>
                <View style={styles.breakdownHeader}>
                    <Receipt size={20} color="#3b82f6" />
                    <Text style={styles.breakdownTitle}>Payment Summary</Text>
                </View>

                <View style={styles.breakdownGrid}>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Wallet Balance Increase</Text>
                        <Text style={styles.breakdownValueGreen}>
                            +{formatCurrency(feeCalculation.walletReceives)}
                        </Text>
                    </View>

                    <View style={styles.breakdownItem}>
                        <View style={styles.breakdownLabelRow}>
                            <Text style={styles.breakdownLabel}>Processing Fee</Text>
                            <Info size={14} color="#6b7280" />
                        </View>
                        <Text style={styles.breakdownValueRed}>
                            {formatCurrency(feeCalculation.processingFee)}
                        </Text>
                    </View>

                    <View style={styles.breakdownDivider} />

                    <View style={styles.breakdownTotal}>
                        <Text style={styles.breakdownTotalLabel}>Total Amount to Pay</Text>
                        <Text style={styles.breakdownTotalValue}>
                            {formatCurrency(feeCalculation.totalAmount)}
                        </Text>
                    </View>

                    <View style={styles.feeDetails}>
                        <Text style={styles.feeDetailsTitle}>Fee Details:</Text>
                        <Text style={styles.feeDetailsText}>
                            • {feeCalculation.breakdown.description}
                        </Text>
                        {feeCalculation.breakdown.feeCap && (
                            <Text style={styles.feeDetailsText}>
                                • {feeCalculation.breakdown.feeCap}
                            </Text>
                        )}
                        <Text style={styles.feeDetailsNote}>
                            Fee goes to payment processor (PayStack)
                        </Text>
                    </View>
                </View>

                <View style={styles.securityInfo}>
                    <Shield size={16} color="#10b981" />
                    <Text style={styles.securityText}>
                        Secured by PayStack's bank-level encryption
                    </Text>
                </View>
            </View>
        );
    };

    // ✅ Automatic verification after Paystack
    const handleVerifyPayment = async (reference) => {
        setIsPaymentInProgress(false)
        setStatusModal({
            visible: true,
            status: 'loading',
            message: 'Verifying payment...\n\nPlease wait.',
        });

        try {
            // Give backend a moment to process webhook (5 seconds)
            await new Promise(resolve => setTimeout(resolve, 3000));

            const result = await ClientUtils.verifyTopUpPayment(reference);

            if (result.success) {
                await invalidateClientFinanceQueries();

                setStatusModal({
                    visible: true,
                    status: 'success',
                    message: `Success! ₦${result.wallet?.credited || 0} added to wallet.`,
                    autoClose: true,
                    autoCloseDelay: 2000,
                });
            } else {
                await invalidateClientFinanceQueries();
                throw new Error(result.error || 'Verification failed');
            }
        } catch (err) {
            console.log('❌ Verification error:', err);
            setStatusModal({
                visible: true,
                status: 'error',
                message: 'Unable to verify payment automatically.\n\nPlease check manual verification.',
                showRetryOnError: true,
            });
            await invalidateClientFinanceQueries();
        }
    };

    const handleCancel = async (reference) => {
        setIsPaymentInProgress(false)
        setStatusModal({
            visible: true,
            status: 'loading',
            message: 'Verifying payment...\n\nPlease wait.',
        });

        try {
            // Give backend a moment to process webhook (5 seconds)
            await new Promise(resolve => setTimeout(resolve, 3000));

            const result = await ClientUtils.verifyTopUpPayment(reference);

            if (result.success) {
                await invalidateClientFinanceQueries();

                setStatusModal({
                    visible: true,
                    status: 'success',
                    message: `Success! ₦${result.wallet?.credited || 0} added to wallet.`,
                    autoClose: true,
                    autoCloseDelay: 2000,
                });
            } else if (result.code === 'PAYSTACK_API_ERROR') {
                setStatusModal({
                    visible: true,
                    status: 'error',
                    message: `${result.message}`,
                    showRetryOnError: false,
                });
                await invalidateClientFinanceQueries();
            } else {
                setStatusModal({
                    visible: true,
                    status: 'error',
                    message: `${result.message}`,
                    showRetryOnError: false,
                });
                await invalidateClientFinanceQueries();
            }
        } catch (err) {
            console.log('❌ Verification error:', err);
            setStatusModal({
                visible: true,
                status: 'error',
                message: 'Unable to verify payment automatically.\n\nPlease check manual verification.',
                showRetryOnError: true,
            });
            await invalidateClientFinanceQueries();
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleSection}>
                                <View style={styles.modalIconContainer}>
                                    <Wallet size={24} color="#3b82f6" />
                                </View>
                                <View>
                                    <Text style={styles.modalTitle}>Top Up Wallet</Text>
                                    <Text style={styles.modalSubtitle}>Add funds instantly</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.modalCloseButton}
                            >
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Current Balance */}
                            <View style={styles.balanceSection}>
                                <Text style={styles.balanceLabel}>Current Balance</Text>
                                <Text style={styles.balanceValue}>{formatCurrency(currentBalance)}</Text>
                            </View>

                            {/* Amount Input */}
                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>Enter Amount</Text>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.currencySymbol}>₦</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        placeholder="0"
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="numeric"
                                    />
                                </View>
                                {amount && parseFloat(amount) > 0 && (
                                    <Text style={styles.inputHint}>
                                        You'll add {formatCurrency(parseFloat(amount))} to your wallet
                                    </Text>
                                )}
                            </View>

                            {/* Quick Amounts */}
                            <View style={styles.quickAmountsSection}>
                                <Text style={styles.quickAmountsLabel}>Quick Amounts</Text>
                                <View style={styles.quickAmountsGrid}>
                                    {quickAmounts.map((value) => (
                                        <TouchableOpacity
                                            key={value}
                                            onPress={() => handleQuickAmount(value)}
                                            style={[
                                                styles.quickAmountButton,
                                                amount === value.toString() && styles.quickAmountButtonActive
                                            ]}
                                        >
                                            <Text style={[
                                                styles.quickAmountText,
                                                amount === value.toString() && styles.quickAmountTextActive
                                            ]}>
                                                {formatCurrency(value)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Show Breakdown Button */}
                            {amount && parseFloat(amount) >= 100 && !showBreakdown && (
                                <TouchableOpacity
                                    onPress={handleShowBreakdown}
                                    style={styles.showBreakdownButton}
                                >
                                    <Percent size={16} color="#3b82f6" />
                                    <Text style={styles.showBreakdownText}>Show Payment Breakdown</Text>
                                </TouchableOpacity>
                            )}

                            {/* Payment Breakdown */}
                            {renderPaymentBreakdown()}

                            {/* Error Message */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <AlertCircle size={20} color="#ef4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {/* Info Section */}
                            <View style={styles.infoSection}>
                                <View style={styles.infoItem}>
                                    <CheckCircle size={16} color="#10b981" />
                                    <Text style={styles.infoItemText}>Instant credit to wallet</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <CheckCircle size={16} color="#10b981" />
                                    <Text style={styles.infoItemText}>Secure payment via Paystack</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <CheckCircle size={16} color="#10b981" />
                                    <Text style={styles.infoItemText}>Use for any order</Text>
                                </View>
                            </View>

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                onPress={showBreakdown ? handleInitiatePayment : handleShowBreakdown}
                                disabled={!amount || parseFloat(amount) < 100 || isPaymentInProgress} // ✅ Add flag here
                                style={[
                                    styles.actionButton,
                                    (!amount || parseFloat(amount) < 100 || isPaymentInProgress) && styles.actionButtonDisabled
                                ]}
                            >
                                {isPaymentInProgress ? (
                                    <ActivityIndicator size="small" color="#ffffff" /> // ✅ Show spinner when processing
                                ) : (
                                    <CreditCard size={20} color="#ffffff" />
                                )}
                                <Text style={styles.actionButtonText}>
                                    {showBreakdown
                                        ? isPaymentInProgress
                                            ? 'Processing...' // ✅ Change text when processing
                                            : `Pay ${formatCurrency(feeCalculation?.totalAmount || amount)}`
                                        : 'Continue to Payment'
                                    }
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ StatusModal - Only for post-payment verification */}
            <StatusModal
                visible={statusModal.visible}
                status={statusModal.status}
                message={statusModal.message}
                onFinish={handleStatusModalClose}
                onRetry={statusModal.showRetryOnError ? handleManualCheck : null}
                onClose={handleStatusModalClose}
                showRetryOnError={statusModal.showRetryOnError}
                autoClose={statusModal.autoClose}
                autoCloseDelay={statusModal.autoCloseDelay}
            />
        </>
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
    modalTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    modalCloseButton: {
        padding: 8,
    },
    modalScroll: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },

    // Balance Section
    balanceSection: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    balanceLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },

    // Input Section
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '600',
        color: '#6b7280',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    inputHint: {
        fontSize: 13,
        color: '#10b981',
        marginTop: 8,
    },

    // Quick Amounts
    quickAmountsSection: {
        marginBottom: 16,
    },
    quickAmountsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    quickAmountsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickAmountButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    quickAmountButtonActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
    },
    quickAmountButtonDisabled: {
        opacity: 0.5,
    },
    quickAmountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    quickAmountTextActive: {
        color: '#3b82f6',
    },

    // Show Breakdown Button
    showBreakdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginBottom: 20,
    },
    showBreakdownText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },

    // Payment Breakdown
    breakdownContainer: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    breakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    breakdownTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    breakdownGrid: {
        gap: 12,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    breakdownLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    breakdownValueGreen: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10b981',
    },
    breakdownValueRed: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 8,
    },
    breakdownTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    breakdownTotalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    breakdownTotalValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3b82f6',
    },
    feeDetails: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    feeDetailsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    feeDetailsText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    feeDetailsNote: {
        fontSize: 11,
        color: '#9ca3af',
        fontStyle: 'italic',
        marginTop: 4,
    },
    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    securityText: {
        fontSize: 13,
        color: '#065f46',
        flex: 1,
    },

    // Error Container
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#991b1b',
    },

    // Info Container
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbeafe',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1e40af',
    },

    // Info Section
    infoSection: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoItemText: {
        fontSize: 14,
        color: '#374151',
    },

    // Footer
    modalFooter: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
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
        backgroundColor: '#10b981',
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },







    referenceContainer: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    referenceLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    referenceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3b82f6',
        marginBottom: 4,
    },
    referenceHint: {
        fontSize: 12,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    retryButton: {
        backgroundColor: '#f59e0b',
    },
});

export default TopUpModal;