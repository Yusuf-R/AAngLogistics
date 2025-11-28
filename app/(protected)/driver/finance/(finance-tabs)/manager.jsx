// app/(protected)/driver/finance/(finance-tabs)/manager.jsx
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet,
} from 'react-native';
import FinanceManager from "../../../../../components/Driver/Finance/FinanceManager";
import DriverUtils from "../../../../../utils/DriverUtilities";

function ManagerTab({ userData, onNavigateToPayouts }) {
    // Fetch ONLY manager/overview data
    const {
        data: financialSummaryData,
        isLoading: summaryLoading,
        error: summaryError,
        refetch: refetchSummary
    } = useQuery({
        queryKey: ['FinanceManager'],
        queryFn: () => DriverUtils.getFinancialSummary(),
        retry: 3,
        refetchOnWindowFocus: true,

    });

    if (summaryLoading && !financialSummaryData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading financial overview...</Text>
            </View>
        );
    }

    if (summaryError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load financial overview</Text>
                <Text style={styles.errorSubtext}>
                    Please check your connection and try again
                </Text>
            </View>
        );
    }

    const financialSummary = financialSummaryData?.summary || financialSummaryData || {};

    return (
        <FinanceManager
            userData={userData}
            financialSummary={financialSummary}
            refetch={refetchSummary}
            isLoading={summaryLoading}
            onNavigateToPayouts={onNavigateToPayouts}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#F9FAFB',
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

export default ManagerTab;