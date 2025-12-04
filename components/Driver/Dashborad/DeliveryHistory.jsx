import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {useRecentDeliveries} from "../../../hooks/useDriverDashboard";
import Loading from "../../Loading/Loading";

const DeliveryHistory = ({ userData }) => {
    const router = useRouter();
    const { data: deliveries, isLoading, isError } = useRecentDeliveries(userData?.id);

    // ✅ Loading state
    if (isLoading) {
        return <Loading />;
    }

    if (isError) {
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Deliveries</Text>
                </View>

                <View style={styles.deliveriesContainer}>
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                        <Text style={styles.errorText}>Failed to load delivery history</Text>
                    </View>
                </View>
            </View>
        );
    }

    // ✅ Data already limited to 7 and sorted by backend
    const hasDeliveries = deliveries && deliveries.length > 0;

    // If no delivery data exists, show empty state
    if (!hasDeliveries) {
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Delivery History</Text>
                </View>

                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                    </View>
                    <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
                    <Text style={styles.emptyDescription}>
                        Start accepting orders to build your delivery history and track your earnings
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => router.push('/driver/discover')}
                    >
                        <Text style={styles.emptyButtonText}>Find Deliveries</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const formatCurrency = (amount) => `₦${(amount || 0).toLocaleString()}`;
    const formatDistance = (km) => `${(km || 0).toFixed(2)} km`;
    const formatDuration = (minutes) => {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };
    const getStatusColor = (status) => {
        const colors = {
            delivered: '#4CAF50',
            cancelled: '#F44336',
            'en_route_pickup': '#FF9800',
            'en_route_dropoff': '#2196F3',
            'picked_up': '#9C27B0'
        };
        return colors[status] || '#9E9E9E';
    };
    const getStatusIcon = (status) => {
        const icons = {
            delivered: 'checkmark-circle',
            cancelled: 'close-circle',
            'en_route_pickup': 'arrow-forward',
            'en_route_dropoff': 'rocket',
            'picked_up': 'cube'
        };
        return icons[status] || 'ellipse';
    };
    const getCategoryIcon = (category) => {
        const icons = {
            laptop: 'laptop',
            document: 'document-text',
            food: 'fast-food',
            electronics: 'hardware-chip',
            clothing: 'shirt',
            furniture: 'cube',
            medicine: 'medical',
            gift: 'gift',
            other: 'cube-outline'
        };
        return icons[category] || 'cube-outline';
    };
    const extractLocation = (address) => {
        if (!address) return 'Unknown';
        const parts = address.split(',');
        return parts[0].trim();
    };

    return (
        <>
            <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Deliveries</Text>
                <TouchableOpacity onPress={() => router.push('/driver/account/analytics/deliveries')}>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.deliveriesSection}>
                {deliveries.map((delivery, index) => (
                    <TouchableOpacity
                        key={delivery.id}
                        style={styles.deliveryCard}
                        activeOpacity={0.7}
                    >
                        {/* Header */}
                        <View style={styles.deliveryHeader}>
                            <View style={styles.deliveryStatus}>
                                <Ionicons
                                    name={getStatusIcon(delivery.status)}
                                    size={20}
                                    color={getStatusColor(delivery.status)}
                                />
                                <Text style={styles.deliveryRef}>{delivery.orderRef}</Text>
                            </View>
                            <Text style={styles.deliveryEarnings}>{formatCurrency(delivery.earnings)}</Text>
                        </View>

                        {/* Package Info */}
                        <View style={styles.packageInfo}>
                            <Ionicons
                                name={getCategoryIcon(delivery.packageCategory)}
                                size={18}
                                color="#666"
                            />
                            <Text style={styles.packageText} numberOfLines={1}>
                                {delivery.packageDescription || delivery.packageCategory}
                            </Text>
                        </View>

                        {/* Route */}
                        <View style={styles.routeContainer}>
                            <View style={styles.routePoint}>
                                <Ionicons name="ellipse" size={10} color="#4CAF50"/>
                                <Text style={styles.routeText} numberOfLines={1}>
                                    {extractLocation(delivery.pickupLocation.address)}
                                </Text>
                            </View>
                            <View style={styles.routeLine}/>
                            <View style={styles.routePoint}>
                                <Ionicons name="location" size={10} color="#F44336"/>
                                <Text style={styles.routeText} numberOfLines={1}>
                                    {extractLocation(delivery.dropoffLocation.address)}
                                </Text>
                            </View>
                        </View>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="speedometer-outline" size={14} color="#999"/>
                                <Text style={styles.statText}>{formatDistance(delivery.distance)}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="time-outline" size={14} color="#999"/>
                                <Text style={styles.statText}>{formatDuration(delivery.duration)}</Text>
                            </View>
                            {delivery.rating && (
                                <View style={styles.statItem}>
                                    <Ionicons name="star" size={14} color="#FFC107"/>
                                    <Text style={styles.statText}>{delivery.rating}.0</Text>
                                </View>
                            )}
                        </View>

                        {/* Proof Indicators */}
                        <View style={styles.proofIndicators}>
                            {delivery.hasPickupPhotos && (
                                <View style={styles.proofBadge}>
                                    <Ionicons name="camera" size={12} color="#4CAF50"/>
                                    <Text style={styles.proofText}>Pickup</Text>
                                </View>
                            )}
                            {delivery.hasDeliveryPhotos && (
                                <View style={styles.proofBadge}>
                                    <Ionicons name="camera" size={12} color="#2196F3"/>
                                    <Text style={styles.proofText}>Delivery</Text>
                                </View>
                            )}
                            {delivery.tokenVerified && (
                                <View style={styles.proofBadge}>
                                    <Ionicons name="shield-checkmark" size={12} color="#9C27B0"/>
                                    <Text style={styles.proofText}>Verified</Text>
                                </View>
                            )}
                        </View>

                        {/* Date */}
                        <Text style={styles.deliveryDate}>
                            {new Date(delivery.completedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>

                        {/*/!* View Details Arrow *!/*/}
                        {/*<View style={styles.viewDetailsIndicator}>*/}
                        {/*    <Ionicons name="chevron-forward" size={20} color="#4CAF50"/>*/}
                        {/*</View>*/}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#1F2937',
        fontFamily: 'PoppinsBold',
    },
    seeAllText: {
        fontSize: 14,
        color: '#3B82F6',
        fontFamily: 'PoppinsMedium',
    },
    deliveriesContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        minHeight: 150,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    errorText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
    },
    deliveryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    deliveryIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deliveryContent: {
        flex: 1,
    },
    deliveryLocation: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    deliveryMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        marginLeft: 8,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 10,
        color: '#92400E',
        fontFamily: 'PoppinsMedium',
    },
    noRating: {
        fontSize: 10,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        fontStyle: 'italic',
    },
    emptyState: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'PoppinsBold',
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    emptyButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
    },






    // Deliveries Section
    deliveriesSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    deliveryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        position: 'relative',
    },
    deliveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    deliveryStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deliveryRef: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    deliveryEarnings: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    packageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    packageText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    routeContainer: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeText: {
        fontSize: 13,
        color: '#333',
        flex: 1,
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#E0E0E0',
        marginLeft: 4,
        marginVertical: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#666',
    },
    proofIndicators: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    proofBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    proofText: {
        fontSize: 11,
        color: '#666',
    },
    deliveryDate: {
        fontSize: 11,
        color: '#999',
    },
    viewDetailsIndicator: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10,
    },

    // Load More
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    loadMoreText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4CAF50',
    },

});

export default DeliveryHistory;