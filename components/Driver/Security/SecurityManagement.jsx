import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Animated,
    StatusBar,
} from 'react-native';
import {router} from 'expo-router';
import {toast} from 'sonner-native';
import CustomHeader from '../../CustomHeader';

function SecurityManagement({userData}) {
    const [securityStatus, setSecurityStatus] = useState({
        hasPin: false,
        emailVerified: false,
        hasPassword: true,
    });

    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        checkSecurityStatus();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const checkSecurityStatus = () => {
        setSecurityStatus({
            hasPin: userData?.authPin?.isEnabled || false,
            emailVerified: userData?.emailVerified || false,
            hasPassword: !!userData?.password,
        });
    };

    const getSecurityScore = () => {
        let score = 0;
        if (securityStatus.hasPin) score += 50;
        if (securityStatus.emailVerified) score += 50;
        return score;
    };

    const handleNavigateToEmail = () => {
        router.push('/driver/account/security/email');
    };

    const handleNavigateToPin = () => {
        if (!securityStatus.emailVerified) {
            toast.info('Please verify your email first before setting up PIN');
            router.push('/driver/account/security/email');
            return;
        }
        router.push('/driver/account/security/pin');
    };

    const handleNavigateToPassword = () => {
        if (!securityStatus.emailVerified) {
            toast.info('Please verify your email first before updating password');
            router.push('/driver/account/security/email');
            return;
        }
        router.push('/driver/account/security/password');
    };

    const BenefitItem = ({icon, text, active}) => (
        <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>{icon}</Text>
            <Text style={[styles.benefitText, active && styles.benefitTextActive]}>{text}</Text>
            {active && <Text style={styles.checkmark}>✓</Text>}
        </View>
    );

    const SecurityCard = ({title, description, status, action, icon, onPress, highlighted}) => (
        <TouchableOpacity
            style={[styles.securityCard, highlighted && styles.securityCardHighlighted]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{icon}</Text>
                <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardDescription}>{description}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={[styles.statusBadge, status === 'active' && styles.statusBadgeActive]}>
                    <Text style={[styles.statusText, status === 'active' && styles.statusTextActive]}>
                        {status === 'active' ? 'Active' : 'Not Set'}
                    </Text>
                </View>
                <Text style={styles.actionText}>{action} →</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <>

            <View style={styles.container}>
                <StatusBar barStyle="dark-content"/>
                <CustomHeader
                    title=""
                    onBackPress={() => router.back()}
                />


                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={{}}>
                        {/* Prep Talk Section */}
                        <View style={styles.prepTalkContainer}>
                            <Text style={styles.prepTalkIcon}>🛡️</Text>
                            <Text style={styles.prepTalkTitle}>Secure Your Account</Text>
                            <Text style={styles.prepTalkText}>
                                Your security is our priority. Set up these features to protect your account and ensure
                                safe deliveries.
                            </Text>

                            <View style={styles.securityScoreContainer}>
                                <Text style={styles.securityScoreLabel}>Security Score</Text>
                                <View style={styles.securityScoreBar}>
                                    <View style={[styles.securityScoreFill, {width: `${getSecurityScore()}%`}]}/>
                                </View>
                                <Text style={styles.securityScoreText}>{getSecurityScore()}% Complete</Text>
                            </View>

                            <View style={styles.benefitsContainer}>
                                <BenefitItem
                                    icon="✅"
                                    text="Quick access with PIN"
                                    active={securityStatus.hasPin}
                                />
                                <BenefitItem
                                    icon="📧"
                                    text="Verified email for recovery"
                                    active={securityStatus.emailVerified}
                                />
                                {/*<BenefitItem*/}
                                {/*    icon="🔒"*/}
                                {/*    text="Strong password protection"*/}
                                {/*    active={securityStatus.hasPassword}*/}
                                {/*/>*/}
                            </View>
                        </View>

                        {/* Security Cards */}
                        <View style={styles.cardsContainer}>
                            {!securityStatus.emailVerified && (
                                <SecurityCard
                                    title="Email Verification"
                                    description="Verify your email for account recovery"
                                    status={securityStatus.emailVerified ? 'active' : 'inactive'}
                                    action="Verify Now"
                                    icon="📧"
                                    onPress={handleNavigateToEmail}
                                    highlighted={true}
                                />
                            )}

                            <SecurityCard
                                title="Security PIN"
                                description="Quick access with your personal PIN"
                                status={securityStatus.hasPin ? 'active' : 'inactive'}
                                action={securityStatus.hasPin ? 'Update PIN' : 'Set PIN'}
                                icon="🔐"
                                onPress={handleNavigateToPin}
                            />

                            <SecurityCard
                                title="Password"
                                description="Secure your account with a strong password"
                                status="active"
                                action="Update Password"
                                icon="🔑"
                                onPress={handleNavigateToPassword}
                            />
                        </View>
                    </Animated.View>
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,

    },
    prepTalkContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 4,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',

    },
    prepTalkIcon: {
        fontSize: 48,
        fontFamily: 'PoppinsBold',
        textAlign: 'center',
        marginBottom: 12,
    },
    prepTalkTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#212529',
        textAlign: 'center',
        marginBottom: 8,
    },
    prepTalkText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    securityScoreContainer: {
        marginBottom: 24,
    },
    securityScoreLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8,
    },
    securityScoreBar: {
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    securityScoreFill: {
        height: '100%',
        backgroundColor: '#28a745',
        borderRadius: 4,
    },
    securityScoreText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6c757d',
        textAlign: 'right',
    },
    benefitsContainer: {
        gap: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitIcon: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
    },
    benefitText: {
        flex: 1,
        fontFamily: 'PoppinsRegular',
        fontSize: 15,
        color: '#6c757d',
    },
    benefitTextActive: {
        color: '#28a745',
        fontWeight: '500',
    },
    checkmark: {
        fontSize: 18,
        color: '#28a745',
        fontWeight: '700',
    },
    cardsContainer: {
        padding: 16,
        gap: 12,
    },
    securityCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    securityCardHighlighted: {
        borderWidth: 2,
        borderColor: '#007bff',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    cardIcon: {
        fontSize: 32,
        fontFamily: 'PoppinsBold',
    },
    cardTitleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6c757d',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
    },
    statusBadgeActive: {
        backgroundColor: '#d4edda',
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        fontWeight: '600',
        color: '#6c757d',
    },
    statusTextActive: {
        color: '#155724',
    },
    actionText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
                fontWeight: '600',
                color: '#007bff',
    },
    screenHeader: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    screenIcon: {
        fontSize: 56,
        marginBottom: 16,
    },
    screenTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#212529',
        textAlign: 'center',
        marginBottom: 8,
    },
    screenSubtitle: {
        fontSize: 15,
        color: '#6c757d',
        textAlign: 'center',
    },
    formContainer: {
        padding: 24,
    },
    infoText: {
        fontSize: 15,
        color: '#495057',
        lineHeight: 22,
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#e7f3ff',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 8,
    },
    otpBox: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#dee2e6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    otpDigit: {
        fontSize: 28,
        fontWeight: '700',
        color: '#212529',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 24,
        padding: 12,
        backgroundColor: '#fff3cd',
        borderRadius: 8,
    },
    timerText: {
        fontSize: 14,
        color: '#856404',
    },
    timerValue: {
        fontWeight: '700',
        fontSize: 16,
    },
    expiredText: {
        fontSize: 14,
        color: '#dc3545',
        fontWeight: '600',
    },
    hiddenInputContainer: {
        marginBottom: 16,
        gap: 8,
    },
    hiddenInput: {
        fontSize: 12,
        color: '#007bff',
        textAlign: 'center',
        padding: 8,
        backgroundColor: '#e7f3ff',
        borderRadius: 4,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 12,
    },
    pinDisplay: {
        fontSize: 32,
        fontWeight: '700',
        color: '#212529',
        textAlign: 'center',
        letterSpacing: 8,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#dee2e6',
        marginBottom: 8,
    },
    passwordDisplay: {
        fontSize: 24,
        fontWeight: '700',
        color: '#212529',
        textAlign: 'center',
        letterSpacing: 4,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#dee2e6',
        marginBottom: 8,
    },
    inputHint: {
        fontSize: 13,
        color: '#6c757d',
        textAlign: 'center',
    },
    requirementsToggle: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: '600',
        textAlign: 'center',
    },
    requirementsContainer: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 12,
    },
    requirementItem: {
        fontSize: 13,
        color: '#dc3545',
        marginBottom: 6,
        lineHeight: 20,
    },
    requirementMet: {
        color: '#28a745',
        fontWeight: '500',
    },
    errorContainer: {
        backgroundColor: '#f8d7da',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#dc3545',
    },
    errorText: {
        fontSize: 14,
        color: '#721c24',
        lineHeight: 20,
    },
    primaryButton: {
        backgroundColor: '#007bff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#007bff',
        marginBottom: 12,
    },
    secondaryButtonText: {
        color: '#007bff',
        fontSize: 16,
        fontWeight: '600',
    },
    textButton: {
        padding: 12,
        alignItems: 'center',
    },
    textButtonText: {
        color: '#6c757d',
        fontSize: 15,
        fontWeight: '500',
    },
});

export default SecurityManagement;