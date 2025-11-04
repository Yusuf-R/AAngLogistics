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
import SessionManager from "../../../lib/SessionManager";

// Custom Confirmation Modal Component
const ConfirmationModal = ({ visible, onClose, onConfirm, isProcessing }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.confirmOverlay}>
                <TouchableOpacity
                    style={styles.confirmBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={styles.confirmCard}>
                    {/* Icon Header */}
                    <View style={styles.confirmIconContainer}>
                        <View style={styles.confirmIconCircle}>
                            <Ionicons name="information-circle" size={40} color="#6366F1" />
                        </View>
                    </View>

                    {/* Content */}
                    <Text style={styles.confirmTitle}>Confirm Order Acceptance</Text>
                    <Text style={styles.confirmMessage}>
                        By accepting this order, you commit to completing the delivery professionally and safely.
                    </Text>

                    {/* Checklist */}
                    <View style={styles.checklistContainer}>
                        <View style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.checklistText}>Verify package condition at pickup</Text>
                        </View>
                        <View style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.checklistText}>Handle fragile items with care</Text>
                        </View>
                        <View style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.checklistText}>Maintain communication with recipient</Text>
                        </View>
                        <View style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.checklistText}>Contact support for any issues</Text>
                        </View>
                    </View>

                    <Text style={styles.confirmWarning}>
                        ⚠️ Violations may affect your driver rating
                    </Text>

                    {/* Action Buttons */}
                    <View style={styles.confirmActions}>
                        <TouchableOpacity
                            style={styles.confirmCancelButton}
                            onPress={onClose}
                            disabled={isProcessing}
                        >
                            <Text style={styles.confirmCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmAcceptButton, isProcessing && styles.buttonDisabled]}
                            onPress={onConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.confirmAcceptText}>Accept & Continue</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

