// components/order/SummaryPanel.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

export default function SummaryPanel({
                                         pickup = {},
                                         dropoff = {},
                                         pickupComplete = false,
                                         dropoffComplete = false,
                                     }) {
    const calculateDistance = (pickup, dropoff) => {
        // Placeholder distance calculation
        if (!pickup.coordinates?.coordinates || !dropoff.coordinates?.coordinates) {
            return null;
        }
        // This would normally use a proper distance calculation
        return Math.random() * 10 + 2; // Mock distance 2-12 km
    };

    const estimatedDistance = calculateDistance(pickup, dropoff);
    const estimatedTime = estimatedDistance ? Math.ceil(estimatedDistance * 5) : null; // Mock time estimation

    if (!pickupComplete || !dropoffComplete) {
        return (
            <View style={styles.container}>
                <View style={styles.incompleteContainer}>
                    <Text style={styles.incompleteIcon}>📋</Text>
                    <Text style={styles.incompleteTitle}>Route Summary</Text>
                    <Text style={styles.incompleteMessage}>
                        Complete both pickup and drop-off locations to view route summary and pricing details.
                    </Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressItem}>
                            <View style={[styles.progressDot, pickupComplete && styles.progressDotComplete]}>
                                <Text style={[styles.progressDotText, pickupComplete && styles.progressDotTextComplete]}>
                                    {pickupComplete ? '✓' : '1'}
                                </Text>
                            </View>
                            <Text style={styles.progressLabel}>Pick-up</Text>
                        </View>
                        <View style={[styles.progressConnector, pickupComplete && styles.progressConnectorComplete]} />
                        <View style={styles.progressItem}>
                            <View style={[styles.progressDot, dropoffComplete && styles.progressDotComplete]}>
                                <Text style={[styles.progressDotText, dropoffComplete && styles.progressDotTextComplete]}>
                                    {dropoffComplete ? '✓' : '2'}
                                </Text>
                            </View>
                            <Text style={styles.progressLabel}>Drop-off</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>📋</Text>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Route Summary</Text>
                    <Text style={styles.headerSubtitle}>Review your delivery details</Text>
                </View>
            </View>

            {/* Route Overview Card */}
            <View style={styles.routeCard}>
                <View style={styles.routeHeader}>
                    <Text style={styles.routeTitle}>🚚 Route Overview</Text>
                    <View style={styles.routeStats}>
                        {estimatedDistance && (
                            <View style={styles.routeStat}>
                                <Text style={styles.routeStatValue}>{estimatedDistance.toFixed(1)} km</Text>
                                <Text style={styles.routeStatLabel}>Distance</Text>
                            </View>
                        )}
                        {estimatedTime && (
                            <View style={styles.routeStat}>
                                <Text style={styles.routeStatValue}>{estimatedTime} min</Text>
                                <Text style={styles.routeStatLabel}>Est. Time</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Route Visualization */}
                <View style={styles.routeVisualization}>
                    <View style={styles.routePoint}>
                        <View style={styles.routePointIcon}>
                            <Text>📍</Text>
                        </View>
                        <Text style={styles.routePointLabel}>Pick-up</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                        <View style={styles.routePointIcon}>
                            <Text>🎯</Text>
                        </View>
                        <Text style={styles.routePointLabel}>Drop-off</Text>
                    </View>
                </View>
            </View>

            {/* Pickup Details Card */}
            <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                    <View style={styles.locationIcon}>
                        <Text>📍</Text>
                    </View>
                    <Text style={styles.locationTitle}>Pick-up Location</Text>
                </View>

                <View style={styles.locationContent}>
                    <Text style={styles.locationAddress}>{pickup.address}</Text>

                    {pickup.landmark && (
                        <Text style={styles.locationDetail}>📍 {pickup.landmark}</Text>
                    )}

                    <View style={styles.contactCard}>
                        <Text style={styles.contactName}>👤 {pickup.contactPerson?.name}</Text>
                        <Text style={styles.contactPhone}>📞 {pickup.contactPerson?.phone}</Text>
                    </View>

                    {pickup.building?.name && (
                        <View style={styles.buildingInfo}>
                            <Text style={styles.buildingText}>
                                🏢 {pickup.building.name}
                                {pickup.building.floor && `, Floor ${pickup.building.floor}`}
                                {pickup.building.unit && `, Unit ${pickup.building.unit}`}
                            </Text>
                        </View>
                    )}

                    {pickup.extraInformation && (
                        <View style={styles.extraInfo}>
                            <Text style={styles.extraInfoTitle}>📝 Special Instructions</Text>
                            <Text style={styles.extraInfoText}>{pickup.extraInformation}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Dropoff Details Card */}
            <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                    <View style={styles.locationIcon}>
                        <Text>🎯</Text>
                    </View>
                    <Text style={styles.locationTitle}>Drop-off Location</Text>
                </View>

                <View style={styles.locationContent}>
                    <Text style={styles.locationAddress}>{dropoff.address}</Text>

                    {dropoff.landmark && (
                        <Text style={styles.locationDetail}>🎯 {dropoff.landmark}</Text>
                    )}

                    <View style={styles.contactCard}>
                        <Text style={styles.contactName}>👤 {dropoff.contactPerson?.name}</Text>
                        <Text style={styles.contactPhone}>📞 {dropoff.contactPerson?.phone}</Text>
                        {dropoff.contactPerson?.alternatePhone && (
                            <Text style={styles.contactPhone}>📱 {dropoff.contactPerson.alternatePhone}</Text>
                        )}
                    </View>

                    {dropoff.building?.name && (
                        <View style={styles.buildingInfo}>
                            <Text style={styles.buildingText}>
                                🏢 {dropoff.building.name}
                                {dropoff.building.floor && `, Floor ${dropoff.building.floor}`}
                                {dropoff.building.unit && `, Unit ${dropoff.building.unit}`}
                            </Text>
                        </View>
                    )}

                    {dropoff.locationType && (
                        <View style={styles.locationTypeInfo}>
                            <Text style={styles.locationTypeText}>
                                🏷️ {dropoff.locationType.charAt(0).toUpperCase() + dropoff.locationType.slice(1)} Location
                            </Text>
                        </View>
                    )}

                    {dropoff.extraInformation && (
                        <View style={styles.extraInfo}>
                            <Text style={styles.extraInfoTitle}>📝 Delivery Instructions</Text>
                            <Text style={styles.extraInfoText}>{dropoff.extraInformation}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Pricing Preview Card */}
            <View style={styles.pricingCard}>
                <View style={styles.pricingHeader}>
                    <Text style={styles.pricingTitle}>💰 Pricing Preview</Text>
                    <Text style={styles.pricingSubtitle}>Estimated delivery cost</Text>
                </View>

                <View style={styles.pricingContent}>
                    <View style={styles.pricingRow}>
                        <Text style={styles.pricingLabel}>Base fare</Text>
                        <Text style={styles.pricingValue}>₦500.00</Text>
                    </View>

                    {estimatedDistance && (
                        <View style={styles.pricingRow}>
                            <Text style={styles.pricingLabel}>Distance ({estimatedDistance.toFixed(1)} km)</Text>
                            <Text style={styles.pricingValue}>₦{(estimatedDistance * 50).toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={styles.pricingDivider} />

                    <View style={styles.pricingRow}>
                        <Text style={styles.pricingTotalLabel}>Total Estimate</Text>
                        <Text style={styles.pricingTotalValue}>
                            ₦{(500 + (estimatedDistance ? estimatedDistance * 50 : 0)).toFixed(2)}
                        </Text>
                    </View>

                    <Text style={styles.pricingNote}>
                        * Final price may vary based on actual route and delivery conditions
                    </Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <Pressable style={styles.editButton}>
                    <Text style={styles.editButtonText}>✏️ Edit Locations</Text>
                </Pressable>

                <Pressable style={styles.continueButton}>
                    <Text style={styles.continueButtonText}>Continue to Step 3 →</Text>
                </Pressable>
            </View>

            {/* Bottom Spacer */}
            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    headerIconText: {
        fontSize: 20,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    incompleteContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    incompleteIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    incompleteTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    incompleteMessage: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressItem: {
        alignItems: 'center',
    },
    progressDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    progressDotComplete: {
        backgroundColor: '#10b981',
    },
    progressDotText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    progressDotTextComplete: {
        color: '#ffffff',
    },
    progressLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    progressConnector: {
        width: 40,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 16,
    },
    progressConnectorComplete: {
        backgroundColor: '#10b981',
    },
    routeCard: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    routeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    routeStats: {
        flexDirection: 'row',
        gap: 16,
    },
    routeStat: {
        alignItems: 'center',
    },
    routeStatValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6366f1',
    },
    routeStatLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    routeVisualization: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    routePoint: {
        alignItems: 'center',
    },
    routePointIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    routePointLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
    },
    routeLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#6366f1',
        marginHorizontal: 16,
        borderRadius: 1,
    },
    locationCard: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    locationIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    locationContent: {
        padding: 16,
    },
    locationAddress: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
        marginBottom: 12,
        lineHeight: 24,
    },
    locationDetail: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    contactCard: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
    },
    contactName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
        marginBottom: 4,
    },
    contactPhone: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
    },
    buildingInfo: {
        backgroundColor: '#fef3c7',
        padding: 8,
        borderRadius: 6,
        marginVertical: 6,
    },
    buildingText: {
        fontSize: 12,
        color: '#92400e',
    },
    locationTypeInfo: {
        backgroundColor: '#e0e7ff',
        padding: 8,
        borderRadius: 6,
        marginVertical: 6,
    },
    locationTypeText: {
        fontSize: 12,
        color: '#4338ca',
        fontWeight: '500',
    },
    extraInfo: {
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    extraInfoTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#0369a1',
        marginBottom: 4,
    },
    extraInfoText: {
        fontSize: 14,
        color: '#0369a1',
        lineHeight: 20,
    },
    pricingCard: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    pricingHeader: {
        padding: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    pricingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    pricingSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    pricingContent: {
        padding: 16,
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pricingLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    pricingValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
    },
    pricingDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 12,
    },
    pricingTotalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    pricingTotalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#059669',
    },
    pricingNote: {
        fontSize: 11,
        color: '#64748b',
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    actionButtons: {
        marginHorizontal: 16,
        marginVertical: 16,
        gap: 12,
    },
    editButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    continueButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: '#6366f1',
        alignItems: 'center',
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    bottomSpacer: {
        height: 100,
    },
});