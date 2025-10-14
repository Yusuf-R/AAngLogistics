// components/Driver/Account/DataVerification/RejectedScreen.js
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CustomHeader from '../../../CustomHeader';

function RejectedScreen({ verification, userData, onRefresh, statusType = 'rejected' }) {
    const router = useRouter();

    const handleResubmit = () => {
        router.push('/driver/account/data-verification?edit=true');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusConfig = () => {
        switch (statusType) {
            case 'suspended':
                return {
                    icon: 'ban',
                    color: '#ef4444',
                    title: 'Account Suspended',
                    subtitle: 'Your verification has been suspended',
                    buttonText: 'Appeal Suspension',
                };
            case 'expired':
                return {
                    icon: 'time',
                    color: '#f59e0b',
                    title: 'Documents Expired',
                    subtitle: 'Please update your expired documents',
                    buttonText: 'Update Documents',
                };
            default:
                return {
                    icon: 'close-circle',
                    color: '#ef4444',
                    title: 'Verification Rejected',
                    subtitle: 'Your submission needs corrections',
                    buttonText: 'Resubmit Documents',
                };
        }
    };

    const config = getStatusConfig();
    const rejectionReason = verification?.rejectionReason || 'No specific reason provided';
    const reviewDate = verification?.lastReviewDate;

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Verification Status"
                onBackPress={() => router.back()}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Header */}
                <View style={styles.statusCard}>
                    <View style={[styles.statusIconContainer, { backgroundColor: config.color }]}>
                        <Ionicons name={config.icon} size={48} color="#fff" />
                    </View>
                    <Text style={styles.statusTitle}>{config.title}</Text>
                    <Text style={styles.statusSubtitle}>{config.subtitle}</Text>
                </View>

                {/* Rejection Details */}
                {statusType === 'rejected' && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="information-circle" size={24} color="#ef4444" />
                            <Text style={styles.cardTitle}>Reason for Rejection</Text>
                        </View>

                        <View style={styles.reasonBox}>
                            <Text style={styles.reasonText}>{rejectionReason}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Reviewed On:</Text>
                            <Text style={styles.infoValue}>{formatDate(reviewDate)}</Text>
                        </View>
                    </View>
                )}

                {/* Common Issues */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" />
                        <Text style={styles.cardTitle}>
                            {statusType === 'expired' ? 'Expired Documents' : 'Common Issues'}
                        </Text>
                    </View>

                    <View style={styles.issueItem}>
                        <Ionicons name="camera" size={20} color="#6b7280" />
                        <View style={styles.issueContent}>
                            <Text style={styles.issueTitle}>Poor Image Quality</Text>
                            <Text style={styles.issueDescription}>
                                Ensure photos are clear, well-lit, and all text is readable
                            </Text>
                        </View>
                    </View>

                    <View style={styles.issueItem}>
                        <Ionicons name="document-text" size={20} color="#6b7280" />
                        <View style={styles.issueContent}>
                            <Text style={styles.issueTitle}>Incorrect Information</Text>
                            <Text style={styles.issueDescription}>
                                Double-check all numbers, dates, and personal details
                            </Text>
                        </View>
                    </View>

                    <View style={styles.issueItem}>
                        <Ionicons name="calendar" size={20} color="#6b7280" />
                        <View style={styles.issueContent}>
                            <Text style={styles.issueTitle}>Expired Documents</Text>
                            <Text style={styles.issueDescription}>
                                All documents must be valid with future expiry dates
                            </Text>
                        </View>
                    </View>

                    <View style={styles.issueItem}>
                        <Ionicons name="checkmark-done" size={20} color="#6b7280" />
                        <View style={styles.issueContent}>
                            <Text style={styles.issueTitle}>Missing Documents</Text>
                            <Text style={styles.issueDescription}>
                                Ensure all required documents for your vehicle type are uploaded
                            </Text>
                        </View>
                    </View>
                </View>

                {/* What to Do Next */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="list-outline" size={24} color="#10b981" />
                        <Text style={styles.cardTitle}>What to Do Next</Text>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Review Feedback</Text>
                            <Text style={styles.stepDescription}>
                                Carefully read the rejection reason above
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Prepare Corrections</Text>
                            <Text style={styles.stepDescription}>
                                Get better photos or update information as needed
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Resubmit</Text>
                            <Text style={styles.stepDescription}>
                                Tap the button below to submit corrected documents
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tips for Approval */}
                <View style={styles.tipsCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="bulb" size={24} color="#3b82f6" />
                        <Text style={styles.cardTitle}>Tips for Quick Approval</Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.tipText}>
                            Take photos in good lighting, avoid shadows and glare
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.tipText}>
                            Ensure all four corners of documents are visible
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.tipText}>
                            Verify all information matches your official documents exactly
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.tipText}>
                            Check expiry dates - documents should be valid for at least 3 months
                        </Text>
                    </View>
                </View>

                {/* Support */}
                <View style={styles.supportCard}>
                    <Ionicons name="headset" size={24} color="#6b7280" />
                    <View style={styles.supportContent}>
                        <Text style={styles.supportTitle}>Need Assistance?</Text>
                        <Text style={styles.supportText}>
                            Contact our support team if you need help understanding the rejection
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Resubmit Button */}
            <View style={styles.bottomBar}>
                <Pressable
                    style={styles.resubmitButton}
                    onPress={handleResubmit}
                >
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.resubmitGradient}
                    >
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={styles.resubmitButtonText}>{config.buttonText}</Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statusIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    statusSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    reasonBox: {
        backgroundColor: '#fef2f2',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    reasonText: {
        fontSize: 14,
        color: '#991b1b',
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    issueItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        gap: 12,
    },
    issueContent: {
        flex: 1,
    },
    issueTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    issueDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        gap: 12,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    tipsCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
        gap: 12,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 18,
    },
    supportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 16,
    },
    supportContent: {
        flex: 1,
    },
    supportTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    supportText: {
        fontSize: 13,
        color: '#6b7280',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    resubmitButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    resubmitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    resubmitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default RejectedScreen;