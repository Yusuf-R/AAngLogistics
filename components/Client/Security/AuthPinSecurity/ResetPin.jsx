import {Alert, Animated, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View,} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useMutation} from "@tanstack/react-query";
import ClientUtils from "../../../../utils/ClientUtilities";
import SessionManager from "../../../../lib/SessionManager";
import {router} from "expo-router";
import StatusModal from "../../../StatusModal/StatusModal";

function ResetPinScreen({userData}) {
    const [step, setStep] = useState(1); // 1: Token, 2: New PIN, 3: Confirm PIN
    const [token, setToken] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);

    // Status Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [modalMessage, setModalMessage] = useState('Logging in...');

    //
    const mutation = useMutation({
        mutationKey: ['ResetPin'],
        mutationFn: ClientUtils.ResetPin,
    });

    // Animation and visual states
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const tokenInputRef = useRef(null);

    // Token input state (5 characters - alphanumeric)
    const [tokenCode, setTokenCode] = useState(['', '', '', '', '']);

    // PIN input states (6 digits each)
    const [newPinCode, setNewPinCode] = useState(['', '', '', '', '', '']);
    const [confirmPinCode, setConfirmPinCode] = useState(['', '', '', '', '', '']);
    const [visibleNewPinDigits, setVisibleNewPinDigits] = useState(new Set());
    const [visibleConfirmPinDigits, setVisibleConfirmPinDigits] = useState(new Set());
    const newPinMaskTimers = useRef({});
    const confirmPinMaskTimers = useRef({});

    // Get current input data based on step (only for PIN steps)
    const getCurrentInputData = () => {
        switch (step) {
            case 2:
                return {
                    code: newPinCode,
                    setCode: setNewPinCode,
                    visibleDigits: visibleNewPinDigits,
                    setVisibleDigits: setVisibleNewPinDigits,
                    maskTimers: newPinMaskTimers,
                    maxLength: 6
                };
            case 3:
                return {
                    code: confirmPinCode,
                    setCode: setConfirmPinCode,
                    visibleDigits: visibleConfirmPinDigits,
                    setVisibleDigits: setVisibleConfirmPinDigits,
                    maskTimers: confirmPinMaskTimers,
                    maxLength: 6
                };
            default:
                return null;
        }
    };

    // Handle numpad input (only for PIN steps)
    const handleNumpadPress = (num) => {
        if (step === 1) return; // Token input uses keyboard, not numpad

        const inputData = getCurrentInputData();
        if (!inputData) return;

        const {code, setCode, visibleDigits, setVisibleDigits, maskTimers, maxLength} = inputData;
        const emptyIndex = code.findIndex(digit => digit === '');

        if (emptyIndex !== -1) {
            const newCode = [...code];
            newCode[emptyIndex] = num.toString();
            setCode(newCode);

            // Update string state
            const codeString = newCode.join('');
            if (step === 2) {
                setNewPin(codeString);
            } else if (step === 3) {
                setConfirmPin(codeString);
            }
        }
    };

    // Handle numpad backspace (only for PIN steps)
    const handleNumpadBackspace = () => {
        if (step === 1) return; // Token input uses keyboard, not numpad

        const inputData = getCurrentInputData();
        if (!inputData) return;

        const {code, setCode, visibleDigits, setVisibleDigits, maskTimers} = inputData;
        const lastFilledIndex = code.findLastIndex(digit => digit !== '');

        if (lastFilledIndex !== -1) {
            const newCode = [...code];
            newCode[lastFilledIndex] = '';
            setCode(newCode);

            // Update string state
            const codeString = newCode.join('');
            if (step === 2) {
                setNewPin(codeString);
            } else if (step === 3) {
                setConfirmPin(codeString);
            }
        }
    };

    // Handle token input change
    const handleTokenChange = (text) => {
        const upperText = text.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Only allow A-Z and 0-9
        if (upperText.length <= 5) {
            setToken(upperText);

            // Update tokenCode array for visual display
            const newTokenCode = Array(5).fill('');
            for (let i = 0; i < upperText.length; i++) {
                newTokenCode[i] = upperText[i];
            }
            setTokenCode(newTokenCode);
        }
    };

    // Handle step progression
    const handleContinue = () => {
        if (step === 1 && token.length !== 5) {
            shakeAnimation();
            return;
        }

        if (step > 1) {
            const inputData = getCurrentInputData();
            const currentInput = step === 2 ? newPin : confirmPin;

            if (currentInput.length !== 6) {
                shakeAnimation();
                return;
            }
        }

        if (step === 1) {
            // Validate token (simulate API call)
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                setStep(2);
                slideTransition();
            }, 1500);
        } else if (step === 2) {
            setStep(3);
            slideTransition();
        } else if (step === 3) {
            if (newPin !== confirmPin) {
                shakeAnimation();
                Alert.alert('Error', 'PINs do not match. Please try again.');
                // Reset confirm PIN
                setConfirmPin('');
                setConfirmPinCode(['', '', '', '', '', '']);
                setVisibleConfirmPinDigits(new Set());
                Object.values(confirmPinMaskTimers.current).forEach(timer => clearTimeout(timer));
                confirmPinMaskTimers.current = {};
                return;
            }
            setModalStatus('loading');
            setModalMessage('Resetting your PIN..');
            setModalVisible(true);

            const payload = {
                newPin,
                confirmPin,
                token,
                reqType: 'resetPin',
                email: userData.email
            }

            mutation.mutate(payload, {
                onSuccess: async () => {

                    setModalStatus('success');
                    setModalMessage('PIN reset Successful 🚀');

                    setTimeout(() => {
                        setModalStatus('loading');
                        setModalMessage('Redirecting... ♻️');
                    }, 2000);

                    // Navigate after 3s total
                    setTimeout(() => {
                        setModalVisible(false);
                        router.replace(`/client/profile`);
                    }, 3500);
                },
                onError: async (error) => {
                    let errorMessage = 'Internal Error ⚠️';
                    if (error.message === "Network error") {
                        errorMessage = 'No internet connection 🔌';
                    } else errorMessage = error.message;
                    setModalStatus('error');
                    setModalMessage(errorMessage);
                    setModalVisible(true);
                }
            })

            // Final submission
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        }
    };

    // Animations
    const shakeAnimation = () => {
        Vibration.vibrate(100);
        Animated.sequence([
            Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: -10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
        ]).start();
    };

    const slideTransition = () => {
        Animated.sequence([
            Animated.timing(slideAnim, {toValue: -20, duration: 150, useNativeDriver: true}),
            Animated.timing(slideAnim, {toValue: 0, duration: 200, useNativeDriver: true}),
        ]).start();
    };

    // Get step content
    const getStepContent = () => {
        switch (step) {
            case 1:
                return {
                    icon: "token",
                    iconColor: "#3B82F6",
                    iconBg: "bg-blue-100",
                    title: "Token Verification",
                    subtitle: "Enter the 5-character token sent to your email",
                    buttonText: loading ? "Verifying..." : "Verify Code",
                    buttonColor: "bg-blue-600"
                };
            case 2:
                return {
                    icon: "lock",
                    iconColor: "#3B82F6",
                    iconBg: "bg-green-100",
                    title: "Create New PIN",
                    subtitle: "Enter your new 6-digit PIN",
                    buttonText: "Continue",
                    buttonColor: "bg-blue-600"
                };
            case 3:
                return {
                    icon: "add-moderator",
                    iconColor: "#3B82F6",
                    iconBg: "bg-purple-100",
                    title: "Confirm New PIN",
                    subtitle: "Re-enter your new PIN to confirm",
                    buttonText: loading ? "Updating PIN..." : "Update PIN",
                    buttonColor: "bg-blue-600"
                };
            default:
                return {};
        }
    };

    const stepContent = getStepContent();
    const inputData = getCurrentInputData();

    // Clean up timers
    useEffect(() => {
        return () => {
            [newPinMaskTimers, confirmPinMaskTimers].forEach(timerRef => {
                Object.values(timerRef.current).forEach(timer => clearTimeout(timer));
            });
        };
    }, []);

    return (
        <>
            <View className="flex-1">
                {/* Progress Indicator */}
                <View className="flex-row justify-center items-center pt-12 pb-6 px-6 ">
                    {[1, 2, 3].map((stepNum) => (
                        <View key={stepNum} className="flex-row items-center">
                            <View
                                className={`w-10 h-10 rounded-full items-center justify-center ${
                                    stepNum <= step ? 'bg-blue-500' : 'bg-gray-600'
                                }`}
                            >
                                <Text className="text-white font-bold">{stepNum}</Text>
                            </View>
                            {stepNum < 3 && (
                                <View
                                    className={`w-12 h-1 mx-2 ${
                                        stepNum < step ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                />
                            )}
                        </View>
                    ))}
                </View>

                <View className="flex justify-center px-6 ">
                    <Animated.View
                        style={{transform: [{translateY: slideAnim}]}}
                        className="items-center mb-8"
                    >
                        <View className={`${stepContent.iconBg} rounded-full p-4 mt-4 mb-4`}>
                            <MaterialIcons name={stepContent.icon} size={48} color={stepContent.iconColor}/>
                        </View>
                        <Text className="text-3xl font-bold text-gray-950 text-center mb-2">
                            {stepContent.title}
                        </Text>
                        <Text className="text-gray-600 text-center text-lg px-4">
                            {stepContent.subtitle}
                        </Text>
                    </Animated.View>

                    <Animated.View
                        className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6"
                        style={{transform: [{translateX: shakeAnim}]}}
                    >
                        {/* Input Display */}
                        {step === 1 ? (
                            /* Token Input - Alphanumeric with Keyboard */
                            <>
                                <View className="mb-8">
                                    <View style={styles.tokenDisplayContainer}>
                                        {tokenCode.map((char, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.tokenDisplay,
                                                    char && styles.tokenDisplayFilled
                                                ]}
                                            >
                                                <Text style={styles.tokenDisplayText}>
                                                    {char || ''}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Hidden TextInput for token entry */}
                                    <View className="relative mt-4 ">
                                        <TouchableOpacity
                                            onPress={() => tokenInputRef.current?.focus()}
                                            className="bg-white/5 border-2 border-gray-600 rounded-2xl py-4 px-6 flex-row items-center justify-between"
                                            style={{borderColor: token.length > 0 ? '#3B82F6' : '#6B7280'}}
                                        >
                                            <Text className="text-black text-lg flex-1">
                                                {token || 'Tap to enter verification code'}
                                            </Text>
                                            <Ionicons
                                                name="create-outline"
                                                size={24}
                                                color={token.length > 0 ? '#3B82F6' : '#6B7280'}
                                            />
                                        </TouchableOpacity>

                                        <TextInput
                                            ref={tokenInputRef}
                                            value={token}
                                            onChangeText={handleTokenChange}
                                            placeholder="Enter 5-character code"
                                            placeholderTextColor="#6B7280"
                                            maxLength={5}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                            autoComplete="off"
                                            className="absolute inset-0 opacity-0 text-white text-lg px-6"
                                            style={{fontSize: 18}}
                                        />
                                    </View>
                                </View>
                            </>
                        ) : (
                            /* PIN Input Display - Numbers only */
                            <View style={styles.codeInputContainer}>
                                {inputData?.code.map((digit, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.pinInput,
                                            digit && styles.codeInputFilled
                                        ]}
                                    >
                                        <Text style={styles.codeInputText}>
                                            {digit ? '●' : ''}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Back Button */}
                        {step > 1 && (
                            <TouchableOpacity
                                onPress={() => {
                                    if (step === 2) {
                                        setStep(1);
                                        setNewPin('');
                                        setNewPinCode(['', '', '', '', '', '']);
                                        setVisibleNewPinDigits(new Set());
                                    } else if (step === 3) {
                                        setStep(2);
                                        setConfirmPin('');
                                        setConfirmPinCode(['', '', '', '', '', '']);
                                        setVisibleConfirmPinDigits(new Set());
                                    }
                                    slideTransition();
                                }}
                                className="flex items-center justify-center"
                            >
                                <Ionicons name="play-back-circle" size={40} color="#fb6f92"/>
                                <Text className="text-gray-400 text-center text-lg">
                                    Prev
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Custom Number Pad - Only for PIN steps */}
                        {step > 1 && (
                            <View style={styles.numberPad}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '*', '#'].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={styles.numberKey}
                                        onPress={() => handleNumpadPress(num)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.numberKeyText}>{num}</Text>
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity
                                    style={styles.numberKey}
                                    onPress={handleNumpadBackspace}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="backspace" size={24} color="#666"/>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Continue Button */}
                        <TouchableOpacity
                            onPress={handleContinue}
                            disabled={loading || (step === 1 ? token.length !== 5 : (inputData?.code.join('').length !== 6))}
                            className={`${stepContent.buttonColor} rounded-2xl py-4 mt-4`}
                            style={{
                                opacity: loading || (step === 1 ? token.length !== 5 : (inputData?.code.join('').length !== 6)) ? 0.7 : 1
                            }}
                        >
                            <Text className="text-white font-semibold text-lg text-center">
                                {stepContent.buttonText}
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

const styles = StyleSheet.create({
    tokenDisplayContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 10,
    },
    tokenDisplay: {
        width: 45,
        height: 45,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 6,
    },
    tokenDisplayFilled: {
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        shadowColor: '#3B82F6',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    tokenDisplayText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    codeInputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    pinInput: {
        width: 55,
        height: 55,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
    },
    codeInputFilled: {
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        shadowColor: '#3B82F6',
        shadowOffset: {width: 0, height: 2},
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
        marginTop: 8
    },
    numberKey: {
        width: 60,
        height: 60,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    numberKeyText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#020202',
    },
});

export default ResetPinScreen;