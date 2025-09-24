// /components/Client/Orders/TrackOrder.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Text,
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Animated,
    TouchableOpacity,
    Alert,
    Linking
} from "react-native";
import { router } from "expo-router";
import { getSocket } from "../../../hooks/useSocket";
import { useOrderStore } from "../../../store/useOrderStore";
import CustomHeader from "../CustomHeader";

// Individual Timeline Item Component
const TimelineItem = ({ item, isLast, isActive }) => {
    const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.98)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActive) {
            // Scale animation for new active item
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.02,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();

            // Continuous pulse for active item
            const pulseLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.95,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    })
                ])
            );
            pulseLoop.start();

            return () => pulseLoop.stop();
        }
    }, [isActive]);

    const formatTime = useCallback((timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }, []);

    const formatDate = useCallback((timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        return date.toLocaleDateString();
    }, []);

    const getItemStyle = () => {
        if (item.isCompleted) {
            return [styles.timelineItem, styles.completedItem];
        }
        if (item.isCurrent) {
            return [styles.timelineItem, styles.activeItem];
        }
        return [styles.timelineItem, styles.pendingItem];
    };

    const getStatusIcon = () => {
        if (item.isCompleted) {
            return "✅";
        }
        if (item.isCurrent) {
            return item.icon || "🚀";
        }
        return "○";
    };

    const handleActionPress = useCallback((action) => {
        switch (action) {
            case 'view_map':
                // Navigate to map view or open external map
                Alert.alert("Live Map", "Opening live tracking map...");
                break;
            case 'contact_driver':
                if (item.metadata?.driverPhone) {
                    Alert.alert(
                        "Contact Driver",
                        `Call ${item.metadata.driverName}?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Call",
                                onPress: () => Linking.openURL(`tel:${item.metadata.driverPhone}`)
                            }
                        ]
                    );
                }
                break;
            default:
                break;
        }
    }, [item.metadata]);

    return (
        <Animated.View
            style={[
                getItemStyle(),
                {
                    transform: [
                        { scale: scaleAnim },
                        ...(isActive ? [{ scale: pulseAnim }] : [])
                    ]
                }
            ]}
        >
            {/* Vertical connecting line */}
            {!isLast && <View style={styles.verticalLine} />}

            {/* Status Icon */}
            <View style={styles.iconContainer}>
                <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
                {/* Header */}
                <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>
                        {item.title?.toUpperCase() || 'STATUS UPDATE'}
                    </Text>
                    <View style={[
                        styles.statusBadge,
                        item.isCompleted ? styles.completedBadge :
                            item.isCurrent ? styles.activeBadge : styles.pendingBadge
                    ]}>
                        <Text style={[
                            styles.statusBadgeText,
                            item.isCompleted ? styles.completedBadgeText :
                                item.isCurrent ? styles.activeBadgeText : styles.pendingBadgeText
                        ]}>
                            {item.isCompleted ? 'COMPLETED' :
                                item.isCurrent ? 'ONGOING' : 'PENDING'}
                        </Text>
                    </View>
                </View>

                {/* Timestamp and Description */}
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                        {item.isCurrent && "LIVE • "}{formatTime(item.timestamp)}
                    </Text>
                    <Text style={styles.dateText}>
                        {formatDate(item.timestamp)}
                    </Text>
                </View>

                <Text style={styles.description}>{item.description}</Text>

                {/* Metadata Information */}
                {item.metadata && (
                    <View style={styles.metadataContainer}>
                        {item.metadata.driverName && (
                            <Text style={styles.metadataText}>
                                Driver: {item.metadata.driverName}
                                {item.metadata.vehicleType && ` • ${item.metadata.vehicleType}`}
                                {item.metadata.vehicleNumber && ` • ${item.metadata.vehicleNumber}`}
                            </Text>
                        )}

                        {item.metadata.eta && (
                            <Text style={styles.metadataText}>
                                ETA: {item.metadata.eta} minutes
                            </Text>
                        )}

                        {item.metadata.distance && (
                            <Text style={styles.metadataText}>
                                Distance: {item.metadata.distance}km
                            </Text>
                        )}

                        {item.metadata.location?.address && (
                            <Text style={styles.metadataText}>
                                Location: {item.metadata.location.address}
                            </Text>
                        )}
                    </View>
                )}

                {/* Action Buttons for Active Items */}
                {item.isCurrent && (item.metadata?.eta || item.metadata?.driverId) && (
                    <View style={styles.actionContainer}>
                        {item.metadata.eta && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleActionPress('view_map')}
                            >
                                <Text style={styles.actionButtonText}>View Live Map</Text>
                            </TouchableOpacity>
                        )}

                        {item.metadata.driverId && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.secondaryActionButton]}
                                onPress={() => handleActionPress('contact_driver')}
                            >
                                <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>
                                    Contact Driver
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Live Indicator */}
                {item.isCurrent && (
                    <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

// Main TrackOrder Component
function TrackOrder({ trackingOrder }) {
    const [showCode, setShowCode] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const { updateOrderTracking, updateDriverLocation, liveTrackingData } = useOrderStore();
    const socket = getSocket();

    // Sort tracking history with most recent first
    const sortedHistory = useMemo(() => {
        if (!trackingOrder?.orderTrackingHistory) return [];
        return [...trackingOrder.orderTrackingHistory].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
    }, [trackingOrder?.orderTrackingHistory]);

    const currentStatus = useMemo(() => {
        return sortedHistory.find(item => item.isCurrent);
    }, [sortedHistory]);

    // WebSocket event handlers
    useEffect(() => {
        if (!socket || !trackingOrder?._id) return;

        const handleStatusUpdate = (orderUpdate) => {
            if (orderUpdate.orderId === trackingOrder._id) {
                updateOrderTracking(orderUpdate);
            }
        };

        const handleLocationUpdate = (locationUpdate) => {
            if (locationUpdate.orderId === trackingOrder._id) {
                updateDriverLocation(locationUpdate);
            }
        };

        const handleConnect = () => setConnectionStatus('connected');
        const handleDisconnect = () => setConnectionStatus('disconnected');

        // Add event listeners
        socket.on('order:status:updated', handleStatusUpdate);
        socket.on('order:location:updated', handleLocationUpdate);
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        return () => {
            // Cleanup event listeners
            socket.off('order:status:updated', handleStatusUpdate);
            socket.off('order:location:updated', handleLocationUpdate);
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket, trackingOrder?._id, updateOrderTracking, updateDriverLocation]);

    const handleBackPress = useCallback(() => {
        router.back();
    }, []);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Request fresh data via socket
            if (socket && trackingOrder?._id) {
                socket.emit('order:request:update', { orderId: trackingOrder._id });
            }

            // Simulate refresh delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    }, [socket, trackingOrder?._id]);

    if (!trackingOrder) {
        return (
            <View style={styles.container}>
                <CustomHeader
                    title="Track Orders"
                    onBackPress={handleBackPress}
                />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>No Order Selected</Text>
                    <Text style={styles.emptyStateSubtitle}>
                        Please select an order to track from your orders list.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <CustomHeader
                title="ORDER TRACKING"
                onBackPress={handleBackPress}
                rightComponent={
                    <View style={styles.connectionStatus}>
                        <View style={[
                            styles.connectionDot,
                            connectionStatus === 'connected' ? styles.connectedDot : styles.disconnectedDot
                        ]} />
                    </View>
                }
            />

            {/* Order Header Info */}
            <View style={styles.orderHeader}>
                <Text style={styles.orderRef}>Order: {trackingOrder.orderRef}</Text>
                <Text style={styles.orderStatus}>
                    Status: {currentStatus?.title || 'Processing'} • Live Updating
                </Text>

                {/* Enhanced Delivery Secret Section */}
                {trackingOrder.deliveryToken && (
                    <View style={styles.deliverySecretContainer}>
                        <View style={styles.deliverySecretHeader}>
                            <View style={styles.secretIconContainer}>
                                <Text style={styles.secretIcon}>🔒</Text>
                            </View>
                            <Text style={styles.deliverySecretTitle}>Delivery Verification Code</Text>

                            {/* Show/Hide Toggle */}
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setShowCode(!showCode)}
                            >
                                <Text style={styles.toggleIcon}>
                                    {showCode ? '👁️' : '👁️‍🗨️'}
                                </Text>
                                <Text style={styles.toggleText}>
                                    {showCode ? 'Hide' : 'Show'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.codeContainer}>
                            {trackingOrder.deliveryToken.split('').map((digit, index) => (
                                <View key={index} style={styles.codeDigit}>
                                    <Text style={styles.codeText}>
                                        {showCode ? digit : '•'}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.deliveryInstructions}>
                            {showCode
                                ? "Share this code with your rider at delivery"
                                : "Tap 'Show' to reveal verification code"
                            }
                        </Text>
                    </View>
                )}
            </View>

            {/* Timeline */}
            <ScrollView
                style={styles.timelineContainer}
                contentContainerStyle={styles.timelineContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
            >
                <Text style={styles.progressionTitle}>ORDER PROGRESSION</Text>

                {sortedHistory.map((item, index) => (
                    <TimelineItem
                        key={item._id || `${item.status}-${index}`}
                        item={item}
                        isLast={index === sortedHistory.length - 1}
                        isActive={item.isCurrent}
                    />
                ))}

                {sortedHistory.length === 0 && (
                    <View style={styles.noHistoryState}>
                        <Text style={styles.noHistoryText}>
                            No tracking information available yet.
                        </Text>
                        <Text style={styles.noHistorySubtext}>
                            Updates will appear here as your order progresses.
                        </Text>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    connectionStatus: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    connectedDot: {
        backgroundColor: '#10B981',
    },
    disconnectedDot: {
        backgroundColor: '#EF4444',
    },
    orderHeader: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        borderBottomColor: '#E5E7EB',
    },
    orderTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    orderRef: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    orderStatus: {
        fontSize: 14,
        color: '#3B82F6',
        fontFamily: 'PoppinsRegular',
        marginBottom: 8,
    },
    deliveryToken: {
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'PoppinsBold',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    timelineContainer: {
        flex: 1,
    },
    timelineContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    progressionTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        textAlign: 'left',
        marginBottom: 24,
        letterSpacing: 0.5,
    },
    timelineItem: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        paddingLeft: 60,
        paddingRight: 16,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    completedItem: {
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    activeItem: {
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    pendingItem: {
        borderLeftWidth: 4,
        borderLeftColor: '#D1D5DB',
        opacity: 0.7,
    },
    verticalLine: {
        position: 'absolute',
        left: 28,
        top: 50,
        bottom: -16,
        width: 2,
        backgroundColor: '#E5E7EB',
    },
    iconContainer: {
        position: 'absolute',
        left: 20,
        top: 20,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusIcon: {
        fontSize: 16,
    },
    contentContainer: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    completedBadge: {
        backgroundColor: '#D1FAE5',
    },
    activeBadge: {
        backgroundColor: '#DBEAFE',
    },
    pendingBadge: {
        backgroundColor: '#F3F4F6',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '500',
    },
    completedBadgeText: {
        color: '#065F46',
    },
    activeBadgeText: {
        color: '#1E40AF',
    },
    pendingBadgeText: {
        color: '#6B7280',
    },
    timeContainer: {
        marginBottom: 6,
    },
    timeText: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'PoppinsSemiBold',
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    description: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 8,
    },
    metadataContainer: {
        marginBottom: 12,
    },
    metadataText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        marginBottom: 2,
    },
    actionContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    actionButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    secondaryActionButton: {
        backgroundColor: '#10B981',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
    },
    secondaryActionButtonText: {
        color: '#FFFFFF',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        // Add pulsing animation here if needed
    },
    liveText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#EF4444',
    },
    noHistoryState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noHistoryText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        marginBottom: 4,
    },
    noHistorySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    bottomPadding: {
        height: 20,
    },
    deliverySecretContainer: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        width: '100%',
        alignItems: 'center',
    },
    deliverySecretHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        width: '100%',
    },
    secretIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    secretIcon: {
        fontSize: 16,
    },
    deliverySecretTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#1E293B',
        flex: 1,
    },
    infoButton: {
        padding: 4,
    },
    infoIcon: {
        fontSize: 16,
        opacity: 0.6,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
    },
    codeDigit: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    codeText: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#3B82F6',
    },
    deliveryInstructions: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        fontFamily: 'PoppinsRegular',
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    toggleIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    toggleText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#475569',
    },
});

export default TrackOrder;