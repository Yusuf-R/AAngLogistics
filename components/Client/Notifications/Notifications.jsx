import React, {useState, useCallback, useMemo} from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Header from "./Header";
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    Modal,
    ScrollView,
    StatusBar
} from "react-native";
import {getSocket} from "../../../hooks/useSocket";
import {useNotificationStore} from "../../../store/useNotificationStore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationCard from './NotificationCard'; // Assuming you extract this component

import {
    Bell,
    Package,
    Shield,
    Settings,
    AlertTriangle,
    Zap,
    X,
    Eye,
    Trash2,
    Clock,
    User,
    CheckCircle2,
    AlertCircle
} from 'lucide-react-native';

const Tab = createMaterialTopTabNavigator();

const PRIORITY_CONFIG = {
    CRITICAL: {color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle, label: 'Critical'},
    URGENT: {color: '#EA580C', bg: '#FED7AA', icon: Zap, label: 'Urgent'},
    HIGH: {color: '#2563EB', bg: '#DBEAFE', icon: Bell, label: 'High'},
    NORMAL: {color: '#059669', bg: '#D1FAE5', icon: Bell, label: 'Normal'},
    LOW: {color: '#6B7280', bg: '#F3F4F6', icon: Bell, label: 'Low'}
};

const CATEGORY_CONFIG = {
    ORDER: {icon: Package, color: '#2563EB', label: 'Orders'},
    DELIVERY: {icon: Package, color: '#059669', label: 'Delivery'},
    SECURITY: {icon: Shield, color: '#DC2626', label: 'Security'},
    SYSTEM: {icon: Settings, color: '#7C3AED', label: 'System'},
    PAYMENT: {icon: Bell, color: '#EA580C', label: 'Payment'},
    SOCIAL: {icon: Bell, color: '#DB2777', label: 'Social'},
    PROMOTION: {icon: Bell, color: '#059669', label: 'Promotions'}
};

