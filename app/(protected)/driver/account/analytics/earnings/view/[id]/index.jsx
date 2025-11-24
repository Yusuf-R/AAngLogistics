// components/Driver/Account/Analytics/EarningDetails.jsx

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import DriverUtils from '../../../../../../../../utils/DriverUtilities';
import EarningDetails from '../../../../../../../../components/Driver/Account/Analytics/EarningDetails';
import { Ionicons } from '@expo/vector-icons';

function ViewEarnings() {
    const { id } = useLocalSearchParams(); // transaction ID

    const { data, isLoading, error, isError } = useQuery({
        queryKey: ['SingleTransaction'],
        queryFn: () => DriverUtils.getSingleTransaction(id),
        retry: 2,
        retryDelay: 1000,
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading delivery details...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
                    <Text style={styles.errorText}>Failed to load delivery</Text>
                    <Text style={styles.errorSubtext}>
                        {error?.message || 'Please check your connection and try again'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <EarningDetails
            data={data?.data}
            refetch={refetch}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F44336',
        marginTop: 16,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default ViewEarnings;