import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Animated,
    Dimensions,
    StyleSheet,
    StatusBar,
    RefreshControl,
    Image,
    TextInput
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
    Package,
    Boxes,
    MapPin,
    Clock,
    Plus,
    Truck,
    Search,
    Star,
    ArrowRight,
    Calendar,
    Shield,
    Zap,
    Users,
    BarChart3,
    Settings,
    Bell,
    Heart,
    History,
    FileText,
    Navigation,
    ChevronRight
} from 'lucide-react-native';
import {useNavigation} from "@react-navigation/native";
import { router } from "expo-router";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const OrdersHub = ({
                       userData,
                       userStats = {totalOrders: 24, activeOrders: 2, completedOrders: 22},
                       recentOrders = [],
                       onTrackOrder = null
                   }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [activeCard, setActiveCard] = useState(null);
    const [greeting, setGreeting] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const firstName = userData?.fullName?.split(' ')[0] || 'User';

    // render today's data as Day, Month, Year
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const quickActionCards = [
        {
            id: 'dropoff',
            title: 'Create',
            icon: Package,
            colors: ['#7C3AED', '#5B21B6'],
            action: () => router.push('/client/orders/create')
        },
        {
            id: 'rates',
            title: 'Rates',
            icon: BarChart3,
            colors: ['#10A1A6', '#5E5AE4'],
            action: () => router.push('/client/orders/manage')
        },
        {
            id: 'pickup',
            title: 'Manage',
            icon: Truck,
            colors: ['#3B82F6', '#1D4ED8'],
            action: () => router.push('/client/orders/manage')
        },

        {
            id: 'history',
            title: 'History',
            icon: History,
            colors: ['#F43F5E', '#B91C1C'],
            action: () => router.push('/client/orders/create')
        }
    ];

    const mockTrackingHistory = recentOrders.length > 0 ? recentOrders : [
        {
            id: '1',
            title: 'Macbook Pro M1 2023',
            trackingId: 'N88817649',
            status: 'delivered',
            date: '2 hours ago',
            destination: 'Victoria Island, Lagos',
            icon: '📦'
        },
        {
            id: '2',
            title: 'Macbook Pro M1 2023',
            trackingId: 'N88817648',
            status: 'in_transit',
            date: 'Yesterday',
            destination: 'Ikeja, Lagos',
            icon: '📦'
        }
    ];

    const mockCurrentShipments = userData.currentOrders?.length > 0 ? userData.currentOrders : [
        {
            id: '1',
            title: 'Macbook pro M2',
            trackingId: 'HI23135461235',
            status: 'in_progress',
            progress: 65,
            destination: 'Lekki Phase 1, Lagos',
            estimatedDelivery: 'Today, 3:00 PM'
        }
    ];

    const handleCardPress = async (cardId, action) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActiveCard(cardId);

        setTimeout(() => {
            setActiveCard(null);
            if (action) action();
        }, 150);
    };

    const handleTrackSearch = async () => {
        if (trackingNumber.trim()) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Handle tracking search
            if (onTrackOrder) {
                onTrackOrder(trackingNumber);
            } else {
                navigation?.navigate('TrackOrder', {trackingNumber});
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Simulate refresh - replace with actual data fetching
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.8],
        extrapolate: 'clamp',
    });

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -20],
        extrapolate: 'clamp',
    });

    return (
        <>
            <View style={styles.container}>
                {/*Header*/}
                <Animated.View>
                    <LinearGradient
                        colors={['#FFF', '#FFF']}
                        style={styles.headerGradient}
                    >
                        {/* Subtle decorative elements */}
                        <View style={styles.decorativeCircle1}/>
                        <View style={styles.decorativeCircle2}/>
                        <View style={styles.headerContent}>
                            {/* LHS */}
                            <View style={styles.headerLeft}>
                                <View style={styles.profileSection}>
                                    {userData?.avatar ? (
                                        <View style={styles.profileImageContainer}>
                                            <Image
                                                source={{uri: userData.avatar}}
                                                style={styles.profileImage}
                                            />
                                            <View style={styles.onlineIndicator}/>
                                        </View>
                                    ) : (
                                        <View style={styles.profilePlaceholder}>
                                            <Text style={styles.profileInitial}>
                                                {firstName.charAt(0).toUpperCase()}
                                            </Text>
                                            <View style={styles.onlineIndicator}/>
                                        </View>
                                    )}
                                    <View style={styles.lhsContent}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.ordersTitle}>Orders Hub</Text>
                                            <Boxes size={20} color="#3B82F6"/>
                                        </View>
                                        <View style={styles.dateContainer}>
                                            <Calendar size={12} color="#3B82F6"/>
                                            <Text style={styles.date}>{formattedDate}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            {/*RHS*/}
                            <View style={styles.headerRight}>
                                <View style={styles.logoContainer}>
                                    <View style={styles.logoImageContainer}>
                                        <Image
                                            source={require('../../../assets/images/AAngLogo.png')}
                                            style={styles.logoImage}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.subtitleContainer}>
                            <Text style={styles.subtitle}>Ready to send something today?</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Main Content */}
                <Animated.ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                    }
                    onScroll={Animated.event(
                        [{nativeEvent: {contentOffset: {y: scrollY}}}],
                        {useNativeDriver: false}
                    )}
                    scrollEventThrottle={16}
                >
                    {/* Stats Overview */}
                    <Animated.View
                        style={[
                            styles.statsContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{translateY: slideAnim}]
                            }
                        ]}
                    >
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <View style={styles.statContent}>
                                    <Text style={styles.statNumber}>{userStats.totalOrders}</Text>
                                    <Text style={styles.statLabel}>Total Orders</Text>
                                </View>
                                <View style={[styles.statIcon, {backgroundColor: '#EBF4FF'}]}>
                                    <BarChart3 size={20} color="#3B82F6"/>
                                </View>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statContent}>
                                    <Text style={[styles.statNumber, {color: '#10B981'}]}>
                                        {userStats.activeOrders}
                                    </Text>
                                    <Text style={styles.statLabel}>Active</Text>
                                </View>
                                <View style={[styles.statIcon, {backgroundColor: '#D1FAE5'}]}>
                                    <Truck size={20} color="#10B981"/>
                                </View>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statContent}>
                                    <Text style={[styles.statNumber, {color: '#8B5CF6'}]}>
                                        {userStats.completedOrders}
                                    </Text>
                                    <Text style={styles.statLabel}>Completed</Text>
                                </View>
                                <View style={[styles.statIcon, {backgroundColor: '#EDE9FE'}]}>
                                    <Star size={20} color="#8B5CF6"/>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Track Package Section */}
                    <View style={styles.section}>
                        <View style={styles.trackingCard}>
                            <LinearGradient
                                colors={['#3B82F6', '#1D4ED8']}

                                style={styles.trackingGradient}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                            >
                                <Text style={styles.trackingTitle}>Track your package</Text>
                                <Text style={styles.trackingSubtitle}>Please enter your tracking number</Text>

                                <View style={styles.searchContainer}>
                                    <View style={styles.searchInputContainer}>
                                        <Search size={20} color="#9CA3AF" style={styles.searchIcon}/>
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Tracking number"
                                            placeholderTextColor="#9CA3AF"
                                            value={trackingNumber}
                                            onChangeText={setTrackingNumber}
                                            returnKeyType="search"
                                            onSubmitEditing={handleTrackSearch}
                                        />
                                    </View>
                                    <Pressable
                                        style={styles.searchButton}
                                        onPress={handleTrackSearch}
                                    >
                                        <LinearGradient
                                            colors={['#F59E0B', '#D97706']}
                                            style={styles.searchButtonGradient}
                                        >
                                            <Package size={20} color="#ffffff"/>
                                        </LinearGradient>
                                    </Pressable>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.section}>
                        <View style={styles.quickActionsGrid}>
                            {quickActionCards.map((card, index) => {
                                const IconComponent = card.icon;
                                const isActive = activeCard === card.id;

                                return (
                                    <Pressable
                                        key={card.id}
                                        onPress={() => handleCardPress(card.id, card.action)}
                                        style={[styles.quickActionItem, isActive && styles.activeActionItem]}
                                    >
                                        <View style={styles.actionIconContainer}>
                                            <LinearGradient
                                                colors={card.colors}
                                                style={styles.actionIconGradient}
                                            >
                                                <IconComponent size={24} color="#ffffff"/>
                                            </LinearGradient>
                                        </View>
                                        <Text style={styles.actionTitle}>{card.title}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Current Shipment */}
                    {mockCurrentShipments.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Current Shipment</Text>
                            <View style={styles.currentShipmentContainer}>
                                {mockCurrentShipments.map((shipment, index) => (
                                    <View key={shipment.id} style={styles.currentShipmentCard}>
                                        <View style={styles.shipmentHeader}>
                                            <View style={styles.shipmentIcon}>
                                                <Text style={styles.shipmentEmoji}>📦</Text>
                                            </View>
                                            <View style={styles.shipmentInfo}>
                                                <Text style={styles.shipmentTitle}>{shipment.title}</Text>
                                                <Text style={styles.shipmentTrackingId}>
                                                    #{shipment.trackingId}
                                                </Text>
                                            </View>
                                            <Pressable style={styles.shipmentMenu}>
                                                <Text style={styles.menuDots}>⋯</Text>
                                            </Pressable>
                                        </View>

                                        <View style={styles.progressContainer}>
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        {width: `${shipment.progress}%`}
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.progressText}>{shipment.progress}%</Text>
                                        </View>

                                        <View style={styles.shipmentDetails}>
                                            <View style={styles.shipmentDetailRow}>
                                                <MapPin size={14} color="#6B7280"/>
                                                <Text style={styles.shipmentDetailText}>{shipment.destination}</Text>
                                            </View>
                                            <View style={styles.shipmentDetailRow}>
                                                <Clock size={14} color="#6B7280"/>
                                                <Text
                                                    style={styles.shipmentDetailText}>Est. {shipment.estimatedDelivery}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Tracking History */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Tracking History</Text>
                            <Pressable>
                                <Text style={styles.seeAll}>See all</Text>
                            </Pressable>
                        </View>
                        <View style={styles.historyContainer}>
                            {mockTrackingHistory.map((order, index) => (
                                <Pressable key={order.id} style={styles.historyCard}>
                                    <View style={styles.historyIcon}>
                                        <Text style={styles.historyEmoji}>{order.icon}</Text>
                                    </View>
                                    <View style={styles.historyContent}>
                                        <Text style={styles.historyTitle}>{order.title}</Text>
                                        <Text style={styles.historyTrackingId}>
                                            Tracking ID: {order.trackingId}
                                        </Text>
                                    </View>
                                    <ChevronRight size={20} color="#9CA3AF"/>
                                </Pressable>
                            ))}
                        </View>
                    </View>


                    {/* Bottom Spacing */}
                    <View style={styles.bottomSpacing}/>
                </Animated.ScrollView>

                {/* Floating Action Button */}
                <View style={[styles.fabContainer, {bottom: insets.bottom + 20}]}>
                    <Pressable
                        style={styles.fab}
                        onPress={() =>  router.push('/client/orders/create')}
                    >
                        <LinearGradient
                            colors={['#3B82F6', '#1D4ED8']}
                            style={styles.fabGradient}
                        >
                            <Plus size={24} color="#ffffff"/>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerGradient: {
        width: SCREEN_WIDTH,
        borderTopRightRadius: 40,
        borderTopLeftRadius: 40,
        paddingHorizontal: 5,
        paddingVertical: 5,
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3B82F6',
        opacity: 0.05,
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10B981',
        opacity: 0.08,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
        marginBottom: 5,
    },
    headerLeft: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 100,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    profileImageContainer: {
        position: 'relative',
        marginRight: 5,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 80,
        marginRight: 10,
    },
    profilePlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    lhsContent: {
        justifyContent: 'center',
        alignItems: 'baseline',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ordersTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#1F2937',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    date: {
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    profileInitial: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerRight: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 100,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoImageContainer: {
        width: 55,
        height: 55,
        borderRadius: 65,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
    },
    logoImage: {
        width: 50,
        height: 50,
        borderRadius: 55,
    },
    subtitleContainer: {
        paddingHorizontal: 5,
        paddingVertical: 5,
        alignSelf: 'flex-start',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
    },
    statsContainer: {
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 26,
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    statContent: {
        flex: 1,
    },
    statNumber: {
        fontSize: 18,
        color: '#1f2937',
        fontFamily: 'PoppinsSemiBold',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        paddingHorizontal: 10,
        marginBottom: 25,
    },
    // Tracking Card Styles
    trackingCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 12,
    },
    trackingGradient: {
        padding: 24,
    },
    trackingTitle: {
        fontSize: 22,
        color: '#ffffff',
        marginBottom: 8,
        fontFamily: 'PoppinsSemiBold',
    },
    trackingSubtitle: {
        fontSize: 16,
        color: '#ffffff',
        opacity: 0.9,
        marginBottom: 20,
        fontFamily: 'PoppinsRegular',
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 25,
        paddingHorizontal: 16,
        height: 50,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'PoppinsRegular',
    },
    searchButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 6,
    },
    searchButtonGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Quick Actions Styles
    quickActionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    quickActionItem: {
        flex: 1,
        alignItems: 'center',
        padding: 8,
    },
    activeActionItem: {
        transform: [{scale: 0.95}],
    },
    actionIconContainer: {
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
    },
    actionIconGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        fontFamily: 'PoppinsMedium',
    },
    // Section Headers
    sectionTitle: {
        fontSize: 20,
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
    seeAll: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
    // History Styles
    historyContainer: {
        gap: 12,
    },
    historyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
    },
    historyIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyEmoji: {
        fontSize: 20,
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    historyTrackingId: {
        fontSize: 13,
        color: '#6B7280',
    },
    // Current Shipment Styles
    currentShipmentContainer: {
        gap: 16,
    },
    currentShipmentCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    shipmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    shipmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    shipmentEmoji: {
        fontSize: 18,
    },
    shipmentInfo: {
        flex: 1,
    },
    shipmentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    shipmentTrackingId: {
        fontSize: 12,
        color: '#6B7280',
    },
    shipmentMenu: {
        padding: 4,
    },
    menuDots: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: 'bold',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
        minWidth: 35,
        textAlign: 'right',
    },
    shipmentDetails: {
        gap: 8,
    },
    shipmentDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    shipmentDetailText: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    // FAB Styles
    fabContainer: {
        position: 'absolute',
        right: 20,
        alignItems: 'center',
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSpacing: {
        height: 100,
    },
});

export default OrdersHub;