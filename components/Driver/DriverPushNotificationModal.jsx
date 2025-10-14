import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DriverPushNotificationModal = ({ visible, onEnable, onMaybeLater }) => {
    const benefits = [
        {
            icon: 'car-sport-outline',
            title: 'Instant Delivery Requests',
            description: 'Get real-time order alerts and be the first to accept deliveries'
        },
        {
            icon: 'cash-outline',
            title: 'Earnings Updates',
            description: 'Instant notifications for completed deliveries and payments'
        },
        {
            icon: 'navigate-outline',
            title: 'Navigation & Routing',
            description: 'Turn-by-turn directions and pickup/dropoff alerts'
        },
        {
            icon: 'shield-checkmark-outline',
            title: 'Safety & Emergency',
            description: 'Critical safety alerts and emergency notifications'
        },
        {
            icon: 'trending-up-outline',
            title: 'Performance Insights',
            description: 'Weekly earnings reports and performance metrics'
        },
        {
            icon: 'time-outline',
            title: 'Schedule Reminders',
            description: 'Shift reminders and peak hour notifications'
        }
    ];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onMaybeLater}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="car-sport" size={40} color="#10B981" />
                        </View>
                        <Text style={styles.title}>Maximize Your Earnings</Text>
                        <Text style={styles.subtitle}>
                            Enable notifications to get instant delivery requests and maximize your earning potential
                        </Text>
                    </View>

                    {/* Benefits Grid */}
                    <View style={styles.benefitsGrid}>
                        {benefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitCard}>
                                <View style={styles.benefitIconContainer}>
                                    <Ionicons name={benefit.icon} size={20} color="#10B981" />
                                </View>
                                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                                <Text style={styles.benefitDescription}>{benefit.description}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Warning for Denial */}
                    <View style={styles.warningBox}>
                        <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                        <Text style={styles.warningText}>
                            Without notifications, you'll miss time-sensitive delivery requests and may earn less
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={onEnable}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="notifications" size={20} color="#FFF" style={styles.buttonIcon} />
                            <Text style={styles.primaryButtonText}>Enable Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onMaybeLater}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Not Now</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Privacy Note */}
                    <Text style={styles.privacyNote}>
                        Required for real-time delivery operations. Change anytime in Settings.
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        width: width - 40,
        maxWidth: 400,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    benefitCard: {
        width: '48%',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    benefitIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    benefitTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 4,
    },
    benefitDescription: {
        fontSize: 10,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 14,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        color: '#92400E',
        lineHeight: 16,
    },
    buttonContainer: {
        gap: 10,
    },
    primaryButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonIcon: {
        marginRight: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    secondaryButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    privacyNote: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 16,
    },
});

export default DriverPushNotificationModal;