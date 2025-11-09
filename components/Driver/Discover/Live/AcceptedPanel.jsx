// components/Driver/Delivery/Panels/AcceptedPanel.jsx
import React, {useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Platform
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {toast} from 'sonner-native';
import useLogisticStore from '../../../../store/Driver/useLogisticStore';
import {navigate} from "expo-router/build/global-state/routing";


function AcceptedPanel({ onNavigateToChat }) {
    const {
        activeOrder,
        navigationData,
        startNavigation,
        sendAutomatedUpdate,
        cancelDelivery
    } = useLogisticStore();

    const [showCancelModal, setShowCancelModal] = useState(false);

    if (!activeOrder) return null;

    const pickupLocation = activeOrder.location.pickUp;
    const contact = pickupLocation.contactPerson;

    // Handle phone call
    const handleCall = () => {
        if (!contact?.phone) {
            toast.error('No contact number available');
            return;
        }

        const phoneUrl = `tel:${contact.phone}`;
        Linking.canOpenURL(phoneUrl).then((supported) => {
            if (supported) {
                Linking.openURL(phoneUrl);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
                toast.error('Cannot make phone call');
            }
        });
    };

    // Handle WhatsApp
    const handleWhatsApp = () => {
        // navigate to chat tab
        if (onNavigateToChat) {
            onNavigateToChat();
        }
        else {
            toast.error('Chat is Unavailable');
        }
    };

    // Handle navigation start
    const handleStartNavigation = () => {
        startNavigation('pickup');
        sendAutomatedUpdate('on_way_to_pickup');
    };

    // Handle cancel
    const handleCancelRequest = () => {
        setShowCancelModal(true);
        toast.info('Are you sure?');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        /*
         * TODO
         * we set up an elegant modal for confirmation
         * -- we present several checkboxes of reasons for cancellation
         * we include a section for extra information
         * highlight the negative rank it can cause for the driver profile upon investigation
         * he accepts to cancel,
         * we clear his useLogistics store -- hit the BE, revert back on the accepted order,
         * -- send a notification to the client driver
         * update the session manager, display a toast
         *  we route him to the dashboard
         *
        */

    };

    return (
        <View style={styles.container}>
            {/* Handle Bar */}
            <View style={styles.handleBar}/>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="cube" size={24} color="#10B981"/>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}> Heading to Pickup</Text>
                        <Text style={{color: '#8B5CF6', fontFamily: 'PoppinsSemiBold'}}>
                            {activeOrder.orderRef}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Navigate to collect the package
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Pickup Location Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location" size={20} color="#10B981"/>
                        <Text style={styles.cardTitle}>Pickup Location</Text>
                    </View>

                    <Text style={styles.address}>{pickupLocation.address}</Text>

                    {pickupLocation.landmark && (
                        <View style={styles.landmarkRow}>
                            <Ionicons name="flag" size={14} color="#6B7280"/>
                            <Text style={styles.landmark}>{pickupLocation.landmark}</Text>
                        </View>
                    )}

                    {pickupLocation.instructions && (
                        <View style={styles.instructionsBox}>
                            <Ionicons name="information-circle" size={16} color="#F59E0B"/>
                            <Text style={styles.instructions}>
                                {pickupLocation.instructions}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Contact Person Card */}
                {contact && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="person" size={20} color="#6366F1"/>
                            <Text style={styles.cardTitle}>Contact Person</Text>
                        </View>

                        <View style={styles.contactRow}>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{contact.name}</Text>
                                <Text style={styles.contactPhone}>{contact.phone}</Text>
                            </View>

                            <View style={styles.contactActions}>
                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={handleCall}
                                >
                                    <Ionicons name="call" size={20} color="#10B981"/>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={handleWhatsApp}
                                >
                                    <Ionicons name="logo-whatsapp" size={20} color="#25D366"/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Package Summary */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="cube-outline" size={20} color="#8B5CF6"/>
                        <Text style={styles.cardTitle}>Package Details</Text>
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
                                {activeOrder.package?.weight?.value || 'N/A'} {activeOrder.package?.weight?.unit || 'kg'}
                            </Text>
                        </View>

                        {activeOrder.package?.isFragile && (
                            <View style={[styles.packageItem, styles.fragileItem]}>
                                <Ionicons name="warning" size={16} color="#F59E0B"/>
                                <Text style={styles.fragileText}>Fragile</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {!navigationData.isNavigating && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleStartNavigation}
                        >
                            <Ionicons name="navigate" size={20} color="#fff"/>
                            <Text style={styles.primaryButtonText}>Start Navigation</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelRequest}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#EF4444"/>
                        <Text style={styles.cancelButtonText}>Cancel Delivery</Text>
                    </TouchableOpacity>
                </View>

                {/* Safety Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>📋 Pickup Checklist</Text>
                    <View style={styles.tipsList}>
                        <Text style={styles.tipItem}>• Verify package condition before accepting</Text>
                        <Text style={styles.tipItem}>• Check weight matches order details</Text>
                        <Text style={styles.tipItem}>• Take clear photos of the package</Text>
                        <Text style={styles.tipItem}>• Confirm contact person identity</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },

    // Handle Bar
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16
    },

    // Header
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
        backgroundColor: '#D1FAE5',
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

    // Scroll View
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40
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
        alignItems: 'center'
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
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#FEE2E2'
    },
    cancelButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#EF4444'
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
    }
});

export default AcceptedPanel;