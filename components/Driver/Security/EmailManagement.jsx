import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import {toast} from 'sonner-native';
import {router} from 'expo-router';
import CustomHeader from "../../CustomHeader";
import {Ionicons} from "@expo/vector-icons";
import DriverUtils from "../../../utils/DriverUtilities"
import SessionManager from "../../../lib/SessionManager";

function EmailVerificationScreen({userData}) {
    const isEmailVerified = userData?.emailVerified || false;
    const email = userData?.email || '';

    // States
    const [step, setStep] = useState('request'); // 'request' or 'verify'
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(180); // 3 minutes
    const [canResend, setCanResend] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);

    // Refs for OTP inputs
    const inputRefs = useRef([]);

    // Timer countdown
    useEffect(() => {
        if (step === 'verify' && !isSuccess) {
            // Expiry timer (3 minutes)
            if (timer > 0) {
                const expiryInterval = setInterval(() => {
                    setTimer(prev => {
                        if (prev <= 1) {
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                // Resend timer (30 seconds)
                const resendInterval = setInterval(() => {
                    setResendTimer(prev => {
                        if (prev <= 1) {
                            setCanResend(true);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                return () => {
                    clearInterval(expiryInterval);
                    clearInterval(resendInterval);
                };
            }
        }
    }, [step, isSuccess, timer]);

    // Format timer display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Request verification token
    const handleRequestToken = async () => {
        setLoading(true);

        try {
            const obj = {email, reqType: 'EmailVerification'};
            await DriverUtils.GetToken(obj)
            // Simulate API call
            // await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success('Verification code sent!', {
                description: `Check your inbox at ${email}`,
            });
            toast.success(`Token sent: ${resp.token}`);
            setStep('verify');
            setTimer(180);
            setResendTimer(30);
            setCanResend(false);
        } catch (error) {
            toast.error('Failed to send code', {
                description: 'Please try again',
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP input change
    const handleOtpChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all filled
        if (index === 5 && value) {
            const fullOtp = [...newOtp.slice(0, 5), value].join('');
            if (fullOtp.length === 6) {
                Keyboard.dismiss();
                setTimeout(() => handleVerifyOtp(fullOtp), 300);
            }
        }
    };

    // Handle backspace
    const handleKeyPress = (index, key) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (code = null) => {
            const otpCode = code || otp.join('');

            if (otpCode.length !== 6) {
                toast.error('Invalid code', {
                    description: 'Please enter all 6 digits',
                });
                return;
            }

            setLoading(true);

            try {
                const obj = {email, reqType: 'EmailVerification', token: otpCode};
                const resp = await DriverUtils.VerifyEmail(obj)
                setIsSuccess(true);
                toast.success('Congratulations: Email verified!');
                await SessionManager.updateUser(resp.user);

                // Reset to initial state after 2 seconds
                setTimeout(() => {
                    setStep('request');
                    setOtp(['', '', '', '', '', '']);
                    setIsSuccess(false);
                }, 2000);
            } catch
                (error) {
                toast.error('Verification failed', {
                    description: 'Invalid or expired code. Please try again.',
                });
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } finally {
                setLoading(false);
            }
        }
    ;

    // Resend code
    const handleResendCode = () => {
        setOtp(['', '', '', '', '', '']);
        setTimer(180);
        setResendTimer(30);
        setCanResend(false);
        handleRequestToken();
    };

    // Render already verified state
    if (isEmailVerified && !isSuccess && step === 'request') {
        return (
            <>
                <CustomHeader
                    title=""
                    onBackPress={() => router.back()}
                />
                <View style={styles.container}>
                    <View style={styles.alreadyVerifiedContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="checkmark-circle" size={80} color="#10B981"/>
                        </View>
                        <Text style={styles.alreadyVerifiedTitle}>Email Verified!</Text>
                        <Text style={styles.alreadyVerifiedMessage}>
                            Your email address has been successfully verified.
                            You're all set!
                        </Text>
                        <View style={styles.verifiedEmailContainer}>
                            <Ionicons name="mail" size={20} color="#0f9b0f"/>
                            <Text style={styles.verifiedEmail}>{email}</Text>
                        </View>
                    </View>
                </View>
            </>
        );
    }

    // Render success state (temporary)
    if (isSuccess) {
        return (
            <>
                <CustomHeader
                    title="Email Verification"
                    onBackPress={() => router.back()}
                />
                <View style={styles.container}>
                    <View style={styles.successContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="checkmark-circle" size={80} color="#10B981"/>
                        </View>
                        <Text style={styles.successTitle}>Verification Successful!</Text>
                        <Text style={styles.successMessage}>
                            Your email has been verified. Redirecting...
                        </Text>
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <CustomHeader
                title="Email Verification"
                onBackPress={() => step === 'verify' && !loading ? setStep('request') : router.back()}
            />
            <StatusBar barStyle="dark-content"/>

            <View style={styles.container}>
                {/* Icon and Title */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="mail-outline" size={48} color="#6366F1"/>
                    </View>
                    <Text style={styles.title}>Verify your email</Text>
                    <Text style={styles.subtitle}>
                        {step === 'request'
                            ? `We'll send a verification code to ${email}. Please check your inbox to get the code.`
                            : `We have sent a verification code to ${email}. Please check your inbox and input the code below to activate your account.`
                        }
                    </Text>
                </View>

                {step === 'request' ? (
                    // Request Token Step
                    <View style={styles.formContainer}>
                        <View style={styles.emailInputContainer}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <View style={styles.emailDisplay}>
                                <Ionicons name="mail" size={20} color="#6B7280"/>
                                <Text style={styles.emailText}>{email}</Text>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="lock-closed" size={14} color="#6366F1"/>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.buttonDisabled]}
                            onPress={handleRequestToken}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff"/>
                            ) : (
                                <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Verify OTP Step
                    <View style={styles.formContainer}>
                        {/* OTP Input Boxes */}
                        <View style={styles.otpMainContainer}>
                            <View style={styles.otpRow}>
                                {otp.map((digit, index) => (
                                    <React.Fragment key={index}>
                                        <View style={styles.otpBoxContainer}>
                                            <TextInput
                                                ref={ref => inputRefs.current[index] = ref}
                                                style={[
                                                    styles.otpBox,
                                                    digit && styles.otpBoxFilled
                                                ]}
                                                value={digit}
                                                onChangeText={(value) => handleOtpChange(index, value)}
                                                onKeyPress={({nativeEvent: {key}}) => handleKeyPress(index, key)}
                                                keyboardType="number-pad"
                                                maxLength={1}
                                                selectTextOnFocus
                                                editable={!loading && !isSuccess}
                                            />
                                        </View>
                                        {index === 2 && (
                                            <View style={styles.separator}>
                                                <View style={styles.separatorDot}/>
                                            </View>
                                        )}
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>

                        {/* Timer */}
                        <View style={styles.timerContainer}>
                            {timer > 0 ? (
                                <View style={styles.timerContent}>
                                    <Ionicons name="time-outline" size={18} color="#F59E0B"/>
                                    <Text style={styles.timerText}>
                                        Code expires in: <Text style={styles.timerValue}>{formatTime(timer)}</Text>
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.expiredContent}>
                                    <Ionicons name="alert-circle-outline" size={18} color="#EF4444"/>
                                    <Text style={styles.expiredText}>Code expired</Text>
                                </View>
                            )}
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                (loading || otp.join('').length !== 6) && styles.buttonDisabled
                            ]}
                            onPress={() => handleVerifyOtp()}
                            disabled={loading || otp.join('').length !== 6}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff"/>
                            ) : (
                                <Text style={styles.primaryButtonText}>Verify Email</Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend Code */}
                        <View style={styles.resendContainer}>
                            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResendCode} disabled={loading}>
                                    <Text style={styles.resendButton}>Resend Code</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.resendDisabled}>
                                    Resend available in {resendTimer}s
                                </Text>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 32,
        backgroundColor: '#fff',
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 28,
    },
    formContainer: {
        padding: 24,
    },
    emailInputContainer: {
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
        marginBottom: 8,
    },
    emailDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    emailText: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    verifiedBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpMainContainer: {
        marginBottom: 24,
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    otpBoxContainer: {
        width: 48,
        height: 56,
    },
    otpBox: {
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    otpBoxFilled: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
    },
    separator: {
        width: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    separatorDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    timerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timerText: {
        fontSize: 14,
        color: '#92400E',
    },
    timerValue: {
        fontWeight: '700',
        fontSize: 15,
        color: '#B45309',
    },
    expiredContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    expiredText: {
        fontSize: 14,
        color: '#991B1B',
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    resendLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    resendButton: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6366F1',
        fontWeight: '600',
    },
    resendDisabled: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    alreadyVerifiedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconCircle: {
        marginBottom: 24,
    },
    alreadyVerifiedTitle: {
        fontSize: 26,
        fontFamily: 'PoppinsSemiBold',
        color: '#10B981',
        marginBottom: 12,
        textAlign: 'center',
    },
    alreadyVerifiedMessage: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    verifiedEmailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
    },
    verifiedEmail: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#2a5298',
        fontWeight: '500',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default EmailVerificationScreen;