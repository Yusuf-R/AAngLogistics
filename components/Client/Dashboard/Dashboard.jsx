// components/Client/Dashboard/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    RefreshControl,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import {
    Package,
    MapPin,
    History,
    Wallet,
    TrendingUp,
    CreditCard,
    UserRoundCog,
    ChartNoAxesCombined,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import Header from './Header';
import WalletCard from './WalletCard';
import AutoScrollHighlights from './AutoScrollHighlights';
import QuickActionsGrid from './QuickActionsGrid';
import TransactionHistory from './TransactionHistory';
import ClientUtils from '../../../utils/ClientUtilities';
import { clientHighlights } from "../../../utils/Client/clientHighlights"
import { router } from 'expo-router';

function Dashboard({ userData }) {
    const [refreshing, setRefreshing] = useState(false);

    // Fetch financial data
    const { data: financialData, refetch: refetchFinancial } = useQuery({
        queryKey: ['ClientFinancialData'],
        queryFn: ClientUtils.getFinancialData,
        staleTime: 5 * 60 * 1000,
    });

    // Fetch transaction history
    const { data: transactionData, refetch: refetchTransactions } = useQuery({
        queryKey: ['ClientTransactions'],
        queryFn: () => ClientUtils.getTransactionHistory(10),
        staleTime: 5 * 60 * 1000,
    });

    const quickActions = [
        {
            icon: Package,
            title: 'Order',
            color: '#3b82f6',
            onPress: () => router.push('/client/orders'),
        },
        {
            icon: ChartNoAxesCombined,
            title: 'Analytics',
            color: '#10b981',
            onPress: () => router.push('/client/profile/analytics'),

        },
        {
            icon: MapPin,
            title: 'Saved Locations',
            color: '#8b5cf6',
            onPress: () => router.push('/client/profile/location'),
        },
        {
            icon: UserRoundCog,
            title: 'Profile',
            color: '#f59e0b',
            onPress: () => router.push('/client/profile'),
        },
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            refetchFinancial(),
            refetchTransactions(),
        ]);
        setRefreshing(false);
    };

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Header userData={userData} />
                <View style={styles.content}>
                    <WalletCard
                        userData={userData}
                        financialData={financialData}
                    />
                    <AutoScrollHighlights highlights={clientHighlights} />
                    <QuickActionsGrid actions={quickActions} />
                    <TransactionHistory transactions={transactionData?.transactions || []} />
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
});

export default Dashboard;