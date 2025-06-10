import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
    Image,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, Stack} from 'expo-router';
import LottieView from "lottie-react-native";
import {useAuth} from "../../context/auth";
import SessionManager from "../../lib/SessionManager";
import {useSessionStore} from "../../store/useSessionStore";
import StatusModal from "../../components/StatusModal/StatusModal";

const loader = require("@/assets/animations/loader/spin-loader.json");

// Google OAuth
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {makeRedirectUri, ResponseType} from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// Form and validation
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Icons
import Ionicons from '@expo/vector-icons/Ionicons';

// Utils
import SecureStorage from '../../lib/SecureStorage';
import KeyBoardAvoidingHook from '../../hooks/KeyBoardAvoidingHook';
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
const img = require('../../assets/images/now.jpg');
const googleIcon = require('../../assets/icons/googleIcon.png');

// Icon components
const MailIcon = () => <Ionicons name="mail" size={26} color="blue"/>;
const EyeIcon = () => <Ionicons name="eye" size={26} color="blue"/>;
const EyeOffIcon = () => <Ionicons name="eye-off" size={26} color="blue"/>;
const AlertIcon = () => <Ionicons name="alert-circle-outline" size={18} color="red"/>;
const UserIcon = () => <Ionicons name="person-sharp" size={26} color="blue"/>;
const CarIcon = () => <Ionicons name="car-sport" size={26} color="blue"/>;

// Header title with logo and role
function LogoTitle({role}) {
    const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Role';

    return (
        <View
            style={{
                display: 'flex',
                alignItems: 'center',
                alignContent: 'center',
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between'
            }}>
            <Text className="text-2xl font-['PoppinsSemiBold'] text-blue-500">{displayRole} </Text>
            <Image source={require('../../assets/AAngLogo.png')} style={{width: 45, height: 45}}/>
        </View>
    );
}

