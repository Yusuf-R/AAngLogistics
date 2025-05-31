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
    Modal
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, Stack} from 'expo-router';
import LottieView from "lottie-react-native";
import {useAuth} from "../../context/auth";
import SessionManager from "../../lib/SessionManager";
import { useSessionStore } from "../../store/useSessionStore";
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

// GlueStack UI components
import {FormControl, FormControlError, FormControlErrorIcon} from '@/components/ui/form-control';
import {Input, InputField, InputSlot, InputIcon} from '@/components/ui/input';

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
            reset({ role: stored, email: '', password: '' });
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
            {/* Animated Logo */}
            <View className="items-center">
                <LottieView
                    source={require('../../assets/images/AAngAnimation.json')}
                    autoPlay
                    loop
                    style={styles.animation}
                />
                <Text className="text-2xl font-['PoppinsSemiBold'] text-[#60a5fa] mb-5">
                    Get Started
                </Text>
            </View>
            <KeyBoardAvoidingHook>
                {/* SignUp Form */}
                <View className="flex-1 px-7 py-2 ">
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
                                        placeholder="Password"
                                        secureTextEntry={!showPassword}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                    />
                                    <TouchableOpacity className="pr-3" onPress={() => setShowPassword((prev) => !prev)}>
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
                    <View className="flex-row justify-center items-center mb-4 mt-8">
                        <Text className=" text-lg text-gray-500 font-['PoppinsRegular']">Or Sign In with</Text>
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
                    <View className="flex-row justify-center items-center mb-4 mt-8">
                        <Text className="text-lg text-gray-500 font-['PoppinsRegular']">Already have an account?</Text>
                        <TouchableOpacity onPress={() => router.push('/(authentication)/login')}>
                            <Text className="text-lg text-blue-500 font-['PoppinsSemiBold']"> Login</Text>
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
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        color: 'white',
        fontFamily: 'PoppinsBold',
        textAlign: 'center',
        marginBottom: 20,
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
    animationContainer: {
        alignItems: 'center',
    },
    animation: {
        width: 300,
        height: 300
    },
    errorContainer: {
        height: 20, // Fixed height for error message
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
});
