// app/(authentication)/login.jsx

import React, {useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ImageBackground,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';

import {useRouter} from 'expo-router';
import ClientUtils from '../../utils/ClientUtilities';
import SecureStorage from '../../lib/SecureStorage';
import SessionManager from '../../lib/SessionManager';
import {useMutation} from '@tanstack/react-query';
import {useAuth} from '../../context/auth';
import StatusModal from '../../components/StatusModal/StatusModal';

import img from '../../assets/images/new.jpg';

const googleIcon = require('../../assets/icons/googleIcon.png');

const loginSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup
        .string()
        .required('Password is required')
        .min(4, 'At least 4 chars')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,}$/, 'Include upper, lower, number'),
});

const AlertIcon = () => <Ionicons name="alert-circle" size={16} color="#EF4444"/>;

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Logging in...');
    const router = useRouter();
    const {signInWithGoogle} = useAuth();

    const {control, handleSubmit, formState: {errors}} = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {email: '', password: ''},
        mode: 'onTouched',
    });

    const mutation = useMutation({
        mutationKey: ['Login'],
        mutationFn: ClientUtils.Login,
    });

    const onLogin = async (data) => {
        setModalStatus('loading');
        setModalMessage('Logging in..');
        setModalVisible(true);

        mutation.mutate(data, {
            onSuccess: async (respData) => {
                setModalStatus('success');
                setModalMessage('Login successful 🚀');

                const {accessToken, refreshToken, user, expiresIn} = respData;

                await SessionManager.updateToken(accessToken, expiresIn);
                await SecureStorage.saveRefreshToken(refreshToken);
                await SessionManager.updateUser(user);
                await SessionManager.updateRole(user.role);
                await SessionManager.updateOnboardingStatus(true);

                setTimeout(() => {
                    setModalStatus('loading');
                    setModalMessage('Redirecting to your dashboard ♻️');
                }, 2000);

                setTimeout(() => {
                    setModalVisible(false);
                    router.replace(`/(protected)/${user.role}/dashboard`);
                }, 3500);
            },
            onError: (error) => {
                let errorMessage = 'Login failed ⚠️';

                if (error?.response?.status === 401) {
                    errorMessage = 'Invalid Credentials ⚠️';
                } else if (error?.response?.status === 409) {
                    errorMessage = 'Duplicate Credentials ⚠️';
                } else if (error.message === 'Network error') {
                    errorMessage = 'No internet connection 🔌';
                }

                setModalStatus('error');
                setModalMessage(errorMessage);
                setModalVisible(true);
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content"/>
            <ImageBackground source={img} style={StyleSheet.absoluteFill} resizeMode="cover"/>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Animation Section - Responsive */}
                    <View style={styles.animationContainer}>
                        <LottieView
                            source={require('../../assets/images/AAngAnimation.json')}
                            autoPlay
                            loop
                            style={styles.animation}
                        />
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Login to continue</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        {/* Email Field */}
                        <View style={styles.formControl}>
                            <Controller
                                control={control}
                                name="email"
                                render={({field: {onChange, onBlur, value}}) => (
                                    <View style={[
                                        styles.inputWrapper,
                                        errors.email && styles.inputWrapperError
                                    ]}>
                                        <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon}/>
                                        <TextInput
                                            placeholder="Email address"
                                            style={styles.input}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            value={value}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                )}
                            />
                            {errors.email && (
                                <View style={styles.errorContainer}>
                                    <AlertIcon/>
                                    <Text style={styles.errorText}>{errors.email?.message}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password Field */}
                        <View style={styles.formControl}>
                            <Controller
                                control={control}
                                name="password"
                                render={({field: {onChange, onBlur, value}}) => (
                                    <View style={[
                                        styles.inputWrapper,
                                        errors.password && styles.inputWrapperError
                                    ]}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon}/>
                                        <TextInput
                                            placeholder="Password"
                                            style={styles.input}
                                            secureTextEntry={!showPassword}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            value={value}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(prev => !prev)}
                                            style={styles.eyeButton}
                                        >
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color="#6B7280"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {errors.password && (
                                <View style={styles.errorContainer}>
                                    <AlertIcon/>
                                    <Text style={styles.errorText}>{errors.password?.message}</Text>
                                </View>
                            )}
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                mutation.isPending && styles.buttonDisabled
                            ]}
                            onPress={handleSubmit(onLogin)}
                            disabled={mutation.isPending}
                        >
                            <Text style={styles.buttonText}>
                                {mutation.isPending ? 'LOGGING IN...' : 'LOGIN'}
                            </Text>
                        </TouchableOpacity>

                        {/* Forgot Password */}
                        <TouchableOpacity onPress={() => router.push('/(authentication)/forgot-password')}>
                            <Text style={styles.link}>Forgot password?</Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider}/>
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.divider}/>
                        </View>

                        {/* Google Sign In */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={signInWithGoogle}
                        >
                            <Image source={googleIcon} style={styles.googleIcon}/>
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <TouchableOpacity
                            style={styles.footer}
                            onPress={() => router.push('/(onboarding)/role-select')}
                        >
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Text style={styles.footerLink}>Sign Up</Text>
                        </TouchableOpacity>
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
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    animationContainer: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 12,
    },
    animation: {
        width: 180,
        height: 180,
    },
    title: {
        fontSize: 24,
        color: '#60a5fa',
        marginBottom: 4,
        letterSpacing: -0.5,
        fontFamily: 'PoppinsBold',
        marginTop: -8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        marginBottom: 8,
    },
    formContainer: {
        paddingHorizontal: 24,
        flex: 1,
    },
    formControl: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 4,
        height: 48,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputWrapperError: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(254, 242, 242, 0.95)',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        paddingVertical: 0,
    },
    inputIcon: {
        width: 40,
        textAlign: 'center',
    },
    eyeButton: {
        width: 40,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
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
    button: {
        backgroundColor: '#60a5fa',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
        shadowColor: '#60a5fa',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#93C5FD',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        letterSpacing: 0.5,
    },
    link: {
        color: '#60a5fa',
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        marginBottom: 20,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#D1D5DB',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#9CA3AF',
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        height: 48,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleButtonText: {
        fontSize: 15,
        color: '#374151',
        fontFamily: 'PoppinsMedium',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    footerText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    footerLink: {
        fontSize: 14,
        color: '#00BFA6',
        fontFamily: 'PoppinsSemiBold',
    },
});