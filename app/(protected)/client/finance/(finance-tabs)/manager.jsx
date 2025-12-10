import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import FinanceManager from "../../../../../components/Client/Finance/FinanceManager";
import ClientUtils from "../../../../../utils/ClientUtilities";

function ManagerTab({ userData, onNavigateToTopUp }) {
    const [isRetrying, setIsRetrying] = useState(false);

    // Fetch holistic financial data (combines orders + wallet)
    const {
        data: financialSummaryData,
        isLoading: summaryLoading,
        error: summaryError,
        refetch: refetchSummary
    } = useQuery({
        queryKey: ['ClientFinanceManager'],
        queryFn: () => ClientUtils.getFinancialSummary(),
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
                <ActivityIndicator size="large" color="#3b82f6" />
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
            onNavigateToTopUp={onNavigateToTopUp}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9fafb',
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
        marginBottom: 24,
    },
    refreshButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    refreshButtonDisabled: {
        opacity: 0.6,
    },
    retryLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    refreshButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ManagerTab;