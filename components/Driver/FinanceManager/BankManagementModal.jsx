// components/Driver/FinanceManager/BankManagementModal.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import {
    X,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Search,
    ChevronDown,
    Trash2
} from 'lucide-react-native';
import DriverUtils from "../../../utils/DriverUtilities";

function BankManagementModal({
                                 visible,
                                 onClose,
                                 onSuccess,
                                 currentBankDetails,
                                 driverId
                             }) {
    const [step, setStep] = useState(1); // 1: View/Select, 2: Add New
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // Bank data
    const [banks, setBanks] = useState([]);
    const [filteredBanks, setFilteredBanks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBankList, setShowBankList] = useState(false);

    // Form data
    const [selectedBank, setSelectedBank] = useState(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        if (visible) {
            loadBanks();
            resetForm();
        }
    }, [visible]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = banks.filter(bank =>
                bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bank.code.includes(searchQuery)
            );
            setFilteredBanks(filtered);
        } else {
            setFilteredBanks(banks);
        }
    }, [searchQuery, banks]);

    const loadBanks = async () => {
        try {
            setLoading(true);
            const result = await DriverUtils.getBanks();
            setBanks(result.banks || []);
            setFilteredBanks(result.banks || []);
        } catch (error) {
            console.error('Load banks error:', error);
            Alert.alert('Error', 'Failed to load banks list');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setSelectedBank(null);
        setAccountNumber('');
        setAccountName('');
        setVerified(false);
        setSearchQuery('');
        setShowBankList(false);
    };

    const handleBankSelect = (bank) => {
        setSelectedBank(bank);
        setShowBankList(false);
        setSearchQuery('');
        // Clear verification when bank changes
        setAccountName('');
        setVerified(false);
    };

    const handleVerifyAccount = async () => {
        if (!accountNumber || accountNumber.length !== 10) {
            Alert.alert('Invalid Account', 'Please enter a valid 10-digit account number');
            return;
        }

        if (!selectedBank) {
            Alert.alert('Select Bank', 'Please select a bank first');
            return;
        }

        try {
            setVerifying(true);
            const result = await DriverUtils.verifyBankAccount(
                accountNumber,
                selectedBank.code
            );

            if (result.success) {
                setAccountName(result.accountName);
                setVerified(true);
                Alert.alert('Success', 'Account verified successfully!');
            } else {
                Alert.alert('Verification Failed', result.message || 'Could not verify account');
            }
        } catch (error) {
            console.error('Verify account error:', error);
            Alert.alert('Error', 'Failed to verify account. Please check your details.');
        } finally {
            setVerifying(false);
        }
    };

    const handleSaveBank = async () => {
        if (!verified) {
            Alert.alert('Verify Account', 'Please verify your account number first');
            return;
        }

        try {
            setLoading(true);

            const bankDetails = {
                accountName,
                accountNumber,
                bankName: selectedBank.name,
                bankCode: selectedBank.code,
                verified: true
            };

            const result = await DriverUtils.updateBankDetails(driverId, bankDetails);

            if (result.success) {
                Alert.alert('Success', 'Bank account saved successfully!');
                resetForm();
                onSuccess();
                onClose();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Save bank error:', error);
            Alert.alert('Error', 'Failed to save bank account');
        } finally {
            setLoading(false);
        }
    };

    const renderCurrentBank = () => (
        <View className={`bg-white rounded-2xl p-5 mb-4 shadow-sm`}>
            <Text className={`text-gray-900 font-bold text-lg mb-4`}>
                Current Bank Account
            </Text>

            {currentBankDetails?.verified ? (
                <View>
                    <View className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-4`}>
                        <View className={`flex-row items-start justify-beeen mb-3`}>
                            <View className={`flex-1`}>
                                <View className={`flex-row items-center mb-2`}>
                                    <View className={`bg-green-100 rounded-full p-2 mr-2`}>
                                        <CreditCard size={20} color="#10b981" />
                                    </View>
                                    <Text className={`text-green-900 font-bold text-lg`}>
                                        {currentBankDetails.accountName}
                                    </Text>
                                </View>
                                <Text className={`text-green-700 text-sm mb-1`}>
                                    {currentBankDetails.bankName}
                                </Text>
                                <Text className={`text-green-600 text-sm font-mono`}>
                                    {currentBankDetails.accountNumber}
                                </Text>
                            </View>
                            <View className={`bg-green-100 rounded-full p-2`}>
                                <CheckCircle2 size={20} color="#10b981" />
                            </View>
                        </View>

                        <View className={`bg-green-100/50 rounded-lg px-3 py-2`}>
                            <Text className={`text-green-700 text-xs text-center font-medium`}>
                                ✓ Verified Account
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setStep(2)}
                        className={`border-2 border-green-500 rounded-xl py-3`}
                    >
                        <Text className={`text-center text-green-600 font-bold`}>
                            Change Bank Account
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View className={`items-center py-6`}>
                    <View className={`bg-gray-100 rounded-full p-4 mb-3`}>
                        <CreditCard size={32} color="#6b7280" />
                    </View>
                    <Text className={`text-gray-900 font-semibold mb-1`}>
                        No Bank Account Added
                    </Text>
                    <Text className={`text-gray-500 text-sm text-center mb-4`}>
                        Add your bank account to receive withdrawals
                    </Text>
                    <TouchableOpacity
                        onPress={() => setStep(2)}
                        className={`bg-green-500 rounded-xl py-3 px-6`}
                    >
                        <Text className={`text-white font-bold`}>
                            Add Bank Account
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderAddBankForm = () => (
        <ScrollView className={`flex-1`} showsVerticalScrollIndicator={false}>
            {/* Progress Indicator */}
            <View className={`mb-6`}>
                <View className={`flex-row items-center justify-beeen mb-2`}>
                    <View className={`flex-1 h-2 rounded-full ${selectedBank ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <View className={`w-2`} />
                    <View className={`flex-1 h-2 rounded-full ${verified ? 'bg-green-500' : 'bg-gray-200'}`} />
                </View>
                <View className={`flex-row justify-beeen`}>
                    <Text className={`text-xs ${selectedBank ? 'text-green-600' : 'text-gray-500'} font-medium`}>
                        Select Bank
                    </Text>
                    <Text className={`text-xs ${verified ? 'text-green-600' : 'text-gray-500'} font-medium`}>
                        Verify Account
                    </Text>
                </View>
            </View>

            {/* Bank Selection */}
            <View className={`mb-4`}>
                <Text className={`text-gray-700 font-semibold mb-2`}>Select Bank</Text>
                <TouchableOpacity
                    onPress={() => setShowBankList(!showBankList)}
                    className={`border-2 border-gray-300 rounded-xl p-4 flex-row items-center justify-beeen`}
                >
                    {selectedBank ? (
                        <View className={`flex-1`}>
                            <Text className={`text-gray-900 font-semibold`}>
                                {selectedBank.name}
                            </Text>
                            <Text className={`text-gray-500 text-xs mt-1`}>
                                Code: {selectedBank.code}
                            </Text>
                        </View>
                    ) : (
                        <Text className={`text-gray-400`}>Choose your bank</Text>
                    )}
                    <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {/* Bank List Dropdown */}
            {showBankList && (
                <View className={`mb-4 border-2 border-gray-200 rounded-xl overflow-hidden`}>
                    <View className={`bg-gray-50 p-3 border-b border-gray-200`}>
                        <View className={`flex-row items-center bg-white rounded-lg px-3 py-2`}>
                            <Search size={16} color="#6b7280" />
                            <TextInput
                                placeholder="Search banks..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className={`flex-1 ml-2 text-gray-900`}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>

                    <ScrollView className={{ maxHeight: 250 }}>
                        {filteredBanks.map((bank) => (
                            <TouchableOpacity
                                key={bank.code}
                                onPress={() => handleBankSelect(bank)}
                                className={`p-4 border-b border-gray-100 ${
                                    selectedBank?.code === bank.code ? 'bg-green-50' : 'bg-white'
                                }`}
                            >
                                <Text className={`text-gray-900 font-semibold mb-1`}>
                                    {bank.name}
                                </Text>
                                <Text className={`text-gray-500 text-xs`}>
                                    Code: {bank.code}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {filteredBanks.length === 0 && (
                            <View className={`p-8 items-center`}>
                                <Text className={`text-gray-400`}>No banks found</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Account Number */}
            <View className={`mb-4`}>
                <Text className={`text-gray-700 font-semibold mb-2`}>Account Number</Text>
                <View className={`flex-row gap-2`}>
                    <TextInput
                        placeholder="0000000000"
                        keyboardType="numeric"
                        maxLength={10}
                        value={accountNumber}
                        onChangeText={(text) => {
                            setAccountNumber(text.replace(/[^0-9]/g, ''));
                            // Reset verification when account number changes
                            setVerified(false);
                            setAccountName('');
                        }}
                        className={`flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-mono text-base`}
                        placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity
                        onPress={handleVerifyAccount}
                        disabled={!selectedBank || accountNumber.length !== 10 || verifying}
                        className={`bg-green-500 rounded-xl px-4 justify-center ${
                            (!selectedBank || accountNumber.length !== 10 || verifying) ? 'opacity-50' : ''
                        }`}
                    >
                        {verifying ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className={`text-white font-bold`}>Verify</Text>
                        )}
                    </TouchableOpacity>
                </View>
                {accountNumber.length > 0 && accountNumber.length < 10 && (
                    <Text className={`text-orange-500 text-xs mt-1`}>
                        Account number must be 10 digits
                    </Text>
                )}
            </View>

            {/* Account Name (After Verification) */}
            {accountName && verified && (
                <View className={`mb-4`}>
                    <View className={`bg-green-50 border-2 border-green-200 rounded-xl p-4`}>
                        <View className={`flex-row items-center mb-2`}>
                            <CheckCircle2 size={20} color="#10b981" className={`mr-2`} />
                            <Text className={`text-green-700 font-semibold`}>
                                Account Verified
                            </Text>
                        </View>
                        <Text className={`text-green-900 font-bold text-lg`}>
                            {accountName}
                        </Text>
                    </View>
                </View>
            )}

            {/* Important Info */}
            <View className={`flex-row bg-blue-50 rounded-xl p-4 mb-4`}>
                <AlertCircle size={20} color="#3b82f6" className={`mr-3 mt-0.5`} />
                <View className={`flex-1`}>
                    <Text className={`text-blue-900 font-semibold mb-1`}>
                        Important
                    </Text>
                    <Text className={`text-blue-700 text-sm`}>
                        Ensure your account details are correct. All withdrawals will be sent to this account.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
                resetForm();
                onClose();
            }}
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
                                onPress={() => {
                                    if (step === 2) {
                                        setStep(1);
                                    } else {
                                        resetForm();
                                        onClose();
                                    }
                                }}
                                className={`p-2 -ml-2`}
                            >
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                            <Text className={`text-xl font-bold text-gray-900`}>
                                {step === 1 ? 'Bank Account' : 'Add Bank Account'}
                            </Text>
                            <View className={`w-8`} />
                        </View>

                        {/* Content */}
                        <View className={`px-6 pt-4`} className={{ maxHeight: '75%' }}>
                            {step === 1 ? renderCurrentBank() : renderAddBankForm()}
                        </View>

                        {/* Action Buttons */}
                        {step === 2 && (
                            <View className={`px-6 pt-4 border-t border-gray-200`}>
                                <View className={`flex-row gap-3`}>
                                    <TouchableOpacity
                                        onPress={() => setStep(1)}
                                        className={`flex-1 bg-gray-200 rounded-2xl py-4`}
                                        disabled={loading}
                                    >
                                        <Text className={`text-center font-bold text-gray-700`}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleSaveBank}
                                        disabled={!verified || loading}
                                        className={`flex-1 bg-green-500 rounded-2xl py-4 ${
                                            (!verified || loading) ? 'opacity-50' : ''
                                        }`}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className={`text-center font-bold text-white`}>
                                                Save Bank Account
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export default BankManagementModal;