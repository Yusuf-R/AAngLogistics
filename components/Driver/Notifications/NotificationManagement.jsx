import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Modal,
    RefreshControl,
    Dimensions, Pressable,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner-native';
import {useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {Gesture, GestureDetector, GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
    interpolate,
    useAnimatedReaction,
    withRepeat,
    withSequence,
} from 'react-native-reanimated';
import DriverUtils from '../../../utils/DriverUtilities';
import socketClient from '../../../lib/driver/SocketClient';
import {useNotificationStore} from "../../../store/Driver/useNotificationStore";

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.6;
const isNarrow = SCREEN_WIDTH < 360;

function NotificationManagement() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const {
        incrementBadge,
        decrementBadge,
        clearBadge,
        fetchNotificationStats
    } = useNotificationStore();

    // States
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Single API call for both notifications and stats
    const {data, isLoading, isError, refetch} = useQuery({
        queryKey: ['Notifications'],
        queryFn: DriverUtils.GetNotification,
        staleTime: 30000,
    });

    const notifications = data?.notifications || [];
    const notificationStats = data?.stats || {total: 0, unread: 0};

    // Filter notifications by category
    const filteredNotifications = useMemo(() => {
        if (selectedCategory === 'ALL') return notifications;
        return notifications.filter(n => n.category === selectedCategory);
    }, [notifications, selectedCategory]);

    // Socket setup for real-time updates
    useEffect(() => {
        const handleNewNotification = (notification) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Only invalidate the single query
            queryClient.invalidateQueries(['Notifications']);
        };

        socketClient.on('notification', handleNewNotification);
        fetchNotificationStats();

        return () => {
            socketClient.off('notification', handleNewNotification);
        };
    }, []);

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: (notificationId) => DriverUtils.MarkAsRead({id: notificationId}),
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries(['Notifications']);

            const previousData = queryClient.getQueryData(['Notifications']);

            // Optimistically update both notifications and stats in one go
            queryClient.setQueryData(['Notifications'], (old) => {
                if (!old) return old;

                const updatedNotifications = old.notifications?.map(n =>
                    n._id === notificationId ? {...n, read: {status: true, readAt: new Date()}} : n
                ) || [];

                const updatedStats = {
                    ...old.stats,
                    unread: Math.max(0, (old.stats?.unread || 0) - 1)
                };

                return {
                    notifications: updatedNotifications,
                    stats: updatedStats
                };
            });

            return {previousData};
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['Notifications'], context.previousData);
            toast.error('Failed to mark as read');
        },
        onSuccess: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // we need to update our notification store
            decrementBadge();
        }
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: (notificationId) => DriverUtils.DeleteNotification({id: notificationId}),
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries(['Notifications']);

            const previousData = queryClient.getQueryData(['Notifications']);

            // Optimistically update both notifications and stats
            queryClient.setQueryData(['Notifications'], (old) => {
                if (!old) return old;

                const notificationToDelete = old.notifications?.find(n => n._id === notificationId);
                const updatedNotifications = old.notifications?.filter(n => n._id !== notificationId) || [];

                const updatedStats = {
                    total: Math.max(0, (old.stats?.total || 0) - 1),
                    unread: notificationToDelete?.read?.status
                        ? old.stats?.unread || 0
                        : Math.max(0, (old.stats?.unread || 0) - 1)
                };

                return {
                    notifications: updatedNotifications,
                    stats: updatedStats
                };
            });

            return {previousData};
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['Notifications'], context.previousData);
            toast.error('Failed to delete notification');
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success('Notification deleted');
            decrementBadge();
        }
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: DriverUtils.MarkAllAsRead,
        onMutate: async () => {
            await queryClient.cancelQueries(['Notifications']);

            const previousData = queryClient.getQueryData(['Notifications']);

            // Optimistically update all notifications and reset unread count
            queryClient.setQueryData(['Notifications'], (old) => {
                if (!old) return old;

                const updatedNotifications = old.notifications?.map(n => ({
                    ...n,
                    read: {status: true, readAt: new Date()}
                })) || [];

                const updatedStats = {
                    ...old.stats,
                    unread: 0
                };

                return {
                    notifications: updatedNotifications,
                    stats: updatedStats
                };
            });

            return {previousData};
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['Notifications'], context.previousData);
            toast.error('Failed to mark all as read');
            refetch();
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success('All notifications marked as read');
            clearBadge();
        }
    });

    // Delete all mutation
    const deleteAllMutation = useMutation({
        mutationFn: DriverUtils.DeleteAllNotification,
        onMutate: async () => {
            await queryClient.cancelQueries(['Notifications']);

            const previousData = queryClient.getQueryData(['Notifications']);

            // Clear all notifications and reset stats
            queryClient.setQueryData(['Notifications'], () => ({
                notifications: [],
                stats: {total: 0, unread: 0}
            }));

            return {previousData};
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['Notifications'], context.previousData);
            toast.error('Failed to delete all notifications');
            refetch();
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success('All notifications deleted');
            clearBadge();
        }
    });

    // Handlers
    const handleNotificationPress = useCallback((notification) => {
        if (!notification.read.status) {
            markAsReadMutation.mutate(notification._id);
        }
        setSelectedNotification(notification);
        setShowDetailModal(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [refetch]);

    const handleMarkAllRead = useCallback(() => {
        if (notificationStats.unread === 0) {
            toast.info('No unread notifications');
            return;
        }
        markAllAsReadMutation.mutate();
    }, [notificationStats.unread]);

    const handleDeleteAll = useCallback(() => {
        if (notifications.length === 0) {
            toast.info('No notifications to delete');
            return;
        }

        toast.warning('Are you sure?', {
            description: 'This will delete all notifications',
            action: {
                label: 'Delete All',
                onClick: () => deleteAllMutation.mutate()
            }
        });
    }, [notifications.length]);

    const getCategoryIcon = (category) => {
        const icons = {
            ORDER: 'receipt',
            DELIVERY: 'bicycle',
            SECURITY: 'shield-checkmark',
            IDENTITY: 'person',
            SYSTEM: 'settings',
            PAYMENT: 'card',
            SOCIAL: 'chatbubbles',
            PROMOTION: 'pricetag',
        };
        return icons[category] || 'notifications';
    };

    const getCategoryColor = (category) => {
        const colors = {
            ORDER: '#8B5CF6',
            DELIVERY: '#10B981',
            SECURITY: '#EF4444',
            IDENTITY: '#3B82F6',
            SYSTEM: '#6B7280',
            PAYMENT: '#F59E0B',
            SOCIAL: '#EC4899',
            PROMOTION: '#6366F1',
        };
        return colors[category] || '#6B7280';
    };

    // Category filters
    const categories = [
        {key: 'ALL', label: 'All', icon: 'apps-outline'},
        {key: 'ORDER', label: 'Orders', icon: 'receipt-outline'},
        {key: 'DELIVERY', label: 'Delivery', icon: 'bicycle-outline'},
        {key: 'SECURITY', label: 'Security', icon: 'shield-checkmark-outline'},
        {key: 'PAYMENT', label: 'Payment', icon: 'card-outline'},
        {key: 'SYSTEM', label: 'System', icon: 'settings-outline'},
    ];

    if (isLoading) {
        return (
            <>
                <CustomHeader title="Notifications" onBackPress={() => router.back()}/>
                <View style={styles.container}>
                    <NotificationSkeleton/>
                </View>
            </>
        );
    }

    if (isError) {
        return (
            <>
                <CustomHeader title="Notifications" onBackPress={() => router.back()}/>
                <View style={styles.container}>
                    <EmptyState
                        icon="alert-circle-outline"
                        title="Failed to Load"
                        message="Unable to fetch notifications"
                        action={{label: 'Retry', onPress: refetch}}
                    />
                </View>
            </>
        );
    }

    return (
        <GestureHandlerRootView style={{flex: 1}}>


            <View style={styles.container}>
                {/* Hero Section */}
                <NotificationHero/>
                <View style={[styles.headerContainer]}>
                    {/* Main header content */}
                    <View style={styles.headerContent}>
                        <View style={styles.leftContainer}>
                            <View style={styles.mainStatsRow}>
                                <View style={styles.statCard}>
                                    <View style={styles.statIconBadge}>
                                        <Ionicons name="notifications" size={16} color="#6366F1"/>
                                    </View>
                                    <Text style={styles.statCardValue}>{notificationStats.total || 0}</Text>
                                    <Text style={styles.statCardLabel}>Total</Text>
                                </View>

                                <View style={[styles.statCard, styles.unreadCard]}>
                                    <View style={[styles.statIconBadge, styles.unreadIconBadge]}>
                                        <Ionicons name="mail-unread" size={16} color="#EF4444"/>
                                    </View>
                                    <Text style={[styles.statCardValue, styles.unreadValue]}>
                                        {notificationStats.unread || 0}
                                    </Text>
                                    <Text style={styles.statCardLabel}>Unread</Text>
                                </View>

                                {notificationStats.byPriority?.HIGH > 0 && (
                                    <View style={[styles.statCard, styles.priorityCard]}>
                                        <View style={[styles.statIconBadge, styles.priorityIconBadge]}>
                                            <Ionicons name="warning" size={16} color="#F59E0B"/>
                                        </View>
                                        <Text style={[styles.statCardValue, styles.priorityValue]}>
                                            {notificationStats.byPriority.HIGH}
                                        </Text>
                                        <Text style={styles.statCardLabel}>Priority</Text>
                                    </View>
                                )}

                            </View>
                        </View>

                        <View style={styles.rightContainer}>
                            <View style={styles.headerActionsContainer}>
                                <View style={styles.headerActions}>
                                    <View style={styles.actionWithTooltip}>
                                        <TouchableOpacity
                                            onPress={handleMarkAllRead}
                                            style={[
                                                styles.headerActionButton,
                                                notificationStats.unread === 0 && styles.headerActionButtonDisabled
                                            ]}
                                            disabled={notificationStats.unread === 0}
                                        >
                                            <Ionicons
                                                name="checkmark-done"
                                                size={20}
                                                color={notificationStats.unread === 0 ? '#9CA3AF' : '#10B981'}
                                            />
                                        </TouchableOpacity>
                                        <Text style={styles.actionTooltip}>Read All</Text>
                                    </View>

                                    <View style={styles.actionWithTooltip}>
                                        <TouchableOpacity
                                            onPress={handleDeleteAll}
                                            style={[
                                                styles.headerActionButton,
                                                notifications.length === 0 && styles.headerActionButtonDisabled
                                            ]}
                                            disabled={notifications.length === 0}
                                        >
                                            <Ionicons
                                                name="trash-bin"
                                                size={20}
                                                color={notifications.length === 0 ? '#9CA3AF' : '#EF4444'}
                                            />
                                        </TouchableOpacity>
                                        <Text style={styles.actionTooltip}>Clear All</Text>
                                    </View>

                                    <View style={styles.actionWithTooltip}>
                                        <TouchableOpacity
                                            style={styles.headerActionButton}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                handleRefresh();
                                                fetchNotificationStats();
                                            }}
                                        >
                                            <Ionicons name="refresh" size={20} color="#6366F1"/>
                                        </TouchableOpacity>
                                        <Text style={styles.actionTooltip}>Refresh</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Bar */}
                <View style={styles.compactStatsContainer}>
                    {/* Category Chips */}
                    {notificationStats.byCategory && Object.keys(notificationStats.byCategory).length > 0 && (
                        <View style={styles.categoryChipsRow}>
                            {Object.entries(notificationStats.byCategory).slice(0, 6).map(([category, count]) => (
                                <View key={category} style={styles.categoryChip}>
                                    <Ionicons
                                        name={getCategoryIcon(category)}
                                        size={11}
                                        color={getCategoryColor(category)}
                                    />
                                    <Text style={styles.categoryChipCount}>{count}</Text>
                                    <Text style={styles.categoryChipLabel}>
                                        {category.slice(0, 3)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>


                {/* Category Filters */}
                <View style={styles.filterContainer}>
                    <FlatList
                        horizontal
                        data={categories}
                        keyExtractor={(item) => item.key}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterList}
                        renderItem={({item}) => (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    selectedCategory === item.key && styles.filterChipActive
                                ]}
                                onPress={() => {
                                    setSelectedCategory(item.key);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={18}
                                    color={selectedCategory === item.key ? '#fff' : '#6B7280'}
                                />
                                <Text style={[
                                    styles.filterChipText,
                                    selectedCategory === item.key && styles.filterChipTextActive
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}

                    />
                </View>

                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                    <EmptyState
                        icon="notifications-off-outline"
                        title="No Notifications"
                        message={selectedCategory === 'ALL'
                            ? "You're all caught up!"
                            : `No ${selectedCategory.toLowerCase()} notifications`
                        }
                    />
                ) : (
                    <FlatList
                        data={filteredNotifications}
                        keyExtractor={(item) => item._id}
                        renderItem={({item}) => (
                            <NotificationCard
                                notification={item}
                                onPress={() => handleNotificationPress(item)}
                                onDelete={() => deleteNotificationMutation.mutate(item._id)}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => {
                                    handleRefresh();
                                    fetchNotificationStats()
                                }}
                                tintColor="#6366F1"
                                colors={['#6366F1']}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Detail Modal */}
            {selectedNotification && (
                <NotificationDetailModal
                    visible={showDetailModal}
                    notification={selectedNotification}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedNotification(null);
                    }}
                    onDelete={() => {
                        deleteNotificationMutation.mutate(selectedNotification._id);
                        setShowDetailModal(false);
                        setSelectedNotification(null);
                    }}
                />
            )}
        </GestureHandlerRootView>
    );
}

// ==========================================
// NOTIFICATION CARD COMPONENT (Swipeable with Reanimated)
// ==========================================
const NotificationCard = ({notification, onPress, onDelete}) => {
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(1);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onUpdate((event) => {
            if (event.translationX < 0) {
                translateX.value = event.translationX;
            }
        })
        .onEnd((event) => {
            if (event.translationX < -SWIPE_THRESHOLD) {
                // Delete animation
                translateX.value = withTiming(-SCREEN_WIDTH, {duration: 300});
                opacity.value = withTiming(0, {duration: 300}, (finished) => {
                    if (finished) {
                        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                        runOnJS(onDelete)();
                    }
                });
            } else {
                // Reset animation
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{translateX: translateX.value}],
        opacity: opacity.value,
    }));

    const getCategoryIcon = (category) => {
        const icons = {
            ORDER: 'receipt',
            DELIVERY: 'bicycle',
            SECURITY: 'shield-checkmark',
            PAYMENT: 'card',
            SYSTEM: 'settings',
            IDENTITY: 'person',
            SOCIAL: 'chatbubbles',
            PROMOTION: 'pricetag',
        };
        return icons[category] || 'notifications';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            CRITICAL: '#EF4444',
            URGENT: '#F59E0B',
            HIGH: '#F97316',
            NORMAL: '#6366F1',
            LOW: '#10B981',
        };
        return colors[priority] || '#6B7280';
    };

    const formatTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifDate.toLocaleDateString();
    };

    return (
        <View style={styles.cardWrapper}>
            {/* Delete Background */}
            <View style={styles.deleteBackground}>
                <Ionicons name="trash" size={24} color="#fff"/>
                <Text style={styles.deleteText}>Delete</Text>
            </View>

            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.cardAnimated, animatedStyle]}>
                    <TouchableOpacity
                        style={[
                            styles.card,
                            !notification.read.status && styles.cardUnread
                        ]}
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        {/* Icon */}
                        <View style={[
                            styles.cardIcon,
                            {backgroundColor: `${getPriorityColor(notification.priority)}15`}
                        ]}>
                            <Ionicons
                                name={getCategoryIcon(notification.category)}
                                size={24}
                                color={getPriorityColor(notification.priority)}
                            />
                        </View>

                        {/* Content */}
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                    {notification.content.title}
                                </Text>
                                {!notification.read.status && (
                                    <View style={styles.unreadDot}/>
                                )}
                            </View>

                            <Text style={styles.cardBody} numberOfLines={2}>
                                {notification.content.body}
                            </Text>

                            <View style={styles.cardFooter}>
                                <Text style={styles.cardTime}>
                                    {formatTime(notification.createdAt)}
                                </Text>
                                <View style={styles.cardBadges}>
                                    <View style={[
                                        styles.categoryBadge,
                                        {backgroundColor: `${getPriorityColor(notification.priority)}15`}
                                    ]}>
                                        <Text style={[
                                            styles.categoryBadgeText,
                                            {color: getPriorityColor(notification.priority)}
                                        ]}>
                                            {notification.category}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

// ==========================================
// NOTIFICATION DETAIL MODAL (with Reanimated)
// ==========================================
const NotificationDetailModal = ({visible, notification, onClose, onDelete}) => {
    const slideAnim = useSharedValue(SCREEN_WIDTH);

    useEffect(() => {
        if (visible) {
            slideAnim.value = withSpring(0, {
                damping: 20,
                stiffness: 90,
            });
        }
    }, [visible]);

    const handleClose = () => {
        slideAnim.value = withTiming(SCREEN_WIDTH, {duration: 250}, (finished) => {
            if (finished) {
                runOnJS(onClose)();
            }
        });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{translateX: slideAnim.value}],
    }));

    const getCategoryIcon = (category) => {
        const icons = {
            ORDER: 'receipt',
            DELIVERY: 'bicycle',
            SECURITY: 'shield-checkmark',
            PAYMENT: 'card',
            SYSTEM: 'settings',
            IDENTITY: 'person',
            SOCIAL: 'chatbubbles',
            PROMOTION: 'pricetag',
        };
        return icons[category] || 'notifications';
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View style={[styles.modalContent, animatedStyle]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={28} color="#111827"/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onDelete}>
                            <Ionicons name="trash-outline" size={24} color="#EF4444"/>
                        </TouchableOpacity>
                    </View>

                    {/* Icon */}
                    <View style={styles.modalIconContainer}>
                        <View style={styles.modalIcon}>
                            <Ionicons
                                name={getCategoryIcon(notification.category)}
                                size={40}
                                color="#6366F1"
                            />
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.modalBody}>
                        <Text style={styles.modalTitle}>{notification.content.title}</Text>
                        <Text style={styles.modalBodyText}>{notification.content.body}</Text>

                        {notification.content.orderRef && (
                            <View style={styles.modalInfoRow}>
                                <Ionicons name="document-text-outline" size={20} color="#6B7280"/>
                                <Text style={styles.modalInfoText}>
                                    Order: {notification.content.orderRef}
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalInfoRow}>
                            <Ionicons name="time-outline" size={20} color="#6B7280"/>
                            <Text style={styles.modalInfoText}>
                                {new Date(notification.createdAt).toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    {notification.content.richContent?.actionButtons?.length > 0 && (
                        <View style={styles.modalActions}>
                            {notification.content.richContent.actionButtons.map((button, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.actionButton}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        // router.push(button.deepLink);
                                        onClose();
                                    }}
                                >
                                    <Text style={styles.actionButtonText}>{button.label}</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#6366F1"/>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

// ==========================================
// SKELETON LOADER (with Reanimated)
// ==========================================
const NotificationSkeleton = () => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, {duration: 1000}),
                withTiming(0.3, {duration: 1000})
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((item) => (
                <Animated.View key={item} style={[styles.skeletonCard, animatedStyle]}>
                    <View style={styles.skeletonIcon}/>
                    <View style={styles.skeletonContent}>
                        <View style={styles.skeletonTitle}/>
                        <View style={styles.skeletonBody}/>
                        <View style={styles.skeletonFooter}>
                            <View style={styles.skeletonTime}/>
                            <View style={styles.skeletonBadge}/>
                        </View>
                    </View>
                </Animated.View>
            ))}
        </View>
    );
};

