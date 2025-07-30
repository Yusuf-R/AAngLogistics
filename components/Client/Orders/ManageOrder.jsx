import React, { useState, useMemo, useEffect } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    Alert,
    Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CustomHeader from "../CustomHeader";
import { useOrderStore } from "../../../store/useOrderStore"
import ConfirmationModal from "../../ConfrimationModal/ConfirmationModal";
import ClientUtilities from "../../../utils/ClientUtilities";
import SessionManager from "../../../lib/SessionManager";
const { width } = Dimensions.get('window');

function ManageOrder({ allOrderData, onRefreshData }) {
    const [activeTab, setActiveTab] = useState('Draft');
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        status: 'confirm',
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: () => setModalVisible(false),
        onRetry: null
    });
    const [selectedActionOrder, setSelectedActionOrder] = useState(null)

    // Zustand store
    const {
        setSelectedOrder,
        updateOrderStatus,
        removeOrder,
        canResumeOrder,
        getDraftProgress
    } = useOrderStore();

    // ✅ Enhanced filtering logic
    const filteredOrders = useMemo(() => {
        if (!allOrderData || allOrderData.length === 0) return [];

        switch (activeTab) {
            case 'Draft':
                return allOrderData.orders.filter(order => order.status === 'draft');
            case 'Pending':
                return allOrderData.orders.filter(order => order.status === 'pending' || order.status === 'broadcast');
            case 'Ongoing':
                const ongoingStatuses = ['confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup', 'picked_up', 'in_transit', 'arrived_dropoff'];
                return allOrderData.orders.filter(order => ongoingStatuses.includes(order.status));
            case 'Completed':
                return allOrderData.orders.filter(order => ['delivered', 'cancelled', 'failed', 'returned'].includes(order.status));
            default:
                return [];
        }
    }, [activeTab, allOrderData]);

    // ✅ Handle pull-to-refresh
    const handleRefresh = async () => {
        if (onRefreshData) {
            setRefreshing(true);
            try {
                await onRefreshData();
            } finally {
                setRefreshing(false);
            }
        }
    };

    // ✅ Action handlers
    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        router.push('/(protected)/client/orders/view');
    };

    const handleResumeOrder = (order) => {
        const progress = getDraftProgress(order._id);
        const currentStep = progress?.step || 1;

        setSelectedOrder(order);
        router.push({
            pathname: '/(protected)/client/orders/create',
            params: {
                resumeOrderId: order._id,
                step: currentStep.toString()
            }
        });
    };

    // delete order operations
    const handleDeleteOrder = (order) => {
        setSelectedActionOrder(order);
        setModalConfig({
            status: 'confirm',
            title: 'Delete Order',
            message: `Are you sure you want to delete order ${order.orderRef}?`,
            onConfirm: () => confirmDelete(order._id),
            onCancel: () => setModalVisible(false)
        });
        setModalVisible(true);
    };
    const confirmDelete = async (orderId) => {
        setModalConfig(prev => ({
            ...prev,
            status: 'loading',
            message: 'Deleting order...'
        }));

        try {
            const { order } = await ClientUtilities.DeleteOrder({ orderId });

            // update the SessionManager with the deleted order
            await SessionManager.updateAllOrderData(order);

            setModalConfig(prev => ({
                ...prev,
                status: 'success',
                message: 'Order deleted successfully'
            }));

            // Refresh data after delay
            setTimeout(async () => {
                setModalVisible(false);
                if (onRefreshData) await onRefreshData();
            }, 700);
        } catch (error) {
            setModalConfig(prev => ({
                ...prev,
                status: 'error',
                message: 'Failed to delete order. Please try again.',
                onRetry: () => confirmDelete(orderId)
            }));
        }
    };

    // cancel order operations
    const handleCancelOrder = (order) => {
        setSelectedActionOrder(order);
        setModalConfig({
            status: 'confirm',
            title: 'Cancel Order',
            message: `Are you sure you want to cancel order ${order.orderRef}?`,
            onConfirm: () => confirmCancel(order),
            onCancel: () => setModalVisible(false)
        });
        setModalVisible(true);
    };
    const confirmCancel = async (order) => {
        setModalConfig(prev => ({
            ...prev,
            status: 'loading',
            message: 'Cancelling order...'
        }));

        try {
            // await cancelOrder(order._id);
            updateOrderStatus(order._id, 'cancelled');

            setModalConfig(prev => ({
                ...prev,
                status: 'success',
                message: 'Order cancelled successfully'
            }));

            setTimeout(async () => {
                setModalVisible(false);
                if (onRefreshData) await onRefreshData();
            }, 1500);
        } catch (error) {
            setModalConfig(prev => ({
                ...prev,
                status: 'error',
                message: 'Failed to cancel order. Please try again.',
                onRetry: () => confirmCancel(order)
            }));
        }
    };

    // retry order operations
    const handleRetryOrder = (order) => {
        setSelectedActionOrder(order);
        setModalConfig({
            status: 'confirm',
            title: 'Retry Order',
            message: 'Create a new order with the same details?',
            onConfirm: () => handleReorder(order),
            onCancel: () => setModalVisible(false)
        });
        setModalVisible(true);
    };
    const handleReorder = (order) => {
        setSelectedOrder(order);
        router.push({
            pathname: '/(protected)/client/orders/create',
            params: { reorderFrom: order._id }
        });
    };


    // ✅ Get action icons based on order status and category
    const getActionIcons = (order) => {
        const actions = [];

        // View action (always available)
        actions.push({
            icon: 'eye-sharp',
            color: '#3B82F6',
            onPress: () => handleViewOrder(order),
            label: 'View'
        });

        // Status-specific actions
        switch (order.status) {
            case 'draft':
                if (canResumeOrder(order)) {
                    actions.push({
                        icon: 'reload-circle-sharp',
                        color: '#059669',
                        onPress: () => handleResumeOrder(order),
                        label: 'Resume'
                    });
                }
                actions.push({
                    icon: 'trash-bin-sharp',
                    color: '#EF4444',
                    onPress: () => handleDeleteOrder(order),
                    label: 'Delete'
                });
                break;

            case 'pending':
            case 'broadcast':
                actions.push({
                    icon: 'close-circle-outline',
                    color: '#F59E0B',
                    onPress: () => handleCancelOrder(order),
                    label: 'Cancel'
                });
                break;

            case 'confirmed':
            case 'assigned':
            case 'picked_up':
            case 'in_transit':
                actions.push({
                    icon: 'location-outline',
                    color: '#8B5CF6',
                    onPress: () => handleTrackOrder(order),
                    label: 'Track'
                });
                break;

            case 'delivered':
                actions.push({
                    icon: 'chatbubble-outline',
                    color: '#06B6D4',
                    onPress: () => handleRateOrder(order),
                    label: 'Rate'
                });
                actions.push({
                    icon: 'copy-outline',
                    color: '#10B981',
                    onPress: () => handleReorder(order),
                    label: 'Reorder'
                });
                break;

            case 'cancelled':
            case 'failed':
                actions.push({
                    icon: 'refresh-outline',
                    color: '#F59E0B',
                    onPress: () => handleRetryOrder(order),
                    label: 'Retry'
                });
                break;
        }

        return actions.slice(0, 3); // Limit to 3 actions for UI cleanliness
    };

    // Additional action handlers
    const handleTrackOrder = (order) => {
        setSelectedOrder(order);
        router.push('/(protected)/client/orders/track');
    };
    const handleRateOrder = (order) => {
        setSelectedOrder(order);
        router.push('/(protected)/client/orders/rate');
    };

    // ✅ Enhanced order card with action icons
    const renderOrderCard = (order) => {
        const actions = getActionIcons(order);
        const isHighValue = order.flags?.isHighValue || order.pricing?.totalAmount > 50000;
        const isUrgent = order.flags?.isUrgent || order.priority === 'urgent';

        return (
            <View key={order._id || order.orderRef} style={[
                styles.orderCard,
                isHighValue && styles.highValueCard,
                isUrgent && styles.urgentCard
            ]}>
                {/* Priority indicators */}
                {isUrgent && (
                    <View style={styles.urgentBadge}>
                        <Ionicons name="flash" size={12} color="#FFF" />
                        <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                )}

                <View style={styles.orderHeader}>
                    <View style={styles.orderTitleRow}>
                        <Text style={styles.orderRef}>{order.orderRef}</Text>
                        {isHighValue && (
                            <Ionicons name="diamond" size={16} color="#F59E0B" style={styles.highValueIcon} />
                        )}
                    </View>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(order.status)]}>
                        <Text style={[styles.statusText, getStatusTextStyle(order.status)]}>
                            {formatStatus(order.status)}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <View style={styles.locationRow}>
                        <Ionicons name="radio-button-on" size={16} color="#10B981" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {order.pickup?.landmark || order.pickup?.address || 'Pickup location TBD'}
                        </Text>
                    </View>

                    <View style={styles.routeLine} />

                    <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color="#EF4444" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {order.dropoff?.landmark || order.dropoff?.address || 'Destination TBD'}
                        </Text>
                    </View>

                    <View style={styles.packageRow}>
                        <View style={styles.packageInfo}>
                            <Ionicons
                                name={getPackageIcon(order.package?.category)}
                                size={16}
                                color="#6B7280"
                            />
                            <Text style={styles.packageText}>
                                {order.package?.description || `${order.package?.category} package`}
                            </Text>
                        </View>

                        <View style={styles.packageMeta}>
                            {order.package?.isFragile && (
                                <View style={styles.fragileTag}>
                                    <Ionicons name="warning" size={12} color="#F59E0B" />
                                </View>
                            )}
                            <Text style={styles.orderDate}>
                                {formatDate(order.createdAt)}
                            </Text>
                        </View>
                    </View>

                    {/* Draft progress indicator */}
                    {order.status === 'draft' && order.metadata?.draftProgress && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${(order.metadata.draftProgress.step / 7) * 100}%` }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                Step {order.metadata.draftProgress.step} of 7
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.orderFooter}>
                    <Text style={styles.orderAmount}>
                        ₦{order.pricing?.totalAmount?.toLocaleString() || '0'}
                    </Text>

                    <View style={styles.actionButtons}>
                        {actions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.actionButton, { backgroundColor: `${action.color}15` }]}
                                onPress={action.onPress}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={action.icon}
                                    size={20}
                                    color={action.color}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    // ✅ Helper functions
    const formatStatus = (status) => {
        const statusMap = {
            'draft': 'DRAFT',
            'pending': 'PENDING',
            'broadcast': 'FINDING DRIVER',
            'assigned': 'ASSIGNED',
            'confirmed': 'CONFIRMED',
            'en_route_pickup': 'EN ROUTE',
            'arrived_pickup': 'ARRIVED',
            'picked_up': 'PICKED UP',
            'in_transit': 'IN TRANSIT',
            'arrived_dropoff': 'ARRIVED',
            'delivered': 'DELIVERED',
            'cancelled': 'CANCELLED',
            'failed': 'FAILED',
            'returned': 'RETURNED'
        };
        return statusMap[status] || status.toUpperCase();
    };

    const getPackageIcon = (category) => {
        const iconMap = {
            'document': 'document-text-outline',
            'parcel': 'cube-outline',
            'food': 'restaurant-outline',
            'fragile': 'alert-circle-outline',
            'electronics': 'phone-portrait-outline',
            'clothing': 'shirt-outline',
            'medicine': 'medical-outline',
            'furniture': 'home-outline',
            'jewelry': 'diamond-outline',
            'gifts': 'gift-outline',
            'books': 'library-outline',
            'others': 'ellipsis-horizontal-circle-outline'
        };
        return iconMap[category] || 'cube-outline';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // ✅ Status styling
    const getStatusBadgeStyle = (status) => {
        const styleMap = {
            'draft': { backgroundColor: '#FEF3C7' },
            'pending': { backgroundColor: '#DBEAFE' },
            'broadcast': { backgroundColor: '#E0F2FE' },
            'assigned': { backgroundColor: '#D1FAE5' },
            'confirmed': { backgroundColor: '#D1FAE5' },
            'en_route_pickup': { backgroundColor: '#DDD6FE' },
            'arrived_pickup': { backgroundColor: '#DDD6FE' },
            'picked_up': { backgroundColor: '#A7F3D0' },
            'in_transit': { backgroundColor: '#A7F3D0' },
            'arrived_dropoff': { backgroundColor: '#BFDBFE' },
            'delivered': { backgroundColor: '#E0E7FF' },
            'cancelled': { backgroundColor: '#FED7D7' },
            'failed': { backgroundColor: '#FED7D7' },
            'returned': { backgroundColor: '#FECACA' }
        };
        return styleMap[status] || { backgroundColor: '#F3F4F6' };
    };

    const getStatusTextStyle = (status) => {
        const styleMap = {
            'draft': { color: '#D97706' },
            'pending': { color: '#2563EB' },
            'broadcast': { color: '#0891B2' },
            'assigned': { color: '#059669' },
            'confirmed': { color: '#059669' },
            'en_route_pickup': { color: '#7C3AED' },
            'arrived_pickup': { color: '#7C3AED' },
            'picked_up': { color: '#047857' },
            'in_transit': { color: '#047857' },
            'arrived_dropoff': { color: '#1D4ED8' },
            'delivered': { color: '#7C3AED' },
            'cancelled': { color: '#DC2626' },
            'failed': { color: '#DC2626' },
            'returned': { color: '#B91C1C' }
        };
        return styleMap[status] || { color: '#6B7280' };
    };

    return (
        <>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                {/* Header */}
                <CustomHeader
                    title="Manage Orders"
                    onBackPress={() => router.back()}
                />

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    {['Draft', 'Pending', 'Ongoing', 'Completed'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[
                                styles.tab,
                                activeTab === tab && styles.activeTab
                            ]}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab && styles.activeTabText
                            ]}>
                                {tab}
                            </Text>
                            {activeTab === tab && <View style={styles.tabIndicator} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#3B82F6']}
                        />
                    }
                >
                    <View style={styles.ordersContainer}>
                        {filteredOrders.length > 0 ? (
                            <>
                                <Text style={styles.sectionTitle}>
                                    {activeTab} Orders ({filteredOrders.length})
                                </Text>
                                {filteredOrders.map(renderOrderCard)}
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={64}
                                    color="#D1D5DB"
                                />
                                <Text style={styles.emptyStateTitle}>
                                    No {activeTab.toLowerCase()} orders
                                </Text>
                                <Text style={styles.emptyStateMessage}>
                                    {activeTab === 'Draft'
                                        ? "You don't have any draft orders yet. Create a new order to get started."
                                        : `You don't have any ${activeTab.toLowerCase()} orders at the moment.`
                                    }
                                </Text>

                                {activeTab === 'Draft' && (
                                    <TouchableOpacity
                                        style={styles.createOrderButton}
                                        onPress={() => router.replace('/(protected)/client/orders/create')}
                                    >
                                        <Text style={styles.createOrderButtonText}>Create New Order</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
                <ConfirmationModal
                    visible={modalVisible}
                    status={modalConfig.status}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    onConfirm={modalConfig.onConfirm}
                    onCancel={modalConfig.onCancel}
                    onRetry={modalConfig.onRetry}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        position: 'relative',
    },
    tabText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsBold'
    },
    activeTabText: {
        color: '#3B82F6',
        fontFamily: 'PoppinsBold'
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#3B82F6',
    },
    content: {
        flex: 1,
    },
    ordersContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#111827',
        marginBottom: 16,
        fontFamily: 'PoppinsBold',
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    highValueCard: {
        borderColor: '#F59E0B',
        borderWidth: 2,
    },
    urgentCard: {
        borderColor: '#EF4444',
        borderWidth: 2,
    },
    urgentBadge: {
        position: 'absolute',
        top: -1,
        right: -1,
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderTopRightRadius: 16,
        zIndex: 1,
    },
    urgentText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'PoppinsBold',
        marginLeft: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    orderRef: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsBold',
    },
    highValueIcon: {
        marginLeft: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 11,
        fontFamily: 'PoppinsBold',
    },
    orderDetails: {
        marginBottom: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#374151',
        fontFamily: 'PoppinsRegular',
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#D1D5DB',
        marginLeft: 7,
        marginVertical: 4,
    },
    packageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    packageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    packageText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        flex: 1,
    },
    packageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fragileTag: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 4,
        marginRight: 8,
    },
    orderDate: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'PoppinsRegular',
    },
    progressContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 2,
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 11,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderAmount: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsBold',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyStateTitle: {
        fontSize: 20,
        color: '#374151',
        fontFamily: 'PoppinsBold',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateMessage: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    createOrderButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    createOrderButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'PoppinsBold',
    },
});

export default ManageOrder;