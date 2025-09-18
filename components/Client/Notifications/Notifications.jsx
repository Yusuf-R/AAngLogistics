import React, {useState, useCallback, useMemo, useEffect, memo} from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Header from "./Header";
import {
    Text,
    View,
    StyleSheet,
    FlatList,
    Alert,
} from "react-native";
import {
    Bell,
} from 'lucide-react-native';
import {getSocket} from "../../../hooks/useSocket";
import {useNotificationStore} from "../../../store/useNotificationStore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfirmModal from "../../ConfirmModal";
import NotificationCard from './NotificationCard';
import {router} from "expo-router";

const Tab = createMaterialTopTabNavigator();

function EmptyState({category}) {
    return (
        <View style={styles.emptyState}>
            <Bell size={48} color="#D1D5DB"/>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
                {category === 'ALL'
                    ? "You're all caught up! New notifications will appear here."
                    : `No ${category.toLowerCase()} notifications yet.`
                }
            </Text>
        </View>
    );
}

// All Notifications Screen
function AllNotificationsScreen({
                                    notifications,
                                    onDeleteNotification,
                                    onViewDetails,
                                    onMarkAsRead,
                                    onViewSilently
                                }) {
    const handleDelete = useCallback(async (notificationId) => {
        try {
            const dontAskAgain = await AsyncStorage.getItem('dontAskDeleteConfirmation');

            if (dontAskAgain === 'true') {
                await onDeleteNotification(notificationId);
                return;
            }

            Alert.alert(
                'Delete Notification',
                'Are you sure you want to delete this notification?',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {
                        text: "Don't ask again",
                        onPress: async () => {
                            await AsyncStorage.setItem('dontAskDeleteConfirmation', 'true');
                            await onDeleteNotification(notificationId);
                        }
                    },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => await onDeleteNotification(notificationId),
                    }
                ]
            );
        } catch (error) {
            console.error('Error checking delete confirmation preference:', error);
            await onDeleteNotification(notificationId);
        }
    }, [onDeleteNotification]);

    const renderNotification = useCallback(({item}) => (
        <NotificationCard
            notification={item}
            onDelete={handleDelete}
            onViewDetails={onViewDetails}
            onMarkAsRead={onMarkAsRead}
            onViewSilently={onViewSilently}
        />
    ), [handleDelete, onViewDetails, onMarkAsRead]);

    const keyExtractor = useCallback((item) => item._id, []);

    return (
        <View style={styles.tabContent}>
            {notifications.length === 0 ? (
                <EmptyState category="ALL"/>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={keyExtractor}
                    renderItem={renderNotification}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={8}
                    windowSize={8}
                    initialNumToRender={8}
                />
            )}
        </View>
    );
}

// Category Notifications Screen
function CategoryNotificationsScreen({
                                         notifications,
                                         category,
                                         onMarkAsRead,
                                         onDeleteNotification,
                                         onViewDetails,
                                         onViewSilently
                                     }) {
    const filteredNotifications = useMemo(() =>
            notifications.filter(n => n.category === category),
        [notifications, category]
    );

    const handleDelete = useCallback(async (notificationId) => {
        try {
            const dontAskAgain = await AsyncStorage.getItem('dontAskDeleteConfirmation');

            if (dontAskAgain === 'true') {
                onDeleteNotification(notificationId);
                return;
            }

            Alert.alert(
                'Delete Notification',
                'Are you sure you want to delete this notification?',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {
                        text: "Don't ask again",
                        onPress: async () => {
                            await AsyncStorage.setItem('dontAskDeleteConfirmation', 'true');
                            onDeleteNotification(notificationId);
                        }
                    },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => onDeleteNotification(notificationId)
                    }
                ]
            );
        } catch (error) {
            console.error('Error checking delete confirmation preference:', error);
            onDeleteNotification(notificationId);
        }
    }, [onDeleteNotification]);

    const renderNotification = useCallback(({item}) => (
        <NotificationCard
            notification={item}
            onDelete={handleDelete}
            onViewDetails={onViewDetails}
            onMarkAsRead={onMarkAsRead}
            onViewSilently={onViewSilently}
        />
    ), [handleDelete, onViewDetails, onMarkAsRead]);

    const keyExtractor = useCallback((item) => item._id, []);

    return (
        <View style={styles.tabContent}>
            {filteredNotifications.length === 0 ? (
                <EmptyState category={category}/>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    keyExtractor={keyExtractor}
                    renderItem={renderNotification}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    initialNumToRender={10}
                />
            )}
        </View>
    );
}

