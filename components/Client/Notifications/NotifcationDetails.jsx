import React, {memo, useMemo, useCallback} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    StatusBar
} from 'react-native';
import {
    Clock,
    User,
    AlertTriangle,
    Bell,
    Zap,
    Package,
    Shield,
    Settings
} from 'lucide-react-native';
import { useSessionStore } from "../../../store/useSessionStore";
import { router, useSegments } from "expo-router";

import {useOrderStore} from "../../../store/useOrderStore";
import CustomHeader from "../CustomHeader";

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

// Action Buttons Section
const ActionButtons = memo(({notification, actionButtons}) => {
    const allOrderData = useSessionStore((state) => state.allOrderData);
    const segments = useSegments();
    const {
        setTrackingOrder,
        setSelectedOrder,
    } = useOrderStore();

    const handleActionPress = useCallback((action) => {
        const {orderRef} = notification.content;
        const data = allOrderData.find(order => order.orderRef === orderRef);
        setTrackingOrder(data);
        setSelectedOrder(data);

        if (action === 'track' && orderRef && data) {
            router.replace({
                pathname: '/client/orders/track',
            });
        }
        if (action === 'view') {
            router.replace({
                pathname: '/client/orders/view',
            });
        }
    }, [allOrderData, notification.content, setTrackingOrder, setSelectedOrder]);

    if (!actionButtons?.length) return null;

    return (
        <View style={styles.detailActionsContainer}>
            <Text style={styles.detailActionsTitle}>Actions</Text>
            <View style={styles.detailActionButtons}>
                {actionButtons.map((button, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.detailActionButton}
                        onPress={() => handleActionPress(button.action)}
                    >
                        <Text style={styles.detailActionButtonText}>{button.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
});

// Metadata Section
const MetadataSection = memo(({notification, formatDetailedTime}) => (
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
));

// Main Component
function NotificationDetails({notification}) {
    const formatDetailedTime = useCallback((dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const handleBackPress = () => {
        router.back();
    };

    const computed = useMemo(() => {
        if (!notification) return null;
        const priority = PRIORITY_CONFIG[notification.priority];
        const category = CATEGORY_CONFIG[notification.category];
        return {
            priorityConfig: priority,
            categoryConfig: category,
            CategoryIcon: category?.icon || Bell,
            PriorityIcon: priority?.icon || Bell
        };
    }, [notification]);

    if (!notification || !computed) return null;

    const {priorityConfig, categoryConfig, CategoryIcon, PriorityIcon} = computed;

    return (
        <>
            <CustomHeader
                title="Details"
                onBackPress={handleBackPress}
            />
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
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
                                    <Text style={styles.categoryText}>
                                        {categoryConfig?.label || notification.category}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.detailBody}>{notification.content.body}</Text>

                        <ActionButtons
                            notification={notification}
                            actionButtons={notification.content.richContent?.actionButtons}/>

                        <MetadataSection
                            notification={notification}
                            formatDetailedTime={formatDetailedTime}
                        />
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    detailCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 1},
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
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
        color: '#111827',
        marginBottom: 8,
        fontFamily: 'PoppinsSemiBold',
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
        marginLeft: 4,
        fontFamily: 'PoppinsRegular',
    },
    categoryText: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    detailBody: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
        marginBottom: 24,
        fontFamily: 'PoppinsRegular',
    },
    detailActionsContainer: {
        marginBottom: 24,
    },
    detailActionsTitle: {
        fontSize: 16,
        color: '#111827',
        marginBottom: 12,
        fontFamily: 'PoppinsSemiBold',
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
        fontFamily: 'PoppinsRegular',
    },
    metadataContainer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
    },
    metadataTitle: {
        fontSize: 16,
        color: '#111827',
        marginBottom: 12,
        fontFamily: 'PoppinsSemiBold',
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    metadataContent: {
        flex: 1,
        marginLeft: 12,
        paddingVertical: 4,
    },
    metadataLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
        fontFamily: 'PoppinsRegular',
    },
    metadataValue: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'PoppinsRegular',
    },
});

export default memo(NotificationDetails);
