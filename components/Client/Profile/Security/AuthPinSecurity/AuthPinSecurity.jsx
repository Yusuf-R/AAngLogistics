import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import { navigate } from "expo-router/build/global-state/routing";
import PinSecurity from "../../../../../assets/images/pin-security.svg"
import UpdateSecurity from "../../../../../assets/images/pin-security2.svg"
import {useMutation} from '@tanstack/react-query';
import ClientUtils from "../../../../../utils/ClientUtilities";
import SessionManager from "../../../../../lib/SessionManager";
import StatusModal from "../../../../StatusModal/StatusModal";
import KeyboardAvoidingHook from "../../../../../hooks/KeyBoardAvoidingHook";

// Main Auth PIN Security Component
function AuthPinSecurity({userData}) {
    const [currentScreen, setCurrentScreen] = useState('main');
    const [animationPhase, setAnimationPhase] = useState('entering');

    // Check if user has PIN enabled
    const hasPinEnabled = userData?.authPin?.isEnabled || false;
    // const hasPinEnabled = false;

    useEffect(() => {
        if (!hasPinEnabled) {
            setCurrentScreen('setupPin');
        }
    }, [hasPinEnabled]);

    const handleScreenTransition = (nextScreen) => {
        setAnimationPhase('exiting');
        setTimeout(() => {
            setCurrentScreen(nextScreen);
            setAnimationPhase('entering');
        }, 300);
    };

    const renderCurrentScreen = () => {
        switch (currentScreen) {
            case 'setupPin':
                return <SetupPinScreen onComplete={() => handleScreenTransition('success')}/>;
            case 'main':
                return <MainSecurityScreen />;
            case 'success':
                return <SuccessScreen onContinue={() => router.back()}/>;
            default:
                return <MainSecurityScreen onNavigate={handleScreenTransition}/>;
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#1F2937"/>
            <LinearGradient
                colors={['#F5F5F5', '#F5F5F5', '#F5F5F5']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                className="flex-1"
            >
                <SafeAreaView className="flex-1">
                    <AnimatedContainer animationPhase={animationPhase}>
                        {renderCurrentScreen()}
                    </AnimatedContainer>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
}

// Animated Container Component
function AnimatedContainer({children, animationPhase}) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animationPhase === 'exiting') {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -50,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [animationPhase]);

    return (
        <Animated.View
            className="flex-1"
            style={{
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}]
            }}
        >
            {children}
        </Animated.View>
    );
}