// Main Notification Screen Component
export default function NotificationScreen({ userData }) {
    const {
        notifications,
        stats,
        markAsRead,
        deleteNotification,
        markAllAsRead,
        clearAll,
    } = useNotificationStore();

    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

    const socket = getSocket();

    // Memoize socket to avoid recreation
    const memoizedSocket = useMemo(() => socket, [socket]);

    const handleViewSilently = useCallback(async (notification) => {
        // Mark as read when viewing details
        if (!notification.read?.status) {
            await handleMarkAsRead(notification._id);
        }
    }, []);

    // Updated to use navigation instead of modal
    const handleViewDetails = useCallback(async (notification) => {
        // Mark as read immediately for instant feedback
        if (!notification.read?.status) {
            await handleMarkAsRead(notification._id);
        }

        // Store notification in Zustand instead of passing via router
        useNotificationStore.getState().setSelectedNotification(notification);

        // Navigate to details screen
        router.push('/client/notifications/details');
    }, [handleMarkAsRead]);


    const handleMarkAllRead = useCallback(() => {
        markAllAsRead();
        if (memoizedSocket) {
            memoizedSocket.emit('notification:read:all');
        }
    }, [markAllAsRead, memoizedSocket]);

    const handleMarkAsRead = useCallback(async (notificationId) => {
        try {
            await markAsRead(notificationId);
            // Emit socket event if needed
            if (memoizedSocket) {
                memoizedSocket.emit('notification:read:single', { notificationId });
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            Alert.alert('Error', 'Failed to mark notification as read');
        }
    }, [markAsRead, memoizedSocket]);

    const handleDeleteNotification = useCallback(async (notificationId) => {
        try {
            await deleteNotification(notificationId);

            // Emit socket event if needed
            if (memoizedSocket) {
                memoizedSocket.emit('notification:delete:single', { notificationId });
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            Alert.alert('Error', 'Failed to delete notification');
        }
    }, [deleteNotification, memoizedSocket]);

    // delete all notification
    const handleDeleteAllNotifications = useCallback(() => {
        clearAll();
        if (memoizedSocket) {
            memoizedSocket.emit('notification:delete:all');
        }
        setShowDeleteAllModal(false);
    }, [clearAll, memoizedSocket]);

    // Memoize tab screens to prevent recreation
    const AllScreen = useCallback(() => (
        <AllNotificationsScreen
            notifications={notifications}
            onDeleteNotification={handleDeleteNotification}
            onViewDetails={handleViewDetails}
            onMarkAsRead={handleMarkAsRead}
            onViewSilently={handleViewSilently}
        />
    ), [notifications, handleDeleteNotification, handleViewDetails, handleMarkAsRead, handleViewSilently]);

    const OrdersScreen = useCallback(() => (
        <CategoryNotificationsScreen
            notifications={notifications}
            category="ORDER"
            onMarkAsRead={handleMarkAsRead}
            onDeleteNotification={handleDeleteNotification}
            onViewDetails={handleViewDetails}
            onViewSilently={handleViewSilently}
        />
    ), [notifications, handleMarkAsRead, handleDeleteNotification, handleViewDetails]);

    const DeliveryScreen = useCallback(() => (
        <CategoryNotificationsScreen
            notifications={notifications}
            category="DELIVERY"
            onMarkAsRead={handleMarkAsRead}
            onDeleteNotification={handleDeleteNotification}
            onViewDetails={handleViewDetails}
            onViewSilently={handleViewSilently}
        />
    ), [notifications, handleMarkAsRead, handleDeleteNotification, handleViewDetails]);

    const PaymentScreen = useCallback(() => (
        <CategoryNotificationsScreen
            notifications={notifications}
            category="PAYMENT"
            onMarkAsRead={handleMarkAsRead}
            onDeleteNotification={handleDeleteNotification}
            onViewDetails={handleViewDetails}
            onViewSilently={handleViewSilently}
        />
    ), [notifications, handleMarkAsRead, handleDeleteNotification, handleViewDetails]);



    const SystemScreen = useCallback(() => (
        <CategoryNotificationsScreen
            notifications={notifications}
            category="SYSTEM"
            onMarkAsRead={handleMarkAsRead}
            onDeleteNotification={handleDeleteNotification}
            onViewDetails={handleViewDetails}
            onViewSilently={handleViewSilently}
        />
    ), [notifications, handleMarkAsRead, handleDeleteNotification, handleViewDetails]);

    const SecurityScreen = useCallback(() => (
        <CategoryNotificationsScreen
            notifications={notifications}
            category="SECURITY"
            onMarkAsRead={handleMarkAsRead}
            onDeleteNotification={handleDeleteNotification}
            onViewDetails={handleViewDetails}
            onViewSilently={handleViewSilently}
        />
    ), [notifications, handleMarkAsRead, handleDeleteNotification, handleViewDetails, handleViewSilently]);

    return (
        <>
            <View style={styles.container}>
                <Header
                    userData={userData}
                    stats={stats}
                    onMarkAllRead={handleMarkAllRead}
                    onDeleteAll={() => setShowDeleteAllModal(true)}
                />
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        tabBarLabel: ({ focused }) => (
                            <View style={styles.tabLabelContainer}>
                                <Text
                                    style={[
                                        styles.tabLabelText,
                                        focused ? styles.tabLabelTextFocused : styles.tabLabelTextUnfocused
                                    ]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {route.name}
                                </Text>
                                {focused && (
                                    <View style={styles.activeIndicator} />
                                )}
                            </View>
                        ),
                        tabBarStyle: styles.tabBar,
                        tabBarIndicatorStyle: {
                            height: 0,
                        },
                        tabBarPressColor: 'transparent',
                        tabBarItemStyle: styles.tabItem,
                        tabBarScrollEnabled: true,
                    })}
                >
                    <Tab.Screen name="All" component={AllScreen} />
                    <Tab.Screen name="Orders" component={OrdersScreen} />
                    <Tab.Screen name="Delivery" component={DeliveryScreen} />
                    <Tab.Screen name="Payment" component={PaymentScreen} />
                    <Tab.Screen name="Security" component={SecurityScreen} />
                    <Tab.Screen name="System" component={SystemScreen} />

                </Tab.Navigator>

                <ConfirmModal
                    visible={showDeleteAllModal}
                    title="Delete all notifications?"
                    message="This action will permanently delete all notifications. Are you sure?"
                    onCancel={() => setShowDeleteAllModal(false)}
                    onConfirm={handleDeleteAllNotifications}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',

    },
    tabContent: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        marginTop: 8,
    },
    listContent: {
        padding: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    unreadBadge: {
        backgroundColor: '#DC2626',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    headerActions: {
        flexDirection: 'row',
    },
    deleteButton: {
        padding: 8,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    unreadBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 16,
    },
    unreadBannerText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
        marginLeft: 8,
    },
    detailCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    detailHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailHeaderText: {
        flex: 1,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    detailMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 12,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    categoryText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    detailBody: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
        marginBottom: 24,
    },
    detailActionsContainer: {
        marginBottom: 24,
    },
    detailActionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    detailActionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailActionButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    detailActionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    metadataContainer: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
    },
    metadataTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    metadataContent: {
        flex: 1,
        marginLeft: 12,
    },
    metadataLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    metadataValue: {
        fontSize: 14,
        color: '#374151',
    },
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    markReadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    markReadButtonText: {
        color: '#059669',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    // tab bar
    tabBar: {
        backgroundColor: '#FFFFFF',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        height: 60,
    },
    tabItem: {
        width: 'auto',
        minHeight: 60,
        paddingHorizontal: 16,
    },
    tabLabelContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    tabLabelText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    tabLabelTextFocused: {
        color: '#3B82F6',
    },
    tabLabelTextUnfocused: {
        color: '#6B7280',
    },
    activeIndicator: {
        width: 24,
        height: 3,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
        position: 'absolute',
        bottom: 0,
    },
});