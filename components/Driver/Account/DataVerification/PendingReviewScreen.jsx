// components/Driver/Account/DataVerification/PendingReviewScreen.js
import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Image,
    StyleSheet,
    RefreshControl,
    Animated
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useRouter} from 'expo-router';
import CustomHeader from '../../../CustomHeader';

function PendingReviewScreen({verification, userData, onRefresh}) {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [pulseAnim] = useState(new Animated.Value(1));

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };

    const handleEditSubmission = () => {
        router.push('/driver/account/verification?edit=true');
    };

    const getVehicleTypeName = (type) => {
        const names = {
            bicycle: 'Bicycle',
            motorcycle: 'Motorcycle',
            tricycle: 'Tricycle',
            car: 'Car',
            van: 'Van',
            truck: 'Truck'
        };
        return names[type] || 'Vehicle';
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

    const getSubmissionInfo = () => {
        const submissions = verification?.submissions || [];
        const latestSubmission = submissions[submissions.length - 1];
        return {
            date: latestSubmission?.submittedAt,
            type: latestSubmission?.submissionType,
            count: submissions.length
        };
    };

    const submissionInfo = getSubmissionInfo();
    const vehicleType = verification?.specificVerification?.activeVerificationType;

    // Pulsating animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, []);


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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#10b981"
                        colors={['#10b981']}
                    />
                }
            >
                {/* Status Header */}
                <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    style={styles.statusCard}
                >
                    <Animated.View style={{transform: [{scale: pulseAnim}]}}>
                        <View style={styles.statusIconContainer}>
                            <Ionicons name="time-outline" size={48} color="#fff"/>
                        </View>
                    </Animated.View>
                    <Text style={styles.statusTitle}>Under Review</Text>
                    <Text style={styles.statusSubtitle}>
                        Your documents are being verified by our team
                    </Text>
                    <View style={styles.statusBadge}>
                        <View style={styles.pulseDot}/>
                        <Text style={styles.statusBadgeText}>Pending Admin Approval</Text>
                    </View>
                </LinearGradient>

                {/* Timeline Info */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calendar-outline" size={24} color="#10b981"/>
                        <Text style={styles.cardTitle}>Submission Details</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Submitted On:</Text>
                        <Text style={styles.infoValue}>
                            {formatDate(submissionInfo.date)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Submission Type:</Text>
                        <Text style={styles.infoValue}>
                            {submissionInfo.type === 'initial' ? 'Initial Submission' : 'Resubmission'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Expected Review Time:</Text>
                        <Text style={styles.infoValueHighlight}>24-48 hours</Text>
                    </View>

                    {submissionInfo.count > 1 && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total Submissions:</Text>
                            <Text style={styles.infoValue}>{submissionInfo.count}</Text>
                        </View>
                    )}
                </View>

                {/* Submission Summary */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text-outline" size={24} color="#10b981"/>
                        <Text style={styles.cardTitle}>Submission Summary</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981"/>
                        <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabel}>Vehicle Type</Text>
                            <Text style={styles.summaryValue}>
                                {getVehicleTypeName(vehicleType)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981"/>
                        <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabel}>Operational Area</Text>
                            <Text style={styles.summaryValue}>
                                {verification?.basicVerification?.operationalArea?.state},{' '}
                                {verification?.basicVerification?.operationalArea?.lga}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981"/>
                        <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabel}>Identification</Text>
                            <Text style={styles.summaryValue}>
                                {verification?.basicVerification?.identification?.type?.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981"/>
                        <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabel}>Bank Accounts</Text>
                            <Text style={styles.summaryValue}>
                                {verification?.basicVerification?.bankAccounts?.length || 0} account(s) added
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981"/>
                        <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabel}>Documents</Text>
                            <Text style={styles.summaryValue}>
                                All required documents uploaded
                            </Text>
                        </View>
                    </View>
                </View>

                {/* What's Next */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="information-circle-outline" size={24} color="#3b82f6"/>
                        <Text style={styles.cardTitle}>What Happens Next?</Text>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Document Review</Text>
                            <Text style={styles.stepDescription}>
                                Our team will carefully verify all submitted documents
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Quality Check</Text>
                            <Text style={styles.stepDescription}>
                                We'll ensure all information meets our standards
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Notification</Text>
                            <Text style={styles.stepDescription}>
                                You'll receive an SMS/email once review is complete
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Card */}
                <View style={styles.actionCard}>
                    <Ionicons name="alert-circle-outline" size={24} color="#6b7280"/>
                    <Text style={styles.actionText}>
                        Spotted an error in your submission? You can edit your documents
                        before the review is completed.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <Pressable
                    style={styles.editButton}
                    onPress={handleEditSubmission}
                >
                    <LinearGradient
                        colors={['#6b7280', '#4b5563']}
                        style={styles.editGradient}
                    >
                        <Ionicons name="create-outline" size={20} color="#fff"/>
                        <Text style={styles.editButtonText}>Edit Submission</Text>
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
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statusIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
        marginBottom: 8,
    },
    statusSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
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
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    infoLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
    },
    infoValue: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
    },
    infoValueHighlight: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#10b981',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        gap: 12,
    },
    summaryContent: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        textTransform: 'capitalize',
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
        fontFamily: 'PoppinsRegular',
        fontWeight: '600',
        color: '#3b82f6',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        lineHeight: 18,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 16,
    },
    actionText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#4b5563',
        lineHeight: 18,
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
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    editButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    editGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'PoppinsRegular',
        color: '#fff',
    },
});

export default PendingReviewScreen;