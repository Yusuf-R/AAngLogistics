// app/(protected)/driver/discover/index.jsx
import React, {useEffect, useState} from 'react';
import {
    View,
    ActivityIndicator,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions
} from 'react-native';
import {useRouter} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Discover from "/components/Driver/Discover/Discover"
import {useSessionStore} from "../../../../store/useSessionStore";
import useLogisticStore, {DELIVERY_STAGES} from "../../../../store/Driver/useLogisticStore";
import useNavigationStore from "../../../../store/Driver/useNavigationStore";

const { width } = Dimensions.get('window');

function DiscoverScreen() {
    const router = useRouter();
    const userData = useSessionStore(state => state.user);
    const [isChecking, setIsChecking] = useState(true);

    // ✅ Get verification status
    const verification = userData?.verification;
    const verificationStatus = verification?.overallStatus || 'missing';
    const isVerified = verificationStatus === 'approved';

    // ✅ Get delivery state from store
    const {isOnActiveDelivery, activeOrder, deliveryStage} = useLogisticStore();

    // ✅ Get navigation state
    const {isComingFromReview, shouldSkipLiveTracking, clearComingFromReview} = useNavigationStore();

    // ✅ Helper function to get verification configuration
    const getVerificationConfig = () => {
        switch(verificationStatus) {
            case 'pending':
            case 'submitted':
                return {
                    icon: 'time',
                    title: 'Verification in Progress',
                    statusText: 'Under Review',
                    statusColor: '#F59E0B',
                    statusBg: '#FEF3C7',
                    description: 'Your verification is currently being reviewed by our team. This process usually takes 1-2 business days.',
                    buttonText: 'Check Verification Status',
                    note: 'You\'ll receive a notification and email once your verification is complete.'
                };
            case 'rejected':
                return {
                    icon: 'alert-circle',
                    title: 'Verification Required',
                    statusText: 'Action Required',
                    statusColor: '#DC2626',
                    statusBg: '#FEE2E2',
                    description: 'Your verification requires attention. Please review the feedback and resubmit your documents.',
                    buttonText: 'Review & Resubmit Documents',
                    note: 'You can continue with deliveries once all verification issues are resolved.'
                };
            case 'suspended':
                return {
                    icon: 'ban',
                    title: 'Verification Suspended',
                    statusText: 'Suspended',
                    statusColor: '#DC2626',
                    statusBg: '#FEE2E2',
                    description: 'Your verification has been suspended. Please contact support for more information.',
                    buttonText: 'Contact Support',
                    note: 'You cannot access delivery opportunities while your verification is suspended.'
                };
            case 'expired':
                return {
                    icon: 'calendar',
                    title: 'Verification Expired',
                    statusText: 'Expired',
                    statusColor: '#D97706',
                    statusBg: '#FEF3C7',
                    description: 'Your verification documents have expired. Please update your documents to continue.',
                    buttonText: 'Renew Verification',
                    note: 'Expired documents must be updated before you can accept new deliveries.'
                };
            case 'not-started':
                return {
                    icon: 'play-circle',
                    title: 'Start Verification',
                    statusText: 'Not Started',
                    statusColor: '#3B82F6',
                    statusBg: '#DBEAFE',
                    description: 'Welcome! Before you can start accepting deliveries, please complete your account verification.',
                    buttonText: 'Begin Verification',
                    note: 'This process helps us ensure safety and build trust in our delivery network.'
                };
            case 'incomplete':
                return {
                    icon: 'document-text',
                    title: 'Complete Verification',
                    statusText: 'Incomplete',
                    statusColor: '#6B7280',
                    statusBg: '#F3F4F6',
                    description: 'Your verification process has been started but is not yet complete. Please finish submitting all required documents.',
                    buttonText: 'Continue Verification',
                    note: 'Complete all required steps to unlock delivery opportunities.'
                };
            case 'approved':
                return {
                    icon: 'checkmark-circle',
                    title: 'Verified',
                    statusText: 'Approved',
                    statusColor: '#10B981',
                    statusBg: '#D1FAE5',
                    description: 'Your verification is complete! You can now access all delivery features.',
                    buttonText: 'Start Delivering',
                    note: 'You\'re all set to start accepting deliveries.'
                };
            default: // 'missing' or any other unknown status
                return {
                    icon: 'help-circle',
                    title: 'Verification Required',
                    statusText: 'Not Started',
                    statusColor: '#6B7280',
                    statusBg: '#F3F4F6',
                    description: 'To access delivery opportunities and start earning, please complete your account verification first.',
                    buttonText: 'Start Verification Process',
                    note: 'Verification helps us ensure safety and build trust in our delivery network.'
                };
        }
    };

    // ✅ Handler for verification action button
    const handleVerificationAction = () => {
        switch(verificationStatus) {
            case 'suspended':
                router.push('/driver/support');
                break;
            case 'not-started':
            case 'incomplete':
            case 'expired':
            case 'rejected':
            case 'pending':
            case 'submitted':
            case 'missing':
            default:
                router.push('/driver/account/verification');
                break;
        }
    };

    // ✅ SECURITY CHECK: Redirect if user has active delivery (only if verified)
    useEffect(() => {
        const checkDeliveryStatus = async () => {
            // Skip delivery checks if not verified
            if (!isVerified) {
                setIsChecking(false);
                return;
            }

            // Small delay for UX and store synchronization
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ CRITICAL: If coming from review, skip live tracking check entirely
            if (shouldSkipLiveTracking()) {
                console.log('🚩 Coming from review - forcing Discover access');
                clearComingFromReview(); // Clear the flag immediately
                setIsChecking(false);
                return;
            }

            // ✅ LAYER 1: Check user availability status
            const isDriverBusy = userData?.availabilityStatus === 'on-delivery';

            // ✅ LAYER 2: Check store delivery state
            const hasActiveDelivery = isOnActiveDelivery && activeOrder;

            // Combined security check - if user should be on live tracking instead
            const shouldRedirectToLive = isDriverBusy && hasActiveDelivery;

            if (shouldRedirectToLive) {
                console.log('🔄 Active delivery found - redirecting to Live Tracking');
                router.replace('/driver/discover/live');
            } else {
                console.log('✅ Access granted to Discover');
                setIsChecking(false);
            }
        };

        checkDeliveryStatus();
    }, [userData, isOnActiveDelivery, activeOrder, deliveryStage, shouldSkipLiveTracking, isVerified]);

    // ✅ Loading State while checking (only for verified users)
    if (isVerified && isChecking) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1"/>
                <Text style={styles.loadingText}>Loading delivery opportunities...</Text>
            </View>
        );
    }

    // ✅ Show verification required screen if not verified
    if (!isVerified) {
        const config = getVerificationConfig();
        const documentStatus = verification?.documentsStatus || {};

        // Helper to check if documents have been started
        const hasStartedVerification = () => {
            const docsStatus = verification?.documentsStatus || {};
            const hasAnyDoc = Object.values(docsStatus).some(status =>
                status === 'pending' || status === 'submitted' || status === 'approved'
            );

            // Also check basic verification
            const basicVer = verification?.basicVerification;
            const hasBasicInfo = basicVer?.identification ||
                basicVer?.passportPhoto ||
                basicVer?.vehiclePictures;

            return hasAnyDoc || hasBasicInfo;
        };

        // Adjust description for 'not-started' if user has started
        let finalDescription = config.description;
        if (verificationStatus === 'not-started' && hasStartedVerification()) {
            finalDescription = 'You\'ve started the verification process. Please complete all remaining steps to finish verification.';
        }

        return (
            <ScrollView
                contentContainerStyle={styles.verificationContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.verificationContent}>
                    {/* Icon & Status */}
                    <View style={[styles.verificationIconContainer, {backgroundColor: config.statusBg}]}>
                        <Ionicons name={config.icon} size={48} color={config.statusColor} />
                    </View>

                    <Text style={styles.verificationTitle}>{config.title}</Text>

                    <View style={[styles.statusBadge, {backgroundColor: config.statusBg}]}>
                        <Text style={[styles.statusText, {color: config.statusColor}]}>
                            {config.statusText}
                        </Text>
                    </View>

                    <Text style={styles.verificationDescription}>
                        {finalDescription}
                    </Text>

                    {/* What Discover Section Offers */}
                    <View style={styles.discoverInfoBox}>
                        <Text style={styles.infoTitle}>Discover Section Offers:</Text>
                        <View style={styles.featureItem}>
                            <Ionicons name="search" size={18} color="#3B82F6" />
                            <Text style={styles.featureText}>
                                <Text style={styles.featureBold}>Browse Deliveries</Text> - Find available delivery jobs in your area
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="cash" size={18} color="#10B981" />
                            <Text style={styles.featureText}>
                                <Text style={styles.featureBold}>Earn Money</Text> - Accept and complete deliveries for payment
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="analytics" size={18} color="#8B5CF6" />
                            <Text style={styles.featureText}>
                                <Text style={styles.featureBold}>Track Performance</Text> - Monitor your delivery stats and ratings
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="calendar" size={18} color="#F59E0B" />
                            <Text style={styles.featureText}>
                                <Text style={styles.featureBold}>Flexible Schedule</Text> - Work when you want, as much as you want
                            </Text>
                        </View>
                    </View>

                    {/* Required Documents Checklist */}
                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementsTitle}>Documents Needed:</Text>

                        {['license', 'vehicleRegistration', 'insurance', 'profilePhoto'].map((docType) => {
                            const isComplete = documentStatus[docType] === 'approved' ||
                                documentStatus[docType] === 'verified';
                            const docNames = {
                                license: "Driver's License",
                                vehicleRegistration: "Vehicle Registration",
                                insurance: "Insurance Certificate",
                                profilePhoto: "Profile Photo"
                            };

                            return (
                                <View key={docType} style={styles.requirementItem}>
                                    <Ionicons
                                        name={isComplete ? "checkmark-circle" : "ellipse-outline"}
                                        size={20}
                                        color={isComplete ? '#10B981' : '#9CA3AF'}
                                    />
                                    <Text style={[
                                        styles.requirementText,
                                        isComplete ? styles.completedRequirement : styles.pendingRequirement
                                    ]}>
                                        {docNames[docType]}
                                        {isComplete && (
                                            <Text style={styles.verifiedText}> ✓ Verified</Text>
                                        )}
                                    </Text>
                                </View>
                            );
                        })}

                        <View style={styles.noteBox}>
                            <Ionicons name="information-circle" size={16} color="#6B7280" />
                            <Text style={styles.noteText}>
                                All documents are reviewed by our verification team to ensure safety standards.
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleVerificationAction}
                    >
                        <Ionicons name="shield-checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.primaryButtonText}>{config.buttonText}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>

                    {(verificationStatus === 'pending' || verificationStatus === 'submitted') && (
                        <View style={styles.estimatedTimeBox}>
                            <Ionicons name="time-outline" size={18} color="#F59E0B" />
                            <Text style={styles.estimatedTimeText}>
                                Estimated completion: 1-2 business days
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push('/driver/support')}
                    >
                        <Ionicons name="chatbubbles" size={18} color="#3B82F6" />
                        <Text style={styles.secondaryButtonText}>Need help? Contact Support</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // ✅ Render Discover (verified user with no active delivery)
    return (
        <Discover userData={userData}/>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'PoppinsMedium',
    },

    // Verification Container
    verificationContainer: {
        flexGrow: 1,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 40,
    },
    verificationContent: {
        alignItems: 'center',
    },
    verificationIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    verificationTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: 'PoppinsBold',
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 24,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
    },
    verificationDescription: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontFamily: 'PoppinsRegular',
    },

    // Discover Info Section
    discoverInfoBox: {
        width: '100%',
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    featureText: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'PoppinsRegular',
        flex: 1,
        lineHeight: 20,
    },
    featureBold: {
        fontWeight: '600',
        color: '#111827',
    },

    // Requirements Section
    requirementsContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    requirementsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingVertical: 8,
    },
    requirementText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        flex: 1,
    },
    completedRequirement: {
        color: '#065F46',
    },
    pendingRequirement: {
        color: '#4B5563',
    },
    verifiedText: {
        fontSize: 13,
        color: '#10B981',
        fontFamily: 'PoppinsMedium',
    },
    noteBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        lineHeight: 18,
    },

    // Buttons
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#3B82F6',
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonIcon: {
        marginRight: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        fontFamily: 'PoppinsSemiBold',
        flex: 1,
        textAlign: 'center',
    },
    estimatedTimeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    estimatedTimeText: {
        fontSize: 14,
        color: '#92400E',
        fontFamily: 'PoppinsMedium',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: '#3B82F6',
        fontFamily: 'PoppinsMedium',
        textDecorationLine: 'underline',
    },
});

export default DiscoverScreen;