// components/Driver/Account/DataVerification/ApprovedScreen.jsx
import React, {useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Alert,
    Animated, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CustomHeader from '../../../CustomHeader';

function ApprovedScreen({ verification, userData, onRefresh }) {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const [initiatingUpdate, setInitiatingUpdate] = useState(false);

    React.useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleStartEarning = () => {
        router.push('/driver/discover');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };
    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };

    const hasPendingUpdate = verification?.pendingUpdate?.exists &&
        verification?.pendingUpdate?.status === 'pending_review';


    const verificationDate = verification?.verificationDate || verification?.lastReviewDate;

    const handleInitiateUpdate = () => {
        if (hasPendingUpdate) {
            Alert.alert(
                'Pending Update',
                'You already have an update request under review. Please wait for admin approval.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Update Verification',
            'Do you want to update your verification details? Your current verification will remain active while the update is being reviewed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    onPress: () => {
                        router.push({
                            pathname: '/driver/account/verification',
                            params: { mode: 'update' }
                        });
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Verification Status"
                onBackPress={() => router.back()}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#10b981"
                        colors={['#10b981']}
                    />
                }
            >
                {hasPendingUpdate && (
                    <View style={styles.pendingBanner}>
                        <View style={styles.pendingIconContainer}>
                            <Ionicons name="time-outline" size={28} color="#f59e0b" />
                        </View>
                        <View style={styles.pendingContent}>
                            <Text style={styles.pendingTitle}>Update Under Review</Text>
                            <Text style={styles.pendingText}>
                                Your verification update is being reviewed. You can continue
                                working with your current verification.
                            </Text>
                            <Text style={styles.pendingDate}>
                                Submitted: {formatDate(verification.pendingUpdate.submittedAt)}
                            </Text>
                        </View>
                    </View>
                )}
                {/* Success Animation */}
                <Animated.View
                    style={[
                        styles.successCard,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.successGradient}
                    >
                        <View style={styles.successIconContainer}>
                            <View style={styles.successIconOuter}>
                                <Ionicons name="checkmark-circle" size={80} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.successTitle}>Congratulations!</Text>
                        <Text style={styles.successSubtitle}>
                            Your verification has been approved
                        </Text>
                        <View style={styles.approvedBadge}>
                            <Ionicons name="shield-checkmark" size={16} color="#fff" />
                            <Text style={styles.approvedBadgeText}>Verified Driver</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Update Verification Button */}
                {!hasPendingUpdate && (
                    <Pressable
                        style={styles.updateCard}
                        onPress={handleInitiateUpdate}
                        disabled={initiatingUpdate}
                    >
                        <View style={styles.updateCardContent}>
                            <View style={styles.updateIconContainer}>
                                <Ionicons name="refresh-circle" size={32} color="#3b82f6" />
                            </View>
                            <View style={styles.updateTextContainer}>
                                <Text style={styles.updateTitle}>Update Verification</Text>
                                <Text style={styles.updateDescription}>
                                    Change vehicle type, location, or renew documents
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                        </View>
                    </Pressable>
                )}

                {/* Welcome Message */}
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeTitle}>
                        Welcome to AAng Logistics! 🎉
                    </Text>
                    <Text style={styles.welcomeText}>
                        You're now officially verified and ready to start accepting delivery
                        requests. Your journey to earning begins now!
                    </Text>
                </View>

                {/* Verification Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="information-circle-outline" size={24} color="#10b981" />
                        <Text style={styles.cardTitle}>Verification Details</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status:</Text>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Approved</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Verified On:</Text>
                        <Text style={styles.detailValue}>
                            {formatDate(verificationDate)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Vehicle Type:</Text>
                        <Text style={styles.detailValue}>
                            {userData?.vehicleDetails?.type || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Compliance Score:</Text>
                        <Text style={styles.scoreValue}>
                            {verification?.complianceScore || 100}%
                        </Text>
                    </View>
                </View>

                {/* What You Can Do Now */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="rocket-outline" size={24} color="#10b981" />
                        <Text style={styles.cardTitle}>What You Can Do Now</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="location" size={24} color="#10b981" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>Go Online</Text>
                            <Text style={styles.featureDescription}>
                                Toggle availability to start receiving delivery requests
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="card" size={24} color="#10b981" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>Accept Orders</Text>
                            <Text style={styles.featureDescription}>
                                Start earning by accepting nearby delivery requests
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="wallet" size={24} color="#10b981" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>Track Earnings</Text>
                            <Text style={styles.featureDescription}>
                                Monitor your daily, weekly, and monthly earnings
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="cash" size={24} color="#10b981" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>Withdraw Funds</Text>
                            <Text style={styles.featureDescription}>
                                Request payouts directly to your verified bank account
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tips for Success */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
                        <Text style={styles.cardTitle}>Tips for Success</Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons name="star" size={16} color="#f59e0b" />
                        <Text style={styles.tipText}>
                            Maintain a high rating by being professional and punctual
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons name="star" size={16} color="#f59e0b" />
                        <Text style={styles.tipText}>
                            Keep your vehicle in good condition for better performance
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons name="star" size={16} color="#f59e0b" />
                        <Text style={styles.tipText}>
                            Communicate clearly with customers for smooth deliveries
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons name="star" size={16} color="#f59e0b" />
                        <Text style={styles.tipText}>
                            Update your availability status when taking breaks
                        </Text>
                    </View>
                </View>

                {/* Support Card */}
                <View style={styles.supportCard}>
                    <Ionicons name="headset-outline" size={24} color="#6b7280" />
                    <View style={styles.supportContent}>
                        <Text style={styles.supportTitle}>Need Help?</Text>
                        <Text style={styles.supportText}>
                            Our support team is available 24/7 to assist you
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Start Earning Button */}
            <View style={styles.bottomBar}>
                <Pressable
                    style={styles.startButton}
                    onPress={handleStartEarning}
                >
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.startGradient}
                    >
                        <Text style={styles.startButtonText}>Start Earning Now</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    successCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    successGradient: {
        padding: 32,
        alignItems: 'center',
    },
    successIconContainer: {
        marginBottom: 16,
    },
    successIconOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitle: {
        fontSize: 28,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 16,
    },
    approvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    approvedBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
    },
    welcomeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
    },
    welcomeTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    welcomeText: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'PoppinsMedium',
        lineHeight: 20,
        textAlign: 'justify'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsMedium',
        fontWeight: '600',
        color: '#111827',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#6b7280',
    },
    detailValue: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        textTransform: 'capitalize',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1fae5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#059669',
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10b981',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        gap: 16,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        lineHeight: 18,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
        gap: 12,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#4b5563',
        lineHeight: 18,
    },
    supportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 16,
    },
    supportContent: {
        flex: 1,
    },
    supportTitle: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        marginBottom: 4,
    },
    supportText: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#6b7280',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    startButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    startGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'PoppinsMedium',
        color: '#fff',
    },



    pendingBanner: {
        backgroundColor: '#fffbeb',
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        gap: 12,
    },
    pendingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingContent: {
        flex: 1,
    },
    pendingTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#92400e',
        marginBottom: 4,
    },
    pendingText: {
        fontSize: 13,
        color: '#78350f',
        fontFamily: 'PoppinsRegular',
        lineHeight: 18,
        marginBottom: 8,
    },
    pendingDate: {
        fontSize: 12,
        color: '#a16207',
        fontStyle: 'italic',
    },
    updateCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    updateCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    updateIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateTextContainer: {
        flex: 1,
    },
    updateTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        marginBottom: 4,
    },
    updateDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#6b7280',
        lineHeight: 18,
    },
});

export default ApprovedScreen;