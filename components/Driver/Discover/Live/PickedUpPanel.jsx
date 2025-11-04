// components/Driver/Delivery/Panels/PickedUpPanel.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import useLogisticStore from '../../../../store/Driver/useLogisticStore';

function PickedUpPanel() {
    const {
        activeOrder,
        navigationData,
        pickupVerification,
        startNavigation,
        sendAutomatedUpdate,
        reportIssue
    } = useLogisticStore();

    const [showIssueModal, setShowIssueModal] = useState(false);

    if (!activeOrder) return null;

    const dropoffLocation = activeOrder.location.dropOff;
    const recipientContact = dropoffLocation.contactPerson;

    // Handle phone call to recipient
    const handleCallRecipient = () => {
        if (!recipientContact?.phone) {
            toast.error('No recipient contact available');
            return;
        }

        const phoneUrl = `tel:${recipientContact.phone}`;
        Linking.canOpenURL(phoneUrl).then((supported) => {
            if (supported) {
                Linking.openURL(phoneUrl);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
                toast.error('Cannot make phone call');
            }
        });
    };

    // Handle WhatsApp to recipient
    const handleWhatsAppRecipient = () => {
        if (!recipientContact?.phone) {
            toast.error('No recipient contact available');
            return;
        }

        const cleanPhone = recipientContact.phone.replace(/\D/g, '');
        const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;

        Linking.canOpenURL(whatsappUrl).then((supported) => {
            if (supported) {
                Linking.openURL(whatsappUrl);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
                toast.error('WhatsApp not installed');
            }
        });
    };

    // Handle navigation start
    const handleStartNavigation = () => {
        startNavigation('dropoff');
        sendAutomatedUpdate('on_way_to_delivery');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // Handle issue report
    const handleReportIssue = () => {
        setShowIssueModal(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // Get delivery token display
    const getDeliveryToken = () => {
        if (activeOrder.deliveryToken) {
            return activeOrder.deliveryToken;
        }
        return '******'; // Placeholder if token not yet visible
    };

    return (
        <View style={styles.container}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="cube" size={24} color="#8B5CF6" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Heading to Delivery</Text>
                        <Text style={styles.headerSubtitle}>
                            Package collected, en route to recipient
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Pickup Confirmation Banner */}
                <View style={styles.successBanner}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <View style={styles.successInfo}>
                        <Text style={styles.successTitle}>Package Collected</Text>
                        <Text style={styles.successText}>
                            Condition: {pickupVerification.packageCondition === 'good' ? 'Good ✓' :
                            pickupVerification.packageCondition === 'damaged' ? 'Damaged ⚠️' :
                                'Tampered 🚨'}
                        </Text>
                    </View>
                </View>

                {/* Delivery Location Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location" size={20} color="#EF4444" />
                        <Text style={styles.cardTitle}>Delivery Location</Text>
                    </View>

                    <Text style={styles.address}>{dropoffLocation.address}</Text>

                    {dropoffLocation.landmark && (
                        <View style={styles.landmarkRow}>
                            <Ionicons name="flag" size={14} color="#6B7280" />
                            <Text style={styles.landmark}>{dropoffLocation.landmark}</Text>
                        </View>
                    )}

                    {dropoffLocation.instructions && (
                        <View style={styles.instructionsBox}>
                            <Ionicons name="information-circle" size={16} color="#F59E0B" />
                            <Text style={styles.instructions}>
                                {dropoffLocation.instructions}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Recipient Contact Card */}
                {recipientContact && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="person" size={20} color="#6366F1" />
                            <Text style={styles.cardTitle}>Recipient Contact</Text>
                        </View>

                        <View style={styles.contactRow}>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{recipientContact.name}</Text>
                                <Text style={styles.contactPhone}>{recipientContact.phone}</Text>
                            </View>

                            <View style={styles.contactActions}>
                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={handleCallRecipient}
                                >
                                    <Ionicons name="call" size={20} color="#10B981" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={handleWhatsAppRecipient}
                                >
                                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.contactNote}>
                            <Ionicons name="information-circle" size={14} color="#6B7280" />
                            <Text style={styles.contactNoteText}>
                                Notify recipient when you're nearby (5-10 minutes away)
                            </Text>
                        </View>
                    </View>
                )}

                {/* Delivery Token Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="key" size={20} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Delivery Verification Token</Text>
                    </View>

                    <Text style={styles.tokenDescription}>
                        Ask recipient for this 6-digit code to complete delivery
                    </Text>

                    <View style={styles.tokenContainer}>
                        <View style={styles.tokenBox}>
                            <Text style={styles.tokenLabel}>DELIVERY TOKEN</Text>
                            <Text style={styles.tokenValue}>{getDeliveryToken()}</Text>
                        </View>
                        <View style={styles.tokenInfo}>
                            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                            <Text style={styles.tokenInfoText}>
                                This ensures package is delivered to the right person
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Package Details Summary */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="cube-outline" size={20} color="#8B5CF6" />
                        <Text style={styles.cardTitle}>Package Summary</Text>
                    </View>

                    <View style={styles.packageGrid}>
                        <View style={styles.packageItem}>
                            <Text style={styles.packageLabel}>Category</Text>
                            <Text style={styles.packageValue}>
                                {activeOrder.package?.category || 'General'}
                            </Text>
                        </View>

                        <View style={styles.packageItem}>
                            <Text style={styles.packageLabel}>Weight</Text>
                            <Text style={styles.packageValue}>
                                {pickupVerification.weight || activeOrder.package?.weight?.value || 'N/A'} kg
                            </Text>
                        </View>

                        {activeOrder.package?.isFragile && (
                            <View style={[styles.packageItem, styles.fragileItem]}>
                                <Ionicons name="warning" size={16} color="#F59E0B" />
                                <Text style={styles.fragileText}>Handle with Care</Text>
                            </View>
                        )}
                    </View>

                    {pickupVerification.notes && (
                        <View style={styles.notesBox}>
                            <Text style={styles.notesLabel}>Pickup Notes:</Text>
                            <Text style={styles.notesText}>{pickupVerification.notes}</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {!navigationData.isNavigating && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleStartNavigation}
                        >
                            <Ionicons name="navigate" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>Start Navigation to Delivery</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.issueButton}
                        onPress={handleReportIssue}
                    >
                        <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
                        <Text style={styles.issueButtonText}>Report Issue</Text>
                    </TouchableOpacity>
                </View>

                {/* Delivery Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>📋 Delivery Checklist</Text>
                    <View style={styles.tipsList}>
                        <Text style={styles.tipItem}>• Call recipient 5-10 minutes before arrival</Text>
                        <Text style={styles.tipItem}>• Verify delivery token before handing over package</Text>
                        <Text style={styles.tipItem}>• Request recipient signature if required</Text>
                        <Text style={styles.tipItem}>• Take delivery completion photo (optional)</Text>
                        <Text style={styles.tipItem}>• Handle fragile items with extra care</Text>
                    </View>
                </View>

                {/* ETA Display (if navigating) */}
                {navigationData.isNavigating && navigationData.estimatedDuration && (
                    <View style={styles.etaCard}>
                        <Ionicons name="time" size={24} color="#6366F1" />
                        <View style={styles.etaInfo}>
                            <Text style={styles.etaLabel}>Estimated Arrival</Text>
                            <Text style={styles.etaValue}>
                                {navigationData.estimatedDuration} minutes • {navigationData.estimatedDistance} km
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },

    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EDE9FE',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },

    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40
    },

    // Success Banner
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#D1FAE5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#6EE7B7'
    },
    successInfo: {
        flex: 1
    },
    successTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#065F46',
        marginBottom: 2
    },
    successText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#047857'
    },

    // Cards
    card: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },

    // Location
    address: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        lineHeight: 20,
        marginBottom: 8
    },
    landmarkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8
    },
    landmark: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    instructionsBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        marginTop: 4
    },
    instructions: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#92400E',
        lineHeight: 18
    },

    // Contact
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    contactInfo: {
        flex: 1
    },
    contactName: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 2
    },
    contactPhone: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    contactActions: {
        flexDirection: 'row',
        gap: 10
    },
    contactButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    contactNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#F0F9FF',
        padding: 10,
        borderRadius: 8
    },
    contactNoteText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#075985',
        lineHeight: 16
    },

    // Delivery Token
    tokenDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 18
    },
    tokenContainer: {
        gap: 12
    },
    tokenBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FCD34D',
        borderStyle: 'dashed'
    },
    tokenLabel: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold',
        color: '#92400E',
        letterSpacing: 1,
        marginBottom: 8
    },
    tokenValue: {
        fontSize: 32,
        fontFamily: 'PoppinsBold',
        color: '#F59E0B',
        letterSpacing: 4
    },
    tokenInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F0FDF4',
        padding: 10,
        borderRadius: 8
    },
    tokenInfoText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#166534',
        lineHeight: 16
    },

    // Package
    packageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    packageItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8
    },
    packageLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 4
    },
    packageValue: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    fragileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FCD34D'
    },
    fragileText: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#F59E0B'
    },
    notesBox: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginTop: 12
    },
    notesLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
        marginBottom: 4
    },
    notesText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        lineHeight: 18
    },

    // Actions
    actionsContainer: {
        gap: 12,
        marginTop: 8
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        borderRadius: 12
    },
    primaryButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },
    issueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#FED7AA'
    },
    issueButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#F59E0B'
    },

    // Tips
    tipsCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD'
    },
    tipsTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#0C4A6E',
        marginBottom: 10
    },
    tipsList: {
        gap: 6
    },
    tipItem: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#075985',
        lineHeight: 18
    },

    // ETA Card
    etaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#EEF2FF',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#C7D2FE'
    },
    etaInfo: {
        flex: 1
    },
    etaLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#4338CA',
        marginBottom: 2
    },
    etaValue: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#312E81'
    }
});

export default PickedUpPanel;