// app/(protected)/driver/dashboard/index.jsx
import React, {useEffect, useState, useRef} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Switch,
    Animated,
    Easing,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import {Ionicons, MaterialCommunityIcons, FontAwesome5, Feather} from '@expo/vector-icons';
import {useRouter} from "expo-router";
import DriverUtils from "utils/DriverUtilities";
import AutoScrollHighlights from './AutoScrollHighlights';
import {ProfileCompletionBanner} from "./ProfileCompletionBanner";
import AchievementsCard from './AchievementsCard';
import DeliveryHistory from './DeliveryHistory';
import {StatsBar} from "./StatsBar";
import {WalletCard} from "./WalletCard";
import SessionManager from "../../../lib/SessionManager";
import {toast} from "sonner-native";

const { width } = Dimensions.get('window');


export default function DriverDashboard({userData}) {
    const router = useRouter();
    const [isOnline, setIsOnline] = useState(userData?.availabilityStatus === 'online');
    const [currentStatus, setCurrentStatus] = useState(userData?.availabilityStatus || 'offline');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const getCurrentDate = () => {
        const date = new Date();
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Determine availability status display
    const getAvailabilityStatus = () => {
        if (currentStatus === 'on-ride') {
            return {text: 'On Transit', color: '#F59E0B', icon: 'car-side'};
        }
        if (currentStatus === 'online') {
            return {text: 'Online', color: '#10B981', icon: 'check-circle'};
        }
        return {text: 'Offline', color: '#6B7280', icon: 'pause-circle'};
    };
    const availabilityStatus = getAvailabilityStatus();
    // Online Toggle
    const handleOnlineToggle = async (value) => {
        if (currentStatus === 'on-ride') {
            toast.info('Cannot change status while on transit');
            return;
        }

        setIsUpdatingStatus(true);

        try {
            const newStatus = value ? 'online' : 'offline';

            // Show loading state immediately
            setIsOnline(value);
            setCurrentStatus(newStatus);

            // Make API call to update status
            const response = await DriverUtils.updateDriverStatus(newStatus);

            if (response.success) {
                // Update session data
                await SessionManager.updateUser(response?.driverData);

                toast.success(`Status updated to ${newStatus}`);
            } else {
                // Revert on error
                setIsOnline(!value);
                setCurrentStatus(value ? 'offline' : 'online');

                toast.error(response.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Status update error:', error);
            // Revert on error
            setIsOnline(!value);
            setCurrentStatus(value ? 'offline' : 'online');

            toast.error('Network error. Please try again.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };
    const isVerified = userData?.verification?.overallStatus === 'approved';
    const stats = [
        {
            label: 'Total Deliveries',
            value: userData?.performance?.totalDeliveries || 0,
            icon: 'package',
            color: '#3B82F6',
            iconLib: 'Feather',
        },
        {
            label: 'Completed',
            value: userData?.performance?.weeklyStats?.deliveries || 0,
            icon: 'checkmark-done-circle',
            color: '#10B981',
            iconLib: 'Ionicons',
        },
        {
            label: 'Rating',
            value: userData?.performance?.averageRating?.toFixed(1) || '0.0',
            icon: 'star',
            color: '#F59E0B',
            iconLib: 'Ionicons',
        },
        {
            label: 'This Week',
            value: `₦${userData?.performance?.weeklyStats?.earnings?.toLocaleString() || '0'}`,
            icon: 'trending-up',
            color: '#8B5CF6',
            iconLib: 'Feather',
        },
    ];


    const recentDeliveries = userData?.wallet?.recentTransactions?.slice(0, 3) || [];

    // Profile completion via DriverUtils
    const {percent: profileCompletion, isComplete: isProfileComplete} =
        DriverUtils.getProfileCompletion(userData);

    // Pulse anim only when NOT complete
    const pulse = useRef(new Animated.Value(0)).current;

    const highlights = [
        {
            title: 'Start Earning Today',
            description: 'Complete your profile and start accepting orders to earn money on your schedule',
            icon: 'wallet',
            gradient: ['#3B82F6', '#2563EB'],
        },
        {
            title: 'Flexible Schedule',
            description: 'Work when you want. You control your hours and maximize your earnings',
            icon: 'calendar',
            gradient: ['#10B981', '#059669'],
        },
        {
            title: 'Secure Platform',
            description: 'Your safety matters. Track all deliveries with GPS and 24/7 support',
            icon: 'shield-checkmark',
            gradient: ['#8B5CF6', '#7C3AED'],
        },
        {
            title: 'Quick Payouts',
            description: 'Get paid instantly to your bank account. No delays, no hassles',
            icon: 'cash',
            gradient: ['#F59E0B', '#D97706'],
        },
    ];

    useEffect(() => {
        if (!isProfileComplete) {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, {
                        toValue: 1,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true
                    }),
                    Animated.timing(pulse, {
                        toValue: 0,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true
                    }),
                ])
            );
            loop.start();
            return () => loop.stop();
        } else {
            pulse.setValue(0); // reset when completed
        }
    }, [isProfileComplete, pulse]);

    const completionAnimatedStyle = {
        transform: [
            {
                scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.04],
                }),
            },
        ],
        shadowOpacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.15, 0.35],
        }),
        elevation: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [3, 6],
        }),
    };


    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.headerContainer}>
                <Image
                    source={require('../../../assets/images/test.png')}
                    style={styles.headerBackground}
                    blurRadius={1}
                />

                <View style={styles.headerOverlay}>
                    {/* ROW 1: Avatar (left) + Greeting+Data (center) + Logo (right) */}
                    <View style={styles.rowOne}>
                        {/* Avatar */}
                        <View style={styles.avatarWrap}>
                            {userData?.avatar ? (
                                <Image source={{uri: userData.avatar}} style={styles.avatar}/>
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {userData?.fullName?.charAt(0)?.toUpperCase() || 'D'}
                                    </Text>
                                </View>
                            )}
                            <View
                                style={[
                                    styles.verificationBadge,
                                    {backgroundColor: isVerified ? '#10B981' : '#6B7280'},
                                ]}>
                                <Ionicons
                                    name={isVerified ? 'checkmark' : 'time-outline'}
                                    size={12}
                                    color="#FFF"
                                />
                            </View>
                        </View>

                        {/* Greeting + DATA (date) */}
                        <View style={styles.centerTexts}>
                            <Text style={styles.greeting}>
                                {userData?.fullName
                                    ? `Hi, ${userData.fullName.split(' ')[0]}`
                                    : 'Hi, Driver'}
                            </Text>
                            <View style={styles.dataPill}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={14}
                                    color="rgba(255,255,255,0.9)"
                                />
                                <Text style={styles.dataText}>{getCurrentDate()}</Text>
                            </View>
                        </View>

                        {/* Logo (far right) */}
                        <View style={styles.logoContainer}>
                            {/* Replace with your PNG/SVG if you have it */}
                            <Image
                                source={require('../../../assets/images/AAngLogo.png')}
                                style={styles.logoImg}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* ROW 2: Ready to earn today? (only thing on the row) */}
                    <View style={styles.rowTwo}>
                        <Text style={styles.readyText}>Ready to earn today?</Text>
                        <View style={styles.availabilityCard}>
                            <View style={styles.availabilityLeft}>
                                <View style={styles.availabilityInfo}>
                                    <Text style={styles.availabilityLabel}>Status</Text>
                                </View>
                                <View style={[styles.statusIndicator, {backgroundColor: availabilityStatus.color}]}>
                                    <FontAwesome5 name={availabilityStatus.icon} size={16} color="#FFF"/>
                                </View>
                                {currentStatus !== 'on-ride' && (
                                    <View style={styles.availabilityRight}>
                                        {isUpdatingStatus ? (
                                            <View style={styles.loadingContainer}>
                                                <ActivityIndicator size="small" color="#10B981" />
                                            </View>
                                        ) : (
                                            <Switch
                                                value={isOnline}
                                                onValueChange={handleOnlineToggle}
                                                trackColor={{false: '#E5E7EB', true: '#10B981'}}
                                                thumbColor="#FFF"
                                                ios_backgroundColor="#E5E7EB"
                                                disabled={isUpdatingStatus}
                                            />
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
            {isUpdatingStatus && (
                <View style={styles.overlay}>
                    <View style={styles.overlayContent}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.overlayText}>Updating status...</Text>
                    </View>
                </View>
            )}
            {/* BODY */}
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                {/* Wallet */}
                <WalletCard userData={userData} />
                {/* Stats */}
                <StatsBar stats={stats} />
                {/* Profile Completion */}
                <ProfileCompletionBanner
                    profileCompletion={profileCompletion}
                    isProfileComplete={isProfileComplete}
                    completionAnimatedStyle={completionAnimatedStyle}
                />
                {/* Highlights */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Why AAngLogistics ?</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionLink}>Learn More</Text>
                        </TouchableOpacity>
                    </View>
                    <AutoScrollHighlights highlights={highlights} />
                </View>
                {/* Achievement */}
                <AchievementsCard userData={userData} />
                {/*Mini Delivery history*/}
                <DeliveryHistory userData={userData} />
            </ScrollView>
        </View>
    );
}

const HEADER_HEIGHT = 175;
const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#F9FAFB'},
    headerContainer: {
        height: HEADER_HEIGHT,
        position: 'relative',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        overflow: "hidden"
    },
    headerBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
    },
    headerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.40)',
        paddingHorizontal: 8,
        paddingTop: 15,
    },

    /* ROW 1 */
    rowOne: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    avatarWrap: {position: 'relative'},
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.85)',
    },
    avatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 100,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.85)',
    },
    avatarText: {color: '#FFF', fontSize: 16, fontWeight: '800'},
    verificationBadge: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerTexts: {
        flex: 1,
        paddingHorizontal: 8,
        marginTop: 3,
    },
    greeting: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        marginBottom: 6,
    },
    dataPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderColor: 'rgba(255,255,255,0.35)',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    dataText: {color: 'rgba(255,255,255,0.95)', fontSize: 12, fontFamily: 'PoppinsRegular'},
    logoContainer: {
        width: 50,
        height: 50,
        borderRadius: 100,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImg: {width: 60, height: 60},
    /* ROW 2 */
    rowTwo: {
        marginTop: 28,
        paddingHorizontal: 4,
    },
    readyText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'PoppinsRegular'
    },
    availabilityCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
    },
    availabilityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusIndicator: {
        width: 18,
        height: 18,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    availabilityInfo: {
        gap: 2,
    },
    availabilityLabel: {
        fontSize: 12,
        color: '#FFF',
        fontFamily: 'PoppinsRegular',
    },
    availabilityStatus: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
    },
    availabilityRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    /* BODY */
    contentContainer: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
    },

    emptyState: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'PoppinsBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    emptyStateButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyStateButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    // section title
    sectionTitle: {
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'PoppinsBold',
    },
    sectionLink: {
        fontSize: 14,
        color: '#3B82F6',
        fontFamily: 'PoppinsMedium',
    },

    // Overlay
    loadingContainer: {
        width: 51, // Same width as Switch for consistent layout
        height: 31, // Same height as Switch
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    overlayContent: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 150,
    },
    overlayText: {
        marginTop: 12,
        fontSize: 14,
        color: '#374151',
        fontFamily: 'PoppinsMedium',
    },

});