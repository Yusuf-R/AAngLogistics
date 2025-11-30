// components/Driver/Account/DataVerification/SubmissionHistoryScreen.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomHeader from '../../../CustomHeader';

function SubmissionHistoryScreen({ verification, userData, onRefresh }) {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get submissions and updates
    const submissions = verification?.submissions || [];
    const updateHistory = verification?.updateHistory || [];

    // Combine and sort all submissions
    const allSubmissions = [
        ...submissions.map(s => ({
            type: 'submission',
            ...s,
            date: s.submittedAt
        })),
        ...updateHistory.map(u => ({
            type: 'update',
            ...u,
            date: u.updatedAt
        }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const getSubmissionIcon = (submission) => {
        if (submission.type === 'update') {
            return submission.status === 'approved' ? 'refresh-circle' : 'refresh-circle-outline';
        }
        return submission.status === 'approved' ? 'checkmark-circle' : 'document-text';
    };

    const getSubmissionColor = (submission) => {
        if (submission.status === 'approved') return '#10b981';
        if (submission.status === 'rejected') return '#ef4444';
        return '#f59e0b';
    };

    const getSubmissionBgColor = (submission) => {
        if (submission.status === 'approved') return '#d1fae5';
        if (submission.status === 'rejected') return '#fee2e2';
        return '#fef3c7';
    };

    const getSubmissionTitle = (submission) => {
        if (submission.type === 'update') {
            const updateTypes = {
                vehicle_upgrade: 'Vehicle Upgrade',
                vehicle_downgrade: 'Vehicle Downgrade',
                location_change: 'Location Change',
                document_renewal: 'Document Renewal',
                bank_account_change: 'Bank Account Update',
                comprehensive_update: 'Comprehensive Update'
            };
            return updateTypes[submission.updateType] || 'Verification Update';
        }

        const submissionTypes = {
            initial: 'Initial Verification',
            resubmission: 'Resubmission',
            update: 'Update'
        };
        return submissionTypes[submission.submissionType] || 'Verification Submission';
    };

    const renderSubmissionItem = (submission, index) => {
        const icon = getSubmissionIcon(submission);
        const color = getSubmissionColor(submission);
        const bgColor = getSubmissionBgColor(submission);
        const title = getSubmissionTitle(submission);

        return (
            <View key={index} style={styles.submissionCard}>
                <View style={[styles.submissionIconContainer, { backgroundColor: bgColor }]}>
                    <Ionicons name={icon} size={32} color={color} />
                </View>

                <View style={styles.submissionContent}>
                    <View style={styles.submissionHeader}>
                        <Text style={styles.submissionTitle}>{title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                            <Text style={[styles.statusText, { color }]}>
                                {submission.status}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.submissionDate}>
                        {formatDate(submission.date)}
                    </Text>

                    {/* Show changes for updates */}
                    {submission.type === 'update' && submission.changesSummary && (
                        <View style={styles.changesContainer}>
                            {submission.changesSummary.vehicleTypeChange && (
                                <View style={styles.changeItem}>
                                    <Ionicons name="car-outline" size={16} color="#6b7280" />
                                    <Text style={styles.changeText}>
                                        {submission.changesSummary.vehicleTypeChange.from} → {submission.changesSummary.vehicleTypeChange.to}
                                    </Text>
                                </View>
                            )}
                            {submission.changesSummary.locationChange && (
                                <View style={styles.changeItem}>
                                    <Ionicons name="location-outline" size={16} color="#6b7280" />
                                    <Text style={styles.changeText}>
                                        {submission.changesSummary.locationChange.to.state}
                                    </Text>
                                </View>
                            )}
                            {submission.changesSummary.documentsUpdated?.length > 0 && (
                                <View style={styles.changeItem}>
                                    <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                                    <Text style={styles.changeText}>
                                        {submission.changesSummary.documentsUpdated.length} documents updated
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Show feedback if rejected */}
                    {submission.status === 'rejected' && submission.feedback && (
                        <View style={styles.feedbackContainer}>
                            <Ionicons name="information-circle" size={16} color="#ef4444" />
                            <Text style={styles.feedbackText}>{submission.feedback}</Text>
                        </View>
                    )}

                    {/* Show reviewed by */}
                    {submission.reviewedBy && (
                        <Text style={styles.reviewedBy}>
                            Reviewed by: {submission.reviewedByName || 'Admin'}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Submission History"
                onBackPress={() => router.back()}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#10b981"
                        colors={['#10b981']}
                    />
                }
            >
                {/* Summary Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{allSubmissions.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#10b981' }]}>
                            {allSubmissions.filter(s => s.status === 'approved').length}
                        </Text>
                        <Text style={styles.statLabel}>Approved</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>
                            {allSubmissions.filter(s => s.status === 'rejected').length}
                        </Text>
                        <Text style={styles.statLabel}>Rejected</Text>
                    </View>
                </View>

                {/* Submissions List */}
                {allSubmissions.length > 0 ? (
                    <View style={styles.submissionsContainer}>
                        {allSubmissions.map((submission, index) =>
                            renderSubmissionItem(submission, index)
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No Submissions Yet</Text>
                        <Text style={styles.emptyText}>
                            Your verification submissions will appear here
                        </Text>
                    </View>
                )}
            </ScrollView>
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
        paddingBottom: 32,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#6b7280',
    },
    submissionsContainer: {
        gap: 12,
    },
    submissionCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    submissionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submissionContent: {
        flex: 1,
    },
    submissionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    submissionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    submissionDate: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
    },
    changesContainer: {
        gap: 6,
        marginTop: 8,
    },
    changeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    changeText: {
        fontSize: 13,
        color: '#6b7280',
    },
    feedbackContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8,
        padding: 10,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
    },
    feedbackText: {
        flex: 1,
        fontSize: 13,
        color: '#991b1b',
        lineHeight: 18,
    },
    reviewedBy: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});

export default SubmissionHistoryScreen;