import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import ClientUtils from '../../../../utils/ClientUtilities';
import { Search } from 'lucide-react-native';
import { Ionicons } from "@expo/vector-icons";
import OrderHistoryList from '../../../../components/Client/Orders/OrderHistoryList';

function HistoryScreen() {
    // Get current month/year as default
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentYear = now.getFullYear();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState({ month: currentMonth, year: currentYear });
    const [skip, setSkip] = useState(0);
    const [allOrders, setAllOrders] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [showPeriodPicker, setShowPeriodPicker] = useState(false);

    const LIMIT = 50;

    // Fetch orders by period
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching
    } = useQuery({
        queryKey: ["GetOrderHistory", selectedPeriod.month, selectedPeriod.year, skip],
        queryFn: () => ClientUtils.GetOrderHistory(
            selectedPeriod.month,
            selectedPeriod.year,
            LIMIT,
            skip
        ),
        enabled: !searchMode,
        staleTime: 60000,
    });

    // Search query
    const {
        data: searchData,
        isLoading: isSearching,
        refetch: performSearch
    } = useQuery({
        queryKey: ["SearchOrderHistory", searchQuery],
        queryFn: () => ClientUtils.SearchOrderHistory(searchQuery),
        enabled: false, // Manual trigger only
    });

    useEffect(() => {
        if (data?.data && !searchMode) {
            if (skip === 0) {
                setAllOrders(data.data.orders);
            } else {
                setAllOrders(prev => [...prev, ...data.data.orders]);
            }
            setHasMore(data.data.pagination.hasMore);

            if (data.data.availablePeriods) {
                setAvailablePeriods(data.data.availablePeriods);
            }
        }
    }, [data, searchMode]);

    useEffect(() => {
        if (searchData?.data) {
            setAllOrders(searchData.data.orders);
            setSearchMode(true);
            setHasMore(false); // No pagination for search
        }
    }, [searchData]);

    const handleSearch = () => {
        if (searchQuery.trim() !== '') {
            setSkip(0);
            performSearch();
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchMode(false);
        setSkip(0);
        setAllOrders([]); // Clear the search results
        // This will trigger a refetch of the default period data
        setTimeout(() => {
            refetch();
        }, 100);
    };

    const handlePeriodChange = (month, year) => {
        setSelectedPeriod({ month, year });
        setSkip(0);
        setSearchMode(false);
        setSearchQuery('');
    };

    const handleLoadMore = () => {
        if (!searchMode) {
            setSkip(prev => prev + LIMIT);
        }
    };

    const statusOptions = [
        { value: 'all', label: 'All Status', color: '#6B7280' },
        { value: 'delivered', label: 'Delivered', color: '#10B981' },
        { value: 'failed', label: 'Failed', color: '#EF4444' },
        { value: 'cancelled', label: 'Cancelled', color: '#F59E0B' },
        { value: 'returned', label: 'Returned', color: '#8B5CF6' },
    ];

    // Generate period options from available periods
    const getPeriodOptions = () => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const periods = [];

        // Generate periods from 2025 to current year
        for (let year = 2025; year <= currentYear; year++) {
            // For past years, show all 12 months
            // For current year, only show months up to current month
            const maxMonth = year === currentYear ? currentMonth : 12;

            for (let month = 1; month <= maxMonth; month++) {
                periods.push({
                    month: month,
                    year: year,
                    label: `${monthNames[month - 1]} ${year}`,
                    hasData: availablePeriods.some(p => p.month === month && p.year === year)
                });
            }
        }

        // Sort descending (most recent first)
        return periods.reverse();
    };

    const getCurrentPeriodLabel = () => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (searchMode) return 'Search Results';
        if (!selectedPeriod.month) return 'All Periods';
        return `${monthNames[selectedPeriod.month - 1]} ${selectedPeriod.year}`;
    };

    if (isLoading && !allOrders.length) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading order history...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load orders</Text>
                    <Pressable style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </Pressable>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.sectionTitle}>Order History</Text>
                    </View>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by order ref or description..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchMode && (
                        <Pressable onPress={handleClearSearch}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </Pressable>
                    )}
                </View>
                <Pressable
                    style={styles.searchButton}
                    onPress={handleSearch}
                    disabled={isSearching}
                >
                    <Text style={styles.searchButtonText}>
                        {isSearching ? 'Searching...' : 'Search'}
                    </Text>
                </Pressable>
            </View>

            {/* Filters */}
            {!searchMode && (
                <View style={styles.filtersWrapper}>
                    {/* Period Selector */}
                    <View style={styles.filterSection}>
                        <View style={styles.filterHeaderRow}>
                            <Text style={styles.filterLabel}>Period</Text>
                            <Pressable
                                style={styles.periodPickerButton}
                                onPress={() => setShowPeriodPicker(!showPeriodPicker)}
                            >
                                <Text style={styles.periodPickerButtonText}>
                                    {getCurrentPeriodLabel()}
                                </Text>
                                <Ionicons
                                    name={showPeriodPicker ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color="#3B82F6"
                                />
                            </Pressable>
                        </View>

                        {showPeriodPicker && (
                            <View style={styles.periodPickerContainer}>
                                <ScrollView
                                    horizontal={false}
                                    showsVerticalScrollIndicator={true}
                                    style={styles.periodScroll}
                                >
                                    <View style={styles.periodGrid}>
                                        {getPeriodOptions().map(period => (
                                            <Pressable
                                                key={`${period.month}-${period.year}`}
                                                style={[
                                                    styles.filterChip,
                                                    selectedPeriod.month === period.month &&
                                                    selectedPeriod.year === period.year &&
                                                    styles.filterChipPeriodActive,
                                                    !period.hasData && styles.filterChipNoData
                                                ]}
                                                onPress={() => {
                                                    handlePeriodChange(period.month, period.year);
                                                    setShowPeriodPicker(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.filterChipText,
                                                    selectedPeriod.month === period.month &&
                                                    selectedPeriod.year === period.year &&
                                                    styles.filterChipTextActive,
                                                    !period.hasData && styles.filterChipTextNoData
                                                ]}>
                                                    {period.label}
                                                </Text>
                                                {!period.hasData && (
                                                    <Text style={styles.noDataIndicator}>•</Text>
                                                )}
                                            </Pressable>
                                        ))}
                                    </View>
                                </ScrollView>
                                <View style={styles.periodPickerFooter}>
                                    <View style={styles.legendItem}>
                                        <View style={styles.legendDot} />
                                        <Text style={styles.legendText}>No orders</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Status Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Status</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.filterRow}>
                                {statusOptions.map(option => (
                                    <Pressable
                                        key={option.value}
                                        style={[
                                            styles.filterChip,
                                            selectedStatus === option.value && {
                                                backgroundColor: option.color,
                                                borderColor: option.color,
                                            }
                                        ]}
                                        onPress={() => setSelectedStatus(option.value)}
                                    >
                                        <Text style={[
                                            styles.filterChipText,
                                            selectedStatus === option.value && styles.filterChipTextActive
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* Orders List */}
            <ScrollView
                style={styles.ordersScroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => {
                            setSkip(0);
                            refetch();
                        }}
                    />
                }
            >
                <OrderHistoryList
                    orders={allOrders}
                    selectedStatus={selectedStatus}
                    onLoadMore={handleLoadMore}
                    hasMore={hasMore}
                    isLoadingMore={isRefetching && skip > 0}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        paddingHorizontal: 10,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    headerTitleContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 26,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
    },
    periodIndicator: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginTop: 2,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        gap: 12,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    searchButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#FFFFFF',
    },
    filtersWrapper: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    filterSection: {
        gap: 8,
    },
    filterLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    filterChipPeriodActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    filterChipText: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    ordersScroll: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    backButton: {
        backgroundColor: '#4F628E',
        borderRadius: 5,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    periodPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    periodPickerButtonText: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#3B82F6',
    },
    periodPickerContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        maxHeight: 320,
    },


    periodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    periodScroll: {
        maxHeight: 250,
    },
    filterChipNoData: {
        opacity: 0.6,
        borderStyle: 'dashed',
    },
    filterChipTextNoData: {
        fontStyle: 'italic',
    },
    noDataIndicator: {
        fontSize: 10,
        color: '#EF4444',
        marginLeft: 4,
    },
    periodPickerFooter: {
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    legendText: {
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },

});

export default HistoryScreen;