// ==========================================
// EMPTY STATE
// ==========================================
const EmptyState = ({icon, title, message, action}) => (
    <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
            <Ionicons name={icon} size={64} color="#D1D5DB"/>
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
        {action && (
            <TouchableOpacity style={styles.emptyButton} onPress={action.onPress}>
                <Text style={styles.emptyButtonText}>{action.label}</Text>
            </TouchableOpacity>
        )}
    </View>
);

// ==========================================
// HERO SECTION COMPONENT
// ==========================================
const NotificationHero = () => {
    const router = useRouter();
    return (
        <View style={styles.heroContainer}>
            <View className="flex-row items-center justify-between ">
                <Text style={styles.heroTitle}>Notification Center </Text>
                {/*Settings icon */}
                <TouchableOpacity onPress={() => router.push('/driver/notifications/settings')}>
                    <Ionicons name="settings" size={24} color="#FFF"/>
                </TouchableOpacity>
            </View>
            <View style={styles.heroFeatures}>
                <View style={styles.heroFeature}>
                    <Ionicons name="flash" size={16} color="#10B981"/>
                    <Text style={styles.heroFeatureText}>Real-time Updates</Text>
                </View>
                <View style={styles.heroFeature}>
                    <Ionicons name="shield-checkmark" size={16} color="#6366F1"/>
                    <Text style={styles.heroFeatureText}>Secure & Reliable</Text>
                </View>
                <View style={styles.heroFeature}>
                    <Ionicons name="filter" size={16} color="#F59E0B"/>
                    <Text style={styles.heroFeatureText}>Smart Filtering</Text>
                </View>
            </View>
        </View>
    );
};

