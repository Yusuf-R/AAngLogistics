// components/Driver/Delivery/Panels/ArrivedDropoffPanel.jsx
import React, {useState, useRef} from 'react';
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
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {toast} from 'sonner-native';
import useLogisticStore from '../../../../store/Driver/useLogisticStore';
import DriverMediaUploader from '../../DriverMediaUploader';
import {router} from "expo-router";

function DropoffConfirmationPanel() {
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
    const [mediaData, setMediaData] = useState({
        images: [],
        video: null
    });

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
            RNAnimated.timing(shakeAnimation, {toValue: 10, duration: 50, useNativeDriver: true}),
            RNAnimated.timing(shakeAnimation, {toValue: -10, duration: 50, useNativeDriver: true}),
            RNAnimated.timing(shakeAnimation, {toValue: 10, duration: 50, useNativeDriver: true}),
            RNAnimated.timing(shakeAnimation, {toValue: 0, duration: 50, useNativeDriver: true})
        ]).start();
    };

    // Callback when media changes
    const handleMediaChange = (images, video) => {
        setMediaData({images, video});
        // Update verification with media URLs
        updateDeliveryVerification('photos', images.map(img => img.url));
        updateDeliveryVerification('videoUrl', video?.url || null);
    };

    // Check if ready to complete
    const isReadyToComplete = () => {
        return (
            deliveryVerification.tokenVerified &&
            deliveryVerification.recipientName.trim().length > 0 &&
            mediaData.images.length >= 2 // Minimum 2 delivery photos required
        );
    };

    // Handle delivery completion
    const handleCompleteDelivery = async () => {
        if (!isReadyToComplete()) {
            if (!deliveryVerification.tokenVerified) {
                toast.error('Please verify delivery token first');
            } else if (deliveryVerification.recipientName.trim().length === 0) {
                toast.error('Please enter recipient name');
            } else if (mediaData.images.length < 2) {
                toast.error('Please upload at least 2 delivery photos');
            } else {
                toast.error('Please complete all required fields');
            }
            return;
        }

        setIsCompletingDelivery(true);

        try {
            // Prepare verification data with media
            const verificationData = {
                ...deliveryVerification,
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

            const result = await completeDelivery(verificationData);
            if (!result.success) {
                toast.error('Try again : Failed to complete delivery');
                return
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
                router.push({
                    pathname: result.nextAction.route,
                    params: result.nextAction.params
                });
            }, 1000);
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
            <View style={styles.handleBar}/>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-done" size={24} color="#EF4444"/>
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
                        <Ionicons name="location" size={20} color="#EF4444"/>
                        <Text style={styles.cardTitle}>Delivery Location</Text>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={14} color="#10B981"/>
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    </View>
                    <Text style={styles.address}>{dropoffLocation.address}</Text>
                </View>

                {/* Token Verification */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="key" size={20} color="#F59E0B"/>
                        <Text style={styles.cardTitle}>Verify Delivery Token</Text>
                        {deliveryVerification.tokenVerified && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981"/>
                            </View>
                        )}
                    </View>

                    {!deliveryVerification.tokenVerified ? (
                        <>
                            <Text style={styles.tokenDescription}>
                                Ask the recipient for their 6-digit delivery code
                            </Text>

                            <RNAnimated.View style={{transform: [{translateX: shakeAnimation}]}}>
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
                                            <ActivityIndicator size="small" color="#fff"/>
                                        ) : (
                                            <Ionicons name="checkmark" size={20} color="#fff"/>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </RNAnimated.View>

                            <View style={styles.tokenHint}>
                                <Ionicons name="information-circle" size={16} color="#6B7280"/>
                                <Text style={styles.tokenHintText}>
                                    The token is case-sensitive (e.g., A3X9K2)
                                </Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.tokenVerifiedBox}>
                            <Ionicons name="checkmark-circle" size={48} color="#10B981"/>
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
                        <Ionicons name="person" size={20} color="#6366F1"/>
                        <Text style={styles.cardTitle}>Recipient Details</Text>
                        {deliveryVerification.recipientName.trim().length > 0 && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981"/>
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

                        <View style={styles.expectedRecipient}>
                            <Text style={styles.expectedLabel}>Contact</Text>
                            <Text style={styles.expectedValue}>
                                {recipientContact?.phone || 'Not specified'}
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

                {/* Media Documentation (Images & Video) - ENHANCED */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="camera" size={20} color="#8B5CF6"/>
                        <Text style={styles.cardTitle}>Delivery Proof Documentation</Text>
                        {mediaData.images.length >= 2 && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark" size={12} color="#10B981"/>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionDescription}>
                        Capture proof of delivery handover (min 2 photos required)
                    </Text>

                    <DriverMediaUploader
                        orderId={activeOrder._id}
                        clientId={activeOrder.clientId}
                        onMediaChange={handleMediaChange}
                        minImages={2}
                        maxImages={5}
                        videoOptional={true}
                        videoMaxDuration={15}
                        stage="dropoff"
                    />

                    <View style={styles.photoHint}>
                        <Ionicons name="information-circle" size={16} color="#8B5CF6"/>
                        <Text style={styles.photoHintText}>
                            💡 Capture: recipient receiving package, package condition, and handover moment
                        </Text>
                    </View>
                </View>

                {/* Additional Notes */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text" size={20} color="#6B7280"/>
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
                        <ActivityIndicator size="small" color="#fff"/>
                    ) : (
                        <>
                            <Ionicons name="checkmark-done-circle" size={24} color="#fff"/>
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
                                name={mediaData.images.length >= 2 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={mediaData.images.length >= 2 ? '#10B981' : '#D1D5DB'}
                            />
                            <Text style={styles.progressText}>
                                Delivery photos captured ({mediaData.images.length}/2 minimum)
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
                                name="information-circle-outline"
                                size={20}
                                color="#6B7280"
                            />
                            <Text style={[styles.progressText, {color: '#6B7280'}]}>
                                Notes are optional
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
    photoHint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#F5F3FF',
        padding: 10,
        borderRadius: 8,
        marginTop: 8
    },
    photoHintText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6D28D9',
        lineHeight: 16
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
        shadowOffset: {width: 0, height: 4},
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
        color: '#075985',
        flex: 1
    },
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
    },
    bottomSpace: {
        height: 120
    }
});

export default DropoffConfirmationPanel;