// Setup PIN Screen (First Time) - Enhanced Version
function SetupPinScreen({onComplete}) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [modalMessage, setModalMessage] = useState('Setting up your PIN...');

    const setPinMutation = useMutation({
        mutationKey: ['SetPin'],
        mutationFn: ClientUtils.SetPin,
    });

    // Timer for auto-masking digits
    const [visibleDigits, setVisibleDigits] = useState(new Set());
    const maskTimers = useRef({});

    // Handle numpad input - This is now the ONLY way to input
    const handleNumpadPress = (num) => {
        const emptyIndex = verificationCode.findIndex(digit => digit === '');
        if (emptyIndex !== -1) {
            const newCode = [...verificationCode];
            newCode[emptyIndex] = num.toString();
            setVerificationCode(newCode);

            // Update pin state based on current step
            const pinString = newCode.join('');
            if (step === 1) {
                setPin(pinString);
            } else {
                setConfirmPin(pinString);
            }

            // Show the digit temporarily
            setVisibleDigits(prev => new Set([...prev, emptyIndex]));

            // Clear existing timer for this index
            if (maskTimers.current[emptyIndex]) {
                clearTimeout(maskTimers.current[emptyIndex]);
            }

            // Set timer to mask the digit after 800ms
            maskTimers.current[emptyIndex] = setTimeout(() => {
                setVisibleDigits(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(emptyIndex);
                    return newSet;
                });
            }, 800);
        }
    };

    // Handle numpad backspace
    const handleNumpadBackspace = () => {
        const lastFilledIndex = verificationCode.findLastIndex(digit => digit !== '');
        if (lastFilledIndex !== -1) {
            const newCode = [...verificationCode];
            newCode[lastFilledIndex] = '';
            setVerificationCode(newCode);

            // Update pin state
            const pinString = newCode.join('');
            if (step === 1) {
                setPin(pinString);
            } else {
                setConfirmPin(pinString);
            }

            // Clear visibility and timer
            setVisibleDigits(prev => {
                const newSet = new Set(prev);
                newSet.delete(lastFilledIndex);
                return newSet;
            });
            if (maskTimers.current[lastFilledIndex]) {
                clearTimeout(maskTimers.current[lastFilledIndex]);
            }
        }
    };

    const handlePinSubmit = () => {
        const currentPin = step === 1 ? pin : confirmPin;

        if (currentPin.length !== 6) {
            shakeAnimation();
            return;
        }

        if (step === 1) {
            setStep(2);
            // Reset for confirmation step
            setVerificationCode(['', '', '', '', '', '']);
            setVisibleDigits(new Set());
            // Clear all timers
            Object.values(maskTimers.current).forEach(timer => clearTimeout(timer));
            maskTimers.current = {};
        } else {
            if (pin !== confirmPin) {
                shakeAnimation();
                Alert.alert('Error', 'PINs do not match. Please try again.');
                setConfirmPin('');
                setVerificationCode(['', '', '', '', '', '']);
                setVisibleDigits(new Set());
                // Clear all timers
                Object.values(maskTimers.current).forEach(timer => clearTimeout(timer));
                maskTimers.current = {};
                return;
            }

            setModalStatus('loading');
            setModalMessage('Setting up your PIN..');
            setModalVisible(true);

            setLoading(true);

            const payload = {
                pin,
                confirmPin
            }
            setPinMutation.mutate(payload, {
                onSuccess: async (respData) => {
                    const {user} = respData;

                    // STEP 1: Save updated user securely before any UI transitions
                    await SessionManager.updateUser(user);

                    setModalStatus('success');
                    setModalMessage('PIN successful set!');

                    setLoading(true);

                    setTimeout(() => {
                        setModalVisible(false);
                        onComplete();
                    }, 2000);
                },
                onError: () => {
                    setLoading(false);
                    setModalStatus('error');
                    setModalMessage('Setup failed. Please try again.');
                },
            });
        }
    };

    const shakeAnimation = () => {
        Vibration.vibrate(100);
        Animated.sequence([
            Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: -10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
        ]).start();
    };

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            Object.values(maskTimers.current).forEach(timer => clearTimeout(timer));
        };
    }, []);


    return (
        <>
            <View className="flex-1 ">
                <View className="flex items-center ">
                    <PinSecurity
                        width={300}
                        height={300}
                        className="mb-2"
                    />

                    <Text className="text-2xl font-bold text-blue-400 text-center mb-2">
                        {step === 1 ? 'Create Your PIN' : 'Confirm Your PIN'}
                    </Text>
                    <Text className="text-gray-600 text-center text-lg">
                        {step === 1
                            ? 'Set up a 6-digit PIN for enhanced security'
                            : 'Please re-enter your PIN to confirm'
                        }
                    </Text>
                </View>
                <View className="flex justify-center px-3 ">
                    <Animated.View
                        className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-1"
                        style={{transform: [{translateX: shakeAnim}]}}
                    >
                        {/* Enhanced PIN Input Fields */}
                        {/* Display-Only PIN Input Fields - No Keyboard Interaction */}
                        <View style={styles.codeInputContainer}>
                            {verificationCode.map((digit, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.codeInput,
                                        digit && styles.codeInputFilled
                                    ]}
                                >
                                    <Text style={styles.codeInputText}>
                                        {visibleDigits.has(index) ? digit : (digit ? '●' : '')}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {step === 2 && (
                            <TouchableOpacity
                                onPress={() => {
                                    setStep(1);
                                    setConfirmPin('');
                                    setVerificationCode(['', '', '', '', '', '']);
                                    setVisibleDigits(new Set());
                                    Object.values(maskTimers.current).forEach(timer => clearTimeout(timer));
                                    maskTimers.current = {};
                                }}
                                className="mb-6 items-center "
                            >
                                <Text className="text-white text-center px-4 py-4 bg-blue-600 rounded-2xl ">or Back to
                                    PIN
                                    entry</Text>
                            </TouchableOpacity>
                        )}

                        {/* Custom Number Pad */}
                        <View style={styles.numberPad}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={styles.numberKey}
                                    onPress={() => handleNumpadPress(num)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.numberKeyText}>{num}</Text>
                                </TouchableOpacity>
                            ))}

                            {/* Empty space for layout */}
                            {/*<View style={styles.numberKey} />*/}

                            {/* Zero */}
                            <TouchableOpacity
                                style={styles.numberKey}
                                onPress={() => handleNumpadPress(0)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.numberKeyText}>0</Text>
                            </TouchableOpacity>


                            {/* Backspace */}
                            <TouchableOpacity
                                style={styles.numberKey}
                                onPress={handleNumpadBackspace}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="backspace" size={24} color="#666"/>
                            </TouchableOpacity>

                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handlePinSubmit}
                            disabled={loading || (step === 1 ? pin.length !== 6 : confirmPin.length !== 6)}
                            className="bg-blue-600 rounded-2xl py-4 mt-4"
                            style={{
                                opacity: loading || (step === 1 ? pin.length !== 6 : confirmPin.length !== 6) ? 0.7 : 1
                            }}
                        >
                            <Text className="text-white font-semibold text-lg text-center">
                                {loading ? 'Setting up...' : step === 1 ? 'Continue' : 'Create PIN'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>


                </View>
            </View>
            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
}

