// components/Driver/Finance/BankManagementModal.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet
} from 'react-native';
import {
    X,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Search,
    ChevronDown,
    Edit3,
    Trash2,
    Plus
} from 'lucide-react-native';
import { NIGERIAN_BANKS } from '../../../utils/Driver/Constants';
import DriverUtils from '../../../utils/DriverUtilities';
import SessionManager from "../../../lib/SessionManager";


function BankManagementModal({
                                 userData,
                                 visible,
                                 onClose,
                                 onSuccess,
                                 currentBankDetails,
                                 driverId
                             }) {
    const [step, setStep] = useState(1); // 1: View, 2: Add/Edit Form, 3: Summary
    const [loading, setLoading] = useState(false);
    const [customAlert, setCustomAlert] = useState({ visible: false, type: '', message: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [settingPrimaryId, setSettingPrimaryId] = useState(null); // Add this state

    // Bank data
    const [filteredBanks, setFilteredBanks] = useState(NIGERIAN_BANKS);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBankList, setShowBankList] = useState(false);

    // Form data
    const [selectedBank, setSelectedBank] = useState(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingBankId, setEditingBankId] = useState(null);

    useEffect(() => {
        if (visible) {
            resetForm();
        }
    }, [visible]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = NIGERIAN_BANKS.filter(bank =>
                bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bank.code.includes(searchQuery)
            );
            setFilteredBanks(filtered);
        } else {
            setFilteredBanks(NIGERIAN_BANKS);
        }
    }, [searchQuery]);

    const showAlert = (type, message) => {
        setCustomAlert({ visible: true, type, message });
    };

    const hideAlert = () => {
        setCustomAlert({ visible: false, type: '', message: '' });
    };

    const resetForm = () => {
        setStep(1);
        setSelectedBank(null);
        setAccountNumber('');
        setAccountName('');
        setSearchQuery('');
        setShowBankList(false);
        setIsEditing(false);
        setEditingBankId(null);
        setShowDeleteConfirm(false);
    };

    const handleBankSelect = (bank) => {
        setSelectedBank(bank);
        setShowBankList(false);
        setSearchQuery('');
    };

    const handleEditAccount = (bankDetails) => {
        const bank = NIGERIAN_BANKS.find(b => b.code === bankDetails.bankCode);
        if (bank) {
            setSelectedBank(bank);
            setAccountNumber(bankDetails.accountNumber);
            setAccountName(bankDetails.accountName);
            setIsEditing(true);
            setEditingBankId(bankDetails._id);
            setStep(2);
        }
    };

    const handleAddNewAccount = () => {
        resetForm();
        setStep(2);
        setIsEditing(false);
    };

    const handleDeleteAccount = (bankId) => {
        setEditingBankId(bankId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteAccount = async () => {
        try {
            setLoading(true);
            const bankId = {
                bankId: editingBankId
            }
            const result = await DriverUtils.deleteBankDetails(bankId);

            if (result.success) {
                showAlert('success', 'Bank account deleted successfully!');
                resetForm();
                await SessionManager.updateUser(result.userData);
                onSuccess();
                setTimeout(() => {
                    hideAlert();
                    onClose();
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.log('Delete bank error:', error);
            showAlert('error', error.message || 'Failed to delete bank account');
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleSaveBank = async () => {
        // Validation
        if (!accountName.trim()) {
            showAlert('error', 'Please enter account name');
            return;
        }

        if (!selectedBank) {
            showAlert('error', 'Please select a bank');
            return;
        }

        if (!accountNumber || accountNumber.length !== 10) {
            showAlert('error', 'Please enter a valid 10-digit account number');
            return;
        }

        setStep(3); // Move to summary step
    };

    const handleConfirmSave = async () => {
        try {
            setLoading(true);

            const bankDetails = {
                accountName: accountName.trim(),
                accountNumber,
                bankName: selectedBank.name,
                bankCode: selectedBank.code,
                isPrimary: true,
                verified: true,
                editingBankId
            };

            let result;
            if (isEditing && editingBankId) {
                result = await DriverUtils.updateBankDetails(bankDetails);
            } else {
                result = await DriverUtils.newBankDetails(bankDetails);
            }

            if (result.success) {
                showAlert('success', `Bank account ${isEditing ? 'updated' : 'added'} successfully!`);
                resetForm();
                await SessionManager.updateUser(result.userData);
                onSuccess();
                setTimeout(() => {
                    hideAlert();
                    onClose();
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Save bank error:', error);
            showAlert('error', error.message || `Failed to ${isEditing ? 'update' : 'add'} bank account`);
            setStep(2); // Go back to form on error
        } finally {
            setLoading(false);
        }
    };

    const renderCustomAlert = () => {
        if (!customAlert.visible) return null;

        const alertConfig = {
            success: { bg: '#f0fdf4', border: '#d1fae5', icon: CheckCircle2, iconColor: '#10b981' },
            error: { bg: '#fef2f2', border: '#fecaca', icon: AlertCircle, iconColor: '#ef4444' }
        };

        const config = alertConfig[customAlert.type] || alertConfig.error;
        const IconComponent = config.icon;

        return (
            <View style={[styles.alertContainer, { backgroundColor: config.bg, borderColor: config.border }]}>
                <IconComponent size={20} color={config.iconColor} />
                <Text style={[styles.alertText, { color: config.iconColor }]}>
                    {customAlert.message}
                </Text>
                <TouchableOpacity onPress={hideAlert} style={styles.alertCloseButton}>
                    <X size={16} color={config.iconColor} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderDeleteConfirmation = () => {
        if (!showDeleteConfirm) return null;

        return (
            <View style={styles.deleteConfirmOverlay}>
                <View style={styles.deleteConfirmModal}>
                    <View style={styles.deleteConfirmHeader}>
                        <AlertCircle size={24} color="#ef4444" />
                        <Text style={styles.deleteConfirmTitle}>Delete Bank Account</Text>
                    </View>
                    <Text style={styles.deleteConfirmMessage}>
                        Are you sure you want to delete this bank account? This action cannot be undone.
                    </Text>
                    <View style={styles.deleteConfirmActions}>
                        <TouchableOpacity
                            onPress={() => setShowDeleteConfirm(false)}
                            style={[styles.deleteConfirmButton, styles.cancelDeleteButton]}
                            disabled={loading}
                        >
                            <Text style={styles.cancelDeleteText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={confirmDeleteAccount}
                            style={[styles.deleteConfirmButton, styles.confirmDeleteButton]}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.confirmDeleteText}>Delete</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderCurrentBank = () => {
        // Get all bank accounts, primary first
        const bankAccounts = userData?.verification?.basicVerification?.bankAccounts || [];
        const sortedAccounts = [...bankAccounts].sort((a, b) =>
            b.isPrimary ? 1 : -1
        );

        return (
            <View style={styles.contentContainer}>
                <Text style={styles.sectionTitle}>Bank Accounts</Text>

                {sortedAccounts.length > 0 ? (
                    <View>
                        {sortedAccounts.map((account, index) => (
                            <View key={account._id} style={[
                                styles.verifiedBankCard,
                                index !== 0 && styles.bankCardMarginTop
                            ]}>
                                <View style={styles.bankCardHeader}>
                                    <View style={styles.bankCardMain}>
                                        <View style={styles.bankIconWrapper}>
                                            <CreditCard size={20} color="#10b981" />
                                        </View>
                                        <View style={styles.bankInfo}>
                                            <View style={styles.accountHeader}>
                                                <Text style={styles.verifiedAccountName}>
                                                    {account.accountName}
                                                </Text>
                                                {account.isPrimary && (
                                                    <View style={styles.primaryBadge}>
                                                        <Text style={styles.primaryBadgeText}>Primary</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.verifiedBankName}>
                                                {account.bankName}
                                            </Text>
                                            <Text style={styles.verifiedAccountNumber}>
                                                {account.accountNumber}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity
                                            onPress={() => handleEditAccount(account)}
                                            style={[styles.iconButton, styles.editIconButton]}
                                        >
                                            <Edit3 size={18} color="#3b82f6" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteAccount(account._id)}
                                            style={[styles.iconButton, styles.deleteIconButton]}
                                            disabled={account.isPrimary && sortedAccounts.length > 1}
                                        >
                                            <Trash2 size={18} color={account.isPrimary && sortedAccounts.length > 1 ? "#9ca3af" : "#ef4444"} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Add this section for Make Primary button */}
                                <View style={styles.cardFooter}>
                                    <View style={styles.verifiedBadge}>
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <Text style={styles.verifiedBadgeText}>Verified Account</Text>
                                    </View>

                                    {/* Make Primary Button - Show only for non-primary accounts */}
                                    {!account.isPrimary && (
                                        <TouchableOpacity
                                            onPress={() => handleSetPrimaryAccount(account._id)}
                                            disabled={loading && settingPrimaryId === account._id}
                                            style={[
                                                styles.makePrimaryButton,
                                                (loading && settingPrimaryId === account._id) && styles.makePrimaryButtonDisabled
                                            ]}
                                        >
                                            {loading && settingPrimaryId === account._id ? (
                                                <ActivityIndicator size="small" color="#ffffff" />
                                            ) : (
                                                <Text style={styles.makePrimaryButtonText}>
                                                    Make Primary
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={handleAddNewAccount}
                            style={styles.addNewButton}
                        >
                            <Plus size={20} color="#10b981" />
                            <Text style={styles.addNewButtonText}>Add Another Account</Text>
                        </TouchableOpacity>
                    </View>
                )  : (
                    <View style={styles.emptyBankState}>
                        <View style={styles.emptyBankIcon}>
                            <CreditCard size={32} color="#6b7280" />
                        </View>
                        <Text style={styles.emptyBankTitle}>No Bank Account Added</Text>
                        <Text style={styles.emptyBankSubtitle}>
                            Add your bank account to receive withdrawals
                        </Text>
                        <TouchableOpacity
                            onPress={handleAddNewAccount}
                            style={styles.addBankButton}
                        >
                            <Text style={styles.addBankButtonText}>Add Bank Account</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderAddBankForm = () => (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.formTitle}>
                {isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
            </Text>

            {/* Account Name */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                    placeholder="Enter account name"
                    value={accountName}
                    onChangeText={setAccountName}
                    style={styles.textInput}
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Bank Selection */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank</Text>
                <TouchableOpacity
                    onPress={() => setShowBankList(!showBankList)}
                    style={styles.bankSelector}
                >
                    {selectedBank ? (
                        <View style={styles.selectedBankInfo}>
                            <Text style={styles.selectedBankName}>
                                {selectedBank.name}
                            </Text>
                            <Text style={styles.selectedBankCode}>
                                Code: {selectedBank.code}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.bankPlaceholder}>Choose your bank</Text>
                    )}
                    <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {/* Bank List Dropdown */}
            {showBankList && (
                <View style={styles.bankListContainer}>
                    <View style={styles.searchContainer}>
                        <Search size={16} color="#6b7280" />
                        <TextInput
                            placeholder="Search banks..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={styles.searchInput}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <ScrollView
                        style={styles.bankList}
                        nestedScrollEnabled={true}
                    >
                        {filteredBanks.map((item) => (
                            <TouchableOpacity
                                key={item.code}
                                onPress={() => handleBankSelect(item)}
                                style={[
                                    styles.bankItem,
                                    selectedBank?.code === item.code && styles.bankItemSelected
                                ]}
                            >
                                <View style={styles.bankItemContent}>
                                    <Text style={styles.bankItemName}>{item.name}</Text>
                                    <Text style={styles.bankItemCode}>Code: {item.code}</Text>
                                </View>
                                {selectedBank?.code === item.code && (
                                    <CheckCircle2 size={20} color="#10b981" />
                                )}
                            </TouchableOpacity>
                        ))}
                        {filteredBanks.length === 0 && (
                            <View style={styles.emptySearch}>
                                <Text style={styles.emptySearchText}>No banks found</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Account Number */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                    placeholder="0000000000"
                    keyboardType="numeric"
                    maxLength={10}
                    value={accountNumber}
                    onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
                    style={styles.textInput}
                    placeholderTextColor="#9ca3af"
                />
                {accountNumber.length > 0 && accountNumber.length < 10 && (
                    <Text style={styles.errorText}>
                        Account number must be 10 digits
                    </Text>
                )}
            </View>

            <View style={styles.blankSpace} />
        </ScrollView>
    );

    const renderSummary = () => (
        <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Confirm Bank Details</Text>

            <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Account Name:</Text>
                    <Text style={styles.summaryValue}>{accountName}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Bank:</Text>
                    <Text style={styles.summaryValue}>{selectedBank?.name}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Account Number:</Text>
                    <Text style={styles.summaryValue}>{accountNumber}</Text>
                </View>
            </View>

            <View style={styles.infoCard}>
                <AlertCircle size={20} color="#3b82f6" />
                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Important</Text>
                    <Text style={styles.infoText}>
                        Please ensure all details are correct. Withdrawals will be sent to this account.
                    </Text>
                </View>
            </View>
        </View>
    );

    const handleSetPrimaryAccount = async (bankId) => {
        try {
            setSettingPrimaryId(bankId);
            setLoading(true);

            const result = await DriverUtils.setPrimaryBankAccount({bankId});

            if (result.success) {
                showAlert('success', 'Primary bank account updated successfully!');
                await SessionManager.updateUser(result.userData);
                onSuccess();
                setTimeout(() => {
                    hideAlert();
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.log('Set primary bank error:', error);
            showAlert('error', error.message || 'Failed to set primary bank account');
        } finally {
            setLoading(false);
            setSettingPrimaryId(null);
        }
    };

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
                style={styles.modalContainer}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Custom Alert */}
                        {renderCustomAlert()}

                        {/* Delete Confirmation Modal */}
                        {renderDeleteConfirmation()}

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (step === 3) {
                                        setStep(2); // Go back to form from summary
                                    } else if (step === 2) {
                                        setStep(1); // Go back to view from form
                                    } else {
                                        resetForm();
                                        onClose();
                                    }
                                }}
                                style={styles.closeButton}
                            >
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>
                                {step === 1 ? 'Bank Account' :
                                    step === 2 ? (isEditing ? 'Edit Account' : 'Add Account') :
                                        'Confirm Details'}
                            </Text>
                            <View style={styles.headerSpacer} />
                        </View>

                        {/* Content */}
                        <View style={styles.modalBody}>
                            {step === 1 ? renderCurrentBank() :
                                step === 2 ? renderAddBankForm() :
                                    renderSummary()}
                        </View>

                        {/* Action Buttons */}
                        {step === 2 && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    onPress={() => setStep(1)}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSaveBank}
                                    disabled={!accountName || !selectedBank || accountNumber.length !== 10}
                                    style={[
                                        styles.saveButton,
                                        (!accountName || !selectedBank || accountNumber.length !== 10) && styles.saveButtonDisabled
                                    ]}
                                >
                                    <Text style={styles.saveButtonText}>Continue</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {step === 3 && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    onPress={() => setStep(2)}
                                    style={styles.cancelButton}
                                    disabled={loading}
                                >
                                    <Text style={styles.cancelButtonText}>Back</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleConfirmSave}
                                    disabled={loading}
                                    style={[
                                        styles.saveButton,
                                        loading && styles.saveButtonDisabled
                                    ]}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>
                                            {isEditing ? 'Update Account' : 'Save Account'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        maxHeight: '90%'
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
        padding: 8,
        marginLeft: -8,
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
        maxHeight: 500,
    },
    contentContainer: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 16,
    },
    verifiedBankCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    bankCardContent: {
        gap: 8,
    },
    bankIconWrapper: {
        backgroundColor: '#d1fae5',
        borderRadius: 50,
        padding: 8,
    },
    verifiedAccountName: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#065f46',
    },
    verifiedBankName: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#047857',
    },
    verifiedAccountNumber: {
        fontSize: 14,
        color: '#059669',
        fontFamily: 'PoppinsSemiBold',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1fae5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignSelf: 'flex-start',
        gap: 6,
        // marginTop: 8,
    },
    verifiedBadgeText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '500',
        color: '#047857',
    },
    changeBankButton: {
        borderWidth: 2,
        borderColor: '#10b981',
        borderRadius: 12,
        paddingVertical: 12,
    },
    changeBankButtonText: {
        textAlign: 'center',
        fontFamily: 'PoppinsSemiBold',
        color: '#10b981',
    },
    emptyBankState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyBankIcon: {
        backgroundColor: '#f3f4f6',
        borderRadius: 50,
        padding: 16,
        marginBottom: 12,
    },
    emptyBankTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    emptyBankSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    addBankButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    addBankButtonText: {
        color: '#ffffff',
        fontFamily: 'PoppinsSemiBold',

    },
    formContainer: {
        flex: 1,
        padding: 24,
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressStep: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e5e7eb',
    },
    progressStepActive: {
        backgroundColor: '#10b981',
    },
    progressGap: {
        width: 8,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
    },
    progressLabelActive: {
        color: '#10b981',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    bankSelector: {
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedBankInfo: {
        flex: 1,
    },
    selectedBankName: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#111827',
    },
    selectedBankCode: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'PoppinsSemiBold',
        marginTop: 2,
    },
    bankPlaceholder: {
        color: '#9ca3af',
    },
    bankListContainer: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    bankList: {
        maxHeight: 250,
    },
    bankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: '#ffffff',
    },
    bankItemSelected: {
        backgroundColor: '#f0fdf4',
    },
    bankItemContent: {
        flex: 1,
    },
    bankItemName: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    bankItemCode: {
        fontSize: 12,
        color: '#6b7280',
    },
    emptySearch: {
        padding: 32,
        alignItems: 'center',
    },
    emptySearchText: {
        color: '#9ca3af',
    },
    accountNumberRow: {
        flexDirection: 'row',
        gap: 8,
    },
    accountNumberInput: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    verifyButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    verifyButtonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        color: '#ffffff',
        fontFamily: 'PoppinsSemiBold',
    },
    errorText: {
        fontSize: 12,
        color: '#f97316',
        fontFamily: 'PoppinsRegular',
        marginTop: 4,
    },
    verifiedAccountCard: {
        backgroundColor: '#f0fdf4',
        borderWidth: 2,
        borderColor: '#d1fae5',
        borderRadius: 12,
        padding: 16,
    },
    verifiedAccountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    verifiedAccountLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#047857',
    },
    verifiedAccountNameText: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#065f46',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginTop: 8,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#1e40af',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#1d4ed8',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#e5e7eb',
        borderRadius: 16,
        paddingVertical: 16,
    },
    cancelButtonText: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#374151',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#10b981',
        borderRadius: 16,
        paddingVertical: 16,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    blankSpace: {
        height: 12,
    },
    alertContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    alertText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    alertCloseButton: {
        padding: 4,
    },
    formTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 24,
    },
    textInput: {
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 2,
    },
    editButton: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    deleteButton: {
        borderColor: '#fecaca',
        backgroundColor: '#fef2f2',
    },
    actionButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    editButtonText: {
        color: '#3b82f6',
    },
    deleteButtonText: {
        color: '#ef4444',
    },
    addNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#10b981',
        borderRadius: 12,
        paddingVertical: 12,
    },
    addNewButtonText: {
        color: '#10b981',
        fontFamily: 'PoppinsSemiBold',
    },
    summaryContainer: {
        padding: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 16,
    },
    summaryCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
    },
    summaryValue: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    bankInfo: {
        flex: 1,
    },
    bankCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bankCardMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
    },
    editIconButton: {
        backgroundColor: '#eff6ff',
    },
    deleteIconButton: {
        backgroundColor: '#fef2f2',
    },
    deleteConfirmOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    deleteConfirmModal: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        margin: 20,
        width: '80%',
        maxWidth: 400,
    },
    deleteConfirmHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    deleteConfirmTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    deleteConfirmMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
        lineHeight: 20,
    },
    deleteConfirmActions: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteConfirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelDeleteButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    confirmDeleteButton: {
        backgroundColor: '#ef4444',
    },
    cancelDeleteText: {
        color: '#374151',
        fontFamily: 'PoppinsSemiBold',
    },
    confirmDeleteText: {
        color: '#ffffff',
        fontFamily: 'PoppinsSemiBold',
    },



    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#d1fae5',
    },

    makePrimaryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 100,
    },

    makePrimaryButtonDisabled: {
        backgroundColor: '#9ca3af',
        opacity: 0.6,
    },

    makePrimaryButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        textAlign: 'center',
    },
});

export default BankManagementModal;