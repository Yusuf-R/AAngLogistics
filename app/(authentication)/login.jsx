import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Pressable,
    ImageBackground,
    Image,
    Modal,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import LottieView from "lottie-react-native";
import img from "../../assets/images/new.jpg";

// Utils
import SecureStorage from '../../lib/SecureStorage';
import KeyBoardAvoidingHook from '../../hooks/KeyBoardAvoidingHook';
import ClientUtils from "../../utils/ClientUtilities";
import {useMutation} from "@tanstack/react-query";

// Form and validation
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useAuth} from "../../context/auth";

// GlueStack UI components
import {FormControl, FormControlError, FormControlErrorIcon} from '@/components/ui/form-control';
import {Input, InputField, InputSlot, InputIcon} from '@/components/ui/input';
import {useRouter} from "expo-router";
import {Toast} from "toastify-react-native";


// Validation schema
const loginSchema = yup.object().shape({
    role: yup.string().required('Role is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup
        .string()
        .required('Password is required')
        .min(4, 'At least 4 chars')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,}$/, 'Include upper, lower, number'),
});


const MailIcon = () => <Ionicons name="mail" size={26} color="blue"/>;
const EyeIcon = () => <Ionicons name="eye" size={26} color="blue"/>;
const EyeOffIcon = () => <Ionicons name="eye-off" size={26} color="blue"/>;
const AlertIcon = () => <Ionicons name="alert-circle-outline" size={18} color="red"/>;
const UserIcon = () => <Ionicons name="person-sharp" size={26} color="blue"/>;
const CarIcon = () => <Ionicons name="car-sport" size={26} color="blue"/>;
const loader = require("@/assets/animations/loader/spin-loader.json");
const googleIcon = require('../../assets/icons/googleIcon.png');