// Main Security Screen (When PIN is enabled)
function MainSecurityScreen() {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, []);

    const securityOptions = [
        {
            id: 'update',
            title: 'Update PIN',
            subtitle: 'Change your current PIN',
            icon: 'create-outline',
            color: '#3B82F6',
            bgColor: '#DBEAFE',
            url: '/client/profile/pin-email',
            reqType: 'updatePin'
        },
        {
            id: 'reset',
            title: 'Reset PIN',
            subtitle: 'Forgot your PIN? Reset it',
            icon: 'refresh-outline',
            color: '#EF4444',
            bgColor: '#FEE2E2',
            url: '/client/profile/pin-email',
            reqType: 'resetPin'
        }
    ];

    return (
        <Animated.View
            className="flex justify-center px-6"
            style={{transform: [{scale: scaleAnim}]}}
        >
            <View className="flex items-center mb-2">
                <View className="bg-green-100 rounded-full p-4 -mb-8 mt-8">
                    <Ionicons name="shield-checkmark" size={48} color="#10B981"/>
                </View>
                <View className="-mb-8">
                    <UpdateSecurity
                        width={350}
                        height={350}
                    />
                </View>

                <Text className="text-2xl text-blue-500 font-extrabold text-center mb-2">
                    PIN Security
                </Text>
            </View>

            <View className="space-y-4 ">
                {securityOptions.map((option, index) => (
                    <TouchableOpacity
                        key={option.id}
                        onPress={() => router.push({
                            pathname: option.url,
                            params: {reqType: option.reqType}
                        })}
                        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4"
                        style={{
                            shadowColor: option.color,
                            shadowOffset: {width: 0, height: 4},
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        <View className="flex-row items-center">
                            <View
                                className="rounded-full p-3 mr-4"
                                style={{backgroundColor: option.bgColor}}
                            >
                                <Ionicons name={option.icon} size={30} color={option.color}/>
                            </View>
                            <View className="flex-1">
                                <Text className="text-green-500 font-semibold text-lg">
                                    {option.title}
                                </Text>
                                <Text className="text-gray-800 text-sm mt-1">
                                    {option.subtitle}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF"/>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );
}

// Success Screen
function SuccessScreen({onContinue}) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();
        return () => pulseAnimation.stop();
    }, []);

    return (
        <View className="flex-1 justify-center items-center px-6">
            <Animated.View
                className="items-center mb-8"
                style={{transform: [{scale: pulseAnim}]}}
            >
                <View className="bg-green-100 rounded-full p-6 mb-6">
                    <Ionicons name="checkmark-circle" size={64} color="#10B981"/>
                </View>
            </Animated.View>

            <Text className="text-3xl font-bold text-blue-500 text-center mb-4">
                Success!
            </Text>
            <Text className="text-blue-500  text-center text-lg mb-12">
                PIN successfully set. Your account is now secure.
            </Text>

            <TouchableOpacity
                onPress={onContinue}
                className="bg-blue-500 rounded-2xl py-4 px-8 w-full"
            >
                <Text className="text-white font-semibold text-lg text-center">
                    Continue to Security Settings
                </Text>
            </TouchableOpacity>
        </View>
    );
}

// PIN Input Component
function PinInput({value, onChange, placeholder}) {
    const inputRef = useRef(null);

    const handlePress = () => {
        inputRef.current?.focus();
    };

    return (
        <View className="relative">
            <TouchableOpacity onPress={handlePress}>
                <View className="flex-row justify-between mb-4">
                    {[...Array(6)].map((_, index) => (
                        <View
                            key={index}
                            className={`w-12 h-12 rounded-xl border-2 items-center justify-center ${
                                value.length > index
                                    ? 'border-blue-400 bg-blue-400/20'
                                    : 'border-gray-400 bg-white/10'
                            }`}
                        >
                            <Text className="text-white text-xl font-bold">
                                {value.length > index ? '●' : ''}
                            </Text>
                        </View>
                    ))}
                </View>
            </TouchableOpacity>

            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                className="absolute opacity-0 -z-10"
                autoFocus
            />
        </View>
    );
}


// Enhanced Styles
const styles = StyleSheet.create({
    codeInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    codeInput: {
        width: 55,
        height: 55,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeInputFilled: {
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    codeInputText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    numberKey: {
        width: 75,
        height: 75,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    numberKeyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F2F2F',
    },
});

export default AuthPinSecurity;