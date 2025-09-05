// Enhanced Payment.js component with robust state handling
import React, {useState, forwardRef, useImperativeHandle, useMemo, useEffect} from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    Dimensions,
    Alert,
    ActivityIndicator
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useOrderStore} from "../../../store/useOrderStore";

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const PAYMENT_STATUS = {
    IDLE: 'idle',
    INITIATING: 'initiating',
    PROCESSING: 'processing',
    VERIFYING: 'verifying',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

const Payment = forwardRef(({defaultValues, onSubmit, paymentState, isProcessing}, ref) => {
    const orderData = useOrderStore((state) => state.orderData);

    // Local state for payment method selection (for future expansion)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('PayStack');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Expose validation function to parent
    useImperativeHandle(ref, () => ({
        submit: async () => {
            // Validate payment readiness
            if (!orderData?.pricing?.totalAmount || orderData.pricing.totalAmount <= 0) {
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
                        status: 'pending'
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

    const handlePaymentSubmit = async () => {
        if (isProcessing || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get appropriate button text based on payment state
    const getButtonText = () => {
        switch (paymentState?.status) {
            case PAYMENT_STATUS.INITIATING:
                return 'Initializing Payment...';
            case PAYMENT_STATUS.PROCESSING:
                return 'Payment in Progress...';
            case PAYMENT_STATUS.VERIFYING: // NEW: Special state for verification
                return 'Verifying Payment...';
            case PAYMENT_STATUS.SUCCESS:
                return 'Payment Successful ✓';
            case PAYMENT_STATUS.FAILED:
                return 'Payment Failed - Try Again';
            case PAYMENT_STATUS.CANCELLED:
                return 'Payment Cancelled - Try Again';
            default:
                return `Pay ${formatCurrency(orderData?.pricing?.totalAmount)}`;
        }
    };

    // Get button colors based on payment state
    const getButtonColors = () => {
        switch (paymentState?.status) {
            case PAYMENT_STATUS.SUCCESS:
                return ['#10B981', '#34D399']; // Green
            case PAYMENT_STATUS.FAILED:
                return ['#EF4444', '#F87171']; // Red
            case PAYMENT_STATUS.CANCELLED:
                return ['#F59E0B', '#FBBF24']; // Amber
            default:
                return ['#3B82F6', '#60A5FA']; // Blue
        }
    };

    // Check if button should be disabled
    const isButtonDisabled = () => {
        return isProcessing ||
            isSubmitting ||
            paymentState?.status === PAYMENT_STATUS.INITIATING ||
            paymentState?.status === PAYMENT_STATUS.PROCESSING ||
            paymentState?.status === PAYMENT_STATUS.VERIFYING ||
            paymentState?.status === PAYMENT_STATUS.SUCCESS;
    };

    // Get appropriate icon based on payment state
    const getButtonIcon = () => {
        switch (paymentState?.status) {
            case PAYMENT_STATUS.INITIATING:
            case PAYMENT_STATUS.PROCESSING:
            case PAYMENT_STATUS.VERIFYING:
                return null; // Will show spinner instead
            case PAYMENT_STATUS.SUCCESS:
                return 'checkmark-circle';
            case PAYMENT_STATUS.FAILED:
            case PAYMENT_STATUS.CANCELLED:
                return 'reload';
            default:
                return 'card';
        }
    };

    const showSpinner = [
        PAYMENT_STATUS.INITIATING,
        PAYMENT_STATUS.PROCESSING,
        PAYMENT_STATUS.VERIFYING
    ].includes(paymentState?.status);

    return (
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
                            {formatCurrency(orderData?.pricing?.totalAmount)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.paymentMethodSection}>
                <Text style={styles.sectionTitle}>Payment Method</Text>

                <View style={styles.paymentMethodCard}>
                    <Pressable
                        style={[
                            styles.paymentMethodOption,
                            selectedPaymentMethod === 'PayStack' && styles.selectedPaymentMethod
                        ]}
                        onPress={() => setSelectedPaymentMethod('PayStack')}
                    >
                        <View style={styles.paymentMethodLeft}>
                            <View style={[
                                styles.radioButton,
                                selectedPaymentMethod === 'PayStack' && styles.radioButtonSelected
                            ]}>
                                {selectedPaymentMethod === 'PayStack' && (
                                    <View style={styles.radioButtonInner} />
                                )}
                            </View>
                            <View style={styles.paymentMethodInfo}>
                                <Text style={styles.paymentMethodTitle}>Card Payment</Text>
                                <Text style={styles.paymentMethodSubtitle}>
                                    Visa, Mastercard, Verve & Bank Transfer
                                </Text>
                            </View>
                        </View>
                        <Ionicons
                            name="card"
                            size={24}
                            color="#3B82F6"
                        />
                    </Pressable>
                </View>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.securityText}>
                        Your payment is secured with 256-bit SSL encryption
                    </Text>
                </View>
            </View>

            {/* Payment Status Display */}
            {paymentState?.status && paymentState.status !== PAYMENT_STATUS.IDLE && (
                <View style={styles.statusSection}>
                    <View style={[
                        styles.statusCard,
                        paymentState.status === PAYMENT_STATUS.SUCCESS && styles.statusSuccess,
                        paymentState.status === PAYMENT_STATUS.FAILED && styles.statusError,
                        paymentState.status === PAYMENT_STATUS.CANCELLED && styles.statusWarning,
                    ]}>
                        <View style={styles.statusHeader}>
                            {showSpinner ? (
                                <ActivityIndicator size="small" color="#3B82F6" />
                            ) : (
                                <Ionicons
                                    name={
                                        paymentState.status === PAYMENT_STATUS.SUCCESS ? 'checkmark-circle' :
                                            paymentState.status === PAYMENT_STATUS.FAILED ? 'close-circle' :
                                                paymentState.status === PAYMENT_STATUS.CANCELLED ? 'warning' :
                                                    'information-circle'
                                    }
                                    size={20}
                                    color={
                                        paymentState.status === PAYMENT_STATUS.SUCCESS ? '#10B981' :
                                            paymentState.status === PAYMENT_STATUS.FAILED ? '#EF4444' :
                                                paymentState.status === PAYMENT_STATUS.CANCELLED ? '#F59E0B' :
                                                    '#3B82F6'
                                    }
                                />
                            )}
                            <Text style={[
                                styles.statusTitle,
                                paymentState.status === PAYMENT_STATUS.SUCCESS && styles.statusTitleSuccess,
                                paymentState.status === PAYMENT_STATUS.FAILED && styles.statusTitleError,
                                paymentState.status === PAYMENT_STATUS.CANCELLED && styles.statusTitleWarning,
                            ]}>
                                {paymentState.status === PAYMENT_STATUS.INITIATING && 'Initializing Payment'}
                                {paymentState.status === PAYMENT_STATUS.PROCESSING && 'Payment in Progress'}
                                {paymentState.status === PAYMENT_STATUS.VERIFYING && 'Verifying Payment'}
                                {paymentState.status === PAYMENT_STATUS.SUCCESS && 'Payment Successful'}
                                {paymentState.status === PAYMENT_STATUS.FAILED && 'Payment Failed'}
                                {paymentState.status === PAYMENT_STATUS.CANCELLED && 'Payment Cancelled'}
                            </Text>
                        </View>

                        {paymentState.error && (
                            <Text style={styles.statusMessage}>
                                {paymentState.error}
                            </Text>
                        )}

                        {paymentState.reference && (
                            <Text style={styles.statusReference}>
                                Reference: {paymentState.reference}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Action Button */}
            <View style={styles.actionButtonContainer}>
                <LinearGradient
                    colors={getButtonColors()}
                    style={[
                        styles.actionButton,
                        isButtonDisabled() && styles.actionButtonDisabled
                    ]}
                >
                    <Pressable
                        style={styles.actionButtonContent}
                        onPress={handlePaymentSubmit}
                        disabled={isButtonDisabled()}
                    >
                        <View style={styles.buttonTextContainer}>
                            {showSpinner ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#ffffff"
                                    style={styles.buttonSpinner}
                                />
                            ) : (
                                getButtonIcon() && (
                                    <Ionicons
                                        name={getButtonIcon()}
                                        size={20}
                                        color="#ffffff"
                                    />
                                )
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
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 100, // Extra space for floating action panel
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
        shadowOffset: {
            width: 0,
            height: 1,
        },
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
    paymentMethodSection: {
        marginBottom: 24,
    },
    paymentMethodCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
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
    statusSection: {
        marginBottom: 24,
    },
    statusCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    statusSuccess: {
        borderLeftColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    statusError: {
        borderLeftColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    statusWarning: {
        borderLeftColor: '#F59E0B',
        backgroundColor: '#FFFBEB',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginLeft: 8,
    },
    statusTitleSuccess: {
        color: '#065F46',
    },
    statusTitleError: {
        color: '#991B1B',

    },
    statusTitleWarning: {
        color: '#92400E',
    },
    statusMessage: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        marginBottom: 4,
    },
    statusReference: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'PoppinsMedium',
    },
    actionButtonContainer: {
        marginBottom: 16,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
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