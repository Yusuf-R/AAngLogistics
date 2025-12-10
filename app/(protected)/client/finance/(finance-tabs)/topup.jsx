import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import TopUpTab from "../../../../../components/Client/Finance/TopUpTab";
import ClientUtils from "../../../../../utils/ClientUtilities";

function TopUpTabScreen({ userData }) {
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch top-up history
    const {
        data: topUpData,
        isLoading: topUpLoading,
        error: topUpError,
        refetch: refetchTopUp
    } = useQuery({
        queryKey: ['ClientTopUpHistory'],
        queryFn: () => ClientUtils.getTopUpHistory({ status: statusFilter }),
        retry: 3,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    // Fetch wallet balance
    const {
        data: walletData,
        isLoading: walletLoading,
        error: walletError,
        refetch: refetchWallet
    } = useQuery({
        queryKey: ['ClientWalletBalance'],
        queryFn: () => ClientUtils.getWalletBalance(),
        retry: 3,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const handleRefresh = () => {
        refetchTopUp();
        refetchWallet();
    };

    const handleFilterChange = (newFilter) => {
        setStatusFilter(newFilter);
    };

    if ((topUpLoading && !topUpData) || (walletLoading && !walletData)) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading top-up data...</Text>
            </View>
        );
    }

    if (topUpError) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load top-up history</Text>
                    <Text style={styles.errorSubtext}>
                        Please check your connection and try again
                    </Text>
                {/*    Add a retry button to try again*/}
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const topUpHistory = topUpData?.topUps || topUpData || [];
    const topUpPagination = topUpData?.pagination || {};
    const walletBalance = walletData?.balance || userData?.wallet?.balance || 0;

    return (
        <TopUpTab
            topUpHistory={topUpHistory}
            topUpPagination={topUpPagination}
            userData={userData}
            walletBalance={walletBalance}
            isLoading={topUpLoading}
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
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#6b7280',
    },
    errorContainer: {
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ef4444',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});

export default TopUpTabScreen;