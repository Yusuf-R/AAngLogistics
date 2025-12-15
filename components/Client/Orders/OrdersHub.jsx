// components/Client/Orders/OrdersHub.jsx
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
    TextInput, ActivityIndicator,
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
import {router} from "expo-router";
import CustomAlert from "./CustomAlert";
import {useOrderStore} from "../../../store/useOrderStore";
import {
    getShipmentProgress,
    getStatusDisplay,
    formatOrderDate,
    getStatusIcon,
    getStatusColor
} from "../../../utils/Client/orderHelpers";
import useNavigationStore from "../../../store/Client/useNavigationStore";
import {Ionicons} from "@expo/vector-icons";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const OrdersHub = ({
                       userData,
                       allOrderData,
                       orderStatistics,
                       onRefreshData = null,
                       isRefreshing = false,
                   }) => {
    const insets = useSafeAreaInsets();
    const [activeCard, setActiveCard] = useState(null);
    const [greeting, setGreeting] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const firstName = userData?.fullName?.split(' ')[0] || 'User';
    const [alert, showAlert] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'error',
        title: '',
        message: '',
    });
    const [navigationLoading, setNavigationLoading] = useState(null);

    const {
        setTrackingOrder,
    } = useOrderStore();

    const { setLastRoute } = useNavigationStore();

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
        // {
        //     id: 'rates',
        //     title: 'Rates',
        //     icon: BarChart3,
        //     colors: ['#10A1A6', '#5E5AE4'],
        //     action: () => router.push('/client/orders/manage')
        // },
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
            action: () => router.push('/client/orders/history')
        }
    ];

    const handleCardPress = async (cardId, action) => {
        handleNavigateWithLoading(cardId, action);
    };

    const validateAndFindOrder = (trackingNumber, allOrderData) => {
        const clean = trackingNumber?.trim();

        if (!clean) {
            return {
                isValid: false,
                error: {type: 'error', title: 'Input required', message: 'Order-Reference number required.'}
            };
        }

        if (clean.length < 17 || !/^ORD-/.test(clean)) {
            return {
                isValid: false,
                error: {type: 'error', title: 'Invalid Input', message: 'Please enter a valid tracking number.'}
            };
        }

        const matchedOrder = allOrderData.find(order => order.orderRef === clean);

        if (!matchedOrder) {
            return {
                isValid: false,
                error: {type: 'error', title: 'Not Found', message: 'No order found with that tracking number.'}
            };
        }

        return {
            isValid: true,
            matchedOrder
        };
    };

    const handleTrackSearch = async () => {
        const result = validateAndFindOrder(trackingNumber, allOrderData);

        if (!result.isValid) {
            setAlertConfig(result.error);
            showAlert(true);
            return;
        }

        setIsLoading(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTrackingOrder(result.matchedOrder);

        setTimeout(() => {
            setIsLoading(false);
            router.push('/client/orders/track'); // No params needed — Zustand has the data
        }, 500);
    };

    const onRefresh = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (typeof onRefreshData === 'function') {
            await onRefreshData();
        }
    };

    const navigateToOrderDetails = (orderId) => {
        setLastRoute('order-details-from-orders', '/client/orders');
        setTimeout(() => {
            router.push(`/client/profile/analytics/orders/view/${orderId}`);
        }, 10);
    };

    const handleNavigateWithLoading = async (loadingKey, navigationAction, hapticFeedback = true) => {
        if (navigationLoading) return;
        setNavigationLoading(loadingKey);

        if (hapticFeedback) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        setTimeout(() => {
            navigationAction();
            setTimeout(() => setNavigationLoading(null), 300);
        }, 150);
    };

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
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh}/>
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
                                    <Text style={styles.statNumber}>{orderStatistics.total}</Text>
                                    <Text style={styles.statLabel}>Total Orders</Text>
                                </View>
                                <View style={[styles.statIcon, {backgroundColor: '#EBF4FF'}]}>
                                    <BarChart3 size={20} color="#3B82F6"/>
                                </View>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statContent}>
                                    <Text style={[styles.statNumber, {color: '#10B981'}]}>
                                        {orderStatistics.active}
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
                                        {orderStatistics.completed}
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
                                <Text style={styles.trackingSubtitle}>Please enter your order reference number</Text>

                                <View style={styles.searchContainer}>
                                    <View style={styles.searchInputContainer}>
                                        <Package size={22} color="#FFF" style={styles.packageIcon}/>
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="ORD-XXX"
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
                                            <Search size={20} color="#FFF" style={styles.searchIcon}/>
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
                    {(() => {
                        const activeStatuses = [
                            'submitted', 'admin_review', 'admin_approved', 'pending', 'broadcast',
                            'assigned', 'en_route_pickup', 'arrived_pickup', 'picked_up',
                            'en_route_dropoff', 'arrived_dropoff'
                        ];

                        const activeOrders = allOrderData
                            .filter(order => activeStatuses.includes(order.status))
                            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                            .slice(0, 50);

                        if (activeOrders.length === 0) {
                            return (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Current Shipments</Text>
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyStateEmoji}>📦</Text>
                                        <Text style={styles.emptyStateTitle}>No Active Shipments</Text>
                                        <Text style={styles.emptyStateText}>
                                            Your active orders will appear here
                                        </Text>
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Current Shipments</Text>
                                    {activeOrders.length >= 10 && (
                                        <Pressable
                                            onPress={() => handleNavigateWithLoading(
                                                'current-shipments-all',
                                                () => router.push('/client/orders/current-shipments')
                                            )}
                                            disabled={navigationLoading === 'current-shipments-all'}
                                        >
                                            {navigationLoading === 'current-shipments-all' ? (
                                                <ActivityIndicator size="small" color="#4CAF50" />
                                            ) : (
                                                <Ionicons name="open" size={24} color="#4CAF50"/>
                                            )}
                                        </Pressable>
                                    )}
                                </View>
                                <View style={styles.currentShipmentContainer}>
                                    {activeOrders.map((order) => {
                                        const progress = getShipmentProgress(order.status);
                                        const statusDisplay = getStatusDisplay(order.status);
                                        const driverName = order.driverAssignment?.driverInfo?.name;
                                        const eta = order.driverAssignment?.estimatedArrival?.dropoff;

                                        return (
                                            <Pressable
                                                key={order._id}
                                                style={styles.currentShipmentCard}
                                                // onPress={() => handleNavigateWithLoading(
                                                //     `shipment-${order._id}`,
                                                //     () => navigateToOrderDetails(order._id)
                                                // )}
                                                // disabled={navigationLoading === `shipment-${order._id}`}
                                            >
                                                <View style={styles.shipmentHeader}>
                                                    <View style={styles.shipmentIcon}>
                                                        {navigationLoading === `shipment-${order._id}` ? (
                                                            <ActivityIndicator size="small" color="#3B82F6" />
                                                        ) : (
                                                            <Text style={styles.shipmentEmoji}>
                                                                {order.package.category === 'document' ? '📄' : '📦'}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.shipmentInfo}>
                                                        <Text style={styles.shipmentTitle} numberOfLines={1}>
                                                            {order.package.description || 'Package'}
                                                        </Text>
                                                        <Text style={styles.shipmentTrackingId}>
                                                            {order.orderRef}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.progressContainer}>
                                                    <View style={styles.progressBar}>
                                                        <View
                                                            style={[
                                                                styles.progressFill,
                                                                { width: `${progress}%` }
                                                            ]}
                                                        />
                                                    </View>
                                                    <Text style={styles.progressText}>{progress}%</Text>
                                                </View>

                                                <View style={styles.statusBadge}>
                                                    <View style={styles.statusDot} />
                                                    <Text style={styles.statusText}>{statusDisplay}</Text>
                                                </View>

                                                <View style={styles.shipmentDetails}>
                                                    {driverName && (
                                                        <View style={styles.shipmentDetailRow}>
                                                            <Text style={styles.detailIcon}>🚗</Text>
                                                            <Text style={styles.shipmentDetailText}>{driverName}</Text>
                                                        </View>
                                                    )}
                                                    <View style={styles.shipmentDetailRow}>
                                                        <Text style={styles.detailIcon}>📍</Text>
                                                        <Text style={styles.shipmentDetailText} numberOfLines={1}>
                                                            {order.location.dropOff.address}
                                                        </Text>
                                                    </View>
                                                    {eta && (
                                                        <View style={styles.shipmentDetailRow}>
                                                            <Text style={styles.detailIcon}>⏱️</Text>
                                                            <Text style={styles.shipmentDetailText}>
                                                                Est. {formatOrderDate(eta)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })()}

                    {/* Order History */}
                    {(() => {
                        const completedStatuses = ['delivered', 'failed', 'cancelled', 'returned'];

                        const historyOrders = allOrderData
                            .filter(order => completedStatuses.includes(order.status))
                            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                            .slice(0, 10);

                        if (historyOrders.length === 0) {
                            return (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Order History</Text>
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyStateEmoji}>📋</Text>
                                        <Text style={styles.emptyStateTitle}>No Order History</Text>
                                        <Text style={styles.emptyStateText}>
                                            Completed orders will appear here
                                        </Text>
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Recent Order History</Text>
                                    <Pressable
                                        onPress={() => handleNavigateWithLoading(
                                            'history-all',
                                            () => router.push('/client/orders/history')
                                        )}
                                        disabled={navigationLoading === 'history-all'}
                                    >
                                        {navigationLoading === 'history-all' ? (
                                            <ActivityIndicator size="small" color="#4CAF50" />
                                        ) : (
                                            <Ionicons name="open" size={24} color="#4CAF50"/>
                                        )}
                                    </Pressable>
                                </View>
                                <View style={styles.historyContainer}>
                                    {historyOrders.map((order) => (
                                        <Pressable
                                            key={order._id}
                                            style={styles.historyCard}
                                            onPress={() => handleNavigateWithLoading(
                                                `history-${order._id}`,
                                                () => navigateToOrderDetails(order._id)
                                            )}
                                            disabled={navigationLoading === `history-${order._id}`}
                                        >
                                            <View style={styles.historyIcon}>
                                                {navigationLoading === `history-${order._id}` ? (
                                                    <ActivityIndicator size="small" color="#3B82F6" />
                                                ) : (
                                                    <Text style={styles.historyEmoji}>
                                                        {getStatusIcon(order.status)}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.historyContent}>
                                                <Text style={styles.historyTitle} numberOfLines={1}>
                                                    {order.package.description || 'Package'}
                                                </Text>
                                                <Text style={styles.historyTrackingId}>
                                                    {order.orderRef}
                                                </Text>
                                                <View style={[
                                                    styles.historyStatusBadge,
                                                    { backgroundColor: `${getStatusColor(order.status)}15` }
                                                ]}>
                                                    <Text style={[
                                                        styles.historyStatusText,
                                                        { color: getStatusColor(order.status) }
                                                    ]}>
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.historyMeta}>
                                                {navigationLoading === `history-${order._id}` ? (
                                                    <ActivityIndicator size="small" color="#3B82F6" />
                                                ) : (
                                                    <Text style={styles.historyDate}>
                                                        {formatOrderDate(order.deliveryConfirmation.verifiedAt)}
                                                    </Text>
                                                )}
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        );
                    })()}

                    {/* Bottom Spacing */}
                    <View style={styles.bottomSpacing}/>
                </Animated.ScrollView>

                {/* Floating Action Button */}
                <View style={[styles.fabContainer, {bottom: insets.bottom + 20}]}>
                    <Pressable
                        style={styles.fab}
                        onPress={() => handleNavigateWithLoading(
                            'create-order',
                            () => router.push('/client/orders/create')
                        )}
                        disabled={navigationLoading === 'create-order'}
                    >
                        <LinearGradient
                            colors={['#3B82F6', '#1D4ED8']}
                            style={styles.fabGradient}
                        >
                            {navigationLoading === 'create-order' ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Plus size={24} color="#ffffff"/>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>

            {alert && (
                <CustomAlert
                    type={alertConfig.type}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => showAlert(false)}
                />
            )}

            {isLoading && (
                <BlurView
                    intensity={90}
                    tint="light"
                    style={StyleSheet.absoluteFillObject}
                >
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6"/>
                        <Text style={styles.loadingText}>Loading your order details...</Text>
                    </View>
                </BlurView>
            )}

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
        color: '#FFFFFF',
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
        marginRight: 1,
    },
    packageIcon:{
        marginRight: 5,
        backgroundColor: '#1D4ED8',
        borderRadius: 25,
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
    sectionTitle: {
        fontSize: 20,
        color: '#1f2937',
        fontFamily: 'PoppinsSemiBold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    seeAll: {
        fontSize: 14,
        color: '#3b82f6',
        fontFamily: 'PoppinsMedium',
    },
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
        fontFamily: 'PoppinsMedium',
        color: '#1F2937',
        marginBottom: 4,
    },
    historyTrackingId: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
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
        fontFamily: 'PoppinsMedium',
        color: '#1F2937',
        marginBottom: 2,
    },
    shipmentTrackingId: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
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
        fontFamily: 'PoppinsSemiBold',
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
        fontFamily: 'PoppinsSemiBold',
        flex: 1,
    },
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
        height: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
        textAlign: 'center',
    },
    emptyState: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyStateEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#3B82F6',
    },
    detailIcon: {
        fontSize: 14,
    },
    historyStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    historyStatusText: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold',
    },
    historyMeta: {
        alignItems: 'flex-end',
    },
    historyDate: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'PoppinsRegular',
    },
});

export default OrdersHub;