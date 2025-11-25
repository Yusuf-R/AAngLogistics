// components/Driver/FinanceManager/EarningsTab.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import {
    Search,
    Filter,
    ChevronDown,
    Calendar,
    TrendingUp,
    Package
} from 'lucide-react-native';
import DriverUtils from "../../../utils/DriverUtilities";

function EarningsTab({
                         driverId,
                         initialData,
                         initialPagination,
                         formatCurrency,
                         formatDate
                     }) {
    const [earnings, setEarnings] = useState(initialData || []);
    const [pagination, setPagination] = useState(initialPagination || {});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        withdrawn: 0,
        pending: 0
    });

    useEffect(() => {
        calculateStats();
    }, [earnings]);

    const calculateStats = () => {
        const newStats = {
            total: earnings.length,
            available: earnings.filter(e => e.status === 'available').length,
            withdrawn: earnings.filter(e => e.status === 'withdrawn').length,
            pending: earnings.filter(e => e.status === 'pending').length
        };
        setStats(newStats);
    };

    const loadEarnings = async (page = 1, filters = {}) => {
        try {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const result = await DriverUtils.getEarningsHistory(
                driverId,
                page,
                50,
                filters
            );

            if (page === 1) {
                setEarnings(result.earnings);
            } else {
                setEarnings(prev => [...prev, ...result.earnings]);
            }

            setPagination(result.pagination);
        } catch (error) {
            console.error('Load earnings error:', error);
            Alert.alert('Error', 'Failed to load earnings');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadEarnings(1, {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            dateRange: dateFilter !== 'all' ? dateFilter : undefined
        });
    };

    const loadMore = () => {
        if (pagination.hasNext && !loadingMore) {
            loadEarnings(pagination.currentPage + 1, {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                dateRange: dateFilter !== 'all' ? dateFilter : undefined
            });
        }
    };

    const handleStatusFilter = async (status) => {
        setStatusFilter(status);
        await loadEarnings(1, {
            status: status !== 'all' ? status : undefined,
            dateRange: dateFilter !== 'all' ? dateFilter : undefined
        });
    };

    const handleDateFilter = async (range) => {
        setDateFilter(range);
        await loadEarnings(1, {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            dateRange: range !== 'all' ? range : undefined
        });
    };

    const getFilteredEarnings = () => {
        let filtered = earnings;

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(earning =>
                earning.orderId?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'available':
                return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
            case 'withdrawn':
                return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
            case 'pending':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
        }
    };

    const renderHeader = () => (
        <View className={`bg-white border-b border-gray-200`}>
            {/* Stats Cards */}
            <View className={`px-4 py-4`}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerclassName={`gap-3`}
                >
                    <View className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 min-w-[140px]`}>
                        <View className={`bg-green-100 self-start rounded-full p-2 mb-2`}>
                            <TrendingUp size={16} color="#10b981" />
                        </View>
                        <Text className={`text-green-600 text-xs font-medium mb-1`}>Available</Text>
                        <Text className={`text-green-900 text-xl font-bold`}>{stats.available}</Text>
                    </View>

                    <View className={`bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 min-w-[140px]`}>
                        <View className={`bg-blue-100 self-start rounded-full p-2 mb-2`}>
                            <Package size={16} color="#3b82f6" />
                        </View>
                        <Text className={`text-blue-600 text-xs font-medium mb-1`}>Withdrawn</Text>
                        <Text className={`text-blue-900 text-xl font-bold`}>{stats.withdrawn}</Text>
                    </View>

                    <View className={`bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 min-w-[140px]`}>
                        <View className={`bg-yellow-100 self-start rounded-full p-2 mb-2`}>
                            <Calendar size={16} color="#f59e0b" />
                        </View>
                        <Text className={`text-yellow-600 text-xs font-medium mb-1`}>Pending</Text>
                        <Text className={`text-yellow-900 text-xl font-bold`}>{stats.pending}</Text>
                    </View>

                    <View className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 min-w-[140px]`}>
                        <View className={`bg-purple-100 self-start rounded-full p-2 mb-2`}>
                            <TrendingUp size={16} color="#8b5cf6" />
                        </View>
                        <Text className={`text-purple-600 text-xs font-medium mb-1`}>Total</Text>
                        <Text className={`text-purple-900 text-xl font-bold`}>{stats.total}</Text>
                    </View>
                </ScrollView>
            </View>

            {/* Search Bar */}
            <View className={`px-4 pb-3`}>
                <View className={`flex-row gap-2`}>
                    <View className={`flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2`}>
                        <Search size={18} color="#6b7280" />
                        <TextInput
                            placeholder="Search by order ID..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className={`flex-1 ml-2 text-gray-900`}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilterModal(true)}
                        className={`bg-gray-100 rounded-xl px-4 justify-center`}
                    >
                        <Filter size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter Chips */}
            <View className={`px-4 pb-3`}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerclassName={`gap-2`}
                >
                    {['all', 'available', 'withdrawn', 'pending'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => handleStatusFilter(status)}
                            className={`px-4 py-2 rounded-full ${
                                statusFilter === status
                                    ? 'bg-green-500'
                                    : 'bg-gray-100'
                            }`}
                        >
                            <Text className={`capitalize font-medium ${
                                statusFilter === status
                                    ? 'text-white'
                                    : 'text-gray-600'
                            }`}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Date Filter */}
            <View className={`px-4 pb-4`}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerclassName={`gap-2`}
                >
                    {[
                        { key: 'all', label: 'All Time' },
                        { key: 'today', label: 'Today' },
                        { key: 'week', label: 'This Week' },
                        { key: 'month', label: 'This Month' }
                    ].map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            onPress={() => handleDateFilter(filter.key)}
                            className={`px-4 py-2 rounded-full border ${
                                dateFilter === filter.key
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-white border-gray-300'
                            }`}
                        >
                            <Text className={`font-medium text-sm ${
                                dateFilter === filter.key
                                    ? 'text-green-600'
                                    : 'text-gray-600'
                            }`}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderEarningItem = (earning, index) => {
        const statusColors = getStatusColor(earning.status);

        return (
            <View
                key={earning._id}
                className={`bg-white mx-4 rounded-2xl p-4 shadow-sm ${
                    index !== 0 ? 'mt-3' : ''
                }`}
            >
                <View className={`flex-row justify-between items-start mb-3`}>
                    <View className={`flex-1 mr-3`}>
                        <Text className={`text-gray-900 font-bold text-base mb-1`}>
                            {earning.orderId}
                        </Text>
                        {earning.description && (
                            <Text className={`text-gray-600 text-sm`} numberOfLines={2}>
                                {earning.description}
                            </Text>
                        )}
                    </View>
                    <View className={`px-3 py-1.5 rounded-full ${statusColors.bg} border ${statusColors.border}`}>
                        <Text className={`text-xs font-semibold ${statusColors.text} capitalize`}>
                            {earning.status}
                        </Text>
                    </View>
                </View>

                <View className={`border-t border-gray-100 pt-3 flex-row justify-between items-center`}>
                    <View>
                        <Text className={`text-gray-500 text-xs mb-1`}>Earned On</Text>
                        <Text className={`text-gray-700 text-sm font-medium`}>
                            {formatDate(earning.earnedAt)}
                        </Text>
                    </View>
                    <View className={`items-end`}>
                        <Text className={`text-green-600 font-bold text-2xl`}>
                            +{formatCurrency(earning.amount)}
                        </Text>
                    </View>
                </View>

                {earning.payoutId && (
                    <View className={`mt-3 bg-blue-50 rounded-xl p-3 flex-row items-center`}>
                        <View className={`bg-blue-100 rounded-full p-1.5 mr-2`}>
                            <Package size={14} color="#3b82f6" />
                        </View>
                        <Text className={`text-blue-700 text-xs flex-1`}>
                            Withdrawn on {formatDate(earning.withdrawnAt || new Date())}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading && earnings.length === 0) {
        return (
            <View className={`flex-1 justify-center items-center bg-gray-50`}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text className={`mt-4 text-gray-600`}>Loading earnings...</Text>
            </View>
        );
    }

    const filteredEarnings = getFilteredEarnings();

    return (
        <View className={`flex-1 bg-gray-50`}>
            {renderHeader()}

            <ScrollView
                className={`flex-1`}
                contentContainerclassName={`pb-4`}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onMomentumScrollEnd={(event) => {
                    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                    if (isCloseToBottom) {
                        loadMore();
                    }
                }}
            >
                {filteredEarnings.length === 0 ? (
                    <View className={`py-20 px-4`}>
                        <View className={`items-center`}>
                            <View className={`bg-gray-100 rounded-full p-6 mb-4`}>
                                <TrendingUp size={48} color="#d1d5db" />
                            </View>
                            <Text className={`text-gray-900 font-bold text-lg mb-2`}>
                                No Earnings Found
                            </Text>
                            <Text className={`text-gray-500 text-center`}>
                                {searchQuery
                                    ? 'No results match your search'
                                    : statusFilter !== 'all' || dateFilter !== 'all'
                                        ? 'No earnings match your filters'
                                        : 'Complete deliveries to start earning!'
                                }
                            </Text>
                        </View>
                    </View>
                ) : (
                    <>
                        {filteredEarnings.map((earning, index) =>
                            renderEarningItem(earning, index)
                        )}

                        {loadingMore && (
                            <View className={`py-4 items-center`}>
                                <ActivityIndicator color="#10b981" />
                                <Text className={`text-gray-500 text-sm mt-2`}>Loading more...</Text>
                            </View>
                        )}

                        {!pagination.hasNext && filteredEarnings.length > 0 && (
                            <View className={`py-6 items-center`}>
                                <Text className={`text-gray-400 text-sm`}>
                                    You've reached the end
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

export default EarningsTab;