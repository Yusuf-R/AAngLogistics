// components/Driver/Dashboard/WalletCard.jsx
import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverWallet } from '../../../hooks/useDriverDashboard';

export const WalletCard =  ({ userData }) => {
    const { data: walletData, isLoading, isError, error } =  useDriverWallet(userData?.id);

    if (isLoading) {
        return (
            <View style={styles.walletCard}>
                <LinearGradient
                    colors={['#000046', '#141E30']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={[styles.walletGradient, styles.loadingContainer]}
                >
                    <ActivityIndicator size="large" color="#60A5FA" />
                    <Text style={styles.loadingText}>Loading wallet...</Text>
                </LinearGradient>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.walletCard}>
                <LinearGradient
                    colors={['#DC2626', '#991B1B']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.walletGradient}
                >
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={32} color="#FEE2E2" />
                        <Text style={styles.errorText}>Failed to load wallet data</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    const { totalEarnings = 0, totalPayout = 0, balance = 0 } = walletData || {};

    return (
        <View style={styles.walletCard}>
            <LinearGradient
                colors={['#000046', '#141E30']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.walletGradient}
            >
                <View style={styles.walletHeader}>
                    <View>
                        <Text style={styles.walletLabel}>Available Balance</Text>
                        <Text style={styles.walletAmount}>
                            ₦{balance.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.walletIcon}>
                        <Ionicons name="wallet" size={28} color="#60A5FA"/>
                    </View>
                </View>

                <View style={styles.walletFooter}>
                    <View style={styles.walletInfo}>
                        <Text style={styles.walletInfoLabel}>Total Payout</Text>
                        <Text style={styles.walletInfoValue}>
                            ₦{totalPayout.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.walletDivider}/>
                    <View style={styles.walletInfo}>
                        <Text style={styles.walletInfoLabel}>Lifetime Earning</Text>
                        <Text style={styles.walletInfoValue}>
                            ₦{totalEarnings.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    walletCard: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    walletGradient: {
        padding: 20,
    },
    loadingContainer: {
        minHeight: 180,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
    },
    errorContainer: {
        minHeight: 180,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    errorText: {
        color: '#FEE2E2',
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    walletLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    walletAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFF',
        fontFamily: 'PoppinsBold',
    },
    walletIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#374151',
    },
    walletInfo: {
        alignItems: 'center',
    },
    walletInfoLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    walletInfoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        fontFamily: 'PoppinsSemiBold',
    },
    walletDivider: {
        width: 1,
        backgroundColor: '#374151',
    },
});