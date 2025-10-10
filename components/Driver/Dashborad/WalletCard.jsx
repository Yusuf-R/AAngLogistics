import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 60;

export const WalletCard = ({ userData }) => {
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
                        <Text style={styles.walletLabel}>Total Earnings</Text>
                        <Text style={styles.walletAmount}>
                            ₦{(userData?.wallet?.totalEarnings || 0).toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.walletIcon}>
                        <Ionicons name="wallet" size={28} color="#60A5FA"/>
                    </View>
                </View>

                <View style={styles.walletFooter}>
                    <View style={styles.walletInfo}>
                        <Text style={styles.walletInfoLabel}>Available</Text>
                        <Text style={styles.walletInfoValue}>
                            ₦{(userData?.wallet?.balance || 0).toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.walletDivider}/>
                    <View style={styles.walletInfo}>
                        <Text style={styles.walletInfoLabel}>Pending</Text>
                        <Text style={styles.walletInfoValue}>
                            ₦{(userData?.wallet?.pendingEarnings || 0).toLocaleString()}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};


const styles = StyleSheet.create({
    /* Wallet Section */
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
    // Enhanced Highlights Styles
    highlightsWrapper: {
        marginBottom: 8,
    },
    highlightsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        gap: 16,
    },
    highlightCard: {
        width: CARD_WIDTH * 0.75,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        height: 200,
    },
    highlightGradient: {
        flex: 1,
        padding: 0,
        position: 'relative',
    },
    cardPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    patternCircle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    highlightContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 2,
    },
    highlightIconContainer: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    highlightIconBackground: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },
    highlightTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    highlightTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        fontFamily: 'PoppinsBold',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    highlightDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.95)',
        fontFamily: 'PoppinsRegular',
        lineHeight: 20,
        opacity: 0.95,
    },
    shineOverlay: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 50,
        transform: [{ rotate: '45deg' }],
    },
    particleContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    paginationDotWrapper: {
        padding: 4,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
});
