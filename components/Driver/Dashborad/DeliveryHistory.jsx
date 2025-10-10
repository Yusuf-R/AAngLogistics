import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DeliveryHistory = ({ userData }) => {
    const router = useRouter();

    // Mock data - you'll replace this with actual delivery history from userData
    const recentDeliveries = userData?.deliveryHistory?.recentDeliveries || [];
    const hasDeliveries = recentDeliveries.length > 0;

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

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Deliveries</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.deliveriesContainer}>
                {recentDeliveries.slice(0, 5).map((delivery, index) => (
                    <View key={delivery.orderId || index} style={styles.deliveryItem}>
                        <View style={styles.deliveryIcon}>
                            <Ionicons name="location" size={16} color="#3B82F6" />
                        </View>

                        <View style={styles.deliveryContent}>
                            <Text style={styles.deliveryLocation}>
                                {delivery.pickupLocation || 'Pickup Location'} → {delivery.dropoffLocation || 'Dropoff Location'}
                            </Text>
                            <View style={styles.deliveryMeta}>
                                <Text style={styles.deliveryEarnings}>
                                    ₦{(delivery.earnings || 0).toLocaleString()}
                                </Text>
                                <Text style={styles.deliveryDate}>
                                    {delivery.completedAt ? formatDate(delivery.completedAt) : 'Recently'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.ratingContainer}>
                            {delivery.rating ? (
                                <View style={styles.rating}>
                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                    <Text style={styles.ratingText}>{delivery.rating}</Text>
                                </View>
                            ) : (
                                <Text style={styles.noRating}>No rating</Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

// Helper function to format dates
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    deliveryEarnings: {
        fontSize: 14,
        fontWeight: '700',
        color: '#059669',
        fontFamily: 'PoppinsBold',
    },
    deliveryDate: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
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
});

export default DeliveryHistory;