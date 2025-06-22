import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import {
    Plus,
    Eye,
    EyeOff
} from 'lucide-react-native';
import { router } from 'expo-router';

function WalletCard({ userData }) {
    const [showBalance, setShowBalance] = useState(false);
    const [showCardNumber, setShowCardNumber] = useState(false);
    // Generate random balance only once
    const [randomBalance] = useState(() => (Math.random() * 100000).toFixed(2));

    const getDisplayBalance = () => {
        if (!showBalance) {
            return '₦ •••••';
        }

        if (userData?.balance != null && !isNaN(userData.balance)) {
            const balance = parseFloat(userData.balance).toFixed(2);
            return `₦ ${parseFloat(balance).toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }

        // Show random balance if no real one exists
        return `₦ ${parseFloat(randomBalance).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const onTopUp = () => {
        // Handle top-up action here
        router.push('/client/wallet');
    }

    return (
        <View style={styles.walletCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{userData.fullName}</Text>
                <View style={styles.cardLogos}>
                    <Text style={styles.visaLogo}>VISA</Text>
                    <View style={styles.mastercardLogo}>
                        <View style={[styles.circle, styles.redCircle]} />
                        <View style={[styles.circle, styles.orangeCircle]} />
                    </View>
                </View>
            </View>

            <View style={styles.cardRow}>
                <Text style={styles.cardNumber}>
                    {showCardNumber ? userData.cardNumber? userData.cardNumber : '1234 4567 9876 4321' : '•••• •••• •••• ••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowCardNumber(prev => !prev)}>
                    {showCardNumber ? (
                        <EyeOff size={18} color="white" />
                    ) : (
                        <Eye size={18} color="white" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <View style={styles.balanceRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.balanceAmount}>{getDisplayBalance()}</Text>
                        <TouchableOpacity onPress={() => setShowBalance(prev => !prev)}>
                            {showBalance ? (
                                <EyeOff size={18} color="white" />
                            ) : (
                                <Eye size={18} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={onTopUp} style={styles.topUpButton}>
                        <Plus size={18} color="#3b82f6" />
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
        borderRadius: 16,
        padding: 20,
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardName: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
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
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    cardNumber: {
        color: 'white',
        fontSize: 18,
        letterSpacing: 2,
        fontFamily: 'PoppinsSemiBold',
    },
    balanceSection: {
        marginTop: 10,
    },
    balanceLabel: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        opacity: 0.8,
        marginBottom: 5,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceAmount: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
    },
    topUpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    topUpText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default WalletCard;
