import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const PushNotificationModal = ({ visible, onEnable, onMaybeLater }) => {
    const benefits = [
        {
            icon: 'notifications-outline',
            title: 'Real-time Order Updates',
            description: 'Know exactly when your order is picked up, in transit, and delivered'
        },
        {
            icon: 'car-outline',
            title: 'Driver Assignment',
            description: 'Get instant alerts when a driver accepts your delivery request'
        },
        {
            icon: 'card-outline',
            title: 'Payment Confirmations',
            description: 'Secure notifications for all payment transactions'
        },
        {
            icon: 'shield-checkmark-outline',
            title: 'Security Alerts',
            description: 'Important account activity and safety notifications'
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
                            <Ionicons name="notifications" size={40} color="#60a5fa" />
                        </View>
                        <Text style={styles.title}>Stay in the Loop</Text>
                        <Text style={styles.subtitle}>
                            Enable notifications to never miss important updates about your deliveries
                        </Text>
                    </View>

                    {/* Benefits List */}
                    <View style={styles.benefitsList}>
                        {benefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                                <View style={styles.benefitIconContainer}>
                                    <Ionicons name={benefit.icon} size={24} color="#60a5fa" />
                                </View>
                                <View style={styles.benefitTextContainer}>
                                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={onEnable}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Enable Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onMaybeLater}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Privacy Note */}
                    <Text style={styles.privacyNote}>
                        You can change this anytime in Security settings
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        width: width - 40,
        maxWidth: 440,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    benefitsList: {
        marginBottom: 24,
    },
    benefitItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    benefitIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    benefitTextContainer: {
        flex: 1,
        paddingTop: 2,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    benefitDescription: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
    },
    buttonContainer: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#60a5fa',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#60a5fa',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
    },
    secondaryButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
    },
    privacyNote: {
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
});

export default PushNotificationModal;