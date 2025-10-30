import React, { useState, useEffect, useRef } from 'react';
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
import { toast } from 'sonner-native';
import { router } from 'expo-router';
import CustomHeader from "../../CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import DriverUtils from "../../../utils/DriverUtilities";
import SessionManager from "../../../lib/SessionManager";

function PinManagement({ userData }) {
    const hasPinEnabled = userData?.authPin?.isEnabled || false;
    const email = userData?.email || '';
    const isEmailVerified = userData?.emailVerified || false;

    // Determine action: 'set' or 'reset'
    const action = hasPinEnabled ? 'reset' : 'set';

    // States
    const [step, setStep] = useState('request'); // 'request', 'verify', 'enter-pin'
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(180); // 3 minutes
    const [resendTimer, setResendTimer] = useState(30); // 30 seconds
    const [canResend, setCanResend] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Refs for inputs
    const otpInputRefs = useRef([]);
    const pinInputRefs = useRef([]);
    const confirmPinInputRefs = useRef([]);

    // Check email verification on mount
    useEffect(() => {
        if (!isEmailVerified) {
            toast.error('Email not verified', {
                description: 'Please verify your email first',
            });
            setTimeout(() => {
                router.replace('/driver/account/security/email');
            }, 2000);
        }
    }, [isEmailVerified]);

    // Timer countdown
    useEffect(() => {
        if (step === 'verify' && !isSuccess) {
            if (timer > 0) {
                const expiryInterval = setInterval(() => {
                    setTimer(prev => (prev <= 1 ? 0 : prev - 1));
                }, 1000);

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
            const obj = { email, reqType: 'PinVerification' };
            await DriverUtils.GetToken(obj);

            toast.success('Verification code sent!: Check your mail inbox');

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
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        if (index === 5 && value) {
            const fullOtp = [...newOtp.slice(0, 5), value].join('');
            if (fullOtp.length === 6) {
                Keyboard.dismiss();
                setTimeout(() => handleVerifyOtp(fullOtp), 300);
            }
        }
    };

    // Handle PIN input change
    const handlePinChange = (index, value, isPinConfirm = false) => {
        if (value && !/^\d+$/.test(value)) return;

        const refs = isPinConfirm ? confirmPinInputRefs : pinInputRefs;
        const currentPin = isPinConfirm ? confirmPin : pin;
        const setCurrentPin = isPinConfirm ? setConfirmPin : setPin;

        const newPin = [...currentPin];
        newPin[index] = value;
        setCurrentPin(newPin);

        if (value && index < 5) {
            refs.current[index + 1]?.focus();
        }
    };

    // Handle backspace
    const handleKeyPress = (index, key, refs, currentValues) => {
        if (key === 'Backspace' && !currentValues[index] && index > 0) {
            refs.current[index - 1]?.focus();
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
            // Verify token with backend
            const obj = { email, reqType: 'PinVerification', token: otpCode };
            await DriverUtils.VerifyAuthToken(obj);

            toast.success('Code verified!', { description: 'Now enter your new PIN'});

            setStep('enter-pin');
        } catch (error) {
            toast.error('Verification failed', {
                description: 'Invalid or expired code. Please try again.',
            });
            setOtp(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Submit PIN
    const handleSubmitPin = async () => {
        const pinCode = pin.join('');
        const confirmPinCode = confirmPin.join('');

        // Validation
        if (pinCode.length !== 6) {
            toast.error('Invalid PIN', {
                description: 'PIN must be 6 digits',
            });
            return;
        }

        if (pinCode !== confirmPinCode) {
            toast.error('PINs do not match', {
                description: 'Please ensure both PINs are the same',
            });
            return;
        }

        setLoading(true);

        try {
            const otpCode = otp.join('');
            const obj = {
                email,
                reqType: 'SetAuthorizationPin',
                token: otpCode,
                pin: pinCode
            };

            const resp = await DriverUtils.SetAuthPin(obj);

            setIsSuccess(true);
            toast.success(`PIN ${action === 'set' ? 'set' : 'reset'} successfully!`);
            await SessionManager.updateUser(resp.user);

            setTimeout(() => {
                router.back();
            }, 2000);
        } catch (error) {
            toast.error(`Failed to ${action} PIN`, {
                description: 'Please try again',
            });
        } finally {
            setLoading(false);
        }
    };

    // Resend code
    const handleResendCode = () => {
        setOtp(['', '', '', '', '', '']);
        setTimer(180);
        setResendTimer(30);
        setCanResend(false);
        handleRequestToken();
    };

    // Render success state
    if (isSuccess) {
        return (
            <>
                <CustomHeader
                    title={`${action === 'set' ? 'Set' : 'Reset'} PIN`}
                    onBackPress={() => router.back()}
                />
                <View style={styles.container}>
                    <View style={styles.successContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                        </View>
                        <Text style={styles.successTitle}>PIN {action === 'set' ? 'Set' : 'Reset'} Successfully!</Text>
                        <Text style={styles.successMessage}>
                            Your security PIN has been {action === 'set' ? 'created' : 'updated'}. Redirecting...
                        </Text>
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <CustomHeader
                title={`${action === 'set' ? 'Set' : 'Reset'} Security PIN`}
                onBackPress={() => {
                    if (step === 'verify' && !loading) {
                        setStep('request');
                    } else if (step === 'enter-pin' && !loading) {
                        setStep('verify');
                    } else {
                        router.back();
                    }
                }}
            />
            <StatusBar barStyle="dark-content" />

            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed-outline" size={48} color="#6366F1" />
                    </View>
                    <Text style={styles.title}>
                        {action === 'set' ? 'Set Your Security PIN' : 'Reset Your Security PIN'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'request'
                            ? `We'll send a verification code to ${email} to confirm it's you.`
                            : step === 'verify'
                                ? `Enter the verification code sent to ${email}.`
                                : 'Create a 6-digit PIN for quick and secure access.'
                        }
                    </Text>
                </View>

                {step === 'request' && (
                    <View style={styles.formContainer}>
                        <View style={styles.emailInputContainer}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <View style={styles.emailDisplay}>
                                <Ionicons name="mail" size={20} color="#6B7280" />
                                <Text style={styles.emailText}>{email}</Text>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
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
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {step === 'verify' && (
                    <View style={styles.formContainer}>
                        {/* OTP Input */}
                        <View style={styles.otpMainContainer}>
                            <View style={styles.otpRow}>
                                {otp.map((digit, index) => (
                                    <React.Fragment key={index}>
                                        <View style={styles.otpBoxContainer}>
                                            <TextInput
                                                ref={ref => otpInputRefs.current[index] = ref}
                                                style={[styles.otpBox, digit && styles.otpBoxFilled]}
                                                value={digit}
                                                onChangeText={(value) => handleOtpChange(index, value)}
                                                onKeyPress={({ nativeEvent: { key } }) =>
                                                    handleKeyPress(index, key, otpInputRefs, otp)
                                                }
                                                keyboardType="number-pad"
                                                maxLength={1}
                                                selectTextOnFocus
                                                editable={!loading}
                                            />
                                        </View>
                                        {index === 2 && (
                                            <View style={styles.separator}>
                                                <View style={styles.separatorDot} />
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
                                    <Ionicons name="time-outline" size={18} color="#F59E0B" />
                                    <Text style={styles.timerText}>
                                        Code expires in: <Text style={styles.timerValue}>{formatTime(timer)}</Text>
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.expiredContent}>
                                    <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
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
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Verify Code</Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend */}
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

                {step === 'enter-pin' && (
                    <View style={styles.formContainer}>
                        {/* New PIN */}
                        <View style={styles.pinSection}>
                            <Text style={styles.pinLabel}>Enter New PIN</Text>
                            <View style={styles.otpRow}>
                                {pin.map((digit, index) => (
                                    <React.Fragment key={index}>
                                        <View style={styles.otpBoxContainer}>
                                            <TextInput
                                                ref={ref => pinInputRefs.current[index] = ref}
                                                style={[styles.otpBox, digit && styles.otpBoxFilled]}
                                                value={digit}
                                                onChangeText={(value) => handlePinChange(index, value, false)}
                                                onKeyPress={({ nativeEvent: { key } }) =>
                                                    handleKeyPress(index, key, pinInputRefs, pin)
                                                }
                                                keyboardType="number-pad"
                                                maxLength={1}
                                                selectTextOnFocus
                                                secureTextEntry
                                                editable={!loading}
                                            />
                                        </View>
                                        {index === 2 && (
                                            <View style={styles.separator}>
                                                <View style={styles.separatorDot} />
                                            </View>
                                        )}
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>

                        {/* Confirm PIN */}
                        <View style={styles.pinSection}>
                            <Text style={styles.pinLabel}>Confirm New PIN</Text>
                            <View style={styles.otpRow}>
                                {confirmPin.map((digit, index) => (
                                    <React.Fragment key={index}>
                                        <View style={styles.otpBoxContainer}>
                                            <TextInput
                                                ref={ref => confirmPinInputRefs.current[index] = ref}
                                                style={[styles.otpBox, digit && styles.otpBoxFilled]}
                                                value={digit}
                                                onChangeText={(value) => handlePinChange(index, value, true)}
                                                onKeyPress={({ nativeEvent: { key } }) =>
                                                    handleKeyPress(index, key, confirmPinInputRefs, confirmPin)
                                                }
                                                keyboardType="number-pad"
                                                maxLength={1}
                                                selectTextOnFocus
                                                secureTextEntry
                                                editable={!loading}
                                            />
                                        </View>
                                        {index === 2 && (
                                            <View style={styles.separator}>
                                                <View style={styles.separatorDot} />
                                            </View>
                                        )}
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                (loading || pin.join('').length !== 6 || confirmPin.join('').length !== 6) && styles.buttonDisabled
                            ]}
                            onPress={handleSubmitPin}
                            disabled={loading || pin.join('').length !== 6 || confirmPin.join('').length !== 6}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {action === 'set' ? 'Set PIN' : 'Reset PIN'}
                                </Text>
                            )}
                        </TouchableOpacity>
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
        backgroundColor: '#D1FAE5',
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
        shadowOffset: { width: 0, height: 4 },
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
    pinSection: {
        marginBottom: 32,
    },
    pinLabel: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 16,
        textAlign: 'center',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconCircle: {
        marginBottom: 24,
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

export default PinManagement;