import React, {memo} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";
import {
    Bell,
    Eye,
    Trash2,
    Clock,
    AlertTriangle,
    Zap
} from 'lucide-react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

const PRIORITY_CONFIG = {
    CRITICAL: {color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle, label: 'Critical'},
    URGENT: {color: '#EA580C', bg: '#FED7AA', icon: Zap, label: 'Urgent'},
    HIGH: {color: '#2563EB', bg: '#DBEAFE', icon: Bell, label: 'High'},
    NORMAL: {color: '#059669', bg: '#D1FAE5', icon: Bell, label: 'Normal'},
    LOW: {color: '#6B7280', bg: '#F3F4F6', icon: Bell, label: 'Low'}
};

const CATEGORY_CONFIG = {
    ORDER: {icon: Bell, color: '#2563EB', label: 'Orders'},
    DELIVERY: {icon: Bell, color: '#059669', label: 'Delivery'},
    SECURITY: {icon: Bell, color: '#DC2626', label: 'Security'},
    SYSTEM: {icon: Bell, color: '#7C3AED', label: 'System'},
    PAYMENT: {icon: Bell, color: '#EA580C', label: 'Payment'},
    SOCIAL: {icon: Bell, color: '#DB2777', label: 'Social'},
    PROMOTION: {icon: Bell, color: '#059669', label: 'Promotions'}
};

const formatTime = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

// Memoized NotificationCard to prevent unnecessary re-renders
const NotificationCard = memo(({notification, onDelete, onViewDetails, onViewSilently}) => {
    const isUnread = !notification.read?.status;

    const priorityConfig = PRIORITY_CONFIG[notification.priority];
    const categoryConfig = CATEGORY_CONFIG[notification.category];
    const CategoryIcon = categoryConfig?.icon || Bell;

    const handleCardPress = () => {
        console.log(`📱 Card pressed: ${notification._id}, isUnread: ${isUnread}`);
        onViewDetails(notification);
    };

    const handleDeletePress = () => {
        console.log(`🗑️ Delete pressed: ${notification._id}`);
        onDelete(notification._id);
    };

    const renderRightActions = () => (
        <TouchableOpacity style={styles.swipeDeleteButton} onPress={handleDeletePress}>
            <Trash2 size={20} color="#FFF"/>
            <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
    );

    // Handle silent view (mark as read without navigation)
    const handleSilentView = () => {
        console.log(`🔍 Silent view: ${notification._id}`);
        onViewSilently(notification);
    };



    return (
        <>
            <Swipeable
                renderRightActions={renderRightActions}
                overshootRight={false}
            >
                <View style={styles.cardContainer}>
                    <View style={[styles.card, isUnread && styles.unreadCard]}>
                        <TouchableOpacity
                            style={styles.cardContent}
                            activeOpacity={0.7}
                            onPress={handleSilentView}
                        >
                            <View style={styles.cardLeft}>
                                <View style={[styles.iconContainer, {backgroundColor: priorityConfig.bg}]}>
                                    <CategoryIcon size={20} color={priorityConfig.color}/>
                                </View>

                                <View style={styles.contentContainer}>
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
                                            {notification.content.title}
                                        </Text>
                                        {(notification.priority === 'URGENT' || notification.priority === 'CRITICAL') && (
                                            <View style={[styles.priorityBadge, {backgroundColor: priorityConfig.bg}]}>
                                                <Text style={[styles.priorityBadgeText, {color: priorityConfig.color}]}>
                                                    {notification.priority}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.body} numberOfLines={2}>
                                        {notification.content.body}
                                    </Text>

                                    <View style={styles.metaRow}>
                                        <Text style={styles.time}>
                                            {formatTime(notification.createdAt)}
                                        </Text>
                                        <Text style={[styles.category, {color: categoryConfig?.color || '#6B7280'}]}>
                                            {categoryConfig?.label || notification.category}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.cardRight}>
                                {isUnread && <View style={styles.unreadDot}/>}

                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        onPress={handleCardPress}
                                        style={styles.actionButton}
                                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                    >
                                        <Eye size={18} color="#6B7280"/>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleDeletePress}
                                        style={styles.actionButton}
                                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                    >
                                        <Trash2 size={16} color="#DC2626"/>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Swipeable>
        </>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for better memoization
    return (
        prevProps.notification._id === nextProps.notification._id &&
        prevProps.notification.read?.status === nextProps.notification.read?.status &&
        prevProps.notification.content.title === nextProps.notification.content.title &&
        prevProps.notification.content.body === nextProps.notification.content.body
    );
});

NotificationCard.displayName = 'NotificationCard';

const styles = StyleSheet.create({
    cardContainer: {
        marginHorizontal: 16,
        marginVertical: 6,
        marginBottom:15
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563EB',
    },
    cardContent: {
        flexDirection: 'row',
        padding: 4,
    },
    cardLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        flex: 1,
        marginRight: 8,
    },
    unreadTitle: {
        color: '#111827',
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginLeft: 8,
    },
    priorityBadgeText: {
        fontSize: 10,
        fontFamily: 'PoppinsSemiBold',
        textTransform: 'uppercase',
    },
    body: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        lineHeight: 20,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    time: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'PoppinsRegular',
    },
    category: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        textTransform: 'uppercase',
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingLeft: 8,
    },
    cardActions: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        marginVertical: 2,
    },
    swipeDeleteButton: {
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    swipeDeleteText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        marginTop: 4,
    },

});

export default NotificationCard;