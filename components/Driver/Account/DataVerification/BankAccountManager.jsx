import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Alert,
    Modal,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NIGERIAN_BANKS } from "/utils/Driver/Constants"

function BankAccountManager({ accounts, onUpdate }) {
    const [showModal, setShowModal] = useState(false);
    const [showBankPicker, setShowBankPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        accountName: '',
        accountNumber: '',
        bankName: '',
        bankCode: '',
        isPrimary: accounts.length === 0
    });

    const filteredBanks = NIGERIAN_BANKS.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleBankSelect = (bank) => {
        setFormData({
            ...formData,
            bankName: bank.name,
            bankCode: bank.code
        });
        setShowBankPicker(false);
        setSearchQuery('');
    };

    const handleAddAccount = () => {
        if (!formData.accountNumber || !formData.bankName) {
            Alert.alert('Error', 'Please select bank and enter account number');
            return;
        }

        if (formData.accountNumber.length !== 10) {
            Alert.alert('Error', 'Account number must be 10 digits');
            return;
        }

        const newAccount = {
            ...formData,
            accountName: formData.accountName || 'Account Holder',
            id: Date.now().toString(),
            addedAt: new Date().toISOString(),
            verified: false
        };

        onUpdate([...accounts, newAccount]);
        setShowModal(false);
        resetForm();
    };

    const handleDeleteAccount = (accountId) => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to remove this bank account?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const updated = accounts.filter(acc => acc.id !== accountId);
                        onUpdate(updated);
                    }
                }
            ]
        );
    };

    const handleSetPrimary = (accountId) => {
        const updated = accounts.map(acc => ({
            ...acc,
            isPrimary: acc.id === accountId
        }));
        onUpdate(updated);
    };

    const resetForm = () => {
        setFormData({
            accountName: '',
            accountNumber: '',
            bankName: '',
            bankCode: '',
            isPrimary: accounts.length === 0
        });
        setSearchQuery('');
    };

    return (
        <>
            <View style={styles.container}>
                {accounts.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="wallet-outline" size={48} color="#9ca3af" />
                        <Text style={styles.emptyText}>No bank accounts added yet</Text>
                    </View>
                )}

                {accounts.map(account => (
                    <View key={account.id} style={styles.accountCard}>
                        <View style={styles.accountHeader}>
                            <View style={styles.accountInfo}>
                                <Text style={styles.accountName}>{account.accountName}</Text>
                                <Text style={styles.accountNumber}>{account.accountNumber}</Text>
                                <Text style={styles.bankName}>{account.bankName}</Text>
                            </View>

                            {account.isPrimary && (
                                <View style={styles.primaryBadge}>
                                    <Text style={styles.primaryText}>Primary</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.accountActions}>
                            {!account.isPrimary && (
                                <Pressable
                                    style={styles.actionBtn}
                                    onPress={() => handleSetPrimary(account.id)}
                                >
                                    <Ionicons name="star-outline" size={16} color="#6b7280" />
                                    <Text style={styles.actionBtnText}>Set Primary</Text>
                                </Pressable>
                            )}

                            <Pressable
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => handleDeleteAccount(account.id)}
                            >
                                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                <Text style={[styles.actionBtnText, styles.deleteText]}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                ))}

                <Pressable style={styles.addButton} onPress={() => setShowModal(true)}>
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.addGradient}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.addButtonText}>Add Bank Account</Text>
                    </LinearGradient>
                </Pressable>
            </View>

            {/* Add Account Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showModal}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalContainer}>
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setShowModal(false)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Bank Account</Text>
                            <Pressable onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        {/* Bank Selection with Search */}
                        <Pressable
                            style={styles.bankSelector}
                            onPress={() => setShowBankPicker(true)}
                        >
                            <Text style={[styles.bankSelectorText, !formData.bankName && styles.placeholder]}>
                                {formData.bankName || 'Select Bank'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6b7280" />
                        </Pressable>

                        <TextInput
                            style={styles.input}
                            placeholder="Account Number (10 digits)"
                            keyboardType="numeric"
                            maxLength={10}
                            value={formData.accountNumber}
                            onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Account Holder Name (Optional)"
                            value={formData.accountName}
                            onChangeText={(text) => setFormData({ ...formData, accountName: text })}
                        />

                        <View style={styles.modalActions}>
                            <Pressable
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.saveBtn,
                                    (!formData.bankName || formData.accountNumber.length !== 10) && styles.saveBtnDisabled
                                ]}
                                onPress={handleAddAccount}
                                disabled={!formData.bankName || formData.accountNumber.length !== 10}
                            >
                                <LinearGradient
                                    colors={(!formData.bankName || formData.accountNumber.length !== 10) ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                                    style={styles.saveGradient}
                                >
                                    <Text style={styles.saveBtnText}>Add Account</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Searchable Bank Picker Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showBankPicker}
                onRequestClose={() => setShowBankPicker(false)}
            >
                <View style={styles.modalContainer}>
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setShowBankPicker(false)}
                    />
                    <View style={styles.bankPickerContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Bank</Text>
                            <Pressable onPress={() => setShowBankPicker(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#6b7280" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search banks..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                                </Pressable>
                            )}
                        </View>

                        <FlatList
                            data={filteredBanks}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.bankItem}
                                    onPress={() => handleBankSelect(item)}
                                >
                                    <Text style={styles.bankItemText}>{item.name}</Text>
                                    {formData.bankCode === item.code && (
                                        <Ionicons name="checkmark" size={20} color="#10b981" />
                                    )}
                                </Pressable>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={() => (
                                <View style={styles.emptySearch}>
                                    <Text style={styles.emptySearchText}>No banks found</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8
    },
    accountCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    accountHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    accountInfo: {
        flex: 1
    },
    accountName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4
    },
    accountNumber: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2
    },
    bankName: {
        fontSize: 13,
        color: '#9ca3af'
    },
    primaryBadge: {
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start'
    },
    primaryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff'
    },
    accountActions: {
        flexDirection: 'row',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        gap: 4,
        backgroundColor: '#fff'
    },
    deleteBtn: {
        marginLeft: 'auto'
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280'
    },
    deleteText: {
        color: '#ef4444'
    },
    addButton: {
        borderRadius: 12,
        overflow: 'hidden'
    },
    addGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '70%'
    },
    bankPickerContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827'
    },
    bankSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },
    bankSelectorText: {
        fontSize: 16,
        color: '#111827'
    },
    placeholder: {
        color: '#9ca3af'
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827'
    },
    bankItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16
    },
    bankItemText: {
        fontSize: 16,
        color: '#111827'
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e7eb'
    },
    emptySearch: {
        alignItems: 'center',
        paddingVertical: 32
    },
    emptySearchText: {
        fontSize: 14,
        color: '#9ca3af'
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8
    },
    cancelBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center'
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280'
    },
    saveBtn: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden'
    },
    saveBtnDisabled: {
        opacity: 0.5
    },
    saveGradient: {
        padding: 16,
        alignItems: 'center'
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    }
});

export default BankAccountManager;