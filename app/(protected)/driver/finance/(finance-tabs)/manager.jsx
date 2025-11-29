// app/(protected)/driver/finance/(finance-tabs)/manager.jsx
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import FinanceManager from "../../../../../components/Driver/Finance/FinanceManager";
import DriverUtils from "../../../../../utils/DriverUtilities";

function ManagerTab({ userData, onNavigateToPayouts }) {
    const [isRetrying, setIsRetrying] = useState(false);

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

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await refetchSummary();
        } finally {
            setIsRetrying(false);
        }
    };

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

                {/* Retry button with loading indication */}
                <TouchableOpacity
                    style={[
                        styles.refreshButton,
                        isRetrying && styles.refreshButtonDisabled
                    ]}
                    onPress={handleRetry}
                    disabled={isRetrying}
                >
                    {isRetrying ? (
                        <View style={styles.retryLoadingContainer}>
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text style={styles.refreshButtonText}>Retrying...</Text>
                        </View>
                    ) : (
                        <Text style={styles.refreshButtonText}>Try Again</Text>
                    )}
                </TouchableOpacity>
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
        fontFamily: 'PoppinsSemiBold',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'PoppinsRegular',
    },
    refreshButton: {
        backgroundColor: '#0262FD',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 120,
    },
    refreshButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    refreshButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        fontFamily: 'PoppinsSemiBold',
    },
    retryLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
});

export default ManagerTab;