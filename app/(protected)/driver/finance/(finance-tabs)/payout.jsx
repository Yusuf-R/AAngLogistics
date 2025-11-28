// app/(protected)/driver/finance/(finance-tabs)/payout.jsx
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet
} from 'react-native';
import PayoutsTab from "../../../../../components/Driver/Finance/PayoutsTab";
import DriverUtils from "../../../../../utils/DriverUtilities";

function PayoutTab({ userData }) {
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch payout data
    const {
        data: payoutsData,
        isLoading: payoutsLoading,
        error: payoutsError,
        refetch: refetchPayouts
    } = useQuery({
        queryKey: ['PayoutHistory', statusFilter],
        queryFn: () => DriverUtils.getPayoutHistory({ status: statusFilter }),
        retry: 3,
        refetchOnWindowFocus: true,
    });

    // Fetch financial summary for available balance
    const {
        data: financialSummaryData,
        isLoading: summaryLoading
    } = useQuery({
        queryKey: ['PayoutManager'],
        queryFn: () => DriverUtils.getFinancialSummary(),
        retry: 3,
    });

    const handleRefresh = () => {
        refetchPayouts();
    };

    const handleFilterChange = (newFilter) => {
        setStatusFilter(newFilter);
    };

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if ((payoutsLoading && !payoutsData) || (summaryLoading && !financialSummaryData)) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading payout data...</Text>
            </View>
        );
    }

    if (payoutsError) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load payouts</Text>
                    <Text style={styles.errorSubtext}>
                        Please check your connection and try again
                    </Text>
                </View>
            </View>
        );
    }

    const payoutHistory = payoutsData?.payouts || payoutsData || [];
    const payoutPagination = payoutsData?.pagination || {};
    const financialSummary = financialSummaryData?.summary || financialSummaryData || {};

    return (
        <PayoutsTab
            initialData={payoutHistory}
            initialPagination={payoutPagination}
            formatDate={formatDate}
            userData={userData}
            financialSummary={financialSummary}
            isLoading={payoutsLoading}
            dataRefresh={handleRefresh}
            currentFilter={statusFilter}
            onFilterChange={handleFilterChange}
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
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default PayoutTab;