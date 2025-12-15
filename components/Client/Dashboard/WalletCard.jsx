import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Plus, Eye, EyeOff, Package, CheckCircle, CreditCard, Wallet as WalletIcon} from 'lucide-react-native';
import {router} from 'expo-router';

function WalletCard({userData, financialData}) {
    const [showBalance, setShowBalance] = useState(false);

    // Financial analytics
    const totalOrders = financialData?.totalOrders || 0;
    const completedOrders = financialData?.completedOrders || 0;
    const totalPaid = financialData?.totalPaid || 0;
    const walletBalance = financialData?.walletBalance || 0;

    const formatCurrency = (amount) => {
        return `₦ ${parseFloat(amount).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const onTopUp = () => {
        router.push('/client/finance');
    };

    const analyticsItems = [
        {
            id: 'totalOrders',
            label: 'Total Orders',
            value: totalOrders,
            icon: <Package size={20} color="rgba(255, 255, 255, 0.9)"/>,
            color: '#60a5fa',
        },
        {
            id: 'completed',
            label: 'Completed',
            value: completedOrders,
            icon: <CheckCircle size={20} color="rgba(255, 255, 255, 0.9)"/>,
            color: '#34d399',
        },
        {
            id: 'totalPaid',
            label: 'Total Paid',
            value: formatCurrency(totalPaid),
            icon: <CreditCard size={20} color="rgba(255, 255, 255, 0.9)"/>,
            color: '#f59e0b',
        },
    ];

    return (
        <View style={styles.walletCard}>
            {/* Header Section */}
            <View style={styles.walletHeader}>
                <Text style={styles.walletName}>
                    {userData?.fullName || 'AAngLogistics Client'}
                </Text>
                <View style={styles.cardLogos}>
                    <Text style={styles.visaLogo}>AANG</Text>
                    <View style={styles.mastercardLogo}>
                        <View style={[styles.circle, styles.redCircle]}/>
                        <View style={[styles.circle, styles.orangeCircle]}/>
                    </View>
                </View>
            </View>

            {/* Analytics Grid */}
            <View style={styles.analyticsContainer}>
                {analyticsItems.map((item) => (
                    <View key={item.id} style={styles.analyticsCard}>
                        <View style={[styles.iconContainer, {backgroundColor: `${item.color}40`}]}>
                            {item.icon}
                        </View>
                        <Text style={styles.analyticsValue}>{item.value}</Text>
                        <Text style={styles.analyticsLabel}>{item.label}</Text>
                    </View>
                ))}
            </View>

            {/* Wallet Balance Section */}
            <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Wallet Balance</Text>
                <View style={styles.balanceRow}>
                    <View style={styles.balanceDisplay}>
                        <Text style={styles.balanceAmount}>
                            {showBalance ? formatCurrency(walletBalance) : '₦ •••••'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                            {showBalance ? (
                                <EyeOff size={18} color="white"/>
                            ) : (
                                <Eye size={18} color="white"/>
                            )}
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={onTopUp} style={styles.topUpButton}>
                        <Plus size={18} color="#3b82f6"/>
                        <Text style={styles.topUpText}>Top Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    walletCard: {
        backgroundColor: '#3b82f6',
        borderRadius: 20,
        padding: 24,
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    walletName: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        flex: 1,
    },
    cardLogos: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    visaLogo: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        marginRight: 10,
    },
    mastercardLogo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circle: {
        width: 25,
        height: 25,
        borderRadius: 15,
        marginLeft: -5,
    },
    redCircle: {
        backgroundColor: '#eb001b',
    },
    orangeCircle: {
        backgroundColor: '#ff5f00',
    },
    analyticsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    analyticsItem: {
        flex: 1,
        alignItems: 'center',
    },
    analyticsValueSmall: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    balanceSection: {
        marginTop: 8,
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 13,
        marginBottom: 8,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    balanceAmount: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
    },
    topUpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 4,
    },
    topUpText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
    analyticsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    },
    analyticsCard: {
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    analyticsValue: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
    },
    analyticsLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        letterSpacing: 0.3,
    },
});

export default WalletCard;