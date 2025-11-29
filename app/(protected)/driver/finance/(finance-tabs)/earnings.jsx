// app/(protected)/driver/finance/(finance-tabs)/earnings.jsx
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet
} from 'react-native';
import EarningsScreen from "../../../../../components/Driver/Finance/EarningsTab";
import DriverUtils from "../../../../../utils/DriverUtilities";

function EarningsTab({ userData }) {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all'
    });

    // Fetch transactions data
    const {
        data: transactionsData,
        isLoading: transactionsLoading,
        error: transactionsError,
        refetch: refetchTransactions
    } = useQuery({
        queryKey: ['TransactionHistory'],
        queryFn: () => DriverUtils.getEarningsHistory({
            page,
            limit: 50,
            type: filters.type,
            status: filters.status
        }),
        retry: 3,
        refetchOnWindowFocus: true,
        keepPreviousData: true,
    });

    const handleLoadMore = () => {
        if (transactionsData?.pagination?.hasNext) {
            setPage(prev => prev + 1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        refetchTransactions();
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page when filters change
    };

    if (transactionsLoading && !transactionsData) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading transaction history...</Text>
            </View>
        );
    }

    if (transactionsError) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load transactions</Text>
                    <Text style={styles.errorSubtext}>
                        {transactionsError.message || 'Please check your connection and try again'}
                    </Text>
                </View>
            </View>
        );
    }

    // Extract data from API response
    const transactions = transactionsData?.transactions || [];
    const pagination = transactionsData?.pagination || {};
    const stats = transactionsData?.stats || {};

    return (
        <EarningsScreen
            userData={userData}
            earningsHistory={transactions}
            earningsPagination={pagination}
            isLoading={transactionsLoading}
            onLoadMore={handleLoadMore}
            onRefresh={handleRefresh}
            onFilterChange={handleFilterChange}
            currentPage={page}
            stats={stats}
            // Note: Your EarningsTab calculates stats internally from earningsHistory
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    errorContainer: {
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'PoppinsSemiBold',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'PoppinsSemiBold',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: 'PoppinsRegular',
    },
});

export default EarningsTab;