function OrdersListModal({ visible, onClose, sourceTab = null }) {
    const {
        tabOrders,
        fetchAvailableOrders,
        currentTabContext
    } = useLogisticStore();

    const targetTab = sourceTab || currentTabContext || 'orders';
    const { availableOrders, orderCount, isFetchingOrders } = tabOrders[targetTab] || {
        availableOrders: [],
        orderCount: 0,
        isFetchingOrders: false
    };

    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingOrder, setPendingOrder] = useState(null);
    const [acceptingOrder, setAcceptingOrder] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAvailableOrders(null, false, targetTab);
        setRefreshing(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setViewMode('detail');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedOrder(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleAcceptOrder = (order) => {
        setPendingOrder(order);
        setShowConfirmModal(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const proceedWithAcceptance = async () => {
        if (!pendingOrder) return;

        setAcceptingOrder(true);

        try {
            const { currentLocation } = useLogisticStore.getState();

            if (!currentLocation) {
                toast.error('Please wait for location to be available');
                setAcceptingOrder(false);
                return;
            }

            console.log('Accepting order with location:', {
                orderId: pendingOrder._id,
                currentLocation: {
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                    accuracy: currentLocation.accuracy
                }
            });

            // Simulate API call
            const result = await useLogisticStore.getState().acceptOrder(pendingOrder);

            if (!result.success) {
                toast.error(result.message || 'Failed to accept order');
                setAcceptingOrder(false);
                return;
            }

            await SessionManager.updateUser(result.user);

            // Close modals
            setShowConfirmModal(false);
            setPendingOrder(null);
            onClose();

            // Success feedback
            toast.success(`Order ${pendingOrder.orderRef} accepted!`);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            console.log('✅ Order accepted - switching to live tracking');

        } catch (error) {
            toast.error('Failed to accept order. Please try again.');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setAcceptingOrder(false);
        }
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
            default: priority;
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

    // Render Order Detail View
    const renderOrderDetail = () => {
        if (!selectedOrder) return null;

        return (
            <View style={styles.detailContainer}>
                <View style={styles.detailHeader}>
                    <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>Order Details</Text>
                    <View style={styles.orderRefBadge}>
                        <Text style={styles.orderRefText}>{selectedOrder.orderRef}</Text>
                    </View>
                </View>

                <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
                    {/* Priority & Status */}
                    <View style={styles.detailSection}>
                        <View style={styles.statusRow}>
                            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(selectedOrder.priority)}15` }]}>
                                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(selectedOrder.priority) }]} />
                                <Text style={[styles.priorityText, { color: getPriorityColor(selectedOrder.priority) }]}>
                                    {getPriorityLabel(selectedOrder.priority)} Priority
                                </Text>
                            </View>
                            <View style={styles.orderTypeBadge}>
                                <Ionicons name={selectedOrder.orderType === 'scheduled' ? 'time' : 'flash'} size={14} color="#6366F1" />
                                <Text style={styles.orderTypeText}>
                                    {selectedOrder.orderType === 'scheduled' ? 'Scheduled' : 'Instant'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Route Information with Connected Dots */}
                    <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>Delivery Route</Text>
                        <View style={styles.routeCard}>
                            {/* Pickup */}
                            <View style={styles.routeItemRow}>
                                <View style={styles.routeMarkerContainer}>
                                    <View style={[styles.routeMarker, styles.pickupMarker]}>
                                        <Ionicons name="ellipse" size={16} color="#10B981" />
                                    </View>
                                    <View style={styles.connectionLine} />
                                </View>
                                <View style={styles.routeContent}>
                                    <Text style={styles.routeLabel}>PICKUP LOCATION</Text>
                                    <Text style={styles.routeAddress}>{selectedOrder.location.pickUp.address}</Text>
                                    {selectedOrder.location.pickUp.landmark && (
                                        <Text style={styles.landmark}>📍 {selectedOrder.location.pickUp.landmark}</Text>
                                    )}
                                    {selectedOrder.location.pickUp.contactPerson && (
                                        <View style={styles.contactInfo}>
                                            <Ionicons name="person" size={12} color="#6B7280" />
                                            <Text style={styles.contactText}>
                                                {selectedOrder.location.pickUp.contactPerson.name} • {selectedOrder.location.pickUp.contactPerson.phone}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Dropoff */}
                            <View style={styles.routeItemRow}>
                                <View style={styles.routeMarkerContainer}>
                                    <View style={[styles.routeMarker, styles.dropoffMarker]}>
                                        <Ionicons name="location" size={16} color="#EF4444" />
                                    </View>
                                </View>
                                <View style={styles.routeContent}>
                                    <Text style={styles.routeLabel}>DELIVERY LOCATION</Text>
                                    <Text style={styles.routeAddress}>{selectedOrder.location.dropOff.address}</Text>
                                    {selectedOrder.location.dropOff.landmark && (
                                        <Text style={styles.landmark}>📍 {selectedOrder.location.dropOff.landmark}</Text>
                                    )}
                                    {selectedOrder.location.dropOff.contactPerson && (
                                        <View style={styles.contactInfo}>
                                            <Ionicons name="person" size={12} color="#6B7280" />
                                            <Text style={styles.contactText}>
                                                {selectedOrder.location.dropOff.contactPerson.name} • {selectedOrder.location.dropOff.contactPerson.phone}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Package Details */}
                    <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>Package Information</Text>
                        <View style={styles.packageCard}>
                            <View style={styles.packageRow}>
                                <Ionicons name="cube" size={16} color="#6366F1" />
                                <Text style={styles.packageLabel}>Category:</Text>
                                <Text style={styles.packageValue}>{selectedOrder.package?.category || 'General'}</Text>
                            </View>
                            <View style={styles.packageRow}>
                                <Ionicons name="scale" size={16} color="#6366F1" />
                                <Text style={styles.packageLabel}>Weight:</Text>
                                <Text style={styles.packageValue}>
                                    {selectedOrder.package?.weight?.value || 'N/A'} {selectedOrder.package?.weight?.unit || 'kg'}
                                </Text>
                            </View>
                            {selectedOrder.package?.isFragile && (
                                <View style={[styles.packageRow, styles.fragileRow]}>
                                    <Ionicons name="warning" size={16} color="#F59E0B" />
                                    <Text style={[styles.packageLabel, styles.fragileText]}>Fragile Item - Handle with Care</Text>
                                </View>
                            )}
                            {selectedOrder.package?.description && (
                                <View style={styles.descriptionRow}>
                                    <Text style={styles.descriptionLabel}>Description:</Text>
                                    <Text style={styles.descriptionText}>{selectedOrder.package.description}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Vehicle Requirements */}
                    <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>Vehicle Requirements</Text>
                        <View style={styles.vehiclesCard}>
                            <View style={styles.vehiclesContainer}>
                                {selectedOrder.vehicleRequirements.map((vehicle, index) => (
                                    <View key={index} style={styles.vehicleBadge}>
                                        <Ionicons name={getVehicleIcon(vehicle)} size={16} color="#6366F1" />
                                        <Text style={styles.vehicleText}>{vehicle.charAt(0).toUpperCase() + vehicle.slice(1)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Pricing */}
                    <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>Earnings</Text>
                        <View style={styles.pricingCard}>
                            <View style={styles.pricingRow}>
                                <Text style={styles.pricingLabel}>Delivery Fee:</Text>
                                <Text style={styles.pricingAmount}>{formatCurrency(selectedOrder.pricing.totalAmount)}</Text>
                            </View>
                            <View style={styles.pricingNote}>
                                <Ionicons name="information-circle" size={14} color="#6B7280" />
                                <Text style={styles.pricingNoteText}>
                                    This amount includes all applicable charges and surcharges
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => handleAcceptOrder(selectedOrder)}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.acceptButtonText}>Accept This Order</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.backButtonSecondary} onPress={handleBackToList}>
                            <Text style={styles.backButtonText}>Back to Orders</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 30 }} />
                </ScrollView>
            </View>
        );
    };

    // Render Order List View
    const renderOrderList = () => {
        return (
            <>
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
                        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                            <Ionicons name="refresh" size={20} color="#fff" />
                            <Text style={styles.refreshButtonText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366F1" />}
                    >
                        {availableOrders.map((order) => (
                            <View key={order._id} style={styles.orderCard}>
                                {/* Order Header */}
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderHeaderLeft}>
                                        <Text style={styles.orderRef}>{order.orderRef}</Text>
                                        <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(order.priority)}15` }]}>
                                            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(order.priority) }]} />
                                            <Text style={[styles.priorityText, { color: getPriorityColor(order.priority) }]}>
                                                {getPriorityLabel(order.priority)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.headerActions}>
                                        <View style={styles.distanceContainer}>
                                            <Ionicons name="location" size={14} color="#6B7280" />
                                            <Text style={styles.distanceText}>{order.distance}km</Text>
                                        </View>
                                        <TouchableOpacity style={styles.viewButton} onPress={() => handleViewOrder(order)}>
                                            <Ionicons name="eye" size={18} color="#6366F1" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Route Info with Connected Dots */}
                                <View style={styles.routeContainer}>
                                    <View style={styles.routeItemCompact}>
                                        <View style={styles.routeMarkerContainerCompact}>
                                            <View style={[styles.routeMarkerSmall, styles.pickupMarkerSmall]}>
                                                <Ionicons name="ellipse" size={10} color="#10B981" />
                                            </View>
                                            <View style={styles.connectionLineCompact} />
                                        </View>
                                        <View style={styles.routeContentCompact}>
                                            <Text style={styles.routeLabelSmall}>Pickup</Text>
                                            <Text style={styles.routeAddressSmall} numberOfLines={1}>
                                                {order.location.pickUp.address}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.routeItemCompact}>
                                        <View style={styles.routeMarkerContainerCompact}>
                                            <View style={[styles.routeMarkerSmall, styles.dropoffMarkerSmall]}>
                                                <Ionicons name="location" size={10} color="#EF4444" />
                                            </View>
                                        </View>
                                        <View style={styles.routeContentCompact}>
                                            <Text style={styles.routeLabelSmall}>Dropoff</Text>
                                            <Text style={styles.routeAddressSmall} numberOfLines={1}>
                                                {order.location.dropOff.address}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Order Details */}
                                <View style={styles.detailsContainer}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="car" size={16} color="#6B7280" />
                                        <Text style={styles.detailLabel}>Vehicles:</Text>
                                        <View style={styles.vehicleIcons}>
                                            {order.vehicleRequirements.slice(0, 3).map((vehicle, idx) => (
                                                <Ionicons key={`${order._id}-${vehicle}-${idx}`} name={getVehicleIcon(vehicle)} size={14} color="#374151" />
                                            ))}
                                            {order.vehicleRequirements.length > 3 && (
                                                <Text style={styles.moreVehicles}>+{order.vehicleRequirements.length - 3}</Text>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.earningsRow}>
                                        <Ionicons name="wallet" size={16} color="#10B981" />
                                        <Text style={styles.earningsLabel}>Earnings:</Text>
                                        <Text style={styles.earningsAmount}>{formatCurrency(order.pricing.totalAmount)}</Text>
                                    </View>
                                </View>

                                {/* Bottom Actions Row */}
                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={styles.viewDetailsButton} onPress={() => handleViewOrder(order)}>
                                        <Ionicons name="eye-outline" size={18} color="#6366F1" />
                                        <Text style={styles.viewDetailsText}>View Details</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.acceptButtonCompact} onPress={() => handleAcceptOrder(order)}>
                                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                        <Text style={styles.acceptButtonTextCompact}>Accept Order</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <View style={{ height: 20 }} />
                    </ScrollView>
                )}
            </>
        );
    };

    return (
        <>
            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
                <View style={styles.container}>
                    {viewMode === 'list' ? renderOrderList() : renderOrderDetail()}
                </View>
            </Modal>

            <ConfirmationModal
                visible={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setPendingOrder(null);
                }}
                onConfirm={proceedWithAcceptance}
                isProcessing={acceptingOrder}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: Platform.OS === 'ios' ? 60 : 20
    },

    // Header
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    viewButton: {
        padding: 6,
        backgroundColor: '#EEF2FF',
        borderRadius: 8
    },

    // Loading & Empty
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

    // Route Container with Connected Dots
    routeContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12
    },
    routeItemCompact: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10
    },
    routeMarkerContainerCompact: {
        alignItems: 'center',
        paddingTop: 2
    },
    routeMarkerSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    pickupMarkerSmall: {
        backgroundColor: '#D1FAE5'
    },
    dropoffMarkerSmall: {
        backgroundColor: '#FEE2E2'
    },
    connectionLineCompact: {
        width: 2,
        height: 20,
        backgroundColor: '#9CA3AF',
        marginVertical: 2
    },
    routeContentCompact: {
        flex: 1,
        paddingBottom: 8
    },
    routeLabelSmall: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 2
    },
    routeAddressSmall: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#374151'
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

    // Card Actions Row
    cardActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4
    },
    viewDetailsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F3F4F6',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    viewDetailsText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },
    acceptButtonCompact: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#6366F1',
        paddingVertical: 10,
        borderRadius: 10
    },
    acceptButtonTextCompact: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },

    // Detail View
    detailContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: {
        padding: 4,
        marginRight: 12
    },
    detailTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        flex: 1
    },
    orderRefBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    orderRefText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },
    detailScrollView: {
        flex: 1,
        padding: 16
    },
    detailSection: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 12
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    orderTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    orderTypeText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },

    // Route Card with Connected Markers
    routeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    routeItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12
    },
    routeMarkerContainer: {
        alignItems: 'center',
        paddingTop: 2
    },
    routeMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4
    },
    pickupMarker: {
        backgroundColor: '#D1FAE5'
    },
    dropoffMarker: {
        backgroundColor: '#FEE2E2'
    },
    connectionLine: {
        width: 3,
        flex: 1,
        minHeight: 40,
        backgroundColor: '#9CA3AF',
        borderRadius: 2,
        marginVertical: 4
    },
    routeContent: {
        flex: 1,
        paddingBottom: 16
    },
    routeLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 4
    },
    routeAddress: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        lineHeight: 20,
        marginBottom: 6
    },
    landmark: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 6
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    contactText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },

    // Package Card
    packageCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    packageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12
    },
    packageLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        minWidth: 80
    },
    packageValue: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        flex: 1
    },
    fragileRow: {
        backgroundColor: '#FFFBEB',
        padding: 10,
        borderRadius: 8,
        marginTop: 4
    },
    fragileText: {
        color: '#F59E0B',
        flex: 1
    },
    descriptionRow: {
        marginTop: 8
    },
    descriptionLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        marginBottom: 4
    },
    descriptionText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        lineHeight: 20
    },

    // Vehicle Card
    vehiclesCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    vehiclesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    vehicleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    vehicleText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151'
    },

    // Pricing Card
    pricingCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    pricingLabel: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#374151'
    },
    pricingAmount: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        color: '#10B981'
    },
    pricingNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8
    },
    pricingNoteText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        flex: 1,
        lineHeight: 16
    },

    // Action Section
    actionSection: {
        marginTop: 24,
        gap: 12
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        borderRadius: 12
    },
    acceptButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },
    backButtonSecondary: {
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    backButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    buttonDisabled: {
        opacity: 0.6
    },

    // Confirmation Modal Styles
    confirmOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    confirmBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    confirmCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
    },
    confirmIconContainer: {
        alignItems: 'center',
        marginBottom: 16
    },
    confirmIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    confirmTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12
    },
    confirmMessage: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20
    },
    checklistContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12
    },
    checklistText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        flex: 1,
        lineHeight: 18
    },
    confirmWarning: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#F59E0B',
        textAlign: 'center',
        backgroundColor: '#FFFBEB',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12
    },
    confirmCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        alignItems: 'center'
    },
    confirmCancelText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    confirmAcceptButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        borderRadius: 12
    },
    confirmAcceptText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    }
});

export default OrdersListModal;