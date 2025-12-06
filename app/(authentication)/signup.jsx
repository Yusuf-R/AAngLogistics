// app/(authentication)/signup.jsx

import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Image,
    TouchableOpacity,
    StyleSheet,
    TextInput
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, Stack} from 'expo-router';
import LottieView from "lottie-react-native";
import {useAuth} from "../../context/auth";
import SessionManager from "../../lib/SessionManager";
import {useSessionStore} from "../../store/useSessionStore";
import StatusModal from "../../components/StatusModal/StatusModal";
import {LinearGradient} from 'expo-linear-gradient';

const loader = require("@/assets/animations/loader/spin-loader.json");

// Google OAuth
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Form and validation
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Icons
import Ionicons from '@expo/vector-icons/Ionicons';

// Utils
import SecureStorage from '../../lib/SecureStorage';
import ClientUtils from "../../utils/ClientUtilities";
import {useMutation} from "@tanstack/react-query";

// Validation schema
const signUpSchema = yup.object().shape({
    role: yup.string().required('Role is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup
        .string()
        .required('Password is required')
        .min(4, 'At least 4 chars')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,}$/, 'Include upper, lower, number'),
});

// Image assets
const googleIcon = require('../../assets/icons/googleIcon.png');

// Icon components with optimized sizes
const MailIcon = () => <Ionicons name="mail-outline" size={20} color="#6B7280"/>;
const EyeIcon = () => <Ionicons name="eye-outline" size={20} color="#6B7280"/>;
const EyeOffIcon = () => <Ionicons name="eye-off-outline" size={20} color="#6B7280"/>;
const AlertIcon = () => <Ionicons name="alert-circle" size={16} color="#EF4444"/>;
const UserIcon = () => <Ionicons name="person-outline" size={20} color="#6B7280"/>;
const CarIcon = () => <Ionicons name="car-sport-outline" size={20} color="#6B7280"/>;

// Header title with logo and role
function LogoTitle({role}) {
    const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Role';

    return (
        <View style={styles.headerContainer}>
            <Text style={styles.headerRole}>{displayRole}</Text>
            <Image
                source={require('../../assets/AAngLogo.png')}
                style={styles.headerLogo}
            />
        </View>
    );
}

