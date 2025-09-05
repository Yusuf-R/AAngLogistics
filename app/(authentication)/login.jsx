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
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';

import {useRouter} from 'expo-router';
import KeyBoardAvoidingHook from '../../hooks/KeyBoardAvoidingHook';
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

const AlertIcon = () => <Ionicons name="alert-circle-outline" size={18} color="red"/>;

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
        console.log({
            data
        })

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
                console.log({
                    error
                })

                setModalStatus('error');
                setModalMessage(errorMessage);
                setModalVisible(true);
                console.log(error.response?.status);
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content"/>
            <ImageBackground source={img} style={StyleSheet.absoluteFill} resizeMode="cover"/>

            <View style={styles.animationContainer}>
                <LottieView
                    source={require('../../assets/images/AAngAnimation.json')}
                    autoPlay
                    loop
                    style={styles.animation}
                />
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Login in to continue</Text>
            </View>

            <KeyBoardAvoidingHook>
                <View className="flex-1 px-7 py-2 ">
                    {/* Email Field */}
                    <View style={[styles.formControl, {marginBottom: 32}]}>
                        <Controller
                            control={control}
                            name="email"
                            render={({field: {onChange, onBlur, value}}) => (
                                <>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="mail" size={22} color="blue" style={styles.inputIcon}/>
                                        <TextInput
                                            placeholder="Email"
                                            style={styles.input}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            value={value}
                                        />
                                    </View>

                                </>
                            )}
                        />
                        <View style={styles.errorContainer}>
                            {errors.email && (
                                <View style={styles.errorContent}>
                                    <AlertIcon/>
                                    <Text style={styles.errorText}>{errors.email?.message}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Password Field */}
                    <View style={[styles.formControl, {marginBottom: 28}]}>
                        <Controller
                            control={control}
                            name="password"
                            render={({field: {onChange, onBlur, value}}) => (
                                <>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed" size={22} color="blue" style={styles.inputIcon}/>
                                        <TextInput
                                            placeholder="Password"
                                            style={styles.input}
                                            secureTextEntry={!showPassword}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            value={value}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="blue"/>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        />
                        <View style={styles.errorContainer}>
                            {errors.password && (
                                <View style={styles.errorContent}>
                                    <AlertIcon/>
                                    <Text style={styles.errorText}>{errors.password?.message}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleSubmit(onLogin)}>
                        <Text style={styles.buttonText}>LOGIN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/(authentication)/forgot-password')}>
                        <Text style={styles.link}>Forgot the password?</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider}/>
                        <Text style={styles.dividerText}>or continue with</Text>
                        <View style={styles.divider}/>
                    </View>

                    <View style={styles.socialRow}>
                        <TouchableOpacity onPress={signInWithGoogle}>
                            <Image source={googleIcon} style={{width: 40, height: 40}}/>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.footer}
                        onPress={() => router.push('/(onboarding)/role-select')}
                    >
                        <Text style={styles.footerText}>Don't have an account?</Text>
                        <Text style={styles.footerLink}> Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </KeyBoardAvoidingHook>

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
    container: {flex: 1, backgroundColor: '#fff'},
    animationContainer: {alignItems: 'center', marginTop: 40},
    animation: {width: 250, height: 250},
    title: {
        fontSize: 28,
        color: '#60a5fa',
        marginBottom: 8,
        letterSpacing: -0.5,
        fontFamily: 'PoppinsBold',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        marginBottom: 20,
    },
    form: {paddingHorizontal: 24, flex: 1, justifyContent: 'center'},
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 10,
        elevation: 3,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
    },
    inputIcon: {
        marginRight: 10,
    },
    errorContainer: {
        height: 20, // Fixed height for error message
        marginTop: 4,
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginLeft: 4,
        fontFamily: 'PoppinsRegular',
    },
    button: {
        backgroundColor: '#60a5fa',
        borderRadius: 30,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        color: '#60a5fa',
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 20,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ccc',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#888',
        fontSize: 14,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#444',
    },
    footerLink: {
        fontSize: 14,
        color: '#00BFA6',
        fontWeight: '600',
    },
});
