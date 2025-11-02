// components/Driver/Discover/OrdersListModal.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useLogisticStore from '../../../store/Driver/useLogisticStore';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';

function OrdersListModal({ visible, onClose }) {
    const {
        availableOrders,
        orderCount,
        isFetchingOrders,
        fetchAvailableOrders,
        currentLocation
    } = useLogisticStore();

    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAvailableOrders();
        setRefreshing(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleOrderPress = (order) => {
        setSelectedOrder(order);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleAcceptOrder = async (order) => {
        // TODO: Implement API call to accept order
        console.log('Accepting order:', order.orderRef);

        toast.success(`Order ${order.orderRef} accepted!`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // TODO: Navigate to order details or start delivery
        onClose();
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return '#EF4444';
            case 'high': return '#F59E0B';
            case 'normal': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'urgent': return 'Urgent';
            case 'high': return 'High Priority';
            case 'normal': return 'Normal';
            default: return priority;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getVehicleIcon = (vehicle) => {
        const icons = {
            bicycle: 'bicycle',
            motorcycle: 'bicycle',
            tricycle: 'car-sport',
            car: 'car',
            van: 'bus',
            truck: 'bus'
        };
        return icons[vehicle] || 'car';
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Ionicons name="cube" size={24} color="#111827" />
                        <Text style={styles.title}>Available Orders</Text>
                        {orderCount > 0 && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{orderCount}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {isFetchingOrders && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text style={styles.loadingText}>Loading orders...</Text>
                    </View>
                ) : availableOrders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No Orders Available</Text>
                        <Text style={styles.emptyDescription}>
                            There are no orders in your area right now.{'\n'}
                            Try adjusting your scan settings or refresh.
                        </Text>
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefresh}
                        >
                            <Ionicons name="refresh" size={20} color="#fff" />
                            <Text style={styles.refreshButtonText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor="#6366F1"
                            />
                        }
                    >
                        {availableOrders.map((order) => (
                            <TouchableOpacity
                                key={order._id}
                                style={styles.orderCard}
                                onPress={() => handleOrderPress(order)}
                                activeOpacity={0.7}
                            >
                                {/* Order Header */}
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderHeaderLeft}>
                                        <Text style={styles.orderRef}>{order.orderRef}</Text>
                                        <View style={[
                                            styles.priorityBadge,
                                            { backgroundColor: `${getPriorityColor(order.priority)}15` }
                                        ]}>
                                            <View style={[
                                                styles.priorityDot,
                                                { backgroundColor: getPriorityColor(order.priority) }
                                            ]} />
                                            <Text style={[
                                                styles.priorityText,
                                                { color: getPriorityColor(order.priority) }
                                            ]}>
                                                {getPriorityLabel(order.priority)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.distanceContainer}>
                                        <Ionicons name="location" size={14} color="#6B7280" />
                                        <Text style={styles.distanceText}>{order.distance}km</Text>
                                    </View>
                                </View>

                                {/* Route Info */}
                                <View style={styles.routeContainer}>
                                    <View style={styles.routeRow}>
                                        <View style={styles.routeIcon}>
                                            <Ionicons name="ellipse" size={12} color="#10B981" />
                                        </View>
                                        <View style={styles.routeContent}>
                                            <Text style={styles.routeLabel}>Pickup</Text>
                                            <Text style={styles.routeAddress} numberOfLines={1}>
                                                {order.location.pickUp.address}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.routeDivider} />

                                    <View style={styles.routeRow}>
                                        <View style={styles.routeIcon}>
                                            <Ionicons name="location" size={12} color="#EF4444" />
                                        </View>
                                        <View style={styles.routeContent}>
                                            <Text style={styles.routeLabel}>Dropoff</Text>
                                            <Text style={styles.routeAddress} numberOfLines={1}>
                                                {order.location.dropOff.address}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Order Details */}
                                <View style={styles.detailsContainer}>
                                    {/* Vehicle Requirements */}
                                    <View style={styles.detailRow}>
                                        <Ionicons name="car" size={16} color="#6B7280" />
                                        <Text style={styles.detailLabel}>Vehicles:</Text>
                                        <View style={styles.vehicleIcons}>
                                            {order.vehicleRequirements.slice(0, 3).map((vehicle, idx) => (
                                                <Ionicons
                                                    key={idx}
                                                    name={getVehicleIcon(vehicle)}
                                                    size={14}
                                                    color="#374151"
                                                />
                                            ))}
                                            {order.vehicleRequirements.length > 3 && (
                                                <Text style={styles.moreVehicles}>
                                                    +{order.vehicleRequirements.length - 3}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* Earnings */}
                                    <View style={styles.earningsRow}>
                                        <Ionicons name="wallet" size={16} color="#10B981" />
                                        <Text style={styles.earningsLabel}>Earnings:</Text>
                                        <Text style={styles.earningsAmount}>
                                            {formatCurrency(order.pricing.totalAmount)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Accept Button */}
                                <TouchableOpacity
                                    style={styles.acceptButton}
                                    onPress={() => handleAcceptOrder(order)}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.acceptButtonText}>Accept Order</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}

                        {/* Bottom spacing */}
                        <View style={{ height: 20 }} />
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: Platform.OS === 'ios' ? 60 : 20
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    title: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    countBadge: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center'
    },
    countText: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },
    closeButton: {
        padding: 4
    },

    // Loading & Empty States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12
    },
    loadingText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8
    },
    emptyDescription: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12
    },
    refreshButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },

    // Orders List
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 16
    },

    // Order Card
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },

    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    orderHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1
    },
    orderRef: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    priorityText: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold'
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    distanceText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },

    // Route
    routeContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8
    },
    routeIcon: {
        marginTop: 2
    },
    routeContent: {
        flex: 1
    },
    routeLabel: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 2
    },
    routeAddress: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#374151'
    },
    routeDivider: {
        width: 2,
        height: 16,
        backgroundColor: '#E5E7EB',
        marginLeft: 5,
        marginVertical: 4
    },

    // Details
    detailsContainer: {
        gap: 8,
        marginBottom: 12
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    detailLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    vehicleIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    moreVehicles: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    earningsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    earningsLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    earningsAmount: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#10B981'
    },

    // Accept Button
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        borderRadius: 12
    },
    acceptButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    }
});

export default OrdersListModal;