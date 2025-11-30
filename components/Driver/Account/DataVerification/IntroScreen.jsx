// components/Driver/Account/Verification/IntroScreen.js
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function IntroScreen({ onStart, verificationStatus }) {
    const getStatusInfo = () => {
        switch (verificationStatus) {
            case 'approved':
                return {
                    icon: 'checkmark-circle',
                    color: '#10b981',
                    title: 'Verification Complete',
                    message: 'Your documents have been approved. You can start accepting orders!'
                };
            case 'pending_review':
                return {
                    icon: 'time',
                    color: '#f59e0b',
                    title: 'Under Review',
                    message: 'Your documents are being reviewed. This usually takes 24-48 hours.'
                };
            case 'rejected':
                return {
                    icon: 'close-circle',
                    color: '#ef4444',
                    title: 'Verification Rejected',
                    message: 'Some documents were rejected. Please review and resubmit.'
                };
            default:
                return null;
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <View style={styles.container}>
            {/*{statusInfo && (*/}
            {/*    <View style={[styles.statusCard, { borderColor: statusInfo.color }]}>*/}
            {/*        <Ionicons name={statusInfo.icon} size={48} color={statusInfo.color} />*/}
            {/*        <Text style={styles.statusTitle}>{statusInfo.title}</Text>*/}
            {/*        <Text style={styles.statusMessage}>{statusInfo.message}</Text>*/}
            {/*    </View>*/}
            {/*)}*/}

            <View style={styles.welcomeCard}>
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.iconContainer}
                >
                    <Ionicons name="shield-checkmark" size={40} color="#fff" />
                </LinearGradient>

                <Text style={styles.title}>Data Verification</Text>
                <Text style={styles.subtitle}>
                    Verify your documents to start earning with confidence
                </Text>
            </View>

            <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>Why verify?</Text>

                <View style={styles.benefitItem}>
                    <View style={styles.benefitIconContainer}>
                        <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                    </View>
                    <View style={styles.benefitText}>
                        <Text style={styles.benefitTitle}>Enhanced Security</Text>
                        <Text style={styles.benefitDescription}>
                            Protect yourself and clients with verified credentials
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitItem}>
                    <View style={styles.benefitIconContainer}>
                        <Ionicons name="people" size={24} color="#10b981" />
                    </View>
                    <View style={styles.benefitText}>
                        <Text style={styles.benefitTitle}>Build Trust</Text>
                        <Text style={styles.benefitDescription}>
                            Verified drivers get more order requests
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitItem}>
                    <View style={styles.benefitIconContainer}>
                        <Ionicons name="trending-up" size={24} color="#10b981" />
                    </View>
                    <View style={styles.benefitText}>
                        <Text style={styles.benefitTitle}>Priority Access</Text>
                        <Text style={styles.benefitDescription}>
                            Get matched with premium delivery opportunities
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitItem}>
                    <View style={styles.benefitIconContainer}>
                        <Ionicons name="time" size={24} color="#10b981" />
                    </View>
                    <View style={styles.benefitText}>
                        <Text style={styles.benefitTitle}>Quick Process</Text>
                        <Text style={styles.benefitDescription}>
                            Usually takes 5-10 minutes to complete
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.infoText}>
                    Have your documents ready: ID card, passport photo, vehicle pictures, and bank details
                </Text>
            </View>

            <Pressable style={styles.startButton} onPress={onStart}>
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.startGradient}
                >
                    <Text style={styles.startButtonText}>
                        {verificationStatus === 'rejected' ? 'Update Documents' : 'Get Started'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    statusTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        marginTop: 12
    },
    statusMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8
    },
    welcomeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        textAlign: 'center'
    },
    benefitsContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    benefitsTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 14
    },
    benefitItem: {
        flexDirection: 'row',
        marginBottom: 16
    },
    benefitIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    benefitText: {
        flex: 1
    },
    benefitTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    benefitDescription: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        lineHeight: 20
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#dbeafe',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'flex-start'
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#1e40af',
        marginLeft: 12,
        lineHeight: 20
    },
    startButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24
    },
    startGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        gap: 8
    },
    startButtonText: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    }
});

export default IntroScreen;