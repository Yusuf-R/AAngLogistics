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
    ScrollView,
} from 'react-native';
import { toast } from 'sonner-native';
import { router } from 'expo-router';
import CustomHeader from "../../CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import DriverUtils from "../../../utils/DriverUtilities";
import SessionManager from "../../../lib/SessionManager";

function PasswordManagement({ userData }) {
    const email = userData?.email || '';
    const isEmailVerified = userData?.emailVerified || false;

    // Check if user has password (Credentials auth method)
    const hasCredentials = userData?.authMethods?.some(method => method.type === 'Credentials') || false;

    // Determine action: 'set' or 'update'
    const action = hasCredentials ? 'update' : 'set';

    // States
    const [step, setStep] = useState('request');
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [timer, setTimer] = useState(180);
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Refs
    const otpInputRefs = useRef([]);

    // Password validation states
    const [passwordCriteria, setPasswordCriteria] = useState({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        passwordsMatch: false,
    });

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

    // Validate password as user types
    useEffect(() => {
        setPasswordCriteria({
            minLength: newPassword.length >= 8,
            hasUppercase: /[A-Z]/.test(newPassword),
            hasLowercase: /[a-z]/.test(newPassword),
            hasNumber: /\d/.test(newPassword),
            hasSpecial: /[@$!%*?&#]/.test(newPassword),
            passwordsMatch: newPassword === confirmPassword && newPassword.length > 0,
        });
    }, [newPassword, confirmPassword]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Request verification token
    const handleRequestToken = async () => {
        setLoading(true);

        try {
            const obj = { email, reqType: 'PasswordReset' };
            await DriverUtils.GetToken(obj);

            toast.success('Verification code sent!', {
                description: `Check your inbox at ${email}`,
            });

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

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        // Auto-move to password step when OTP complete
        if (index === 5 && value) {
            const fullOtp = [...newOtp.slice(0, 5), value].join('');
            if (fullOtp.length === 6) {
                Keyboard.dismiss();
                setTimeout(() => setStep('enter-password'), 300);
            }
        }
    };

    const handleKeyPress = (index, key) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    // Check if all criteria met
    const isPasswordValid = () => {
        return Object.values(passwordCriteria).every(criterion => criterion === true);
    };

    // Submit password
    const handleSubmitPassword = async () => {
        if (!isPasswordValid()) {
            toast.error('Invalid password', {
                description: 'Please meet all password requirements',
            });
            return;
        }

        setLoading(true);

        try {
            const otpCode = otp.join('');
            const obj = {
                email,
                token: otpCode,
                newPassword: newPassword,
                reqType: 'PasswordReset',
            };

            const resp = await DriverUtils.UpdatePassword(obj);

            setIsSuccess(true);
            toast.success(`Password ${action === 'set' ? 'set' : 'updated'} successfully!`);
            await SessionManager.updateUser(resp.user);

            setTimeout(() => {
                router.back();
            }, 2000);
        } catch (error) {
            toast.error(`Failed to ${action} password`, {
                description: error.message || 'Please try again',
            });
        } finally {
            setLoading(false);
        }
    };

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
                    title={`${action === 'set' ? 'Set' : 'Update'} Password`}
                    onBackPress={() => router.back()}
                />
                <View style={styles.container}>
                    <View style={styles.successContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                        </View>
                        <Text style={styles.successTitle}>Password {action === 'set' ? 'Set' : 'Updated'} Successfully!</Text>
                        <Text style={styles.successMessage}>
                            Your password has been {action === 'set' ? 'created' : 'updated'}. Redirecting...
                        </Text>
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <CustomHeader
                title={`${action === 'set' ? 'Set' : 'Update'} Password`}
                onBackPress={() => {
                    if (step === 'verify' && !loading) {
                        setStep('request');
                    } else if (step === 'enter-password' && !loading) {
                        setStep('verify');
                    } else {
                        router.back();
                    }
                }}
            />
            <StatusBar barStyle="dark-content" />

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="key-outline" size={48} color="#6366F1" />
                    </View>
                    <Text style={styles.title}>
                        {action === 'set' ? 'Set Your Password' : 'Update Your Password'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'request'
                            ? action === 'set'
                                ? `Your account was created via social login and doesn't have a password yet. Let's set one up for added security.`
                                : `We'll send a verification code to ${email} to confirm it's you.`
                            : step === 'verify'
                                ? `Enter the verification code sent to ${email}.`
                                : 'Create a strong password that meets all the requirements below.'
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
                                                    handleKeyPress(index, key)
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

                        {/* Continue Button */}
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                (loading || otp.join('').length !== 6) && styles.buttonDisabled
                            ]}
                            onPress={() => setStep('enter-password')}
                            disabled={loading || otp.join('').length !== 6}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Continue</Text>
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

                {step === 'enter-password' && (
                    <View style={styles.formContainer}>
                        {/* New Password */}
                        <View style={styles.passwordSection}>
                            <Text style={styles.passwordLabel}>New Password</Text>
                            <View style={styles.passwordInputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.passwordIcon} />
                                <TextInput
                                    style={styles.passwordInput}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                    <Ionicons
                                        name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.passwordSection}>
                            <Text style={styles.passwordLabel}>Confirm Password</Text>
                            <View style={styles.passwordInputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.passwordIcon} />
                                <TextInput
                                    style={styles.passwordInput}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Re-enter new password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Requirements */}
                        <View style={styles.requirementsContainer}>
                            <Text style={styles.requirementsTitle}>Password must contain:</Text>

                            <PasswordRequirement
                                met={passwordCriteria.minLength}
                                text="At least 8 characters"
                            />
                            <PasswordRequirement
                                met={passwordCriteria.hasUppercase}
                                text="One uppercase letter (A-Z)"
                            />
                            <PasswordRequirement
                                met={passwordCriteria.hasLowercase}
                                text="One lowercase letter (a-z)"
                            />
                            <PasswordRequirement
                                met={passwordCriteria.hasNumber}
                                text="One number (0-9)"
                            />
                            <PasswordRequirement
                                met={passwordCriteria.hasSpecial}
                                text="One special character (@$!%*?&#)"
                            />
                            <PasswordRequirement
                                met={passwordCriteria.passwordsMatch}
                                text="Passwords match"
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                (loading || !isPasswordValid()) && styles.buttonDisabled
                            ]}
                            onPress={handleSubmitPassword}
                            disabled={loading || !isPasswordValid()}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {action === 'set' ? 'Set Password' : 'Update Password'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </>
    );
}

// Password Requirement Component
const PasswordRequirement = ({ met, text }) => (
    <View style={styles.requirementItem}>
        <Ionicons
            name={met ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={met ? "#10B981" : "#D1D5DB"}
        />
        <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
            {text}
        </Text>
    </View>
);

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
    passwordSection: {
        marginBottom: 24,
    },
    passwordLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
        marginBottom: 8,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    passwordIcon: {
        marginRight: 4,
    },
    passwordInput: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: '#111827',
    },
    requirementsContainer: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    requirementsTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 12,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 10,
    },
    requirementText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    requirementTextMet: {
        color: '#10B981',
        fontWeight: '500',
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

export default PasswordManagement;