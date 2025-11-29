// components/Driver/Finance/FinanceManager.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StyleSheet
} from 'react-native';
import {
    Wallet,
    TrendingUp,
    Clock,
    CheckCircle,
    Eye,
    EyeOff,
    CreditCard,
    Plus
} from 'lucide-react-native';
import { toast } from "sonner-native";


import BankManagementModal from './BankManagementModal';
import {queryClient} from "../../../lib/queryClient";

function FinanceManager({
                            userData,
                            financialSummary,
                            refetch,
                            isLoading,
                            onNavigateToPayouts
                        }) {
    const [refreshing, setRefreshing] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [bankModal, setBankModal] = useState(false);

    // Extract bank details from userData
    const bankAccounts = userData?.verification?.basicVerification?.bankAccounts || [];
    const sortedAccounts = [...bankAccounts].sort((a, b) =>
        b.isPrimary ? 1 : -1
    );
    const hasBankAccounts = sortedAccounts.length > 0;


    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₦0.00';
        return `₦  ${amount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const handleBankUpdateSuccess = async () => {
        await queryClient.invalidateQueries(['FinancialSummary']);
        await queryClient.invalidateQueries(['userData']);
        refetch();
        setBankModal(false);
    };

    const handleWithdrawPress = () => {
        // Check if bank account exists
        const hasVerifiedAccount = bankAccounts.some(acc => acc.verified);

        if (!hasVerifiedAccount) {
            setBankModal(true);
            return;
        }

        // Navigate to payout tab
        if (onNavigateToPayouts) {
            onNavigateToPayouts();
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading financial data...</Text>
            </View>
        );
    }

    const renderOverview = () => (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                    <View style={styles.balanceContent}>
                        <Text style={styles.balanceLabel}>Available Balance</Text>
                        <View style={styles.balanceAmountContainer}>
                            {showBalance ? (
                                <Text style={styles.balanceAmount}>
                                    {formatCurrency(financialSummary.availableBalance || userData?.wallet?.balance || 0)}
                                </Text>
                            ) : (
                                <Text style={styles.balanceAmount}>••••••••</Text>
                            )}
                            <TouchableOpacity
                                onPress={() => setShowBalance(!showBalance)}
                                style={styles.eyeButton}
                            >
                                {showBalance ? (
                                    <Eye size={22} color="#ffffff" />
                                ) : (
                                    <EyeOff size={22} color="#ffffff" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.walletIconContainer}>
                        <Wallet size={28} color="#ffffff" />
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Pending Earnings</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(financialSummary.pendingEarnings || 0)}
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Withdrawn</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(financialSummary.totalWithdrawn || 0)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleWithdrawPress}
                    disabled={(financialSummary.availableBalance  || 0) < 1000}
                    style={[
                        styles.withdrawButton,
                        (financialSummary.availableBalance  || 0) < 1000 && styles.withdrawButtonDisabled
                    ]}
                    activeOpacity={0.8}
                >
                    <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
                </TouchableOpacity>

                {(financialSummary.availableBalance || 0) < 1000 && (
                    <Text style={styles.minimumText}>
                        Minimum withdrawal amount is ₦1,000
                    </Text>
                )}
            </View>

            {/* Quick Stats Grid */}
            <View className="flex-row flex-wrap mx-4 mb-4 gap-3">
                {/* Total Earned */}
                <View className="flex-1 min-w-[45%] bg-white rounded-2xl p-4 shadow-sm">
                    <View className="bg-green-100 self-start rounded-full p-2 mb-3">
                        <TrendingUp size={20} color="#10b981"/>
                    </View>
                    <Text className="text-gray-500 text-xs mb-1">Total Earned</Text>
                    <Text className="text-gray-900 text-xl font-bold">
                        {formatCurrency(financialSummary.totalEarnings || 0)}
                    </Text>
                    <Text className="text-green-600 text-xs mt-1">
                        Lifetime earnings
                    </Text>
                </View>

                {/* Deliveries */}
                <View className="flex-1 min-w-[45%] bg-white rounded-2xl p-4 shadow-sm">
                    <View className="bg-blue-100 self-start rounded-full p-2 mb-3">
                        <CheckCircle size={20} color="#3b82f6"/>
                    </View>
                    <Text className="text-gray-500 text-xs mb-1">Deliveries</Text>
                    <Text className="text-gray-900 text-xl font-bold">
                        {financialSummary.totalDeliveries || 0}
                    </Text>
                    <Text className="text-blue-600 text-xs mt-1">
                        Avg: {formatCurrency(financialSummary.averageEarning || 0)}
                    </Text>
                </View>

                {/* Performance */}
                <View className="flex-1 min-w-[45%] bg-white rounded-2xl p-4 shadow-sm">
                    <View className="bg-purple-100 self-start rounded-full p-2 mb-3">
                        <Clock size={20} color="#8b5cf6"/>
                    </View>
                    <Text className="text-gray-500 text-xs mb-1">This Month</Text>
                    <Text className="text-gray-900 text-xl font-bold">
                        {userData.performance?.monthlyStats?.deliveries || 0}
                    </Text>
                    <Text className="text-purple-600 text-xs mt-1">
                        {formatCurrency(userData.performance?.monthlyStats?.earnings || 0)}
                    </Text>
                </View>

                {/* Growth */}
                <View className="flex-1 min-w-[45%] bg-white rounded-2xl p-4 shadow-sm">
                    <View className="bg-orange-100 self-start rounded-full p-2 mb-3">
                        <TrendingUp size={20} color="#f97316"/>
                    </View>
                    <Text className="text-gray-500 text-xs mb-1">Growth Rate</Text>
                    <Text className="text-gray-900 text-xl font-bold">
                        +{(((financialSummary.totalDeliveries || 0) / 12) * 100).toFixed(0)}%
                    </Text>
                    <Text className="text-orange-600 text-xs mt-1">
                        Monthly average
                    </Text>
                </View>
            </View>

            {/* Bank Account Card */}
            <View style={styles.bankCard}>
                <View style={styles.bankCardHeader}>
                    <Text style={styles.bankCardTitle}>Bank Accounts</Text>
                    <TouchableOpacity onPress={() => setBankModal(true)}>
                        <Text style={styles.manageText}>
                            {hasBankAccounts ? 'Manage' : 'Add'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {hasBankAccounts ? (
                    <View style={styles.bankAccountsList}>
                        {sortedAccounts.map((account, index) => (
                            <View key={account._id} style={[
                                styles.bankAccountItem,
                                index !== 0 && styles.bankAccountItemMargin
                            ]}>
                                <View style={styles.bankIconContainer}>
                                    <CreditCard size={20} color="#10b981" />
                                </View>
                                <View style={styles.bankInfo}>
                                    <View style={styles.accountHeader}>
                                        <Text style={styles.accountName}>
                                            {account.accountName}
                                        </Text>
                                        {account.isPrimary && (
                                            <View style={styles.primaryTag}>
                                                <Text style={styles.primaryTagText}>Primary</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.bankName}>
                                        {account.bankName}
                                    </Text>
                                    <Text style={styles.accountNumber}>
                                        {account.accountNumber}
                                    </Text>
                                </View>
                                <CheckCircle size={18} color="#10b981" />
                            </View>
                        ))}
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => setBankModal(true)}
                        style={styles.addBankButton}
                    >
                        <Plus size={20} color="#6b7280" />
                        <Text style={styles.addBankText}>Add Bank Account</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );



    return (
        <>
            <View style={styles.mainContainer}>
                {/* Header Title */}
                <View style={styles.headerTitleSection}>
                    <Text style={styles.headerMainTitle}>Finance Manager</Text>
                    <Text style={styles.headerSubtitle}>
                        Track your earnings, and payout insights
                    </Text>
                </View>

                {/* Tab Content */}
                {renderOverview()}

                <BankManagementModal
                    visible={bankModal}
                    onClose={() => setBankModal(false)}
                    onSuccess={handleBankUpdateSuccess}
                    driverId={userData?.id}
                    userData={userData}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    headerTitleSection: {
        alignItems: 'flex-start',
        marginTop: 60,
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    headerMainTitle: {
        fontSize: 24,
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: -2,
        fontFamily: 'PoppinsSemiBold'
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 16,
        color: '#6b7280',
    },
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    balanceCard: {
        borderRadius: 24,
        marginRight: 8,
        marginLeft: 8,
        marginBottom: 16,
        backgroundColor: '#10b981',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    balanceContent: {
        flex: 1,
    },
    balanceLabel: {
        color: '#ffffff',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
        opacity: 0.9,
    },
    balanceAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceAmount: {
        color: '#ffffff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    eyeButton: {
        marginLeft: 12,
        padding: 8,
    },
    walletIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 50,
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 16,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        color: '#ffffff',
        fontSize: 12,
        marginBottom: 4,
        opacity: 0.8,
    },
    statValue: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statDivider: {
        height: 32,
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 16,
    },
    withdrawButton: {
        backgroundColor: '#ffffff',
        marginTop: 16,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    withdrawButtonDisabled: {
        opacity: 0.5,
    },
    withdrawButtonText: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 16,
    },
    minimumText: {
        color: '#ffffff',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.7,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIconContainer: {
        alignSelf: 'flex-start',
        borderRadius: 50,
        padding: 8,
        marginBottom: 12,
    },
    greenIcon: {
        backgroundColor: '#d1fae5',
    },
    blueIcon: {
        backgroundColor: '#dbeafe',
    },
    purpleIcon: {
        backgroundColor: '#ede9fe',
    },
    orangeIcon: {
        backgroundColor: '#fed7aa',
    },
    statCardLabel: {
        color: '#6b7280',
        fontSize: 12,
        marginBottom: 4,
    },
    statCardValue: {
        color: '#111827',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statCardSubtext: {
        color: '#10b981',
        fontSize: 12,
        marginTop: 4,
    },
    bankCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    bankCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    bankCardTitle: {
        color: '#111827',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 16,
    },
    manageText: {
        color: '#10b981',
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
    },
    bankDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
    },
    bankInfo: {
        flex: 1,
    },
    accountName: {
        color: '#111827',
        fontWeight: '600',
        fontSize: 16,
    },
    bankName: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
    },
    accountNumber: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 4,
    },
    addBankButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
    },
    addBankText: {
        color: '#6b7280',
        marginLeft: 8,
        fontWeight: '500',
    },

    bankAccountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
    },
    bankAccountItemMargin: {
        marginTop: 12,
    },
    accountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    primaryTag: {
        backgroundColor: '#d1fae5',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    primaryTagText: {
        color: '#065f46',
        fontSize: 10,
        fontWeight: '600',
    },
    // Update bankIconContainer for smaller size
    bankIconContainer: {
        backgroundColor: '#d1fae5',
        borderRadius: 50,
        padding: 10,
        marginRight: 12,
    },
});

export default FinanceManager;