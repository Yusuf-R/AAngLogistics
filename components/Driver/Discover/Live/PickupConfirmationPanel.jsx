// components/Driver/Delivery/Panels/ArrivedPickupPanel.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import useLogisticStore from '../../../../store/Driver/useLogisticStore';
import DriverMediaUploader from '../../DriverMediaUploader';

function PickupConfirmationPanel() {
    const {
        activeOrder,
        pickupVerification,
        updatePickupVerification,
        confirmPickup
    } = useLogisticStore();
    console.log({
        activeOrder,
        pickupVerification,

    })

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaData, setMediaData] = useState({
        images: [],
        video: null
    });

    if (!activeOrder) return null;

    const pickupLocation = activeOrder.location.pickUp;

    // Handle package condition selection
    const handleConditionSelect = (condition) => {
        updatePickupVerification('packageCondition', condition);
    };

    // Handle contact verification
    const handleContactVerified = () => {
        updatePickupVerification('contactPersonVerified', !pickupVerification.contactPersonVerified);
    };

    // Callback when media changes
    const handleMediaChange = (images, video) => {
        setMediaData({ images, video });
        // Update verification with media URLs
        updatePickupVerification('photos', images.map(img => img.url));
        updatePickupVerification('videoUrl', video?.url || null);
    };

    // Validate verification data
    const isVerificationComplete = () => {
        return (
            mediaData.images.length >= 2 && // Minimum 2 images required
            pickupVerification.packageCondition !== null &&
            pickupVerification.contactPersonVerified
        );
    };

    // Handle confirm pickup
    const handleConfirmPickup = async () => {
        if (!isVerificationComplete()) {
            if (mediaData.images.length < 2) {
                toast.error('Please upload at least 2 images of the package');
            } else {
                toast.error('Please complete all verification steps');
            }
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare verification data with media
            const verificationData = {
                ...pickupVerification,
                photos: mediaData.images.map(img => ({
                    key: img.key,
                    url: img.url,
                    fileName: img.fileName
                })),
                video: mediaData.video ? {
                    key: mediaData.video.key,
                    url: mediaData.video.url,
                    fileName: mediaData.video.fileName,
                    duration: mediaData.video.duration
                } : null
            };

            const result = await confirmPickup(verificationData);

            if (result.success) {
                toast.success('Pickup confirmed! Heading to delivery');
            } else {
                toast.error(result.message || 'Failed to confirm pickup');
            }
        } catch (error) {
            console.log('Pickup confirmation error:', error);
            toast.error('Failed to confirm pickup');
        } finally {
            setIsSubmitting(false);
        }
    };

    const conditions = [
        { id: 'good', label: 'Good', icon: 'checkmark-circle', color: '#10B981' },
        { id: 'damaged', label: 'Damaged', icon: 'warning', color: '#F59E0B' },
        { id: 'tampered', label: 'Tampered', icon: 'alert-circle', color: '#EF4444' }
    ];

    return (
        <View style={styles.container}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Verify Package</Text>
                        <Text style={styles.headerSubtitle}>
                            Complete all checks before pickup
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Location Confirmation */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location" size={20} color="#10B981" />
                        <Text style={styles.cardTitle}>Pickup Location</Text>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={14} color="#10B981" />
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    </View>
                    <Text style={styles.address}>{pickupLocation.address}</Text>
                </View>

                {/* Package Condition Check */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="cube" size={20} color="#6366F1" />
                        <Text style={styles.cardTitle}>Package Condition</Text>
                        {pickupVerification.packageCondition && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionDescription}>
                        Inspect the package carefully before accepting
                    </Text>

                    <View style={styles.conditionsGrid}>
                        {conditions.map((condition) => (
                            <TouchableOpacity
                                key={condition.id}
                                style={[
                                    styles.conditionButton,
                                    pickupVerification.packageCondition === condition.id && styles.conditionButtonActive,
                                    pickupVerification.packageCondition === condition.id && {
                                        borderColor: condition.color,
                                        backgroundColor: `${condition.color}10`
                                    }
                                ]}
                                onPress={() => handleConditionSelect(condition.id)}
                            >
                                <Ionicons
                                    name={condition.icon}
                                    size={24}
                                    color={pickupVerification.packageCondition === condition.id
                                        ? condition.color
                                        : '#9CA3AF'
                                    }
                                />
                                <Text style={[
                                    styles.conditionLabel,
                                    pickupVerification.packageCondition === condition.id && {
                                        color: condition.color,
                                        fontFamily: 'PoppinsSemiBold'
                                    }
                                ]}>
                                    {condition.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Media Documentation (Images & Video) */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="camera" size={20} color="#8B5CF6" />
                        <Text style={styles.cardTitle}>Package Documentation</Text>
                        {mediaData.images.length >= 3 && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionDescription}>
                        Take clear photos and optional video of the package
                    </Text>

                    <DriverMediaUploader
                        orderId={activeOrder._id}
                        clientId={activeOrder.clientId}
                        onMediaChange={handleMediaChange}
                        minImages={2}
                        maxImages={6}
                        videoOptional={true}
                        videoMaxDuration={20}
                        stage="pickup"
                    />
                </View>

                {/* Weight Verification (Optional) */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="scale" size={20} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Weight Verification (Optional)</Text>
                    </View>

                    <View style={styles.weightRow}>
                        <View style={styles.weightExpected}>
                            <Text style={styles.weightLabel}>Expected</Text>
                            <Text style={styles.weightValue}>
                                {activeOrder.package?.weight?.value || 'N/A'} {activeOrder.package?.weight?.unit || 'kg'}
                            </Text>
                        </View>

                        <TextInput
                            style={styles.weightInput}
                            placeholder="Actual weight"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={pickupVerification.weight || ''}
                            onChangeText={(text) => updatePickupVerification('weight', text)}
                        />
                    </View>
                </View>

                {/* Contact Person Verification */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person" size={20} color="#06B6D4" />
                        <Text style={styles.cardTitle}>Contact Person</Text>
                        {pickupVerification.contactPersonVerified && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981" />
                            </View>
                        )}
                    </View>

                    <View style={styles.contactVerifyRow}>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>
                                {pickupLocation.contactPerson?.name || 'No contact person'}
                            </Text>
                            <Text style={styles.contactPhone}>
                                {pickupLocation.contactPerson?.phone || ''}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.verifyCheckbox,
                                pickupVerification.contactPersonVerified && styles.verifyCheckboxChecked
                            ]}
                            onPress={handleContactVerified}
                        >
                            {pickupVerification.contactPersonVerified && (
                                <Ionicons name="checkmark" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.verifyNote}>
                        ✓ Verify identity matches the contact person
                    </Text>
                </View>

                {/* Additional Notes */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text" size={20} color="#6B7280" />
                        <Text style={styles.cardTitle}>Additional Notes (Optional)</Text>
                    </View>

                    <TextInput
                        style={styles.notesInput}
                        placeholder="Any special observations or issues..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={pickupVerification.notes}
                        onChangeText={(text) => updatePickupVerification('notes', text)}
                    />
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        !isVerificationComplete() && styles.confirmButtonDisabled,
                        isSubmitting && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmPickup}
                    disabled={!isVerificationComplete() || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-done" size={20} color="#fff" />
                            <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Verification Progress */}
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Verification Progress</Text>
                    <View style={styles.progressChecklist}>
                        <View style={styles.progressItem}>
                            <Ionicons
                                name={pickupVerification.packageCondition ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={pickupVerification.packageCondition ? '#10B981' : '#D1D5DB'}
                            />
                            <Text style={styles.progressText}>Package condition checked</Text>
                        </View>
                        <View style={styles.progressItem}>
                            <Ionicons
                                name={mediaData.images.length >= 2 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={mediaData.images.length >= 2 ? '#10B981' : '#D1D5DB'}
                            />
                            <Text style={styles.progressText}>
                                Photos captured ({mediaData.images.length}/2 minimum)
                            </Text>
                        </View>
                        <View style={styles.progressItem}>
                            <Ionicons
                                name={mediaData.video ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={mediaData.video ? '#10B981' : '#D1D5DB'}
                            />
                            <Text style={styles.progressText}>
                                Video evidence (optional {mediaData.video ? '✓' : ''})
                            </Text>
                        </View>
                        <View style={styles.progressItem}>
                            <Ionicons
                                name={pickupVerification.contactPersonVerified ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={pickupVerification.contactPersonVerified ? '#10B981' : '#D1D5DB'}
                            />
                            <Text style={styles.progressText}>Contact person verified</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomSpace}/>


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
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40
    },
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
        color: '#111827',
        flex: 1
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    verifiedText: {
        fontSize: 11,
        fontFamily: 'PoppinsSemiBold',
        color: '#10B981'
    },
    completedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center'
    },
    sectionDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 18
    },
    address: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        lineHeight: 20
    },
    conditionsGrid: {
        flexDirection: 'row',
        gap: 10
    },
    conditionButton: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    conditionButtonActive: {
        borderWidth: 2
    },
    conditionLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center'
    },
    weightRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center'
    },
    weightExpected: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8
    },
    weightLabel: {
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 4
    },
    weightValue: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    weightInput: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    contactVerifyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
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
    verifyCheckbox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center'
    },
    verifyCheckboxChecked: {
        backgroundColor: '#10B981',
        borderColor: '#10B981'
    },
    verifyNote: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        fontStyle: 'italic'
    },
    notesInput: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        minHeight: 80,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 16
    },
    confirmButtonDisabled: {
        opacity: 0.5
    },
    confirmButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },
    progressCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD'
    },
    progressTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#0C4A6E',
        marginBottom: 12
    },
    progressChecklist: {
        gap: 10
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    progressText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#075985'
    },
    bottomSpace: {
        height: 120
    }
});

export default PickupConfirmationPanel;