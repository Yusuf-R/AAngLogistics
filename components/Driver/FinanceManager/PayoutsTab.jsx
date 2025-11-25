// components/Driver/FinanceManager/PayoutsTab.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal
} from 'react-native';
import {
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    CreditCard,
    TrendingDown,
    Calendar,
    ChevronRight,
    X
} from 'lucide-react-native';
import DriverUtils from "../../../utils/DriverUtilities";

function PayoutsTab({
                        driverId,
                        initialData,
                        initialPagination,
                        formatCurrency,
                        formatDate
                    }) {
    const [payouts, setPayouts] = useState(initialData || []);
    const [pagination, setPagination] = useState(initialPagination || {});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [detailsModal, setDetailsModal] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        processing: 0,
        failed: 0,
        totalAmount: 0
    });

    useEffect(() => {
        calculateStats();
    }, [payouts]);

    const calculateStats = () => {
        const newStats = {
            total: payouts.length,
            completed: payouts.filter(p => p.status === 'completed').length,
            processing: payouts.filter(p => p.status === 'processing').length,
            failed: payouts.filter(p => p.status === 'failed').length,
            totalAmount: payouts.reduce((sum, p) =>
                p.status === 'completed' ? sum + (p.amount?.net || 0) : sum, 0
            )
        };
        setStats(newStats);
    };

    const loadPayouts = async (filters = {}) => {
        try {
            setLoading(true);
            const result = await DriverUtils.getPayoutHistory(driverId, filters);
            setPayouts(result.payouts);
            setPagination(result.pagination);
        } catch (error) {
            console.error('Load payouts error:', error);
            Alert.alert('Error', 'Failed to load payout history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPayouts({
            status: statusFilter !== 'all' ? statusFilter : undefined
        });
    };

    const handleStatusFilter = async (status) => {
        setStatusFilter(status);
        await loadPayouts({
            status: status !== 'all' ? status : undefined
        });
    };

    const handleViewDetails = (payout) => {
        setSelectedPayout(payout);
        setDetailsModal(true);
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'completed':
                return {
                    icon: CheckCircle2,
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    border: 'border-green-200',
                    iconColor: '#10b981',
                    label: 'Completed'
                };
            case 'processing':
                return {
                    icon: Clock,
                    bg: 'bg-blue-100',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    iconColor: '#3b82f6',
                    label: 'Processing'
                };
            case 'failed':
                return {
                    icon: XCircle,
                    bg: 'bg-red-100',
                    text: 'text-red-700',
                    border: 'border-red-200',
                    iconColor: '#ef4444',
                    label: 'Failed'
                };
            case 'pending':
                return {
                    icon: AlertCircle,
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-700',
                    border: 'border-yellow-200',
                    iconColor: '#f59e0b',
                    label: 'Pending'
                };
            default:
                return {
                    icon: Clock,
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    border: 'border-gray-200',
                    iconColor: '#6b7280',
                    label: status
                };
        }
    };

    const renderHeader = () => (
        <View className={`bg-white border-b border-gray-200`}>
            {/* Summary Stats */}
            <View className={`px-4 py-4`}>
                <View className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-4`}>
                    <View className={`flex-row items-center mb-2`}>
                        <View className={`bg-purple-100 rounded-full p-2 mr-3`}>
                            <TrendingDown size={20} color="#8b5cf6" />
                        </View>
                        <Text className={`text-purple-900 font-bold text-lg`}>
                            Total Withdrawn
                        </Text>
                    </View>
                    <Text className={`text-purple-900 text-3xl font-bold`}>
                        {formatCurrency(stats.totalAmount)}
                    </Text>
                    <Text className={`text-purple-600 text-sm mt-1`}>
                        {stats.completed} successful {stats.completed === 1 ? 'withdrawal' : 'withdrawals'}
                    </Text>
                </View>

                <View className={`flex-row gap-3`}>
                    <View className={`flex-1 bg-blue-50 rounded-xl p-3`}>
                        <View className={`bg-blue-100 self-start rounded-full p-1.5 mb-2`}>
                            <Clock size={14} color="#3b82f6" />
                        </View>
                        <Text className={`text-blue-600 text-xs font-medium mb-1`}>Processing</Text>
                        <Text className={`text-blue-900 text-lg font-bold`}>{stats.processing}</Text>
                    </View>

                    <View className={`flex-1 bg-red-50 rounded-xl p-3`}>
                        <View className={`bg-red-100 self-start rounded-full p-1.5 mb-2`}>
                            <XCircle size={14} color="#ef4444" />
                        </View>
                        <Text className={`text-red-600 text-xs font-medium mb-1`}>Failed</Text>
                        <Text className={`text-red-900 text-lg font-bold`}>{stats.failed}</Text>
                    </View>
                </View>
            </View>

            {/* Status Filter */}
            <View className={`px-4 pb-4`}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerclassName={`gap-2`}
                >
                    {['all', 'completed', 'processing', 'failed', 'pending'].map((status) => {
                        const count = status === 'all'
                            ? stats.total
                            : stats[status] || 0;

                        return (
                            <TouchableOpacity
                                key={status}
                                onPress={() => handleStatusFilter(status)}
                                className={`px-4 py-2.5 rounded-full flex-row items-center ${
                                    statusFilter === status
                                        ? 'bg-green-500'
                                        : 'bg-gray-100'
                                }`}
                            >
                                <Text className={`capitalize font-semibold ${
                                    statusFilter === status
                                        ? 'text-white'
                                        : 'text-gray-600'
                                }`}>
                                    {status}
                                </Text>
                                {count > 0 && (
                                    <View className={`ml-2 ${
                                        statusFilter === status
                                            ? 'bg-white/30'
                                            : 'bg-gray-200'
                                    } rounded-full px-2 py-0.5`}>
                                        <Text className={`text-xs font-bold ${
                                            statusFilter === status
                                                ? 'text-white'
                                                : 'text-gray-700'
                                        }`}>
                                            {count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );

    const renderPayoutItem = (payout, index) => {
        const statusConfig = getStatusConfig(payout.status);
        const StatusIcon = statusConfig.icon;

        return (
            <TouchableOpacity
                key={payout._id}
                onPress={() => handleViewDetails(payout)}
                className={`bg-white mx-4 rounded-2xl p-4 shadow-sm ${
                    index !== 0 ? 'mt-3' : ''
                }`}
                activeOpacity={0.7}
            >
                <View className={`flex-row justify-between items-start mb-3`}>
                    <View className={`flex-1 mr-3`}>
                        <View className={`flex-row items-center mb-2`}>
                            <View className={`${statusConfig.bg} rounded-full p-2 mr-2`}>
                                <StatusIcon size={16} color={statusConfig.iconColor} />
                            </View>
                            <View className={`flex-1`}>
                                <Text className={`text-gray-900 font-bold text-base`}>
                                    Withdrawal Request
                                </Text>
                                <Text className={`text-gray-500 text-xs mt-0.5`}>
                                    {payout.gateway?.reference || payout._id}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View className={`px-3 py-1.5 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}>
                        <Text className={`text-xs font-semibold ${statusConfig.text}`}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                {/* Amount Breakdown */}
                <View className={`bg-gray-50 rounded-xl p-3 mb-3`}>
                    <View className={`flex-row justify-between mb-2`}>
                        <Text className={`text-gray-600 text-sm`}>Requested</Text>
                        <Text className={`text-gray-900 font-semibold`}>
                            {formatCurrency(payout.payout?.requestedAmount || payout.amount?.gross || 0)}
                        </Text>
                    </View>
                    <View className={`flex-row justify-between mb-2`}>
                        <Text className={`text-gray-600 text-sm`}>Fee</Text>
                        <Text className={`text-red-600 font-semibold`}>
                            -{formatCurrency(payout.payout?.transferFee || payout.amount?.fees || 0)}
                        </Text>
                    </View>
                    <View className={`border-t border-gray-200 pt-2 mt-1`}>
                        <View className={`flex-row justify-between`}>
                            <Text className={`text-gray-900 font-bold`}>Received</Text>
                            <Text className={`text-green-600 font-bold text-lg`}>
                                {formatCurrency(payout.payout?.netAmount || payout.amount?.net || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bank Details */}
                {payout.payout?.bankDetails && (
                    <View className={`flex-row items-center mb-3`}>
                        <View className={`bg-blue-50 rounded-full p-2 mr-2`}>
                            <CreditCard size={14} color="#3b82f6" />
                        </View>
                        <View className={`flex-1`}>
                            <Text className={`text-gray-900 font-medium text-sm`}>
                                {payout.payout.bankDetails.accountName}
                            </Text>
                            <Text className={`text-gray-500 text-xs`}>
                                {payout.payout.bankDetails.bankName} • {payout.payout.bankDetails.accountNumber}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Date and Action */}
                <View className={`flex-row justify-between items-center pt-3 border-t border-gray-100`}>
                    <View className={`flex-row items-center`}>
                        <Calendar size={14} color="#6b7280" />
                        <Text className={`text-gray-600 text-xs ml-1.5`}>
                            {formatDate(payout.createdAt)}
                        </Text>
                    </View>
                    <View className={`flex-row items-center`}>
                        <Text className={`text-green-600 text-sm font-semibold mr-1`}>
                            View Details
                        </Text>
                        <ChevronRight size={16} color="#10b981" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDetailsModal = () => {
        if (!selectedPayout) return null;

        const statusConfig = getStatusConfig(selectedPayout.status);
        const StatusIcon = statusConfig.icon;

        return (
            <Modal
                visible={detailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailsModal(false)}
            >
                <View className={`flex-1 justify-end bg-black/50`}>
                    <View className={`bg-white rounded-t-3xl max-h-[85%]`}>
                        {/* Header */}
                        <View className={`flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200`}>
                            <Text className={`text-xl font-bold text-gray-900`}>
                                Payout Details
                            </Text>
                            <TouchableOpacity
                                onPress={() => setDetailsModal(false)}
                                className={`p-2 -mr-2`}
                            >
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className={`px-6 py-4`}>
                            {/* Status Badge */}
                            <View className={`items-center mb-6`}>
                                <View className={`${statusConfig.bg} rounded-full p-4 mb-3`}>
                                    <StatusIcon size={32} color={statusConfig.iconColor} />
                                </View>
                                <View className={`px-4 py-2 rounded-full ${statusConfig.bg} border-2 ${statusConfig.border}`}>
                                    <Text className={`font-bold ${statusConfig.text}`}>
                                        {statusConfig.label}
                                    </Text>
                                </View>
                            </View>

                            {/* Amount Card */}
                            <View className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 mb-4`}>
                                <Text className={`text-green-600 text-sm mb-2 text-center`}>
                                    Amount Received
                                </Text>
                                <Text className={`text-green-900 text-4xl font-bold text-center`}>
                                    {formatCurrency(selectedPayout.payout?.netAmount || selectedPayout.amount?.net || 0)}
                                </Text>
                            </View>

                            {/* Breakdown */}
                            <View className={`bg-gray-50 rounded-2xl p-4 mb-4`}>
                                <Text className={`text-gray-900 font-bold mb-3`}>Breakdown</Text>

                                <View className={`flex-row justify-between py-2`}>
                                    <Text className={`text-gray-600`}>Requested Amount</Text>
                                    <Text className={`text-gray-900 font-semibold`}>
                                        {formatCurrency(selectedPayout.payout?.requestedAmount || 0)}
                                    </Text>
                                </View>

                                <View className={`flex-row justify-between py-2`}>
                                    <Text className={`text-gray-600`}>Processing Fee</Text>
                                    <Text className={`text-red-600 font-semibold`}>
                                        -{formatCurrency(selectedPayout.payout?.transferFee || 0)}
                                    </Text>
                                </View>

                                <View className={`border-t border-gray-200 pt-2 mt-2`}>
                                    <View className={`flex-row justify-between`}>
                                        <Text className={`text-gray-900 font-bold`}>Net Amount</Text>
                                        <Text className={`text-green-600 font-bold text-lg`}>
                                            {formatCurrency(selectedPayout.payout?.netAmount || 0)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Bank Details */}
                            {selectedPayout.payout?.bankDetails && (
                                <View className={`bg-white border-2 border-gray-200 rounded-2xl p-4 mb-4`}>
                                    <Text className={`text-gray-900 font-bold mb-3`}>Bank Details</Text>
                                    <View className={`bg-gray-50 rounded-xl p-3`}>
                                        <Text className={`text-gray-900 font-bold text-lg mb-1`}>
                                            {selectedPayout.payout.bankDetails.accountName}
                                        </Text>
                                        <Text className={`text-gray-600 mb-1`}>
                                            {selectedPayout.payout.bankDetails.bankName}
                                        </Text>
                                        <Text className={`text-gray-500 text-sm`}>
                                            Account: {selectedPayout.payout.bankDetails.accountNumber}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Transaction Info */}
                            <View className={`bg-white border-2 border-gray-200 rounded-2xl p-4 mb-4`}>
                                <Text className={`text-gray-900 font-bold mb-3`}>Transaction Info</Text>

                                <View className={`mb-3`}>
                                    <Text className={`text-gray-500 text-xs mb-1`}>Reference ID</Text>
                                    <Text className={`text-gray-900 font-mono text-sm`}>
                                        {selectedPayout.gateway?.reference || selectedPayout._id}
                                    </Text>
                                </View>

                                <View className={`mb-3`}>
                                    <Text className={`text-gray-500 text-xs mb-1`}>Requested On</Text>
                                    <Text className={`text-gray-900`}>
                                        {formatDate(selectedPayout.createdAt)}
                                    </Text>
                                </View>

                                {selectedPayout.processedAt && (
                                    <View>
                                        <Text className={`text-gray-500 text-xs mb-1`}>Processed On</Text>
                                        <Text className={`text-gray-900`}>
                                            {formatDate(selectedPayout.processedAt)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Status Message */}
                            {selectedPayout.status === 'processing' && (
                                <View className={`flex-row bg-blue-50 rounded-xl p-4 mb-4`}>
                                    <AlertCircle size={20} color="#3b82f6" className={`mr-3 mt-0.5`} />
                                    <View className={`flex-1`}>
                                        <Text className={`text-blue-900 font-semibold mb-1`}>
                                            Processing
                                        </Text>
                                        <Text className={`text-blue-700 text-sm`}>
                                            Your withdrawal is being processed. Funds will be credited within 24 hours.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {selectedPayout.status === 'failed' && (
                                <View className={`flex-row bg-red-50 rounded-xl p-4 mb-4`}>
                                    <AlertCircle size={20} color="#ef4444" className={`mr-3 mt-0.5`} />
                                    <View className={`flex-1`}>
                                        <Text className={`text-red-900 font-semibold mb-1`}>
                                            Transfer Failed
                                        </Text>
                                        <Text className={`text-red-700 text-sm`}>
                                            {selectedPayout.metadata?.errorMessage || 'The transfer could not be completed. Please contact support.'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Close Button */}
                        <View className={`px-6 py-4 border-t border-gray-200`}>
                            <TouchableOpacity
                                onPress={() => setDetailsModal(false)}
                                className={`bg-gray-200 rounded-2xl py-4`}
                            >
                                <Text className={`text-center font-bold text-gray-700`}>
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading && payouts.length === 0) {
        return (
            <View className={`flex-1 justify-center items-center bg-gray-50`}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text className={`mt-4 text-gray-600`}>Loading payouts...</Text>
            </View>
        );
    }

    return (
        <View className={`flex-1 bg-gray-50`}>
            {renderHeader()}

            <ScrollView
                className={`flex-1`}
                contentContainerclassName={`pb-4`}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {payouts.length === 0 ? (
                    <View className={`py-20 px-4`}>
                        <View className={`items-center`}>
                            <View className={`bg-gray-100 rounded-full p-6 mb-4`}>
                                <TrendingDown size={48} color="#d1d5db" />
                            </View>
                            <Text className={`text-gray-900 font-bold text-lg mb-2`}>
                                No Payouts Yet
                            </Text>
                            <Text className={`text-gray-500 text-center`}>
                                {statusFilter !== 'all'
                                    ? `No ${statusFilter} payouts found`
                                    : 'Request your first withdrawal to see payout history'}
                            </Text>
                        </View>
                    </View>
                ) : (
                    payouts.map((payout, index) => renderPayoutItem(payout, index))
                )}
            </ScrollView>

            {renderDetailsModal()}
        </View>
    );
}

export default PayoutsTab;