export default function SignUp() {
    const [role, setRole] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Creating your account...');

    const router = useRouter();

    const mutation = useMutation({
        mutationKey: ['SignUp'],
        mutationFn: ClientUtils.SignUp,
    });

    const {control, handleSubmit, reset, formState: {errors}} = useForm({
        resolver: yupResolver(signUpSchema),
        defaultValues: {role: '', email: '', password: ''},
        mode: 'onTouched',
    });

    const {signInWithGoogle} = useAuth();

    useEffect(() => {
        async function loadRole() {
            let stored = useSessionStore.getState().role;

            if (!stored) {
                stored = await SecureStorage.getRole();

                if (stored) {
                    await SessionManager.updateRole(stored);
                } else {
                    router.replace('/(onboarding)/role-select?next=/(authentication)/signup');
                    return;
                }
            }

            setRole(stored);
            reset({role: stored, email: '', password: ''});
        }

        loadRole();
    }, [reset]);

    const onSubmit = async (data) => {
        setModalVisible(true);

        mutation.mutate(data, {
            onSuccess: async (respData) => {
                const {accessToken, refreshToken, user, expiresIn} = respData;

                await SessionManager.updateToken(accessToken, expiresIn);
                await SecureStorage.saveRefreshToken(refreshToken);
                await SessionManager.updateUser(user);
                await SessionManager.updateRole(user.role);
                await SessionManager.updateOnboardingStatus(true);

                setModalStatus('success');
                setModalMessage('Account created successfully 🚀');

                setTimeout(() => {
                    setModalStatus('loading');
                    setModalMessage('Redirecting to your dashboard ♻️');
                }, 2000);

                router.replace(`/(protected)/${user.role}/dashboard`);
            },

            onError: async (error) => {
                let errorMessage = 'Error creating account ⚠️';

                if (error.response?.status === 409) {
                    errorMessage = 'Duplicate Credentials ⚠️';
                } else if (error.message === "Network error") {
                    errorMessage = 'No internet connection 🔌';
                }

                setModalStatus('error');
                setModalMessage(errorMessage);
                setModalVisible(true);
            }
        });
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Lightweight gradient background instead of heavy image */}
            <LinearGradient
                colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
                style={styles.gradientBackground}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
            />


            <Stack.Screen
                options={{
                    animation: "slide_from_right",
                    // i need the back arrow to be a white color

                    headerShown: true,
                    headerTitle: () => <LogoTitle role={role}/>,
                    title: "Role",
                    headerTransparent: true,
                    headerStyle: {
                        elevation: 0,
                        shadowColor: 'transparent',
                    },
                    headerTintColor: '#FFFFFF',
                }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Animation Section - Compact */}
                    <View style={styles.animationContainer}>
                        <LottieView
                            source={require('../../assets/images/AAngAnimation.json')}
                            autoPlay
                            loop
                            style={styles.animation}
                        />
                        <Text style={styles.title}>Welcome to AAngLogistics</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>
                    </View>

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        {/* Email */}
                        <View style={styles.formControl}>
                            <Controller
                                name="email"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <View style={[
                                        styles.inputContainer,
                                        errors.email && styles.inputContainerError
                                    ]}>
                                        <View style={styles.iconWrapper}>
                                            <MailIcon />
                                        </View>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Email address"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                )}
                            />
                            {errors.email && (
                                <View style={styles.errorContainer}>
                                    <AlertIcon />
                                    <Text style={styles.errorText}>{errors.email?.message}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password */}
                        <View style={styles.formControl}>
                            <Controller
                                name="password"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <View style={[
                                        styles.inputContainer,
                                        errors.password && styles.inputContainerError
                                    ]}>
                                        <View style={styles.iconWrapper}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280"/>
                                        </View>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Password"
                                            secureTextEntry={!showPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        <TouchableOpacity
                                            style={styles.iconWrapper}
                                            onPress={() => setShowPassword((prev) => !prev)}
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {errors.password && (
                                <View style={styles.errorContainer}>
                                    <AlertIcon />
                                    <Text style={styles.errorText}>{errors.password?.message}</Text>
                                </View>
                            )}
                        </View>

                        {/* Role (read-only) */}
                        <View style={styles.formControl}>
                            <Controller
                                name="role"
                                control={control}
                                render={({field}) => {
                                    const display = field.value || role;
                                    if (!display) return null;
                                    const label = display.charAt(0).toUpperCase() + display.slice(1);
                                    return (
                                        <View style={[styles.inputContainer, styles.inputContainerReadOnly]}>
                                            <View style={styles.iconWrapper}>
                                                {display === 'client' ? <UserIcon /> : <CarIcon />}
                                            </View>
                                            <TextInput
                                                style={[styles.textInput, styles.readOnlyInput]}
                                                value={label}
                                                editable={false}
                                                placeholderTextColor="#374151"
                                            />
                                        </View>
                                    );
                                }}
                            />
                        </View>

                        {/* Submit Button */}
                        <Pressable
                            style={[
                                styles.submitButton,
                                mutation.isPending && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={mutation.isPending}
                        >
                            <Text style={styles.submitButtonText}>
                                {mutation.isPending ? 'Creating account...' : 'Sign Up'}
                            </Text>
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or sign up with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Sign In */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={signInWithGoogle}
                        >
                            <Image
                                source={googleIcon}
                                style={styles.googleIcon}
                            />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginLinkContainer}>
                            <Text style={styles.loginLinkText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/(authentication)/login')}>
                                <Text style={styles.loginLinkButton}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1e3a8a',
    },
    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerRole: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#FFFFFF',
    },
    headerLogo: {
        width: 40,
        height: 40,
        borderRadius: 100,
    },
    keyboardView: {
        flex: 1,
        paddingTop: 80, // Account for transparent header
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    animationContainer: {
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 16,
    },
    animation: {
        width: 180,
        height: 180,
    },
    title: {
        fontSize: 20,
        color: '#FFFFFF',
        fontFamily: 'PoppinsBold',
        textAlign: 'center',
        marginTop: -8,
    },
    subtitle: {
        fontSize: 14,
        color: '#DBEAFE',
        fontFamily: 'PoppinsRegular',
        marginTop: 4,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    formControl: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        height: 48,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingHorizontal: 4,
    },
    inputContainerError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    inputContainerReadOnly: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
    },
    iconWrapper: {
        width: 40,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
        paddingVertical: 0,
        height: '100%',
    },
    readOnlyInput: {
        color: '#6B7280',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 4,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 13,
        marginLeft: 4,
        fontFamily: 'PoppinsRegular',
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#3B82F6',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#93C5FD',
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 13,
        color: '#9CA3AF',
        fontFamily: 'PoppinsRegular',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 48,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 15,
        color: '#374151',
        fontFamily: 'PoppinsMedium',
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    loginLinkText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    loginLinkButton: {
        fontSize: 14,
        color: '#3B82F6',
        fontFamily: 'PoppinsSemiBold',
    },
});