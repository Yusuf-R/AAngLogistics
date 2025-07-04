import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    StatusBar, FlatList
} from 'react-native';
import {
    CreditCard,
    MapPin,
    HelpCircle,
    Package,
    TrendingUp,
    Wallet,
    Search,
    History,
} from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Header from "./Header"
import WalletCard from "./Wallet";
import { serviceFeatures } from "../../../utils/Constant";


// Search Bar Component

// Quick Action Button Component
const QuickActionButton = ({ icon: Icon, title, onPress, color = "#00d4aa" }) => (
    <TouchableOpacity onPress={onPress} style={styles.actionButton}>
        <View style={[styles.actionIcon, { backgroundColor: color }]}>
            <Icon size={24} color="white" />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
);

// Quick Actions Grid Component
const QuickActionsGrid = ({ actions }) => (
    <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
            <QuickActionButton
                key={index}
                icon={action.icon}
                title={action.title}
                onPress={action.onPress}
                color={action.color}
            />
        ))}
    </View>
);

const AangServices = ({ features }) =>{
    return (
        <>
            {/* Service Features */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Why Choose Us</Text>
                <View style={styles.featuresContainer}>
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <View key={index} style={styles.featureCard}>
                                <View style={[styles.featureIcon, {backgroundColor: `${feature.color}15`}]}>
                                    <IconComponent size={24} color={feature.color}/>
                                </View>
                                <View style={styles.featureContent}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDescription}>{feature.description}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </>
    )
}

// Transaction Item Component
const TransactionItem = ({ transaction }) => {
    const getIconAndColor = (type) => {
        switch(type) {
            case 'order': return { icon: Package, color: '#00d4aa' };
            case 'topup': return { icon: TrendingUp, color: '#60a5fa' };
            case 'payment': return { icon: Wallet, color: '#10b981' };
            case 'wallet': return { icon: CreditCard, color: '#8b5cf6' };
            default: return { icon: Package, color: '#00d4aa' };
        }
    };

    const { icon: Icon, color } = getIconAndColor(transaction.type);

    return (
        <View style={styles.transactionItem}>
            <View style={[styles.transactionIcon, { backgroundColor: color }]}>
                <Icon size={20} color="white" />
            </View>
            <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
            </View>
            <Text style={styles.transactionTime}>{transaction.time}</Text>
        </View>
    );
};

// Transaction History Section Component
const TransactionHistory = ({ transactions, onSeeAll }) => (
    <View style={styles.historySection}>
        <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Transaction History</Text>
            <TouchableOpacity onPress={onSeeAll}>
                <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
            <FlatList
                data={transactions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => <TransactionItem transaction={item} />}
                scrollEnabled={false}
            />
        </View>
    </View>
);

// Main Dashboard Component
function Dashboard ({userData}) {
    const [user] = useState({
        name: userData.fullName,
        balance: userData.walletBalance || 0,
        cardNumber: userData.cardNumber || '1234 5678 9012 3456',
        avatar: userData.avatar || null
    });

    const [transactions] = useState([
        {
            type: 'topup',
            title: 'Top Up Successful!',
            description: 'You successfully top up your e-wallet for $600',
            time: '4 hours ago'
        },
        {
            type: 'payment',
            title: 'Payment Successful!',
            description: 'Shipping payment of $40 successfully made',
            time: '1 day ago'
        },
        {
            type: 'wallet',
            title: 'E-Wallet Connected!',
            description: 'You have connected the e-wallet with Saska',
            time: '2 days ago'
        }
    ]);

    const quickActions = [
        {
            icon: Package,
            title: 'Make Order',
            color: '#3b82f6',
            onPress: () => console.log('Make Order')
        },
        {
            icon: History,
            title: 'Order History',
            color: '#3b82f6',
            onPress: () => console.log('Order History')
        },
        {
            icon: MapPin,
            title: 'Saved Locations',
            color: '#3b82f6',
            onPress: () => console.log('Saved Locations')
        },
        {
            icon: (props) => <MaterialCommunityIcons name="headset" size={24} color="white" {...props} />,
            title: 'Help Center',
            color: '#3b82f6',
            onPress: () => console.log('Help Center')
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <Header userData={userData}/>
                <View style={styles.content}>
                    <WalletCard userData={userData} />
                    <AangServices features={serviceFeatures} />

                    <QuickActionsGrid actions={quickActions} />
                    <TransactionHistory transactions={transactions} onSeeAll={() => console.log('See all pressed')} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    greeting: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    notificationButton: {
        padding: 8,
        borderRadius: 20,
    },
    section: {
        flex: 1,
        paddingHorizontal: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#1f2937',
        marginBottom: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    featuresContainer: {
        gap: 16,
    },
    featureCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    featureIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },

    content: {
        paddingHorizontal: 10,
    },
    searchContainer: {
        marginVertical: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchPlaceholder: {
        color: '#9ca3af',
        fontSize: 16,
        flex: 1,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginVertical: 20,
    },
    actionButton: {
        alignItems: 'center',
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
    },
    historySection: {
        marginTop: 20,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    historyTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#1f2937',
    },
    seeAllText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
    transactionsList: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 5,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    transactionDescription: {
        fontSize: 14,
        color: '#6b7280',
    },
    transactionTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
});

export default Dashboard;