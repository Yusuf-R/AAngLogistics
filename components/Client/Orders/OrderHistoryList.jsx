import React, { useState } from 'react'; // ✅ Add useState
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'; // ✅ Add ActivityIndicator
import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { getStatusIcon, getStatusColor, formatOrderDate } from '../../../utils/Client/orderHelpers';
import useNavigationStore from "../../../store/Client/useNavigationStore";

const OrderHistoryList = ({
                              orders,
                              selectedStatus,
                              onLoadMore,
                              hasMore,
                              isLoadingMore
                          }) => {
    const { setLastRoute } = useNavigationStore();
    const [loadingOrderId, setLoadingOrderId] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const filteredOrders = selectedStatus === 'all'
        ? orders
        : orders.filter(order => order.status === selectedStatus);

    if (filteredOrders.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📋</Text>
                <Text style={styles.emptyStateTitle}>No Orders Found</Text>
                <Text style={styles.emptyStateText}>
                    {selectedStatus !== 'all'
                        ? 'Try selecting a different status filter'
                        : 'No orders for this period'}
                </Text>
            </View>
        );
    }

    const navigateToOrderDetails = async (orderId) => {
        if (isNavigating) return;

        setIsNavigating(true);
        setLoadingOrderId(orderId);

        try {
            setLastRoute('order-details-from-history', '/client/orders/history');
            await new Promise(resolve => setTimeout(resolve, 300));
            router.push(`/client/profile/analytics/orders/view/${orderId}`);
        } catch (error) {
            console.error('Navigation error:', error);
        } finally {
            setTimeout(() => {
                setLoadingOrderId(null);
                setIsNavigating(false);
            }, 1000);
        }
    };

    return (
        <View style={styles.ordersContainer}>
            {filteredOrders.map(order => {
                const isLoading = loadingOrderId === order._id;

                return (
                    <Pressable
                        key={order._id}
                        style={[
                            styles.orderCard,
                            isLoading && styles.orderCardLoading
                        ]}
                        onPress={() => navigateToOrderDetails(order._id)}
                        disabled={isNavigating}
                    >
                        <View style={styles.orderCardHeader}>
                            <View style={styles.orderIcon}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#3B82F6" />
                                ) : (
                                    <Text style={styles.orderEmoji}>
                                        {getStatusIcon(order.status)}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.orderInfo}>
                                <Text style={styles.orderTitle} numberOfLines={1}>
                                    {order.package.description || 'Package'}
                                </Text>
                                <Text style={styles.orderRef}>{order.orderRef}</Text>
                            </View>
                            <View style={styles.rightSection}>
                                {isLoading ? (
                                    <Text style={styles.loadingText}>Loading...</Text>
                                ) : null}
                                <ChevronRight
                                    size={20}
                                    color={isLoading ? "#9CA3AF80" : "#9CA3AF"}
                                />
                            </View>
                        </View>

                        <View style={[
                            styles.orderDetails,
                            isLoading && styles.orderDetailsLoading
                        ]}>
                            <View style={styles.orderDetailRow}>
                                <Text style={styles.orderDetailLabel}>Status:</Text>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: `${getStatusColor(order.status)}15` }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: getStatusColor(order.status) }
                                    ]}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.orderDetailRow}>
                                <Text style={styles.orderDetailLabel}>Date:</Text>
                                <Text style={styles.orderDetailValue}>
                                    {formatOrderDate(order.deliveryConfirmation.verifiedAt)}
                                </Text>
                            </View>

                            <View style={styles.orderDetailRow}>
                                <Text style={styles.orderDetailLabel}>Amount:</Text>
                                <Text style={styles.orderDetailValue}>
                                    ₦{order.pricing.totalAmount.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                );
            })}

            {hasMore && !isLoadingMore && (
                <Pressable
                    style={styles.loadMoreButton}
                    onPress={onLoadMore}
                    disabled={isNavigating}
                >
                    <Text style={styles.loadMoreText}>Load More</Text>
                </Pressable>
            )}

            {isLoadingMore && (
                <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    ordersContainer: {
        padding: 20,
        gap: 12,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
    },
    orderCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderEmoji: {
        fontSize: 20,
    },
    orderInfo: {
        flex: 1,
    },
    orderTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        marginBottom: 2,
    },
    orderRef: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9CA3AF',
    },
    orderDetails: {
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    orderDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    orderDetailLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
    },
    orderDetailValue: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    loadMoreButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    loadMoreText: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#FFFFFF',
    },
    loadingMoreText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    emptyState: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 40,
        margin: 20,
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
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
    },
    //
    orderCardLoading: {
        opacity: 0.7,
        backgroundColor: '#F9FAFB',
    },

    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    loadingText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#3B82F6',
    },

    orderDetailsLoading: {
        opacity: 0.8,
    },

    // ✅ Update loadingMore for better visual
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
});

export default OrderHistoryList;