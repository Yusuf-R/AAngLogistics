// components/order/SummaryPanel.jsx - Updated with State & LGA Display
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SummaryPanel({
                                         pickupData,
                                         dropoffData,
                                         pickupComplete,
                                         dropoffComplete,
                                         onSwitchToPickup,
                                         onSwitchToDropoff
                                     }) {
    const safePickupData = pickupData || {};
    const safeDropoffData = dropoffData || {};

    const renderLocationCard = (title, data, isComplete, onEdit, type) => {
        if (!isComplete) {
            return (
                <View style={styles.incompleteCard}>
                    <View style={styles.incompleteHeader}>
                        <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
                        <Text style={styles.incompleteTitle}>{title}</Text>
                    </View>
                    <Text style={styles.incompleteMessage}>
                        Please complete the required information
                    </Text>
                    <Pressable style={styles.completeButton} onPress={onEdit}>
                        <Text style={styles.completeButtonText}>Complete {title}</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <View style={styles.locationCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Ionicons
                            name={type === 'pickup' ? 'arrow-up-circle' : 'arrow-down-circle'}
                            size={20}
                            color={type === 'pickup' ? '#10b981' : '#ef4444'}
                        />
                        <Text style={styles.cardTitle}>{title}</Text>
                    </View>
                    <Pressable onPress={onEdit} style={styles.editButton}>
                        <Ionicons name="pencil" size={16} color="#6b7280" />
                    </Pressable>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.infoSection}>
                        <Ionicons name="location" size={16} color="#6b7280" />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {data?.address || 'No address provided'}
                        </Text>
                    </View>

                    {/* State & LGA Display - Only for Pickup */}
                    {type === 'pickup' && (data?.state || data?.lga) && (
                        <View style={styles.stateSection}>
                            <View style={styles.stateRow}>
                                <View style={styles.stateItem}>
                                    <Ionicons name="map" size={14} color="#3b82f6" />
                                    <Text style={styles.stateLabel}>State:</Text>
                                    <Text style={styles.stateValue}>{data?.state || 'N/A'}</Text>
                                </View>
                                {data?.lga && (
                                    <View style={styles.stateItem}>
                                        <Ionicons name="location-outline" size={14} color="#8b5cf6" />
                                        <Text style={styles.stateLabel}>LGA:</Text>
                                        <Text style={styles.stateValue}>{data.lga}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    <View style={styles.contactSection}>
                        <Text style={styles.contactName}>{data?.contactPerson?.name || 'No contact name'}</Text>
                        <Text style={styles.contactPhone}>{data?.contactPerson?.phone || 'No phone number'}</Text>
                    </View>

                    {data?.landmark && (
                        <View style={styles.detailRow}>
                            <Ionicons name="flag" size={14} color="#8b5cf6" />
                            <Text style={styles.detailText}>{data.landmark}</Text>
                        </View>
                    )}

                    {data?.building?.name && (
                        <View style={styles.detailRow}>
                            <Ionicons name="business" size={14} color="#f59e0b" />
                            <Text style={styles.detailText}>
                                {data.building.name}
                                {data.building.floor && `, Floor ${data.building.floor}`}
                                {data.building.unit && `, Unit ${data.building.unit}`}
                            </Text>
                        </View>
                    )}

                    {data?.extraInformation && (
                        <View style={styles.notesSection}>
                            <Ionicons name="document-text" size={14} color="#6b7280" />
                            <Text style={styles.notesText}>{data.extraInformation}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderStatusHeader = () => {
        if (pickupComplete && dropoffComplete) {
            return (
                <View style={styles.statusHeader}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    <Text style={styles.statusTitle}>Ready for Delivery</Text>
                    <Text style={styles.statusSubtitle}>Both locations are complete</Text>
                </View>
            );
        }

        return (
            <View style={styles.statusHeader}>
                <Ionicons name="information-circle" size={24} color="#f59e0b" />
                <Text style={styles.statusTitle}>Setup Incomplete</Text>
                <Text style={styles.statusSubtitle}>
                    {pickupComplete ? 'Dropoff pending' : dropoffComplete ? 'Pickup pending' : 'Both locations pending'}
                </Text>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {renderStatusHeader()}

            {renderLocationCard(
                'Pickup Location',
                safePickupData,
                pickupComplete,
                onSwitchToPickup,
                'pickup'
            )}

            {renderLocationCard(
                'Dropoff Location',
                safeDropoffData,
                dropoffComplete,
                onSwitchToDropoff,
                'dropoff'
            )}

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Need to make changes? Tap the edit icon on any section or use the tabs above.
                </Text>
            </View>

            {/* Space */}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 16,
    },

    // Status Header
    statusHeader: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statusTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#1f2937',
        marginTop: 8,
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        textAlign: 'center',
    },

    // Location Cards
    locationCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#1f2937',
        marginLeft: 8,
    },
    editButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#f9fafb',
    },

    // Card Content
    cardContent: {
        gap: 12,
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },

    // State & LGA Section (NEW)
    stateSection: {
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    stateRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    stateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: '45%',
    },
    stateLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#1e40af',
        marginLeft: 4,
        marginRight: 4,
    },
    stateValue: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#1e3a8a',
    },

    contactSection: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
    },
    contactName: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    contactPhone: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#059669',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
    },
    detailText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginLeft: 6,
        flex: 1,
    },
    notesSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 8,
    },
    notesText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#4b5563',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },

    // Incomplete Card
    incompleteCard: {
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fcd34d',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    },
    incompleteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    incompleteTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#92400e',
        marginLeft: 8,
    },
    incompleteMessage: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#b45309',
        marginBottom: 16,
    },
    completeButton: {
        backgroundColor: '#3b82f6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#ffffff',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
    },

    // Footer
    footer: {
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    footerText: {
        fontSize: 14,
        color: '#1e40af',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
        lineHeight: 20,
    },
});