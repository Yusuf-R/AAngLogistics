// components/Driver/Delivery/Panels/ArrivedDropoffPanel.jsx
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Animated as RNAnimated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import useLogisticStore from '../../../../store/Driver/useLogisticStore';

function ArrivedDropoffPanel() {
    const {
        activeOrder,
        deliveryVerification,
        updateDeliveryVerification,
        verifyDeliveryToken,
        completeDelivery
    } = useLogisticStore();

    const [tokenInput, setTokenInput] = useState('');
    const [isVerifyingToken, setIsVerifyingToken] = useState(false);
    const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);

    // Animation for token verification
    const shakeAnimation = useRef(new RNAnimated.Value(0)).current;

    if (!activeOrder) return null;

    const dropoffLocation = activeOrder.location.dropOff;
    const recipientContact = dropoffLocation.contactPerson;

    // Handle token verification
    const handleVerifyToken = async () => {
        if (tokenInput.length !== 6) {
            toast.error('Token must be 6 digits');
            triggerShakeAnimation();
            return;
        }

        setIsVerifyingToken(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const result = await verifyDeliveryToken(tokenInput);

            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                triggerShakeAnimation();
                setTokenInput('');
            }
        } catch (error) {
            console.log('Token verification error:', error);
            toast.error('Failed to verify token');
            triggerShakeAnimation();
        } finally {
            setIsVerifyingToken(false);
        }
    };

    // Shake animation for wrong token
    const triggerShakeAnimation = () => {
        shakeAnimation.setValue(0);
        RNAnimated.sequence([
            RNAnimated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            RNAnimated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            RNAnimated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            RNAnimated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    // Handle photo capture (optional)
    const handleTakePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                toast.error('Camera permission required');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8
            });

            if (!result.canceled && result.assets[0]) {
                const newPhotos = [...deliveryVerification.photos, result.assets[0].uri];
                updateDeliveryVerification('photos', newPhotos);
                toast.success('Photo added');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            console.log('Photo capture error:', error);
            toast.error('Failed to capture photo');
        }
    };

    // Check if ready to complete
    const isReadyToComplete = () => {
        return (
            deliveryVerification.tokenVerified &&
            deliveryVerification.recipientName.trim().length > 0
        );
    };

    // Handle delivery completion
    const handleCompleteDelivery = async () => {
        if (!isReadyToComplete()) {
            toast.error('Please complete all required fields');
            return;
        }

        setIsCompletingDelivery(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        try {
            const result = await completeDelivery(deliveryVerification);

            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Navigation back to discovery will happen automatically
            } else {
                toast.error(result.message || 'Failed to complete delivery');
            }
        } catch (error) {
            console.log('Delivery completion error:', error);
            toast.error('Failed to complete delivery');
        } finally {
            setIsCompletingDelivery(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-done" size={24} color="#EF4444" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Complete Delivery</Text>
                        <Text style={styles.headerSubtitle}>
                            Verify and hand over package
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
                        <Ionicons name="location" size={20} color="#EF4444" />
                        <Text style={styles.cardTitle}>Delivery Location</Text>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={14} color="#10B981" />
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    </View>
                    <Text style={styles.address}>{dropoffLocation.address}</Text>
                </View>

                {/* Token Verification */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="key" size={20} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Verify Delivery Token</Text>
                        {deliveryVerification.tokenVerified && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981" />
                            </View>
                        )}
                    </View>

                    {!deliveryVerification.tokenVerified ? (
                        <>
                            <Text style={styles.tokenDescription}>
                                Ask the recipient for their 6-digit delivery code
                            </Text>

                            <RNAnimated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                                <View style={styles.tokenInputContainer}>
                                    <TextInput
                                        style={styles.tokenInput}
                                        placeholder="Enter 6-digit code"
                                        placeholderTextColor="#9CA3AF"
                                        value={tokenInput}
                                        onChangeText={setTokenInput}
                                        keyboardType="default"
                                        maxLength={6}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        style={[
                                            styles.verifyButton,
                                            tokenInput.length !== 6 && styles.verifyButtonDisabled
                                        ]}
                                        onPress={handleVerifyToken}
                                        disabled={tokenInput.length !== 6 || isVerifyingToken}
                                    >
                                        {isVerifyingToken ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Ionicons name="checkmark" size={20} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </RNAnimated.View>

                            <View style={styles.tokenHint}>
                                <Ionicons name="information-circle" size={16} color="#6B7280" />
                                <Text style={styles.tokenHintText}>
                                    The token is case-sensitive (e.g., A3X9K2)
                                </Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.tokenVerifiedBox}>
                            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                            <Text style={styles.tokenVerifiedTitle}>Token Verified! ✓</Text>
                            <Text style={styles.tokenVerifiedText}>
                                Package is ready to be handed over
                            </Text>
                        </View>
                    )}
                </View>

                {/* Recipient Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person" size={20} color="#6366F1" />
                        <Text style={styles.cardTitle}>Recipient Details</Text>
                        {deliveryVerification.recipientName.trim().length > 0 && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981" />
                            </View>
                        )}
                    </View>

                    <View style={styles.recipientInfo}>
                        <View style={styles.expectedRecipient}>
                            <Text style={styles.expectedLabel}>Expected Recipient:</Text>
                            <Text style={styles.expectedValue}>
                                {recipientContact?.name || 'Not specified'}
                            </Text>
                        </View>

                        <TextInput
                            style={styles.recipientInput}
                            placeholder="Enter actual recipient name *"
                            placeholderTextColor="#9CA3AF"
                            value={deliveryVerification.recipientName}
                            onChangeText={(text) => updateDeliveryVerification('recipientName', text)}
                            autoCapitalize="words"
                        />

                        <Text style={styles.inputNote}>
                            * Confirm the name matches ID or authorization
                        </Text>
                    </View>
                </View>

                {/* Photo Documentation (Optional) */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="camera" size={20} color="#8B5CF6" />
                        <Text style={styles.cardTitle}>Delivery Photo (Optional)</Text>
                    </View>

                    <Text style={styles.sectionDescription}>
                        Capture proof of delivery handover
                    </Text>

                    {deliveryVerification.photos.length > 0 && (
                        <View style={styles.photosGrid}>
                            {deliveryVerification.photos.map((photo, index) => (
                                <View key={index} style={styles.photoThumb}>
                                    <View style={styles.photoPlaceholder}>
                                        <Ionicons name="image" size={32} color="#9CA3AF" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.photoRemove}
                                        onPress={() => {
                                            const newPhotos = deliveryVerification.photos.filter((_, i) => i !== index);
                                            updateDeliveryVerification('photos', newPhotos);
                                        }}
                                    >
                                        <Ionicons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                        <Ionicons name="camera-outline" size={20} color="#6366F1" />
                        <Text style={styles.photoButtonText}>
                            {deliveryVerification.photos.length > 0 ? 'Add Another Photo' : 'Take Photo'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Additional Notes */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text" size={20} color="#6B7280" />
                        <Text style={styles.cardTitle}>Delivery Notes (Optional)</Text>
                    </View>

                    <TextInput
                        style={styles.notesInput}
                        placeholder="Any observations during delivery..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={deliveryVerification.notes}
                        onChangeText={(text) => updateDeliveryVerification('notes', text)}
                    />
                </View>

                {/* Complete Delivery Button */}
                <TouchableOpacity
                    style={[
                        styles.completeButton,
                        !isReadyToComplete() && styles.completeButtonDisabled,
                        isCompletingDelivery && styles.completeButtonDisabled
                    ]}
                    onPress={handleCompleteDelivery}
                    disabled={!isReadyToComplete() || isCompletingDelivery}
                >
                    {isCompletingDelivery ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
                            <Text style={styles.completeButtonText}>Complete Delivery</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Completion Checklist */}
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Completion Checklist</Text>
                    <View style={styles.progressChecklist}>
                        <View style={styles.progressItem}>
                            <Ionicons
                                name={deliveryVerification.tokenVerified ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={deliveryVerification.tokenVerified ? '#10B981' : '#D1D5DB'}
                            />
                            <Text style={styles.progressText}>Delivery token verified</Text>
                        </View>
                        <View style={styles.progressItem}>
                            <Ionicons
                                name={deliveryVerification.recipientName.trim().length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={deliveryVerification.recipientName.trim().length > 0 ? '#10B981' : '#D1D5DB'}
                            />
                            <Text style={styles.progressText}>Recipient name confirmed</Text>
                        </View>
                        <View style={styles.progressItem}>
                            <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color="#6B7280"
                            />
                            <Text style={[styles.progressText, { color: '#6B7280' }]}>
                                Photo & notes are optional
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Success Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>✨ Final Steps</Text>
                    <View style={styles.tipsList}>
                        <Text style={styles.tipItem}>• Ensure package is in recipient's hands</Text>
                        <Text style={styles.tipItem}>• Thank the recipient for their business</Text>
                        <Text style={styles.tipItem}>• Confirm all items match the order</Text>
                        <Text style={styles.tipItem}>• Be professional and courteous</Text>
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
        backgroundColor: '#FEE2E2',
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
    address: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        lineHeight: 20
    },
    sectionDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 18
    },

    // Token Verification
    tokenDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 18
    },
    tokenInputContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10
    },
    tokenInput: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: 4,
        borderWidth: 2,
        borderColor: '#F59E0B',
        textTransform: 'uppercase'
    },
    verifyButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center'
    },
    verifyButtonDisabled: {
        opacity: 0.5
    },
    tokenHint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#F3F4F6',
        padding: 10,
        borderRadius: 8
    },
    tokenHintText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        lineHeight: 16
    },
    tokenVerifiedBox: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#86EFAC'
    },
    tokenVerifiedTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#166534',
        marginTop: 12,
        marginBottom: 4
    },
    tokenVerifiedText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#15803D',
        textAlign: 'center'
    },

    // Recipient
    recipientInfo: {
        gap: 12
    },
    expectedRecipient: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8
    },
    expectedLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 4
    },
    expectedValue: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    recipientInput: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 10,
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        borderWidth: 2,
        borderColor: '#6366F1'
    },
    inputNote: {
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        fontStyle: 'italic'
    },

    // Photos
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12
    },
    photoThumb: {
        width: 80,
        height: 80,
        borderRadius: 8,
        position: 'relative'
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    photoRemove: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center'
    },
    photoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#6366F1',
        borderStyle: 'dashed'
    },
    photoButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    },

    // Notes
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

    // Complete Button
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#10B981',
        paddingVertical: 18,
        borderRadius: 14,
        marginBottom: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    completeButtonDisabled: {
        opacity: 0.5
    },
    completeButtonText: {
        fontSize: 17,
        fontFamily: 'PoppinsBold',
        color: '#fff'
    },

    // Progress
    progressCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
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

    // Tips
    tipsCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FDE68A'
    },
    tipsTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#78350F',
        marginBottom: 10
    },
    tipsList: {
        gap: 6
    },
    tipItem: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#92400E',
        lineHeight: 18
    }
});

export default ArrivedDropoffPanel;