const CustomHeader = ({title, onBackPress, rightComponent}) => {

    return (
        <>
            <View style={[styles.headerContainer]}>
                {/* Status bar area - this creates space for the camera/dynamic island */}
                <View style={styles.statusBarSpacer}/>

                {/* Main header content */}
                <View style={styles.headerContent}>

                    <View style={styles.rightContainer}>
                        {rightComponent}
                    </View>
                </View>
            </View>
        </>
    );
};


// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerContainer: {
        backgroundColor: '#ffffff',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        minHeight: 64,
        gap: 25
    },

    leftContainer: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,

    },

    rightContainer: {
        flexShrink: 0,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginRight: 10,
    },

    mainStatsRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },

    statCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 5,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 60,
    },

    unreadCard: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },

    statIconBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },

    unreadIconBadge: {backgroundColor: '#FEE2E2'},

    statCardValue: {
        fontSize: isNarrow ? 18 : 20,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        lineHeight: isNarrow ? 22 : 24,
    },

    unreadValue: {color: '#EF4444'},

    statCardLabel: {
        fontSize: 10,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        marginTop: 2,
    },

    headerActionsContainer: {
        alignItems: 'flex-end',
    },

    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },

    headerActionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    headerActionButtonDisabled: {opacity: 0.5},

    // Add to your styles object:
    heroContainer: {
        backgroundColor: '#265073',
        paddingHorizontal: 8,
        paddingTop: 18,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
    },
    heroTitle: {
        fontSize: 26,
        fontFamily: 'PoppinsBold',
        color: '#FFF',
        marginBottom: 2,
    },
    heroDescription: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'left',
        lineHeight: 20,
        marginBottom: 16,
    },
    heroFeatures: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'nowrap',
        justifyContent: 'flex-start',
    },
    heroFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    heroFeatureText: {
        fontSize: 11,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
    },
    actionWithTooltip: {
        alignItems: 'center',
        gap: 2,
    },
    actionTooltip: {
        fontSize: 8,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
    },
    headerButton: {
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: '#52CAF2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: '#6366F1',
    },
    filterChipText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    cardWrapper: {
        marginBottom: 12,
        position: 'relative',
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 100,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    deleteText: {
        color: '#fff',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
    },
    cardAnimated: {
        width: '100%',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        gap: 12,
    },
    cardUnread: {
        borderLeftWidth: 3,
        borderLeftColor: '#6366F1',
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6366F1',
    },
    cardBody: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTime: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9CA3AF',
    },
    cardBadges: {
        flexDirection: 'row',
        gap: 6,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontFamily: 'PoppinsSemiBold',
        textTransform: 'uppercase',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalIconContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    modalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalBodyText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 24,
    },
    modalInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 12,
    },
    modalInfoText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
    },
    modalActions: {
        paddingHorizontal: 24,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    actionButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1',
    },
    skeletonContainer: {
        padding: 16,
    },
    skeletonCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    skeletonIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E5E7EB',
    },
    skeletonContent: {
        flex: 1,
    },
    skeletonTitle: {
        height: 16,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 8,
        width: '70%',
    },
    skeletonBody: {
        height: 14,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 12,
        width: '100%',
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    skeletonTime: {
        height: 12,
        width: 60,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
    },
    skeletonBadge: {
        height: 20,
        width: 80,
        backgroundColor: '#E5E7EB',
        borderRadius: 6,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
    },

    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    refreshButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    categoryBreakdown: {
        marginBottom: 20,
    },
    breakdownTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 12,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryItem: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        minWidth: 70,
    },
    categoryIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryCount: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 2,
    },
    categoryLabel: {
        fontSize: 10,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
    },
    bulkActions: {
        flexDirection: 'row',
        gap: 12,
    },
    bulkButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    markReadButton: {
        backgroundColor: '#EEF2FF',
        borderColor: '#C7D2FE',
    },
    deleteAllButton: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    bulkButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    bulkButtonDisabled: {
        color: '#9CA3AF',
    },
    // Add to styles object:
    enhancedStatsContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statsHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsHeaderTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
    },
    compactRefreshButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    categoryChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    quickActionsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
    },
    quickActionText: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
    },
    quickActionTextDisabled: {
        color: '#9CA3AF',
    },
    quickActionDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#D1D5DB',
    },

    // Replace/add these in your styles object:
    compactStatsContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    priorityCard: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    priorityIconBadge: {
        backgroundColor: '#FEF3C7',
    },
    priorityValue: {
        color: '#F59E0B',
    },
    categoryChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        backgroundColor: '#F3F4F6',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryChipCount: {
        fontSize: 11,
        fontFamily: 'PoppinsBold',
        color: '#374151',
    },
    categoryChipLabel: {
        fontSize: 9,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
});

export default NotificationManagement;