export default function Login() {
    const [role, setRole] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [submissionState, setSubmissionState] = useState({
        isLoading: false,
        status: 'idle', // idle | loading | success | error
        message: ''
    });

    const router = useRouter();
    const {control, handleSubmit, reset, formState: {errors}} = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {role: '', email: '', password: ''},
        mode: 'onTouched',
    });
    const handleForgotPassword = () => {
        // Navigate to forgot password screen
        console.log('Forgot password');
    };

    const mutation = useMutation({
        mutationKey: ['Login'],
        mutationFn: ClientUtils.Login,
    });

    const onLogin = async (data) => {
        setSubmissionState({
            isLoading: true,
            status: 'loading',
            message: 'logging into your account...'
        });

        mutation.mutate(data, {
            onSuccess: async (respData) => {
                const {accessToken, refreshToken, user, expiresIn} = respData;
                const expiry = new Date(Date.now() + 1000 * expiresIn);

                await SecureStorage.saveAccessToken(accessToken);
                await SecureStorage.saveRefreshToken(refreshToken);
                await SecureStorage.saveExpiry(expiry.toISOString());
                await SecureStorage.saveRole(user.role);
                await SecureStorage.saveUserData(user);
                await SecureStorage.saveOnboardingStatus(true);

                // ✅ Show success before routing
                setSubmissionState({
                    isLoading: true, // still showing overlay
                    status: 'success',
                    message: 'Login Successful 🚀. Redirecting...'
                });

                Toast.success('Login Successful 🚀');

                await new Promise(resolve => setTimeout(resolve, 2500)); // short delay to let user see success

                setSubmissionState({
                    isLoading: false,
                    status: 'idle',
                    message: ''
                });

                // Redirect to the dashboard based on user role
                Toast.success('Redirecting to Dashboard 🔁');

                router.replace(`/(protected)/${user.role}/dashboard`);
            },

            onError: async (error) => {

                let errorMessage = 'Invalid Credentials ⚠️';

                if (error.response.status === 409) {
                    errorMessage = 'Duplicate Credentials ⚠️';
                }

                setSubmissionState({
                    isLoading: true,
                    status: 'error',
                    message: errorMessage,
                });
                Toast.error(errorMessage);
                await new Promise((resolve) => setTimeout(resolve, 2000));

                setSubmissionState({
                    isLoading: false,
                    status: 'idle',
                    message: '',
                });
            }
        });
    };

    const {signInWithGoogle} = useAuth();

    useEffect(() => {
        async function loadRole() {
            const stored = await SecureStorage.getRole();
            if (!stored) {
                router.replace('/(onboarding)/role-select?next=/(authentication)/login')
                return;
            }
            setRole(stored);
            reset({role: stored, email: '', password: ''});
        }

        loadRole();
    }, [reset]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content"/>
            <ImageBackground
                source={img}
                style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,

                }}
                resizeMode="cover"
            />
            {/* Animated Logo */}
            <View className="items-center mt-10">
                <LottieView
                    source={require('../../assets/images/AAngAnimation.json')}
                    autoPlay
                    loop
                    style={styles.animation}
                />
                <Text className="text-2xl font-['PoppinsSemiBold'] text-[#60a5fa] mb-5">
                    Login
                </Text>
            </View>
            <KeyBoardAvoidingHook>
                <View style={styles.content}>

                    <View className="flex-1 px-1 py-2 ">
                        {/* Email */}
                        <FormControl
                            isInvalid={!!errors.email}
                            size='xl'
                            className="mb-8"
                        >
                            <Controller
                                name="email"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <Input
                                        variant="rounded"
                                        size="xl"
                                        isInvalid={!!errors.email}
                                        className="shadow-2xl bg-white/100 elevation-2xl border-1 h-14"
                                        style={{
                                            // Android elevation
                                            elevation: 5,
                                            // iOS shadow
                                            shadowColor: '#000',
                                            shadowOffset: {width: 0, height: 2},
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                        }}
                                    >
                                        <InputField
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                        <InputSlot className="pr-3 ">
                                            <InputIcon as={MailIcon}/>
                                        </InputSlot>
                                    </Input>
                                )}
                            />
                            <View style={styles.errorContainer}>
                                {errors.email && (
                                    <View style={styles.errorContent}>
                                        <FormControlErrorIcon as={AlertIcon}/>
                                        <Text style={styles.errorText}>{errors.email?.message}</Text>
                                    </View>
                                )}
                            </View>
                        </FormControl>

                        {/* Password */}
                        <FormControl
                            isInvalid={!!errors.password}
                            size='xl'
                            className="mb-8"
                        >
                            <Controller
                                name="password"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <Input
                                        variant="rounded"
                                        size="xl"
                                        isInvalid={!!errors.password}
                                        className="shadow-2xl bg-white/100 elevation-2xl border-1 h-14"
                                        style={{
                                            elevation: 5,
                                            shadowColor: '#000',
                                            shadowOffset: {width: 0, height: 2},
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                        }}
                                    >
                                        <InputField
                                            placeholder="Password"
                                            secureTextEntry={!showPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                        <TouchableOpacity className="pr-3"
                                                          onPress={() => setShowPassword((prev) => !prev)}>
                                            <InputIcon as={showPassword ? EyeOffIcon : EyeIcon}/>
                                        </TouchableOpacity>
                                    </Input>
                                )}
                            />

                            <View style={styles.errorContainer}>
                                {errors.password && (
                                    <View style={styles.errorContent}>
                                        <FormControlErrorIcon as={AlertIcon}/>
                                        <Text style={styles.errorText}>{errors.password?.message}</Text>
                                    </View>
                                )}
                            </View>
                        </FormControl>

                        {/* Role (read-only) */}
                        <FormControl isReadOnly className="mb-12">
                            <Controller
                                name="role"
                                control={control}
                                render={({field}) => {
                                    const display = field.value || role;
                                    if (!display) return null; // 🛑 Avoid rendering until role is loaded
                                    const label = display.charAt(0).toUpperCase() + display.slice(1);
                                    return (
                                        <Input
                                            variant="rounded"
                                            size="xl"
                                            className="shadow-2xl bg-white/100 elevation-2xl border-1 h-14"
                                            style={{
                                                elevation: 5,
                                                shadowColor: '#000',
                                                shadowOffset: {width: 0, height: 2},
                                                shadowOpacity: 0.25,
                                                shadowRadius: 3.84,
                                            }}
                                        >
                                            <InputField
                                                placeholder={label}
                                                isReadOnly
                                            />
                                            <InputSlot className="pr-3 ">
                                                <InputIcon as={display === 'client' ? UserIcon : CarIcon}/>
                                            </InputSlot>
                                        </Input>
                                    );
                                }}
                            />
                        </FormControl>

                        <TouchableOpacity
                            style={styles.signInButton}
                            onPress={handleSubmit(onLogin)}
                            disabled={submissionState.isLoading}
                        >
                            <Text style={styles.signInText}>Log in</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleForgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot the password?</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider}/>
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.divider}/>
                        </View>

                        <View style={styles.socialButtonsRow}>
                            <TouchableOpacity onPress={signInWithGoogle}>
                                <Image
                                    source={googleIcon}
                                    style={{width: 40, height: 40}}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyBoardAvoidingHook>
            {submissionState.isLoading && (
                <View style={styles.overlay}>
                    <View style={styles.loadingBox}>
                        <LottieView
                            source={loader}
                            autoPlay
                            loop={submissionState.status !== 'success'}
                            style={{width: 120, height: 120}}
                        />
                        <Text style={styles.loadingText}>
                            {submissionState.message}
                        </Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    animation: {
        width: 300,
        height: 300
    },
    keyboardAvoid: {
        flex: 1,
    },
    header: {
        height: 50,
        justifyContent: 'center',
    },
    backButton: {
        padding: 10,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
        marginTop: 10,
    },
    inputContainer: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 12,
        height: 56,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 8,
        minHeight: 50,
        marginBottom: 5,
    },
    error: {
        color: 'red',
        fontSize: 14,
        marginTop: 4,
    },
    errorContainer: {
        height: 20,
        marginTop: 2,
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginLeft: 4,
    },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    loadingBox: {
        backgroundColor: '#fff',
        paddingVertical: 28,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: {width: 0, height: 8},
        shadowRadius: 12,
        elevation: 6,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#3b82f6',
    },
    eyeIcon: {
        padding: 8,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#00BFA6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    checkboxChecked: {
        backgroundColor: '#00BFA6',
        borderColor: '#00BFA6',
    },
    rememberMeText: {
        fontSize: 14,
        color: '#555',
    },
    signInButton: {
        backgroundColor: '#60a5fa',
        borderRadius: 30,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    signInText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    forgotPasswordText: {
        color: '#60a5fa',
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 30,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        paddingHorizontal: 10,
        color: '#888',
        fontSize: 14,
    },
    socialButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: 30,
    },
    socialButton: {
        width: 60,
        height: 60,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noAccountText: {
        fontSize: 14,
        color: '#888',
    },
    signUpText: {
        fontSize: 14,
        color: '#00BFA6',
        fontWeight: '600',
    },
});
