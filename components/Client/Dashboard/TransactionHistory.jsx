// components/Client/Dashboard/TransactionHistory.jsx

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { CheckCircle, Clock, XCircle, Wallet } from 'lucide-react-native';
import { router } from 'expo-router';
import {Ionicons} from "@expo/vector-icons";

const TransactionItem = ({ transaction }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'failed': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return CheckCircle;
            case 'pending': return Clock;
            case 'failed': return XCircle;
            default: return Wallet;
        }
    };

    const formatAmount = (amount) => {
        return `₦${parseFloat(amount).toLocaleString('en-NG')}`;
    };

    const formatDate = (date) => {
        const now = new Date();
        const transDate = new Date(date);
        const diffMs = now - transDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return transDate.toLocaleDateString();
    };

    const getTransactionTitle = (type) => {
        switch (type) {
            case 'client_payment': return 'Order Payment';
            case 'wallet_deposit': return 'Wallet Top Up';
            case 'wallet_deduction': return 'Wallet Payment';
            case 'refund': return 'Refund';
            default: return 'Transaction';
        }
    };

    const StatusIcon = getStatusIcon(transaction.status);

    return (
        <View style={styles.transactionItem}>
            <View style={[
                styles.transactionIcon,
                { backgroundColor: getStatusColor(transaction.status) }
            ]}>
                <StatusIcon size={20} color="white" />
            </View>
            <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>
                    {getTransactionTitle(transaction.transactionType)}
                </Text>
                <Text style={styles.transactionDescription}>
                    {transaction.metadata?.description ||
                        `Order ${transaction.orderId?.toString().slice(-8)}`}
                </Text>
            </View>
            <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>
                    {formatAmount(transaction.amount.gross)}
                </Text>
                <Text style={styles.transactionTime}>
                    {formatDate(transaction.createdAt)}
                </Text>
            </View>
        </View>
    );
};

function TransactionHistory({ transactions }) {
    const handleSeeAll = () => {
        router.push('/client/profile/analytics');
    };

    return (
        <View style={styles.historySection}>
            <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Recent Transactions</Text>
                <TouchableOpacity onPress={handleSeeAll}>
                    <Ionicons name="open" size={22} color="green" />
                </TouchableOpacity>
            </View>

            <View style={styles.transactionsList}>
                {transactions && transactions.length > 0 ? (
                    <FlatList
                        data={transactions}
                        keyExtractor={(item, index) => item._id || index.toString()}
                        renderItem={({ item }) => <TransactionItem transaction={item} />}
                        scrollEnabled={false}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Wallet size={48} color="#d1d5db" />
                        <Text style={styles.emptyStateText}>No transactions yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Your transaction history will appear here
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    historySection: {
        marginBottom: 24,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    historyTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#1f2937',
    },
    seeAllText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
    transactionsList: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 2,
    },
    transactionDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#6b7280',
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 2,
    },
    transactionTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 12,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
    },
});

export default TransactionHistory;