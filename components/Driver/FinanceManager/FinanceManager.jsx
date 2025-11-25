// components/Driver/FinanceManager/FinanceManager.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert
} from 'react-native';
import {
    Wallet,
    TrendingUp,
    Clock,
    ChevronRight,
    CheckCircle,
    Eye,
    EyeOff,
    CreditCard,
    Plus
} from 'lucide-react-native';

import WithdrawalModal from './WithdrawalModal';
import BankManagementModal from './BankManagementModal';
import EarningsTab from './EarningsTab';
import PayoutsTab from './PayoutsTab';
import {useQuery} from "@tanstack/react-query";
import DriverUtils from "../../../utils/DriverUtilities";

function FinanceManager({ userData }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showBalance, setShowBalance] = useState(true);

    // Financial Data
    const [financialSummary, setFinancialSummary] = useState(null);
    const [earningsHistory, setEarningsHistory] = useState([]);
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [earningsPagination, setEarningsPagination] = useState({});
    const [payoutPagination, setPayoutPagination] = useState({});

    // Modals
    const [withdrawalModal, seithdrawalModal] = useState(false);
    const [bankModal, setBankModal] = useState(false);

    useEffect(() => {
        loadFinancialData();
    }, []);

    const loadFinancialData = async () => {
        try {
            setLoading(true);

            // Load financial summary
            const summary = await DriverUtils.getFinancialSummary();
            setFinancialSummary(summary.summary);

            // Load earnings history (first page)
            const earnings = await DriverUtils.getEarningsHistory({page: 1});
            setEarningsHistory(earnings.earnings);
            setEarningsPagination(earnings.pagination);

            // Load payout history
            const payouts = await DriverUtils.getPayoutHistory({ status: 'all' });
            setPayoutHistory(payouts.payouts);
            setPayoutPagination(payouts.pagination);

        } catch (error) {
            console.error('Error loading financial data:', error);
            Alert.alert('Error', 'Failed to load financial data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFinancialData();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        return `₦${amount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View className='flex-1 justify-center items-center bg-gray-50'>
                <ActivityIndicator size="large" color="#10b981" />
                <Text className={`mt-4 text-gray-600`}>Loading financial data...</Text>
            </View>
        );
    }

    const renderOverview = () => (
        <ScrollView
            className={`flex-1 bg-gray-50`}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Balance Card - Gradient with glassmorphism effect */}
            <View className={`m-4 rounded-3xl overflow-hidden shadow-2xl`}>
                <View className={`bg-gradient-to-br from-emerald-500 to-green-600 p-6`}>
                    <View className={`flex-row justify-beeen items-start mb-6`}>
                        <View className={`flex-1`}>
                            <Text className={`text-white/80 text-sm mb-2 font-medium`}>
                                Available Balance
                            </Text>
                            <View className={`flex-row items-center`}>
                                {showBalance ? (
                                    <Text className={`text-white text-4xl font-bold`}>
                                        {formatCurrency(financialSummary.availableBalance)}
                                    </Text>
                                ) : (
                                    <Text className={`text-white text-4xl font-bold`}>••••••••</Text>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowBalance(!showBalance)}
                                    className={`ml-3 p-2`}
                                >
                                    {showBalance ? (
                                        <Eye size={22} color="white" />
                                    ) : (
                                        <EyeOff size={22} color="white" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View className={`bg-white/20 rounded-full p-4`}>
                            <Wallet size={28} color="white" />
                        </View>
                    </View>

                    <View className={`flex-row justify-beeen items-center bg-white/10 rounded-2xl p-4`}>
                        <View>
                            <Text className={`text-white/70 text-xs mb-1`}>Pending Earnings</Text>
                            <Text className={`text-white text-base font-bold`}>
                                {formatCurrency(financialSummary.pendingEarnings)}
                            </Text>
                        </View>
                        <View className={`h-8 w-px bg-white/30`} />
                        <View>
                            <Text className={`text-white/70 text-xs mb-1`}>Total Withdrawn</Text>
                            <Text className={`text-white text-base font-bold`}>
                                {formatCurrency(financialSummary.totalWithdrawn)}
                            </Text>
                        </View>
                    </View>

                    {/* Withdraw Button */}
                    <TouchableOpacity
                        onPress={() => seithdrawalModal(true)}
                        disabled={financialSummary.availableBalance < 1000}
                        className={`bg-white mt-4 rounded-2xl py-4 items-center ${
                            financialSummary.availableBalance < 1000 ? 'opacity-50' : ''
                        }`}
                        activeOpacity={0.8}
                    >
                        <Text className={`text-green-600 font-bold text-base`}>
                            Withdraw Funds
                        </Text>
                    </TouchableOpacity>

                    {financialSummary.availableBalance < 1000 && (
                        <Text className={`text-white/60 text-xs text-center mt-2`}>
                            Minimum withdrawal amount is ₦1,000
                        </Text>
                    )}
                </View>
            </View>

            {/* Quick Stats Grid */}
            <View className={`flex-row flex-wrap mx-4 mb-4 gap-3`}>
                {/* Total Earned */}
                <View className={`flex-1 min-w-[45%] bg-white rounded-2xl p-4 shadow-sm`}>
                    <View className={`bg-green-100 self-start rounded-full p-2 mb-3`}>
                        <TrendingUp size={20} color="#10b981" />
                    </View>
                    <Text className={`text-gray-500 text-xs mb-1`}>Total Earned</Text>
                    <Text className={`text-gray-900 text-xl font-bold`}>
                        {formatCurrency(financialSummary.totalEarnings)}
                    </Text>
                    <Text className={`text-green-600 text-xs mt-1`}>
                        Lifetime earnings
                    </Text>
                </View>

                {/* Deliveries */}
                <View className={`flex-1 min-w-[45%] bg-white rounded-2xl p-4 shadow-sm`}>
                    <View className={`bg-blue-100 self-start rounded-full p-2 mb-3`}>
                        <CheckCircle size={20} color="#3b82f6" />
                    </View>
                    <Text className={`text-gray-500 text-xs mb-1`}>Deliveries</Text>
                    <Text className={`text-gray-900 text-xl font-bold`}>
                        {financialSummary.totalDeliveries}
                    </Text>
                    <Text className={`text-blue-600 text-xs mt-1`}>
                        Avg: {formatCurrency(financialSummary.averageEarning)}
                    </Text>
                </View>

                {/* Performance */}
                <View className={`flex-1 min-w-[45%] bg-white rounded-2xl p-4 shadow-sm`}>
                    <View className={`bg-purple-100 self-start rounded-full p-2 mb-3`}>
                        <Clock size={20} color="#8b5cf6" />
                    </View>
                    <Text className={`text-gray-500 text-xs mb-1`}>This Month</Text>
                    <Text className={`text-gray-900 text-xl font-bold`}>
                        {userData.performance?.monthlyStats?.deliveries || 0}
                    </Text>
                    <Text className={`text-purple-600 text-xs mt-1`}>
                        {formatCurrency(userData.performance?.monthlyStats?.earnings || 0)}
                    </Text>
                </View>

                {/* Growth */}
                <View className={`flex-1 min-w-[45%] bg-white rounded-2xl p-4 shadow-sm`}>
                    <View className={`bg-orange-100 self-start rounded-full p-2 mb-3`}>
                        <TrendingUp size={20} color="#f97316" />
                    </View>
                    <Text className={`text-gray-500 text-xs mb-1`}>Growth Rate</Text>
                    <Text className={`text-gray-900 text-xl font-bold`}>
                        +{((financialSummary.totalDeliveries / 12) * 100).toFixed(0)}%
                    </Text>
                    <Text className={`text-orange-600 text-xs mt-1`}>
                        Monthly average
                    </Text>
                </View>
            </View>

            {/* Bank Account Card */}
            <View className={`bg-white mx-4 rounded-2xl p-5 mb-4 shadow-sm`}>
                <View className={`flex-row justify-beeen items-center mb-4`}>
                    <Text className={`text-gray-900 font-bold text-base`}>Bank Account</Text>
                    <TouchableOpacity onPress={() => setBankModal(true)}>
                        <Text className={`text-green-600 font-semibold`}>Manage</Text>
                    </TouchableOpacity>
                </View>

                {financialSummary.bankDetails?.verified ? (
                    <View className={`flex-row items-center bg-gray-50 rounded-xl p-4`}>
                        <View className={`bg-green-100 rounded-full p-3 mr-3`}>
                            <CreditCard size={24} color="#10b981" />
                        </View>
                        <View className={`flex-1`}>
                            <Text className={`text-gray-900 font-semibold text-base`}>
                                {financialSummary.bankDetails.accountName}
                            </Text>
                            <Text className={`text-gray-500 text-sm mt-1`}>
                                {financialSummary.bankDetails.bankName}
                            </Text>
                            <Text className={`text-gray-400 text-xs mt-1`}>
                                {financialSummary.bankDetails.accountNumber}
                            </Text>
                        </View>
                        <CheckCircle size={20} color="#10b981" />
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => setBankModal(true)}
                        className={`flex-row items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4`}
                    >
                        <Plus size={20} color="#6b7280" />
                        <Text className={`text-gray-600 ml-2 font-medium`}>
                            Add Bank Account
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Recent Earnings Section */}
            <View className={`bg-white mx-4 rounded-2xl p-5 mb-6 shadow-sm`}>
                <View className={`flex-row justify-beeen items-center mb-4`}>
                    <Text className={`text-gray-900 font-bold text-base`}>
                        Recent Earnings
                    </Text>
                    <TouchableOpacity
                        onPress={() => setActiveTab('earnings')}
                        className={`flex-row items-center`}
                    >
                        <Text className={`text-green-600 font-semibold mr-1`}>View All</Text>
                        <ChevronRight size={16} color="#10b981" />
                    </TouchableOpacity>
                </View>

                {earningsHistory.slice(0, 5).map((earning, index) => (
                    <View
                        key={earning._id}
                        className={`${
                            index !== 0 ? 'border-t border-gray-100 pt-3' : ''
                        } pb-3`}
                    >
                        <View className={`flex-row justify-beeen items-start`}>
                            <View className={`flex-1`}>
                                <Text className={`text-gray-900 font-semibold`}>
                                    {earning.orderId}
                                </Text>
                                <Text className={`text-gray-500 text-xs mt-1`}>
                                    {formatDate(earning.earnedAt)}
                                </Text>
                                {earning.status && (
                                    <View className={`mt-2`}>
                                        <View className={`self-start px-2 py-1 rounded-full ${
                                            earning.status === 'available' ? 'bg-green-100' :
                                                earning.status === 'withdrawn' ? 'bg-blue-100' : 'bg-yellow-100'
                                        }`}>
                                            <Text className={`text-xs font-medium capitalize ${
                                                earning.status === 'available' ? 'text-green-700' :
                                                    earning.status === 'withdrawn' ? 'text-blue-700' : 'text-yellow-700'
                                            }`}>
                                                {earning.status}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                            <Text className={`text-green-600 font-bold text-lg`}>
                                +{formatCurrency(earning.amount)}
                            </Text>
                        </View>
                    </View>
                ))}

                {earningsHistory.length === 0 && (
                    <View className={`py-8 items-center`}>
                        <Text className={`text-gray-400 text-center`}>
                            No earnings yet{'\n'}Complete deliveries to start earning!
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );

    return (
        <View className={`flex-1 bg-gray-50`}>
            {/* Tab Navigation */}
            <View className={`bg-white border-b border-gray-200`}>
                <View className={`flex-row px-4 py-2`}>
                    {[
                        { key: 'overview', label: 'Overview' },
                        { key: 'earnings', label: 'Earnings' },
                        { key: 'payouts', label: 'Payouts' }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setActiveTab(tab.key)}
                            className={`flex-1 py-3 ${
                                activeTab === tab.key ? 'border-b-2 border-green-500' : ''
                            }`}
                        >
                            <Text className={`text-center font-semibold ${
                                activeTab === tab.key ? 'text-green-600' : 'text-gray-500'
                            }`}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'earnings' && (
                <EarningsTab
                    driverId={userData._id}
                    initialData={earningsHistory}
                    initialPagination={earningsPagination}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                />
            )}
            {activeTab === 'payouts' && (
                <PayoutsTab
                    driverId={userData._id}
                    initialData={payoutHistory}
                    initialPagination={payoutPagination}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                />
            )}

            {/* Modals */}
            <WithdrawalModal
                visible={withdrawalModal}
                onClose={() => seithdrawalModal(false)}
                onSuccess={loadFinancialData}
                financialSummary={financialSummary}
                userData={userData}
                formatCurrency={formatCurrency}
            />

            <BankManagementModal
                visible={bankModal}
                onClose={() => setBankModal(false)}
                onSuccess={loadFinancialData}
                currentBankDetails={financialSummary?.bankDetails}
                driverId={userData._id}
            />
        </View>
    );
}

export default FinanceManager;