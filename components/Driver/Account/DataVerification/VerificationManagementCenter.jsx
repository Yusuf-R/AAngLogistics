// components/Driver/Account/DataVerification/VerificationManagementCenter.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Animated,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CustomHeader from '../../../CustomHeader';

function VerificationManagementCenter({ verification, userData, onRefresh }) {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };

    // Determine verification state
    const overallStatus = verification?.overallStatus || 'incomplete';
    const hasPendingUpdate = verification?.pendingUpdate?.exists;
    const hasSubmissions = verification?.submissions?.length > 0;
    const hasUpdateHistory = verification?.updateHistory?.length > 0;

    // Get status info for display
    const getStatusInfo = () => {
        switch (overallStatus) {
            case 'approved':
                return {
                    icon: 'checkmark-circle',
                    color: '#10b981',
                    bgColor: '#d1fae5',
                    title: 'Verified',
                    description: 'Your verification is successful'
                };
            case 'submitted':
                return {
                    icon: 'time',
                    color: '#f59e0b',
                    bgColor: '#fef3c7',
                    title: 'Under Review',
                    description: 'We\'re reviewing your documents'
                };
            case 'rejected':
                return {
                    icon: 'close-circle',
                    color: '#ef4444',
                    bgColor: '#fee2e2',
                    title: 'Rejected',
                    description: 'Some documents need attention'
                };
            case 'pending':
            case 'incomplete':
            default:
                return {
                    icon: 'alert-circle',
                    color: '#6b7280',
                    bgColor: '#f3f4f6',
                    title: 'Not Started',
                    description: 'Complete your verification to start'
                };
        }
    };

    const statusInfo = getStatusInfo();

    // Navigation handlers
    const handleCheckStatus = () => {
        router.push({
            pathname: '/driver/account/verification',
            params: { action: 'status' }
        });
    };

    const handleStartVerification = () => {
        router.push({
            pathname: '/driver/account/verification',
            params: { action: 'new' }
        });
    };

    const handleUpdateVerification = () => {
        router.push({
            pathname: '/driver/account/verification',
            params: { action: 'update' }
        });
    };

    const handleViewSubmissions = () => {
        router.push({
            pathname: '/driver/account/verification',
            params: { action: 'submissions' }
        });
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Verification Center"
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
                {/* Hero Section */}
                <Animated.View
                    style={[
                        styles.heroCard,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.heroGradient}
                    >
                        <View style={styles.heroIconContainer}>
                            <Ionicons name="shield-checkmark" size={64} color="#fff" />
                        </View>
                        <Text style={styles.heroTitle}>Driver Verification</Text>
                        <Text style={styles.heroSubtitle}>
                            Manage your verification documents and status
                        </Text>
                    </LinearGradient>
                </Animated.View>

                {/* Current Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: statusInfo.bgColor }]}>
                    <View style={styles.statusIconContainer}>
                        <Ionicons name={statusInfo.icon} size={32} color={statusInfo.color} />
                    </View>
                    <View style={styles.statusContent}>
                        <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                            {statusInfo.title}
                        </Text>
                        <Text style={styles.statusDescription}>
                            {statusInfo.description}
                        </Text>
                        {hasPendingUpdate && (
                            <View style={styles.pendingUpdateBadge}>
                                <Ionicons name="hourglass" size={12} color="#f59e0b" />
                                <Text style={styles.pendingUpdateText}>
                                    Update request pending
                                </Text>
                            </View>
                        )}
                    </View>
                    <Pressable onPress={handleCheckStatus}>
                        <Ionicons name="chevron-forward" size={24} color={statusInfo.color} />
                    </Pressable>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    {/* Start/Resume Verification */}
                    {(overallStatus === 'incomplete' || overallStatus === 'pending') && (
                        <Pressable
                            style={styles.actionCard}
                            onPress={handleStartVerification}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                                <Ionicons name="rocket" size={28} color="#3b82f6" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>
                                    {overallStatus === 'incomplete' ? 'Start Verification' : 'Resume Verification'}
                                </Text>
                                <Text style={styles.actionDescription}>
                                    {overallStatus === 'incomplete'
                                        ? 'Begin your driver verification process'
                                        : 'Continue where you left off'
                                    }
                                </Text>
                            </View>
                            <Ionicons name="arrow-forward" size={24} color="#9ca3af" />
                        </Pressable>
                    )}

                    {/* Update Verification (only for approved) */}
                    {overallStatus === 'approved' && !hasPendingUpdate && (
                        <Pressable
                            style={styles.actionCard}
                            onPress={handleUpdateVerification}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                                <Ionicons name="refresh-circle" size={28} color="#f59e0b" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Update Verification</Text>
                                <Text style={styles.actionDescription}>
                                    Change vehicle type, location, or renew documents
                                </Text>
                            </View>
                            <Ionicons name="arrow-forward" size={24} color="#9ca3af" />
                        </Pressable>
                    )}

                    {/* Check Status */}
                    <Pressable
                        style={styles.actionCard}
                        onPress={handleCheckStatus}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}>
                            <Ionicons name="checkmark-done-circle" size={28} color="#10b981" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Check Status</Text>
                            <Text style={styles.actionDescription}>
                                View detailed verification status and feedback
                            </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={24} color="#9ca3af" />
                    </Pressable>

                    {/* View Submissions (if any exist) */}
                    {(hasSubmissions || hasUpdateHistory) && (
                        <Pressable
                            style={styles.actionCard}
                            onPress={handleViewSubmissions}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                                <Ionicons name="document-text" size={28} color="#6366f1" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Submission History</Text>
                                <Text style={styles.actionDescription}>
                                    View your verification submission records
                                </Text>
                            </View>
                            <Ionicons name="arrow-forward" size={24} color="#9ca3af" />
                        </Pressable>
                    )}
                </View>

                {/* Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Verification</Text>

                    <View style={styles.infoCard}>
                        <View style={styles.infoItem}>
                            <View style={styles.infoBullet}>
                                <Ionicons name="time-outline" size={20} color="#10b981" />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>Quick Process</Text>
                                <Text style={styles.infoDescription}>
                                    Takes 5-10 minutes to complete, reviewed within 24-48 hours
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.infoBullet}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>Secure & Private</Text>
                                <Text style={styles.infoDescription}>
                                    Your documents are encrypted and only used for verification
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.infoBullet}>
                                <Ionicons name="trending-up-outline" size={20} color="#10b981" />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>Better Opportunities</Text>
                                <Text style={styles.infoDescription}>
                                    Verified drivers get priority access to high-value orders
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.infoBullet}>
                                <Ionicons name="refresh-outline" size={20} color="#10b981" />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>Easy Updates</Text>
                                <Text style={styles.infoDescription}>
                                    Update your information anytime without losing active status
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Required Documents Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Documents You'll Need</Text>

                    <View style={styles.documentsCard}>
                        <View style={styles.documentItem}>
                            <Ionicons name="card-outline" size={20} color="blue" />
                            <Text style={styles.documentText}>Valid ID (Driver's License, NIN, or Passport)</Text>
                        </View>
                        <View style={styles.documentItem}>
                            <Ionicons name="person-circle-outline" size={20} color="green" />
                            <Text style={styles.documentText}>Passport photograph</Text>
                        </View>
                        <View style={styles.documentItem}>
                            <Ionicons name="location-outline" size={20} color="red" />
                            <Text style={styles.documentText}>Operational location details</Text>
                        </View>
                        <View style={styles.documentItem}>
                            <Ionicons name="car-outline" size={20} color="orange" />
                            <Text style={styles.documentText}>Vehicle pictures and documents</Text>
                        </View>
                        <View style={styles.documentItem}>
                            <Ionicons name="wallet-outline" size={20} color="purple" />
                            <Text style={styles.documentText}>Bank account information</Text>
                        </View>
                    </View>
                </View>

                {/* Help Section */}
                <View style={styles.helpCard}>
                    <Ionicons name="help-circle-outline" size={24} color="green" />
                    <View style={styles.helpContent}>
                        <Text style={styles.helpTitle}>Need Assistance?</Text>
                        <Text style={styles.helpText}>
                            Contact support if you have questions about the verification process
                        </Text>
                    </View>
                </View>
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
    heroCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    heroGradient: {
        padding: 32,
        alignItems: 'center',
    },
    heroIconContainer: {
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    statusIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusContent: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    statusDescription: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
    },
    pendingUpdateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    pendingUpdateText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#f59e0b',
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 12,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        gap: 12,
    },
    infoBullet: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    infoDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsMono',
        color: '#6b7280',
        lineHeight: 18,
    },
    documentsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    documentText: {
        fontSize: 14,
        color: '#4b5563',
        fontFamily: 'PoppinsSemiBold',
        flex: 1,
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    helpContent: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    helpText: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        lineHeight: 18,
    },
});

export default VerificationManagementCenter;