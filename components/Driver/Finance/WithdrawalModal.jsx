// components/Driver/FinanceManager/WithdrawalModal.jsx
import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet
} from 'react-native';
import { X, AlertCircle, CheckCircle2, Lock, Shield } from 'lucide-react-native';
import DriverUtils from "../../../utils/DriverUtilities";
import StatusModal from "components/StatusModal/StatusModal";

function WithdrawalModal({
                             visible,
                             onClose,
                             onSuccess,
                             financialSummary,
                             userData,
                             formatCurrency
                         }) {
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState(1); // 1: Enter amount, 2: Confirm 3: Auth Pin
    const pinInputRefs = useRef([]);

    const [authPin, setAuthPin] = useState(['', '', '', '', '', '']);
    const [pinInputs, setPinInputs] = useState(Array(6).fill(''));
    const [pinError, setPinError] = useState('');
    const [pinAttempts, setPinAttempts] = useState(0);

    const [statusModal, setStatusModal] = useState({
        visible: false,
        status: 'loading', // 'loading', 'success', 'error'
        message: ''
    });

    const MIN_WITHDRAWAL = 500;
    const availableBalance = financialSummary?.availableBalance || userData?.wallet?.balance || 0;
    const bankAccounts = userData?.verification?.basicVerification?.bankAccounts || [];
    const primaryBankAccount = bankAccounts.find(acc => acc.isPrimary && acc.verified);

    const authPinEnabled = userData?.authPin?.isEnabled;
    const authPinLocked = userData?.authPin?.lockedUntil && new Date(userData.authPin.lockedUntil) > new Date();

    useEffect(() => {
        if (!visible) {
            // Reset state when modal closes
            setStep(1);
            setAmount('');
            setPinInputs(Array(6).fill(''));
            setPinError('');
            pinInputRefs.current = [];
            setPinAttempts(0);
        }
    }, [visible]);

    const calculateFee = (withdrawalAmount) => {
        // New tiered fee structure for Nigeria
        if (withdrawalAmount <= 5000) {
            return 10;
        } else if (withdrawalAmount <= 50000) {
            return 25;
        } else {
            return 50;
        }
    };

    const handleAmountChange = (text) => {
        // Only allow numbers and single decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        if (parts[1] && parts[1].length > 2) return;

        setAmount(cleaned);
    };

    const handleQuickSelect = (value) => {
        setAmount(value.toString());
    };

    const validateAndProceed = () => {
        const withdrawalAmount = parseFloat(amount);

        if (!amount || isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        if (withdrawalAmount < MIN_WITHDRAWAL) {
            Alert.alert(
                'Minimum Amount Required',
                `Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL)}`
            );
            return;
        }

        if (withdrawalAmount > availableBalance) {
            Alert.alert(
                'Insufficient Balance',
                'Withdrawal amount exceeds your available balance'
            );
            return;
        }

        if (!primaryBankAccount) {
            Alert.alert(
                'Bank Account Required',
                'Please add and verify your bank account before making a withdrawal',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {
                        text: 'Add Bank', onPress: () => {
                            onClose();
                            // Navigate to bank management
                        }
                    }
                ]
            );
            return;
        }

        // Check if auth pin is enabled and not locked
        if (!authPinEnabled) {
            Alert.alert(
                'Security PIN Required',
                'Please set up your 6-digit Authorization PIN in the Security section to enable withdrawals.',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {
                        text: 'Go to Security', onPress: () => {
                            onClose();
                            // Navigate to security settings
                        }
                    }
                ]
            );
            return;
        }

        if (authPinLocked) {
            const lockedUntil = new Date(userData.authPin.lockedUntil);
            const now = new Date();
            const minutesLeft = Math.ceil((lockedUntil - now) / (1000 * 60));

            Alert.alert(
                'PIN Locked',
                `Too many failed attempts. Please try again in ${minutesLeft} minutes or reset your PIN.`,
                [
                    {
                        text: 'Reset PIN', onPress: () => {
                            onClose();
                            // Navigate to PIN reset
                        }
                    },
                    {text: 'OK', style: 'default'}
                ]
            );
            return;
        }

        setStep(2);
    };

    const handlePinInput = (text, index) => {
        if (!/^\d?$/.test(text)) return; // Only allow single digits

        const newPinInputs = [...pinInputs];
        newPinInputs[index] = text;
        setPinInputs(newPinInputs);
        setPinError('');

        // Auto-focus next input
        if (text && index < 5) {
            pinInputRefs.current[index + 1]?.focus();
        }
    };

    const handlePinBackspace = (index) => {
        if (pinInputs[index] === '' && index > 0) {
            const newPinInputs = [...pinInputs];
            newPinInputs[index - 1] = '';
            setPinInputs(newPinInputs);
            pinInputRefs.current[index - 1]?.focus();
        }
    };

    const verifyAuthPin = async () => {
        const pin = pinInputs.join('');

        if (pin.length !== 6) {
            setPinError('Please enter a 6-digit PIN');
            return;
        }

        try {
            setProcessing(true);

            // Call API to verify auth pin
            const verificationResult = await DriverUtils.verifyWithdrawalAuthPin({ pin });

            if (verificationResult.success) {
                // PIN verified successfully, proceed with withdrawal
                await processWithdrawal();
            } else {
                setPinError(verificationResult.message);

                const newAttempts = pinAttempts + 1;
                setPinAttempts(newAttempts);

                if (newAttempts >= 3) {
                    setStatusModal({
                        visible: true,
                        status: 'error',
                        message: 'Too many failed attempts.\n\nYour PIN has been locked for security. Please reset your PIN in the Security section.'
                    });
                } else {
                    setPinInputs(Array(6).fill(''));
                }
            }
        } catch (error) {
            // This will only catch non-400 errors now
            if (error.response && error.response.status === 423) {
                setStatusModal({
                    visible: true,
                    status: 'error',
                    message: `${error.response?.data?.message} || An unexpected error occurred. Please try again.`
                });
            } else {
                setPinError(error.response?.data?.message || 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const processWithdrawal = async () => {
        const withdrawalAmount = parseFloat(amount);
        const fee = calculateFee(withdrawalAmount);
        const netAmount = withdrawalAmount - fee;

        try {
            // Show loading modal
            setStatusModal({
                visible: true,
                status: 'loading',
                message: 'Processing your withdrawal...'
            });

            const result = await DriverUtils.requestPayout({
                driverId: userData._id,
                requestedAmount: withdrawalAmount,
                bankDetails: primaryBankAccount,
                fee,
                netAmount
            });

            if (result.success) {
                // Show success modal
                setStatusModal({
                    visible: true,
                    status: 'success',
                    message: `Withdrawal initiated successfully!\n\nYou'll receive ${formatCurrency(netAmount)} within 24 hours.`
                });
            } else {
                throw new Error(result.message || 'Withdrawal failed');
            }
        } catch (error) {
            console.log('Withdrawal error:', error);

            // Show error modal with specific error message
            setStatusModal({
                visible: true,
                status: 'error',
                message: error.message || 'Failed to process your withdrawal. Please try again.'
            });
        }
    };

    const handleConfirm = async () => {
        if (authPinEnabled) {
            setStep(3); // Go to PIN verification step
        } else {
            await processWithdrawal(); // Skip PIN if not enabled
        }
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setPinInputs(Array(6).fill(''));
            setPinError('');
        } else if (step === 2) {
            setStep(1);
        } else {
            setAmount('');
            setStep(1);
            onClose();
        }
    };

    const renderStepOne = () => {
        const withdrawalAmount = parseFloat(amount) || 0;
        const fee = calculateFee(withdrawalAmount);
        const netAmount = withdrawalAmount - fee;

        return (
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Available Balance */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>
                        {formatCurrency(availableBalance)}
                    </Text>
                </View>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Withdrawal Amount</Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.currencySymbol}>₦</Text>
                        <TextInput
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={handleAmountChange}
                            style={styles.amountInput}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <Text style={styles.minimumText}>
                        Minimum withdrawal: {formatCurrency(MIN_WITHDRAWAL)}
                    </Text>
                </View>

                {/* Quick Select Amounts */}
                <View style={styles.quickSelectGroup}>
                    <Text style={styles.quickSelectLabel}>Quick Select</Text>
                    <View style={styles.quickSelectRow}>
                        {[5000, 10000, 20000, 50000].map((value) => (
                            <TouchableOpacity
                                key={value}
                                onPress={() => handleQuickSelect(value)}
                                disabled={value > availableBalance}
                                style={[
                                    styles.quickSelectButton,
                                    parseFloat(amount) === value && styles.quickSelectButtonActive,
                                    value > availableBalance && styles.quickSelectButtonDisabled
                                ]}
                            >
                                <Text style={[
                                    styles.quickSelectText,
                                    parseFloat(amount) === value && styles.quickSelectTextActive,
                                    value > availableBalance && styles.quickSelectTextDisabled
                                ]}>
                                    ₦{value.toLocaleString()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            onPress={() => handleQuickSelect(availableBalance)}
                            style={[
                                styles.quickSelectButton,
                                parseFloat(amount) === availableBalance && styles.quickSelectButtonActive
                            ]}
                        >
                            <Text style={[
                                styles.quickSelectText,
                                parseFloat(amount) === availableBalance && styles.quickSelectTextActive
                            ]}>
                                All
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Fee Breakdown */}
                {withdrawalAmount > 0 && (
                    <View style={styles.breakdownCard}>
                        <Text style={styles.breakdownTitle}>Breakdown</Text>

                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Withdrawal Amount</Text>
                            <Text style={styles.breakdownValue}>
                                {formatCurrency(withdrawalAmount)}
                            </Text>
                        </View>

                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Processing Fee</Text>
                            <Text style={styles.breakdownValueRed}>
                                -{formatCurrency(fee)}
                            </Text>
                        </View>

                        <View style={styles.breakdownDivider}>
                            <View style={styles.breakdownTotal}>
                                <Text style={styles.breakdownTotalLabel}>You'll Receive</Text>
                                <Text style={styles.breakdownTotalValue}>
                                    {formatCurrency(netAmount)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Bank Details */}
                {primaryBankAccount && (
                    <View style={styles.bankCard}>
                        <Text style={styles.bankCardTitle}>Transfer To</Text>
                        <Text style={styles.bankAccountName}>
                            {primaryBankAccount.accountName}
                        </Text>
                        <Text style={styles.bankName}>
                            {primaryBankAccount.bankName}
                        </Text>
                        <Text style={styles.bankAccountNumber}>
                            {primaryBankAccount.accountNumber}
                        </Text>
                    </View>
                )}

                {/* Security Info */}
                {authPinEnabled && (
                    <View style={styles.securityInfoCard}>
                        <Shield size={20} color="#10b981" style={styles.securityInfoIcon} />
                        <View style={styles.securityInfoContent}>
                            <Text style={styles.securityInfoTitle}>Security Verification</Text>
                            <Text style={styles.securityInfoText}>
                                You'll need to enter your 6-digit Authorization PIN to complete this withdrawal.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Info */}
                <View style={styles.infoCard}>
                    <AlertCircle size={20} color="#f59e0b" style={styles.infoIcon} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoText}>
                            Funds will be transferred to your bank account within 24 hours. Processing fees are deducted automatically.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderStepTwo = () => {
        const withdrawalAmount = parseFloat(amount);
        const fee = calculateFee(withdrawalAmount);
        const netAmount = withdrawalAmount - fee;

        return (
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Confirmation Header */}
                <View style={styles.confirmationHeader}>
                    <View style={styles.confirmationIcon}>
                        <CheckCircle2 size={48} color="#10b981" />
                    </View>
                    <Text style={styles.confirmationTitle}>Confirm Withdrawal</Text>
                    <Text style={styles.confirmationSubtitle}>
                        Please review the details below before confirming
                    </Text>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryAmountSection}>
                        <Text style={styles.summaryAmountLabel}>Amount to Receive</Text>
                        <Text style={styles.summaryAmountValue}>
                            {formatCurrency(netAmount)}
                        </Text>
                    </View>

                    <View style={styles.summaryDetails}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Requested Amount</Text>
                            <Text style={styles.summaryValue}>
                                {formatCurrency(withdrawalAmount)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Processing Fee</Text>
                            <Text style={styles.summaryValue}>
                                {formatCurrency(fee)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bank Details */}
                <View style={styles.bankDetailsCard}>
                    <Text style={styles.bankDetailsTitle}>Transfer Destination</Text>
                    <View style={styles.bankDetailsContent}>
                        <Text style={styles.bankDetailsName}>
                            {primaryBankAccount.accountName}
                        </Text>
                        <Text style={styles.bankDetailsBank}>
                            {primaryBankAccount.bankName}
                        </Text>
                        <Text style={styles.bankDetailsNumber}>
                            Account: {primaryBankAccount.accountNumber}
                        </Text>
                    </View>
                </View>

                {/* Security Notice */}
                {authPinEnabled && (
                    <View style={styles.securityNoticeCard}>
                        <Lock size={20} color="#3b82f6" style={styles.securityNoticeIcon} />
                        <View style={styles.securityNoticeContent}>
                            <Text style={styles.securityNoticeTitle}>Security Step Required</Text>
                            <Text style={styles.securityNoticeText}>
                                You'll need to enter your 6-digit Authorization PIN in the next step to complete this withdrawal.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Processing Time Info */}
                <View style={styles.processingInfoCard}>
                    <AlertCircle size={20} color="#3b82f6" style={styles.processingInfoIcon} />
                    <View style={styles.processingInfoContent}>
                        <Text style={styles.processingInfoTitle}>Processing Time</Text>
                        <Text style={styles.processingInfoText}>
                            Your funds will be credited within 24 hours. You'll receive a notification when the transfer is complete.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderStepThree = () => {
        return (
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* PIN Verification Header */}
                <View style={styles.pinHeader}>
                    <View style={styles.pinIcon}>
                        <Lock size={48} color="#3b82f6" />
                    </View>
                    <Text style={styles.pinTitle}>Enter Authorization PIN</Text>
                    <Text style={styles.pinSubtitle}>
                        Enter your 6-digit security PIN to authorize this withdrawal
                    </Text>
                </View>

                {/* PIN Input Grid */}
                <View style={styles.pinInputContainer}>
                    {pinInputs.map((digit, index) => (
                        <View key={index} style={styles.pinInputWrapper}>
                            <TextInput
                                ref={(ref) => (pinInputRefs.current[index] = ref)}
                                style={[
                                    styles.pinInput,
                                    pinError && styles.pinInputError,
                                    digit && styles.pinInputFilled
                                ]}
                                keyboardType="number-pad"
                                maxLength={1}
                                value={digit}
                                onChangeText={(text) => handlePinInput(text, index)}
                                onKeyPress={({ nativeEvent }) => {
                                    if (nativeEvent.key === 'Backspace') {
                                        handlePinBackspace(index);
                                    }
                                }}
                                secureTextEntry={true}
                                autoFocus={index === 0}
                            />
                        </View>
                    ))}
                </View>

                {pinError ? (
                    <View style={styles.pinErrorContainer}>
                        <AlertCircle size={16} color="#ef4444" />
                        <Text style={styles.pinErrorText}>{pinError}</Text>
                    </View>
                ) : null}

                {/* Security Info */}
                <View style={styles.pinHelpCard}>
                    <AlertCircle size={20} color="#6b7280" style={styles.pinHelpIcon} />
                    <View style={styles.pinHelpContent}>
                        <Text style={styles.pinHelpTitle}>Forgot your PIN?</Text>
                        <Text style={styles.pinHelpText}>
                            You can reset your Authorization PIN in the Security section of your Account tab.
                        </Text>
                    </View>
                </View>

                {/* Withdrawal Summary */}
                <View style={styles.pinSummaryCard}>
                    <Text style={styles.pinSummaryTitle}>Withdrawal Summary</Text>
                    <View style={styles.pinSummaryRow}>
                        <Text style={styles.pinSummaryLabel}>Amount:</Text>
                        <Text style={styles.pinSummaryValue}>
                            {formatCurrency(parseFloat(amount))}
                        </Text>
                    </View>
                    <View style={styles.pinSummaryRow}>
                        <Text style={styles.pinSummaryLabel}>Fee:</Text>
                        <Text style={styles.pinSummaryValue}>
                            -{formatCurrency(calculateFee(parseFloat(amount)))}
                        </Text>
                    </View>
                    <View style={styles.pinSummaryDivider}>
                        <View style={styles.pinSummaryTotal}>
                            <Text style={styles.pinSummaryTotalLabel}>Total:</Text>
                            <Text style={styles.pinSummaryTotalValue}>
                                {formatCurrency(parseFloat(amount) - calculateFee(parseFloat(amount)))}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const handleStatusModalFinish = () => {
        if (statusModal.status === 'success') {
            setAmount('');
            setStep(1);
            setPinInputs(Array(6).fill(''));
            setStatusModal({ visible: false, status: 'loading', message: '' });
            onClose();
            onSuccess();
        }
    };

    const handleRetry = () => {
        setStatusModal({ visible: false, status: 'loading', message: '' });
    };

    const handleCloseError = () => {
        setStatusModal({ visible: false, status: 'loading', message: '' });
        setStep(2);
        setPinInputs(Array(6).fill(''));
        setPinError('');
    };



    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleBack}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    onPress={handleBack}
                                    style={styles.closeButton}
                                    disabled={processing}
                                >
                                    <X size={24} color="#374151" />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>
                                    {step === 1 ? 'Withdraw Funds' :
                                        step === 2 ? 'Confirm Withdrawal' :
                                            'Verify PIN'}
                                </Text>
                                <View style={styles.headerSpacer} />
                            </View>

                            {/* Content */}
                            <View style={styles.modalBody}>
                                {step === 1 ? renderStepOne() :
                                    step === 2 ? renderStepTwo() :
                                        renderStepThree()}
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    onPress={handleBack}
                                    style={styles.cancelButton}
                                    disabled={processing}
                                >
                                    <Text style={styles.cancelButtonText}>
                                        {step === 1 ? 'Cancel' : 'Back'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={step === 1 ? validateAndProceed :
                                        step === 2 ? handleConfirm :
                                            verifyAuthPin}
                                    disabled={processing ||
                                        (step === 1 && (!amount || parseFloat(amount) <= 0)) ||
                                        (step === 3 && pinInputs.join('').length !== 6)}
                                    style={[
                                        styles.confirmButton,
                                        (processing ||
                                            (step === 1 && (!amount || parseFloat(amount) <= 0)) ||
                                            (step === 3 && pinInputs.join('').length !== 6)) &&
                                        styles.confirmButtonDisabled
                                    ]}
                                >
                                    {processing ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.confirmButtonText}>
                                            {step === 1 ? 'Continue' :
                                                step === 2 ? 'Authorize Withdrawal' :
                                                    'Confirm Withdrawal'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <StatusModal
                visible={statusModal.visible}
                status={statusModal.status}
                message={statusModal.message}
                onFinish={handleStatusModalFinish}
                onRetry={handleRetry}
                onClose={handleCloseError}
                showRetryOnError={true}
            />
        </>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        flex: 1,
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
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    headerSpacer: {
        width: 32,
    },
    modalBody: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    scrollContainer: {
        flex: 1,
    },
    // Step 1 Styles
    balanceCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    balanceLabel: {
        color: '#065f46',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
        marginBottom: 8,
    },
    balanceAmount: {
        color: '#065f46',
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        color: '#374151',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    currencySymbol: {
        color: '#10b981',
        fontSize: 22,
    },
    amountInput: {
        flex: 1,
        fontSize: 22,
        color: '#111827',
    },
    minimumText: {
        color: '#6b7280',
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        marginTop: 4,
    },
    quickSelectGroup: {
        marginBottom: 24,
    },
    quickSelectLabel: {
        color: '#374151',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 12,
    },
    quickSelectRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    quickSelectButton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    quickSelectButtonActive: {
        backgroundColor: '#10b981',
    },
    quickSelectButtonDisabled: {
        backgroundColor: '#f3f4f6',
        opacity: 0.5,
    },
    quickSelectText: {
        color: '#374151',
        fontWeight: '600',
    },
    quickSelectTextActive: {
        color: '#ffffff',
    },
    quickSelectTextDisabled: {
        color: '#9ca3af',
    },
    breakdownCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    breakdownTitle: {
        color: '#374151',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 12,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    breakdownLabel: {
        color: '#6b7280',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
    },
    breakdownValue: {
        color: '#111827',
        fontWeight: '600',
    },
    breakdownValueRed: {
        color: '#dc2626',
        fontWeight: '600',
    },
    breakdownDivider: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
        marginTop: 8,
    },
    breakdownTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownTotalLabel: {
        color: '#111827',
        fontFamily: 'PoppinsSemiBold',
    },
    breakdownTotalValue: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 18,
    },
    bankCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    bankCardTitle: {
        color: '#1e40af',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 8,
    },
    bankAccountName: {
        color: '#1e3a8a',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    bankName: {
        color: '#374151',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 2,
    },
    bankAccountNumber: {
        color: '#dc2626',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    infoIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    infoContent: {
        flex: 1,
    },
    infoText: {
        color: '#92400e',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
        lineHeight: 20,
    },
    // Step 2 Styles
    confirmationHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    confirmationIcon: {
        backgroundColor: '#d1fae5',
        borderRadius: 50,
        padding: 16,
        marginBottom: 16,
    },
    confirmationTitle: {
        color: '#111827',
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    confirmationSubtitle: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'PoppinsSemiBold',
    },
    summaryCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    summaryAmountSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryAmountLabel: {
        color: '#065f46',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    summaryAmountValue: {
        color: '#065f46',
        fontSize: 32,
        fontWeight: 'bold',
    },
    summaryDetails: {
        borderTopWidth: 1,
        borderTopColor: '#a7f3d0',
        paddingTop: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#374151',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
    },
    summaryValue: {
        color: '#111827',
        fontWeight: '600',
    },
    bankDetailsCard: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    bankDetailsTitle: {
        color: '#374151',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        marginBottom: 12,
    },
    bankDetailsContent: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
    },
    bankDetailsName: {
        color: '#111827',
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    bankDetailsBank: {
        color: '#374151',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 2,
    },
    bankDetailsNumber: {
        color: '#6b7280',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    processingInfoCard: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    processingInfoIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    processingInfoContent: {
        flex: 1,
    },
    processingInfoTitle: {
        color: '#1e40af',
        fontWeight: '600',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    processingInfoText: {
        color: '#374151',
        fontSize: 14,
        lineHeight: 24,
        fontFamily: 'PoppinsSemiBold',
    },
    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#374151',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#10b981',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        color: '#ffffff',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 16,
    },
    pinHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    pinIcon: {
        backgroundColor: '#dbeafe',
        borderRadius: 50,
        padding: 16,
        marginBottom: 16,
    },
    pinTitle: {
        color: '#111827',
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 8,
    },
    pinSubtitle: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'PoppinsSemiBold',
        lineHeight: 20,
    },
    pinInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    pinInputWrapper: {
        width: 50,
        height: 60,
    },
    pinInput: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        backgroundColor: '#ffffff',
    },
    pinInputFilled: {
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    pinInputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    pinErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        marginHorizontal: 24,
    },
    pinErrorText: {
        color: '#dc2626',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    pinHelpCard: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        marginHorizontal: 24,
    },
    pinHelpIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    pinHelpContent: {
        flex: 1,
    },
    pinHelpTitle: {
        color: '#374151',
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
        marginBottom: 4,
    },
    pinHelpText: {
        color: '#6b7280',
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        lineHeight: 16,
    },
    pinSummaryCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    pinSummaryTitle: {
        color: '#374151',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    pinSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    pinSummaryLabel: {
        color: '#6b7280',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
    },
    pinSummaryValue: {
        color: '#111827',
        fontWeight: '500',
    },
    pinSummaryDivider: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 12,
        marginTop: 8,
    },
    pinSummaryTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pinSummaryTotalLabel: {
        color: '#111827',
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
    },
    pinSummaryTotalValue: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 16,
    },
    securityInfoCard: {
        flexDirection: 'row',
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    securityInfoIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    securityInfoContent: {
        flex: 1,
    },
    securityInfoTitle: {
        color: '#065f46',
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
        marginBottom: 4,
    },
    securityInfoText: {
        color: '#047857',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
        lineHeight: 16,
    },
    securityNoticeCard: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    securityNoticeIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    securityNoticeContent: {
        flex: 1,
    },
    securityNoticeTitle: {
        color: '#1e40af',
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 4,
    },
    securityNoticeText: {
        color: '#374151',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
        lineHeight: 16,
    },
});

export default WithdrawalModal;