export default function SignUp() {
    const [role, setRole] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [modalMessage, setModalMessage] = useState('Creating your account...');

    const [submissionState, setSubmissionState] = useState({
        isLoading: false,
        status: 'idle', // idle | loading | success | error
        message: ''
    });

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
            // ✅ Prefer Zustand memory if present
            let stored = useSessionStore.getState().role;

            if (!stored) {
                // ❌ Fallback to SecureStorage (e.g., hard refresh)
                stored = await SecureStorage.getRole();

                if (stored) {
                    await SessionManager.updateRole(stored); // ✅ sync memory
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
                await SecureStorage.saveRefreshToken(refreshToken); // 🔐 refresh token remains in SecureStorage only
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

                if (error.response.status === 409) {
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
        <>
            <SafeAreaView className="flex-1">
                <ImageBackground
                    source={img}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                    }}
                    resizeMode="cover"
                />

                <Stack.Screen
                    options={{
                        animation: "slide_from_right",
                        headerShown: true,
                        headerTitle: () => <LogoTitle role={role}/>,
                        title: "Role",
                        headerStyle: {
                            elevation: 0, shadowColor: 'transparent',
                        },
                    }}
                />
                <View style={styles.animationContainer}>
                    <LottieView
                        source={require('../../assets/images/AAngAnimation.json')}
                        autoPlay
                        loop
                        style={styles.animation}
                    />
                    <Text style={styles.title}>Welcome to AAngLogistics</Text>
                    <Text style={styles.subtitle}>SignUp to Get Started</Text>
                </View>
                <KeyBoardAvoidingHook>
                    {/* SignUp Form */}
                    <View className="flex-1 px-7 py-2 ">
                        {/* Email */}
                        <View style={[styles.formControl, {marginBottom: 24}]}>
                            <Controller
                                name="email"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <View style={[
                                        styles.inputContainer,
                                        errors.email && styles.inputContainerError
                                    ]}>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        <View style={styles.iconContainer}>
                                            <MailIcon />
                                        </View>
                                    </View>
                                )}
                            />
                            <View style={styles.errorContainer}>
                                {errors.email && (
                                    <View style={styles.errorContent}>
                                        <AlertIcon />
                                        <Text style={styles.errorText}>{errors.email?.message}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Password */}
                        <View style={[styles.formControl, {marginBottom: 24}]}>
                            <Controller
                                name="password"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <View style={[
                                        styles.inputContainer,
                                        errors.password && styles.inputContainerError
                                    ]}>
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
                                            style={styles.iconContainer}
                                            onPress={() => setShowPassword((prev) => !prev)}
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            <View style={styles.errorContainer}>
                                {errors.password && (
                                    <View style={styles.errorContent}>
                                        <AlertIcon />
                                        <Text style={styles.errorText}>{errors.password?.message}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Role (read-only) */}
                        <View style={[styles.formControl, {marginBottom: 48}]}>
                            <Controller
                                name="role"
                                control={control}
                                render={({field}) => {
                                    const display = field.value || role;
                                    if (!display) return null; // 🛑 Avoid rendering until role is loaded
                                    const label = display.charAt(0).toUpperCase() + display.slice(1);
                                    return (
                                        <View style={styles.inputContainer}>
                                            <TextInput
                                                style={[styles.textInput, styles.readOnlyInput]}
                                                placeholder={label}
                                                editable={false}
                                                placeholderTextColor="#374151"
                                            />
                                            <View style={styles.iconContainer}>
                                                {display === 'client' ? <UserIcon /> : <CarIcon />}
                                            </View>
                                        </View>
                                    );
                                }}
                            />
                        </View>

                        {/* Submit Button */}
                        <Pressable
                            className={`rounded-lg p-4 mb-2 ${submissionState.isLoading ? 'bg-blue-400' : 'bg-blue-500'}`}
                            onPress={handleSubmit(onSubmit)}
                            disabled={submissionState.isLoading}
                        >
                            <View className="flex-row justify-center items-center">
                                <Text className="text-white text-center text-lg font-['PoppinsRegular']">
                                    {submissionState.status === 'loading'
                                        ? 'Creating account...'
                                        : submissionState.status === 'success'
                                            ? 'Success! Redirecting...'
                                            : 'Sign Up'}
                                </Text>
                            </View>
                        </Pressable>
                        {/*Social Sign In*/}
                        <View className="flex-row justify-center items-center mb-2 mt-4">
                            <Text className=" text-lg text-gray-400 font-['PoppinsRegular']">Or Sign In with</Text>
                        </View>
                        <View className="flex-row justify-evenly w-full">
                            <TouchableOpacity
                                onPress={signInWithGoogle}
                            >
                                <Image
                                    source={googleIcon}
                                    style={{width: 40, height: 40}}
                                />
                            </TouchableOpacity>
                        </View>
                        <View className="flex-row gap-4 items-center mb-4 mt-4 bg-blue-600 rounded-2xl px-14">
                            <Text className="text-lg text-white font-['PoppinsRegular']">Already have an account?</Text>
                            <TouchableOpacity onPress={() => router.push('/(authentication)/login')}>
                                <Text className="text-lg text-white font-['PoppinsSemiBold']">LOGIN</Text>
                            </TouchableOpacity>
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
                <StatusModal
                    visible={modalVisible}
                    status={modalStatus}
                    message={modalMessage}
                    onClose={() => setModalVisible(false)}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    animationContainer: {alignItems: 'center', marginTop: 10},
    animation: {width: 250, height: 250},
    title: {
        fontSize: 24,
        color: '#60a5fa',
        fontFamily: 'PoppinsBold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#60a5fa',
        fontFamily: 'PoppinsRegular',
        marginBottom: 15
    },
    label: {
        color: 'white',
        fontFamily: 'PoppinsRegular',
        fontSize: 16,
        marginBottom: 1,
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
    btn: {
        marginTop: 20,
        marginBottom: 20,
    },
    container: {
        flex: 1,
        padding: 6,
        justifyContent: 'center'
    },

    formControl: {
        // Matches GlueStack FormControl size='xl'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 25, // rounded variant
        height: 56, // size="xl" equivalent (h-14)
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // Shadow styles matching original
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    inputContainerError: {
        borderColor: '#EF4444', // red border for errors
    },
    textInput: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
        borderWidth: 0,
        outlineWidth: 0,
    },
    readOnlyInput: {
        color: '#374151', // slightly muted color for read-only
    },
    iconContainer: {
        paddingRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
});