import React, {useState, forwardRef, useImperativeHandle, useEffect, useMemo} from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useOrderStore} from "../../../store/useOrderStore";
import useMediaStore from "../../../store/useMediaStore";
import ClientUtils from "../../../utils/ClientUtilities";
import StatusModal from "../../StatusModal/StatusModal";
import {useRouter} from "expo-router";
import {queryClient} from "../../../lib/queryClient";
import { toast } from "sonner-native";

const Payment = forwardRef(({defaultValues, onSubmit, isProcessing = false}, ref) => {
    const router = useRouter();
    const orderData = useOrderStore((state) => state.orderData);
    const {clearDraft} = useOrderStore();
    const {resetMedia} = useMediaStore();

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // StatusModal states for wallet payment
    const [walletModalVisible, setWalletModalVisible] = useState(false);
    const [walletModalStatus, setWalletModalStatus] = useState('loading');
    const [walletModalMessage, setWalletModalMessage] = useState('Processing payment...');

    // Extract wallet balance from orderData metadata
    const walletBalance = orderData?.metadata?.walletBalance || 0;
    const totalAmount = orderData?.pricing?.totalAmount || 0;

    // Calculate payment options
    const paymentOptions = useMemo(() => {
        if (walletBalance === 0) {
            return {
                hasWallet: false,
                walletCoversAll: false,
                walletAmount: 0,
                cardAmount: totalAmount,
                showWalletSection: false
            };
        }

        const walletCoversAll = walletBalance >= totalAmount;
        const walletAmount = walletCoversAll ? totalAmount : walletBalance;
        const cardAmount = walletCoversAll ? 0 : totalAmount - walletBalance;

        return {
            hasWallet: true,
            walletCoversAll,
            walletAmount,
            cardAmount,
            showWalletSection: true
        };
    }, [walletBalance, totalAmount]);

    // Auto-select payment method on mount
    useEffect(() => {
        if (paymentOptions.walletCoversAll) {
            setSelectedPaymentMethod('wallet_only');
        } else if (paymentOptions.hasWallet) {
            setSelectedPaymentMethod('wallet_card');
        } else {
            setSelectedPaymentMethod('card_only');
        }
    }, [paymentOptions]);

    // Expose validation function to parent
    useImperativeHandle(ref, () => ({
        submit: async () => {
            if (!totalAmount || totalAmount <= 0) {
                return {
                    valid: false,
                    error: 'Invalid order amount'
                };
            }

            if (!selectedPaymentMethod) {
                return {
                    valid: false,
                    error: 'Please select a payment method'
                };
            }

            return {
                valid: true,
                data: {
                    payment: {
                        method: selectedPaymentMethod,
                        status: 'pending',
                        walletAmount: selectedPaymentMethod === 'card_only' ? 0 : paymentOptions.walletAmount,
                        cardAmount: selectedPaymentMethod === 'wallet_only' ? 0 : paymentOptions.cardAmount
                    }
                }
            };
        }
    }));

    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return '₦0';
        return `₦${amount.toLocaleString('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    };

    // Handle wallet-only payment - Complete and clean
    const handleWalletOnlyPayment = async () => {
        if (isProcessing || isSubmitting) return;

        setIsSubmitting(true);
        setWalletModalVisible(true);
        setWalletModalStatus('loading');
        setWalletModalMessage('Processing payment from wallet...');

        try {
            // Call wallet-only payment endpoint
            const response = await ClientUtils.processWalletPayment({
                orderId: orderData._id,
                amount: totalAmount
            });

            if (response.success) {

                // Invalidate order queries to refresh data
                await queryClient.invalidateQueries({ queryKey: ["GetAllClientOrder"] });

                // Show success
                setWalletModalStatus('success');
                setWalletModalMessage('Payment successful! Order completed.');

                // Auto-close after 1.5s and navigate
                setTimeout(() => {
                    setWalletModalVisible(false);
                    clearDraft();
                    resetMedia();
                    router.replace('/(protected)/client/orders');
                }, 1500);
            }
        } catch (error) {
            console.log('Wallet payment failed:', error);
            toast.error(error.message || 'Payment failed. Please try again.');
            setWalletModalStatus('error');
            setWalletModalMessage(error.message || 'Payment failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentSubmit = async () => {
        if (isProcessing || isSubmitting) return;

        // If wallet covers everything, use special handler
        if (selectedPaymentMethod === 'wallet_only') {
            await handleWalletOnlyPayment();
            return;
        }

        // Otherwise, proceed with card or hybrid payment (Paystack flow)
        setIsSubmitting(true);
        try {
            // Pass the selected payment method to parent
            await onSubmit(selectedPaymentMethod);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getButtonText = () => {
        if (isProcessing || isSubmitting) return 'Processing...';

        switch (selectedPaymentMethod) {
            case 'wallet_only':
                return `Pay ${formatCurrency(totalAmount)} from Wallet`;
            case 'wallet_card':
                return `Pay ${formatCurrency(paymentOptions.cardAmount)} with Card`;
            case 'card_only':
                return `Pay ${formatCurrency(totalAmount)}`;
            default:
                return 'Continue to Payment';
        }
    };

    const isButtonDisabled = isProcessing || isSubmitting;

    return (
        <>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Order Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Order Payment</Text>

                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Order Reference</Text>
                            <Text style={styles.summaryValue}>{orderData?.orderRef}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Service Type</Text>
                            <Text style={styles.summaryValue}>Delivery Service</Text>
                        </View>

                        <View style={styles.totalDivider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>
                                {formatCurrency(totalAmount)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Wallet Balance Display (if has wallet) */}
                {paymentOptions.showWalletSection && (
                    <View style={styles.walletSection}>
                        <Text style={styles.sectionTitle}>💰 Your Wallet</Text>

                        <View style={styles.walletCard}>
                            <View style={styles.walletRow}>
                                <Text style={styles.walletLabel}>Available Balance</Text>
                                <Text style={[
                                    styles.walletBalance,
                                    paymentOptions.walletCoversAll && styles.walletBalanceFull
                                ]}>
                                    {formatCurrency(walletBalance)}
                                </Text>
                            </View>

                            {paymentOptions.walletCoversAll && (
                                <View style={styles.walletNotice}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <Text style={styles.walletNoticeText}>
                                        Your wallet can cover this entire order!
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Payment Method Selection */}
                <View style={styles.paymentMethodSection}>
                    <Text style={styles.sectionTitle}>Payment Options</Text>

                    <View style={styles.paymentMethodCard}>
                        {/* Wallet Only Option (if balance covers all) */}
                        {paymentOptions.walletCoversAll && (
                            <Pressable
                                style={[
                                    styles.paymentMethodOption,
                                    selectedPaymentMethod === 'wallet_only' && styles.selectedPaymentMethod
                                ]}
                                onPress={() => setSelectedPaymentMethod('wallet_only')}
                            >
                                <View style={styles.paymentMethodLeft}>
                                    <View style={[
                                        styles.radioButton,
                                        selectedPaymentMethod === 'wallet_only' && styles.radioButtonSelected
                                    ]}>
                                        {selectedPaymentMethod === 'wallet_only' && (
                                            <View style={styles.radioButtonInner} />
                                        )}
                                    </View>
                                    <View style={styles.paymentMethodInfo}>
                                        <Text style={styles.paymentMethodTitle}>Pay from Wallet</Text>
                                        <Text style={styles.paymentMethodSubtitle}>
                                            Use {formatCurrency(totalAmount)} from your wallet
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="wallet" size={24} color="#10B981" />
                            </Pressable>
                        )}

                        {/* Wallet + Card Option (if partial balance) */}
                        {paymentOptions.hasWallet && !paymentOptions.walletCoversAll && (
                            <>
                                <Pressable
                                    style={[
                                        styles.paymentMethodOption,
                                        selectedPaymentMethod === 'wallet_card' && styles.selectedPaymentMethod
                                    ]}
                                    onPress={() => setSelectedPaymentMethod('wallet_card')}
                                >
                                    <View style={styles.paymentMethodLeft}>
                                        <View style={[
                                            styles.radioButton,
                                            selectedPaymentMethod === 'wallet_card' && styles.radioButtonSelected
                                        ]}>
                                            {selectedPaymentMethod === 'wallet_card' && (
                                                <View style={styles.radioButtonInner} />
                                            )}
                                        </View>
                                        <View style={styles.paymentMethodInfo}>
                                            <Text style={styles.paymentMethodTitle}>Wallet + Card</Text>
                                            <Text style={styles.paymentMethodSubtitle}>
                                                Use {formatCurrency(paymentOptions.walletAmount)} wallet + {formatCurrency(paymentOptions.cardAmount)} card
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.paymentIcons}>
                                        <Ionicons name="wallet" size={20} color="#3B82F6" />
                                        <Text style={styles.plusIcon}>+</Text>
                                        <Ionicons name="card" size={20} color="#3B82F6" />
                                    </View>
                                </Pressable>

                                <View style={styles.optionDivider} />
                            </>
                        )}

                        {/* Card Only Option */}
                        {paymentOptions.hasWallet && (
                            <Pressable
                                style={[
                                    styles.paymentMethodOption,
                                    selectedPaymentMethod === 'card_only' && styles.selectedPaymentMethod
                                ]}
                                onPress={() => setSelectedPaymentMethod('card_only')}
                            >
                                <View style={styles.paymentMethodLeft}>
                                    <View style={[
                                        styles.radioButton,
                                        selectedPaymentMethod === 'card_only' && styles.radioButtonSelected
                                    ]}>
                                        {selectedPaymentMethod === 'card_only' && (
                                            <View style={styles.radioButtonInner} />
                                        )}
                                    </View>
                                    <View style={styles.paymentMethodInfo}>
                                        <Text style={styles.paymentMethodTitle}>Card Only</Text>
                                        <Text style={styles.paymentMethodSubtitle}>
                                            Pay full {formatCurrency(totalAmount)} with card
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="card" size={24} color="#3B82F6" />
                            </Pressable>
                        )}

                        {/* No Wallet - Card Only */}
                        {!paymentOptions.hasWallet && (
                            <Pressable
                                style={[
                                    styles.paymentMethodOption,
                                    styles.selectedPaymentMethod
                                ]}
                                disabled
                            >
                                <View style={styles.paymentMethodLeft}>
                                    <View style={[styles.radioButton, styles.radioButtonSelected]}>
                                        <View style={styles.radioButtonInner} />
                                    </View>
                                    <View style={styles.paymentMethodInfo}>
                                        <Text style={styles.paymentMethodTitle}>Card Payment</Text>
                                        <Text style={styles.paymentMethodSubtitle}>
                                            Visa, Mastercard, Verve & Bank Transfer
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="card" size={24} color="#3B82F6" />
                            </Pressable>
                        )}
                    </View>

                    {/* Security Notice */}
                    <View style={styles.securityNotice}>
                        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                        <Text style={styles.securityText}>
                            Your payment is secured with 256-bit SSL encryption
                        </Text>
                    </View>
                </View>

                {/* Action Button */}
                <View style={styles.actionButtonContainer}>
                    <LinearGradient
                        colors={isButtonDisabled ? ['#9CA3AF', '#D1D5DB'] :
                            selectedPaymentMethod === 'wallet_only' ? ['#10B981', '#34D399'] :
                                ['#3B82F6', '#60A5FA']}
                        style={[styles.actionButton, isButtonDisabled && styles.actionButtonDisabled]}
                    >
                        <Pressable
                            style={styles.actionButtonContent}
                            onPress={handlePaymentSubmit}
                            disabled={isButtonDisabled}
                        >
                            <View style={styles.buttonTextContainer}>
                                {(isProcessing || isSubmitting) && (
                                    <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
                                )}
                                {!isProcessing && !isSubmitting && (
                                    <Ionicons
                                        name={selectedPaymentMethod === 'wallet_only' ? 'wallet' : 'card'}
                                        size={20}
                                        color="#ffffff"
                                    />
                                )}
                                <Text style={styles.actionButtonText}>
                                    {getButtonText()}
                                </Text>
                            </View>
                        </Pressable>
                    </LinearGradient>
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsSection}>
                    <Text style={styles.termsText}>
                        By proceeding with payment, you agree to our{' '}
                        <Text style={styles.termsLink}>Terms of Service</Text>
                        {' '}and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                </View>
            </ScrollView>

            {/* Wallet Payment Status Modal */}
            <StatusModal
                visible={walletModalVisible}
                status={walletModalStatus}
                message={walletModalMessage}
                autoClose={walletModalStatus === 'success'}
                autoCloseDelay={1500}
                onClose={() => {
                    setWalletModalVisible(false);
                    if (walletModalStatus === 'error') {
                        setIsSubmitting(false);
                    }
                }}
                onRetry={walletModalStatus === 'error' ? handleWalletOnlyPayment : undefined}
                showRetryOnError={true}
            />
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    summarySection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsMedium',
        flex: 1,
    },
    summaryValue: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'PoppinsMedium',
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },
    totalDivider: {
        height: 2,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        flex: 1,
    },
    totalValue: {
        fontSize: 18,
        color: '#3B82F6',
        fontFamily: 'PoppinsSemiBold',
        textAlign: 'right',
    },
    walletSection: {
        marginBottom: 24,
    },
    walletCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    walletRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletLabel: {
        fontSize: 14,
        color: '#92400E',
        fontFamily: 'PoppinsMedium',
    },
    walletBalance: {
        fontSize: 20,
        color: '#92400E',
        fontFamily: 'PoppinsSemiBold',
    },
    walletBalanceFull: {
        color: '#10B981',
    },
    walletNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#FCD34D',
    },
    walletNoticeText: {
        fontSize: 12,
        color: '#10B981',
        fontFamily: 'PoppinsMedium',
        marginLeft: 6,
    },
    paymentMethodSection: {
        marginBottom: 24,
    },
    paymentMethodCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    paymentMethodOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedPaymentMethod: {
        backgroundColor: '#EEF2FF',
        borderColor: '#3B82F6',
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioButtonSelected: {
        borderColor: '#3B82F6',
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3B82F6',
    },
    paymentMethodInfo: {
        flex: 1,
    },
    paymentMethodTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        marginBottom: 2,
    },
    paymentMethodSubtitle: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
    },
    paymentIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    plusIcon: {
        fontSize: 14,
        color: '#6B7280',
        marginHorizontal: 4,
        fontFamily: 'PoppinsMedium',
    },
    optionDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    securityNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    securityText: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        marginLeft: 6,
    },
    actionButtonContainer: {
        marginBottom: 16,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionButtonContent: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    buttonTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonSpinner: {
        marginRight: 8,
    },
    actionButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#ffffff',
        textAlign: 'center',
        marginLeft: 8,
    },
    termsSection: {
        paddingHorizontal: 8,
    },
    termsText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 16,
        fontFamily: 'PoppinsMedium',
    },
    termsLink: {
        color: '#3B82F6',
        textDecorationLine: 'underline',
    },
});

export default Payment;