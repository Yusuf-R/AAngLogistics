// Simplified Payment.js - Only handles payment initiation
import React, {useState, forwardRef, useImperativeHandle} from 'react';
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

const Payment = forwardRef(({defaultValues, onSubmit, isProcessing = false}, ref) => {
    const orderData = useOrderStore((state) => state.orderData);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('PayStack');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Expose validation function to parent
    useImperativeHandle(ref, () => ({
        submit: async () => {
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

    const isButtonDisabled = isProcessing || isSubmitting;

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
                        <Ionicons name="card" size={24} color="#3B82F6" />
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

            {/* Action Button */}
            <View style={styles.actionButtonContainer}>
                <LinearGradient
                    colors={isProcessing ? ['#9CA3AF', '#D1D5DB'] : ['#3B82F6', '#60A5FA']}
                    style={[styles.actionButton, isButtonDisabled && styles.actionButtonDisabled]}
                >
                    <Pressable
                        style={styles.actionButtonContent}
                        onPress={handlePaymentSubmit}
                        disabled={isButtonDisabled}
                    >
                        <View style={styles.buttonTextContainer}>
                            {isProcessing && (
                                <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
                            )}
                            {!isProcessing && <Ionicons name="card" size={20} color="#ffffff" />}
                            <Text style={styles.actionButtonText}>
                                {isProcessing ? 'Initializing Payment...' : `Pay ${formatCurrency(orderData?.pricing?.totalAmount)}`}
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