// Enhanced Notification Detail Modal
function NotificationDetailModal({visible, notification, onClose, onMarkAsRead, onDelete}) {
    if (!notification) return null;

    const priorityConfig = PRIORITY_CONFIG[notification.priority];
    const categoryConfig = CATEGORY_CONFIG[notification.category];
    const CategoryIcon = categoryConfig?.icon || Bell;
    const PriorityIcon = priorityConfig?.icon || Bell;
    const isUnread = !notification.read?.status;

    const formatDetailedTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleMarkAsRead = () => {
        if (isUnread) {
            onMarkAsRead(notification._id);
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={onClose}
            >
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#374151"/>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Notification Details</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={() => onDelete(notification._id)}
                                style={styles.deleteButton}
                            >
                                <Trash2 size={20} color="#DC2626"/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.detailCard}>
                            <View style={styles.detailHeader}>
                                <View style={[styles.detailIconContainer, {backgroundColor: priorityConfig.bg}]}>
                                    <CategoryIcon size={24} color={priorityConfig.color}/>
                                </View>
                                <View style={styles.detailHeaderText}>
                                    <Text style={styles.detailTitle}>{notification.content.title}</Text>
                                    <View style={styles.detailMeta}>
                                        <View style={[styles.priorityBadge, {backgroundColor: priorityConfig.bg}]}>
                                            <PriorityIcon size={12} color={priorityConfig.color}/>
                                            <Text style={[styles.priorityText, {color: priorityConfig.color}]}>
                                                {priorityConfig.label}
                                            </Text>
                                        </View>
                                        <Text style={styles.categoryText}>{categoryConfig?.label}</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.detailBody}>{notification.content.body}</Text>

                            {notification.content.richContent?.actionButtons?.length > 0 && (
                                <View style={styles.detailActionsContainer}>
                                    <Text style={styles.detailActionsTitle}>Available Actions</Text>
                                    <View style={styles.detailActionButtons}>
                                        {notification.content.richContent.actionButtons.map((button, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.detailActionButton}
                                                onPress={() => console.log('Action:', button.action)}
                                            >
                                                <Text style={styles.detailActionButtonText}>{button.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <View style={styles.metadataContainer}>
                                <Text style={styles.metadataTitle}>Details</Text>

                                <View style={styles.metadataRow}>
                                    <Clock size={16} color="#6B7280"/>
                                    <View style={styles.metadataContent}>
                                        <Text style={styles.metadataLabel}>Received</Text>
                                        <Text style={styles.metadataValue}>
                                            {formatDetailedTime(notification.createdAt)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.metadataRow}>
                                    <User size={16} color="#6B7280"/>
                                    <View style={styles.metadataContent}>
                                        <Text style={styles.metadataLabel}>Source</Text>
                                        <Text style={styles.metadataValue}>
                                            {notification.metadata?.source || 'System'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.metadataRow}>
                                    <AlertTriangle size={16} color="#6B7280"/>
                                    <View style={styles.metadataContent}>
                                        <Text style={styles.metadataLabel}>Type</Text>
                                        <Text style={styles.metadataValue}>
                                            {notification.type.replace(/\./g, ' › ')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
}

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
function AllNotificationsScreen({notifications, onDeleteNotification, onViewDetails, onMarkAsRead, onViewSilently}) {
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
                                         onNotificationPress,
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
export default function NotificationScreen({userData}) {
    const {
        notifications,
        stats,
        markAsRead,
        deleteNotification,
        markAllAsRead,
    } = useNotificationStore();

    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

    const socket = getSocket();

    const handleViewSilently = useCallback(async (notification) => {

        // Mark as read when viewing details
        if (!notification.read?.status) {
            await handleMarkAsRead(notification._id);
        }
    }, [handleMarkAsRead]);

    const handleViewDetails = useCallback(async (notification) => {
        setSelectedNotification(notification);
        setIsDetailModalVisible(true);

        if (!notification.read?.status) {
            await handleMarkAsRead(notification._id); // ✅ correct way
        }
    }, [handleMarkAsRead]);

    const handleMarkAllRead = () => {
        markAllAsRead();
        if (socket) {
            socket.emit('notification:read:all');
        }
    };

    const handleMarkAsRead = useCallback(async (notificationId) => {
        try {
            await markAsRead(notificationId);

            // Emit socket event if needed
            if (socket) {
                socket.emit('notification:read:single', {notificationId});
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            Alert.alert('Error', 'Failed to mark notification as read');
        }
    }, [markAsRead, socket]);

    const handleDeleteNotification = useCallback(async (notificationId) => {
        try {
            await deleteNotification(notificationId);

            // Close modal if the deleted notification was being viewed
            if (selectedNotification?._id === notificationId) {
                setIsDetailModalVisible(false);
                setSelectedNotification(null);
            }

            // Emit socket event if needed
            if (socket) {
                socket.emit('notification:deleted', {notificationId});
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            Alert.alert('Error', 'Failed to delete notification');
        }
    }, [deleteNotification, selectedNotification, socket]);

    const handleCloseDetailModal = useCallback(() => {
        setIsDetailModalVisible(false);
        setSelectedNotification(null);
    }, []);

    // Tab screens with proper props
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
        />
    ), [notifications, handleMarkAsRead, handleDeleteNotification, handleViewDetails]);

    const SystemScreen = useCallback(() => (
        <CategoryNotificationsScreen
            notifications={notifications}
            category="SYSTEM"
            onMarkAsRead={handleMarkAsRead}
            onDeleteNotification={handleDeleteNotification}
            onViewDetails={handleViewDetails}
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
        <View style={styles.container}>
            <Header
                userData={userData}
                stats={stats}
                onMarkAllRead={handleMarkAllRead}
                onFilter={() => console.log('Filter pressed')}
            />
            <Tab.Navigator
                screenOptions={({route}) => ({
                    tabBarLabel: ({focused}) => (
                        <View style={{alignItems: 'center'}}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'PoppinsBold',
                                    color: focused ? '#3B82F6' : '#6B7280',
                                }}
                            >
                                {route.name}
                            </Text>
                            {focused && (
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#3B82F6',
                                        marginTop: 1,
                                    }}
                                />
                            )}
                        </View>
                    ),
                    tabBarStyle: {
                        backgroundColor: '#FFFFFF',
                        elevation: 0,
                    },
                    tabBarIndicatorStyle: {
                        height: 0,
                    },
                    tabBarPressColor: 'transparent',
                })}
            >
                <Tab.Screen
                    name="All"
                    component={AllScreen}
                />
                <Tab.Screen
                    name="Orders"
                    component={OrdersScreen}
                />
                <Tab.Screen
                    name="System"
                    component={SystemScreen}
                />
                <Tab.Screen
                    name="Security"
                    component={SecurityScreen}
                />
            </Tab.Navigator>

            <NotificationDetailModal
                visible={isDetailModalVisible}
                notification={selectedNotification}
                onClose={handleCloseDetailModal}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
            />
        </View>
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
});