import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import DriverUtils from "../../../../../../utils/DriverUtilities";
import Tickets from "../../../../../../components/Driver/Account/Support/Tickets";

function TicketScreen() {
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Query for ALL tickets (for stats)
    const { data: allTicketsData, isLoading: statsLoading } = useQuery({
        queryKey: ['Tickets'],
        queryFn: () => DriverUtils.getSupportTickets(null), // Get all tickets
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 2,
    });

    const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
        queryKey: ['FilteredTickets', selectedFilter],
        queryFn: () => DriverUtils.getSupportTickets(
            selectedFilter === 'all' ? null : selectedFilter
        ),
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: true,
        enabled: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 2,
    });

    console.log({
        selectedFilter,
    });

    // Use ALL tickets for stats, filtered tickets for display
    const allTickets = allTicketsData?.data?.tickets || [];
    const filteredTickets = data?.data?.tickets || [];

    const stats = {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length,
    };

    if (isLoading || statsLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading your tickets...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isError) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <AlertCircle color="#EF4444" size={48} />
                    <Text style={styles.errorTitle}>Failed to Load</Text>
                    <Text style={styles.errorMessage}>
                        {error?.message || 'Something went wrong'}
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <Tickets
            tickets={filteredTickets}
            stats={stats}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            isRefetching={isRefetching}
            onRefresh={refetch}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#EF4444',
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default TicketScreen;