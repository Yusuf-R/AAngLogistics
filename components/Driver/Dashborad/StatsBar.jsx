// components/Driver/Dashboard/StatsBar.jsx
import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useDriverStats, useDriverMonthlyStats } from '../../../hooks/useDriverDashboard';

export const StatsBar = ({ userData }) => {
    const { data: statsData, isLoading: statsLoading } = useDriverStats(userData?.id);
    const { data: monthlyData, isLoading: monthlyLoading } = useDriverMonthlyStats(userData?.id);

    const isLoading = statsLoading || monthlyLoading;

    if (isLoading) {
        return (
            <View style={styles.statsBar}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading stats...</Text>
                </View>
            </View>
        );
    }

    const stats = [
        {
            label: 'Total Deliveries',
            value: statsData?.totalDeliveries || 0,
            icon: 'package',
            color: '#3B82F6',
            iconLib: 'Feather',
        },
        {
            label: 'This Month',
            value: monthlyData?.deliveries || 0,
            icon: 'checkmark-done-circle',
            color: '#10B981',
            iconLib: 'Ionicons',
        },
        {
            label: 'Rating',
            value: statsData?.averageRating?.toFixed(1) || '0.0',
            icon: 'star',
            color: '#F59E0B',
            iconLib: 'Ionicons',
        },
        {
            label: monthlyData?.month || 'This Month',
            value: `₦${monthlyData?.earnings?.toLocaleString() || '0'}`,
            icon: 'trending-up',
            color: '#8B5CF6',
            iconLib: 'Feather',
        },
    ];

    return (
        <View style={styles.statsBar}>
            {stats.map((stat, index) => (
                <React.Fragment key={index}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconSm, {backgroundColor: `${stat.color}15`}]}>
                            {stat.iconLib === 'Feather' ? (
                                <Feather name={stat.icon} size={16} color={stat.color}/>
                            ) : (
                                <Ionicons name={stat.icon} size={16} color={stat.color}/>
                            )}
                        </View>

                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            style={styles.statValueSm}
                        >
                            {stat.value}
                        </Text>

                        <Text
                            numberOfLines={1}
                            style={styles.statLabelSm}
                        >
                            {stat.label}
                        </Text>
                    </View>

                    {index < stats.length - 1 && <View style={styles.vDivider}/>}
                </React.Fragment>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginTop: 6,
        marginBottom: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 8,
        minHeight: 90,
    },
    loadingContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 20,
    },
    loadingText: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    statIconSm: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    statValueSm: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 2,
        maxWidth: '90%',
        textAlign: 'center',
    },
    statLabelSm: {
        fontSize: 10,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
    },
    vDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
});