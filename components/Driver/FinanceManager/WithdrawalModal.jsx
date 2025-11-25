// components/Driver/FinanceManager/WithdrawalModal.jsx
import React, { useState } from 'react';
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
    Platform
} from 'react-native';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import DriverUtils from "../../../utils/DriverUtilities";

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
    const [step, setStep] = useState(1); // 1: Enter amount, 2: Confirm

    const MIN_WITHDRAWAL = 1000;

    const calculateFee = (withdrawalAmount) => {
        // Paystack transfer fee: ₦10 + 0.5%
        return Math.round(10 + (withdrawalAmount * 0.005));
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

        if (withdrawalAmount > financialSummary.availableBalance) {
            Alert.alert(
                'Insufficient Balance',
                'Withdrawal amount exceeds your available balance'
            );
            return;
        }

        if (!financialSummary.bankDetails?.verified) {
            Alert.alert(
                'Bank Account Required',
                'Please add and verify your bank account before making a withdrawal',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Bank', onPress: () => {
                            onClose();
                            // Navigate to bank management
                        }}
                ]
            );
            return;
        }

        setStep(2);
    };

    const handleConfirm = async () => {
        const withdrawalAmount = parseFloat(amount);
        const fee = calculateFee(withdrawalAmount);
        const netAmount = withdrawalAmount - fee;

        try {
            setProcessing(true);

            const result = await DriverUtils.requestPayout({
                driverId: userData._id,
                requestedAmount: withdrawalAmount,
                bankDetails: financialSummary.bankDetails
            });

            if (result.success) {
                Alert.alert(
                    'Withdrawal Initiated',
                    `Your withdrawal of ${formatCurrency(netAmount)} is being processed. You'll receive it within 24 hours.`,
                    [
                        { text: 'OK', onPress: () => {
                                setAmount('');
                                setStep(1);
                                onClose();
                                onSuccess();
                            }}
                    ]
                );
            } else {
                throw new Error(result.message || 'Withdrawal failed');
            }
        } catch (error) {
            console.error('Withdrawal error:', error);
            Alert.alert(
                'Withdrawal Failed',
                error.message || 'Failed to process your withdrawal. Please try again.'
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleBack = () => {
        if (step === 2) {
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
            <ScrollView className={`flex-1`} showsVerticalScrollIndicator={false}>
                {/* Available Balance */}
                <View className={`bg-green-50 rounded-2xl p-4 mb-6`}>
                    <Text className={`text-gray-600 text-sm mb-1`}>Available Balance</Text>
                    <Text className={`text-green-600 text-3xl font-bold`}>
                        {formatCurrency(financialSummary.availableBalance)}
                    </Text>
                </View>

                {/* Amount Input */}
                <View className={`mb-6`}>
                    <Text className={`text-gray-700 font-semibold mb-2`}>
                        Withdrawal Amount
                    </Text>
                    <View className={`border-2 border-gray-300 rounded-xl px-4 py-3 flex-row items-center`}>
                        <Text className={`text-gray-400 text-xl mr-2`}>₦</Text>
                        <TextInput
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={handleAmountChange}
                            className={`flex-1 text-2xl font-semibold text-gray-900`}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <Text className={`text-gray-500 text-xs mt-2`}>
                        Minimum withdrawal: {formatCurrency(MIN_WITHDRAWAL)}
                    </Text>
                </View>

                {/* Quick Select Amounts */}
                <View className={`mb-6`}>
                    <Text className={`text-gray-700 font-semibold mb-3`}>Quick Select</Text>
                    <View className={`flex-row flex-wrap gap-2`}>
                        {[5000, 10000, 20000, 50000].map((value) => (
                            <TouchableOpacity
                                key={value}
                                onPress={() => handleQuickSelect(value)}
                                disabled={value > financialSummary.availableBalance}
                                className={`px-4 py-3 rounded-xl ${
                                    parseFloat(amount) === value
                                        ? 'bg-green-500'
                                        : value > financialSummary.availableBalance
                                            ? 'bg-gray-100'
                                            : 'bg-gray-200'
                                }`}
                            >
                                <Text className={`font-semibold ${
                                    parseFloat(amount) === value
                                        ? 'text-white'
                                        : value > financialSummary.availableBalance
                                            ? 'text-gray-400'
                                            : 'text-gray-700'
                                }`}>
                                    ₦{value.toLocaleString()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            onPress={() => handleQuickSelect(financialSummary.availableBalance)}
                            className={`px-4 py-3 rounded-xl ${
                                parseFloat(amount) === financialSummary.availableBalance
                                    ? 'bg-green-500'
                                    : 'bg-gray-200'
                            }`}
                        >
                            <Text className={`font-semibold ${
                                parseFloat(amount) === financialSummary.availableBalance
                                    ? 'text-white'
                                    : 'text-gray-700'
                            }`}>
                                All
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Fee Breakdown */}
                {withdrawalAmount > 0 && (
                    <View className={`bg-gray-50 rounded-2xl p-4 mb-6`}>
                        <Text className={`text-gray-700 font-semibold mb-3`}>Breakdown</Text>

                        <View className={`flex-row justify-beeen mb-2`}>
                            <Text className={`text-gray-600`}>Withdrawal Amount</Text>
                            <Text className={`text-gray-900 font-semibold`}>
                                {formatCurrency(withdrawalAmount)}
                            </Text>
                        </View>

                        <View className={`flex-row justify-beeen mb-2`}>
                            <Text className={`text-gray-600`}>Processing Fee</Text>
                            <Text className={`text-red-600 font-semibold`}>
                                -{formatCurrency(fee)}
                            </Text>
                        </View>

                        <View className={`border-t border-gray-300 pt-2 mt-2`}>
                            <View className={`flex-row justify-beeen`}>
                                <Text className={`text-gray-900 font-bold`}>You'll Receive</Text>
                                <Text className={`text-green-600 font-bold text-lg`}>
                                    {formatCurrency(netAmount)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Bank Details */}
                {financialSummary.bankDetails?.verified && (
                    <View className={`bg-blue-50 rounded-2xl p-4 mb-6`}>
                        <Text className={`text-gray-700 font-semibold mb-2`}>
                            Transfer To
                        </Text>
                        <Text className={`text-gray-900 font-semibold`}>
                            {financialSummary.bankDetails.accountName}
                        </Text>
                        <Text className={`text-gray-600 text-sm`}>
                            {financialSummary.bankDetails.bankName}
                        </Text>
                        <Text className={`text-gray-600 text-sm`}>
                            {financialSummary.bankDetails.accountNumber}
                        </Text>
                    </View>
                )}

                {/* Info */}
                <View className={`flex-row bg-yellow-50 rounded-xl p-4 mb-6`}>
                    <AlertCircle size={20} color="#f59e0b" className={`mr-3 mt-0.5`} />
                    <View className={`flex-1`}>
                        <Text className={`text-gray-700 text-sm`}>
                            Funds will be transferred to your bank account within 24 hours. Processing fees are deducted automatically.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderStepo = () => {
        const withdrawalAmount = parseFloat(amount);
        const fee = calculateFee(withdrawalAmount);
        const netAmount = withdrawalAmount - fee;

        return (
            <ScrollView className={`flex-1`} showsVerticalScrollIndicator={false}>
                {/* Confirmation Header */}
                <View className={`items-center mb-6`}>
                    <View className={`bg-green-100 rounded-full p-4 mb-4`}>
                        <CheckCircle2 size={48} color="#10b981" />
                    </View>
                    <Text className={`text-gray-900 text-2xl font-bold mb-2`}>
                        Confirm Withdrawal
                    </Text>
                    <Text className={`text-gray-600 text-center`}>
                        Please review the details below before confirming
                    </Text>
                </View>

                {/* Summary Card */}
                <View className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6`}>
                    <View className={`items-center mb-4`}>
                        <Text className={`text-gray-600 text-sm mb-1`}>Amount to Receive</Text>
                        <Text className={`text-green-600 text-4xl font-bold`}>
                            {formatCurrency(netAmount)}
                        </Text>
                    </View>

                    <View className={`border-t border-green-200 pt-4`}>
                        <View className={`flex-row justify-beeen mb-3`}>
                            <Text className={`text-gray-600`}>Requested Amount</Text>
                            <Text className={`text-gray-900 font-semibold`}>
                                {formatCurrency(withdrawalAmount)}
                            </Text>
                        </View>
                        <View className={`flex-row justify-beeen`}>
                            <Text className={`text-gray-600`}>Processing Fee</Text>
                            <Text className={`text-gray-900 font-semibold`}>
                                {formatCurrency(fee)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bank Details */}
                <View className={`bg-white border-2 border-gray-200 rounded-2xl p-4 mb-6`}>
                    <Text className={`text-gray-700 font-semibold mb-3`}>
                        Transfer Destination
                    </Text>
                    <View className={`bg-gray-50 rounded-xl p-4`}>
                        <Text className={`text-gray-900 font-bold text-lg mb-1`}>
                            {financialSummary.bankDetails.accountName}
                        </Text>
                        <Text className={`text-gray-600 mb-1`}>
                            {financialSummary.bankDetails.bankName}
                        </Text>
                        <Text className={`text-gray-500 text-sm`}>
                            Account: {financialSummary.bankDetails.accountNumber}
                        </Text>
                    </View>
                </View>

                {/* Processing Time Info */}
                <View className={`flex-row bg-blue-50 rounded-xl p-4 mb-6`}>
                    <AlertCircle size={20} color="#3b82f6" className={`mr-3 mt-0.5`} />
                    <View className={`flex-1`}>
                        <Text className={`text-blue-900 font-semibold mb-1`}>
                            Processing Time
                        </Text>
                        <Text className={`text-blue-700 text-sm`}>
                            Your funds will be credited within 24 hours. You'll receive a notification when the transfer is complete.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleBack}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className={`flex-1`}
            >
                <View className={`flex-1 justify-end bg-black/50`}>
                    <View className={`bg-white rounded-t-3xl ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'}`}>
                        {/* Header */}
                        <View className={`flex-row justify-beeen items-center px-6 pt-6 pb-4 border-b border-gray-200`}>
                            <TouchableOpacity
                                onPress={handleBack}
                                className={`p-2 -ml-2`}
                            >
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                            <Text className={`text-xl font-bold text-gray-900`}>
                                {step === 1 ? 'Withdraw Funds' : 'Confirm Withdrawal'}
                            </Text>
                            <View className={`w-8`} />
                        </View>

                        {/* Content */}
                        <View className={[`px-6 pt-4`, { maxHeight: '75%' }]}>
                            {step === 1 ? renderStepOne() : renderStepo()}
                        </View>

                        {/* Action Buttons */}
                        <View className={`px-6 pt-4 border-t border-gray-200`}>
                            <View className={`flex-row gap-3`}>
                                <TouchableOpacity
                                    onPress={handleBack}
                                    className={`flex-1 bg-gray-200 rounded-2xl py-4`}
                                    disabled={processing}
                                >
                                    <Text className={`text-center font-bold text-gray-700`}>
                                        {step === 1 ? 'Cancel' : 'Back'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={step === 1 ? validateAndProceed : handleConfirm}
                                    disabled={processing || (step === 1 && (!amount || parseFloat(amount) <= 0))}
                                    className={`flex-1 bg-green-500 rounded-2xl py-4 ${
                                        (processing || (step === 1 && (!amount || parseFloat(amount) <= 0)))
                                            ? 'opacity-50'
                                            : ''
                                    }`}
                                >
                                    {processing ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className={`text-center font-bold text-white`}>
                                            {step === 1 ? 'Continue' : 'Confirm Withdrawal'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export default WithdrawalModal;