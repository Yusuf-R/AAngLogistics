import {
    Alert,
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import React, {useRef, useState} from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useMutation} from "@tanstack/react-query";
import ClientUtils from "../../utils/ClientUtilities";
import {router} from "expo-router";
import StatusModal from "../../components/StatusModal/StatusModal";


function ResetPassword({email}) {
    const [step, setStep] = useState(1); // 1: Token, 2: New Password, 3: Confirm Password
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Password visibility
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Status Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Resetting password...');

    const mutation = useMutation({
        mutationKey: ['ResetPassword'],
        mutationFn: ClientUtils.ResetPassword,
    });

    // Animation and visual states
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const tokenInputRef = useRef(null);
    const newPasswordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    // Token input state (5 characters - alphanumeric)
    const [tokenCode, setTokenCode] = useState(['', '', '', '', '']);

    // Password validation
    const isValidPassword = (password) => {
        return password.length >= 6; // Add your password requirements
    };

    // Handle token input change
    const handleTokenChange = (text) => {
        const upperText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (upperText.length <= 5) {
            setToken(upperText);

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

        if (step === 2 && !isValidPassword(newPassword)) {
            shakeAnimation();
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        if (step === 3 && confirmPassword !== newPassword) {
            shakeAnimation();
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (step === 1) {
            setStep(2);
            slideTransition();
            setTimeout(() => newPasswordRef.current?.focus(), 300);
        } else if (step === 2) {
            setStep(3);
            slideTransition();
            setTimeout(() => confirmPasswordRef.current?.focus(), 300);
        } else if (step === 3) {
            // Final submission
            setModalStatus('loading');
            setModalMessage('Resetting your password...');
            setModalVisible(true);

            const payload = {
                email,
                token,
                newPassword,
                confirmPassword,
                reqType: 'resetPassword'
            };
            console.log(payload);

            mutation.mutate(payload, {
                onSuccess: () => {
                    setModalStatus('success');
                    setModalMessage('Password reset successful! 🎉');

                    setTimeout(() => {
                        setModalStatus('loading');
                        setModalMessage('Redirecting to login...');
                    }, 2000);

                    setTimeout(() => {
                        setModalVisible(false);
                        router.replace('/(authentication)/login');
                    }, 3500);
                },
                onError: (error) => {
                    let errorMessage = 'Failed to reset password ⚠️';
                    if (error.message === "Network error") {
                        errorMessage = 'No internet connection 🔌';
                    } else if (error.message.toLowerCase().includes('token')) {
                        errorMessage = 'Invalid or expired token 🔑';
                    } else {
                        console.log(error);
                        errorMessage = error.message;
                    }
                    setModalStatus('error');
                    setModalMessage(errorMessage);
                }
            });
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
                    icon: "verified",
                    iconColor: "#3B82F6",
                    iconBg: "bg-blue-100",
                    title: "Verify Token",
                    subtitle: "Enter the 5-character token from your email",
                    buttonText: "Verify Token",
                    buttonColor: "bg-blue-600"
                };
            case 2:
                return {
                    icon: "lock",
                    iconColor: "#3B82F6",
                    iconBg: "bg-blue-200",
                    title: "New Password",
                    subtitle: "Create your new secure password",
                    buttonText: "Continue",
                    buttonColor: "bg-blue-600"
                };
            case 3:
                return {
                    icon: "check-circle",
                    iconColor: "#3B82F6",
                    iconBg: "bg-purple-100",
                    title: "Confirm Password",
                    subtitle: "Re-enter your new password to confirm",
                    buttonText: loading ? "Resetting..." : "Reset Password",
                    buttonColor: "bg-blue-600"
                };
            default:
                return {};
        }
    };

    const stepContent = getStepContent();

    return (
        <>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Progress Indicator */}
                <View className="flex-row justify-center items-center pt-12 pb-6 px-6 mt-4">
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
                        className="items-center mb-1 "
                    >
                        <View className={`${stepContent.iconBg} rounded-full p-4 mb-4`}>
                            <MaterialIcons name={stepContent.icon} size={48} color={stepContent.iconColor}/>
                        </View>
                        <Text className="text-3xl font-bold text-gray-950 text-center mb-2">
                            {stepContent.title}
                        </Text>
                        <Text className="text-gray-600 text-center text-lg px-4">
                            {stepContent.subtitle}
                        </Text>
                        {email && (
                            <Text className="text-gray-500 text-center text-sm mt-2">
                                for {email}
                            </Text>
                        )}
                    </Animated.View>

                    <Animated.View
                        className="bg-white/10 backdrop-blur-lg rounded-3xl p-6"
                        style={{transform: [{translateX: shakeAnim}]}}
                    >
                        {step === 1 ? (
                            /* Token Input */
                            <>
                                <View className="mb-6">
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

                                    <View className="relative mt-4">
                                        <TouchableOpacity
                                            onPress={() => tokenInputRef.current?.focus()}
                                            className="bg-white/5 border-2 border-gray-600 rounded-2xl py-4 px-6 flex-row items-center justify-between"
                                            style={{borderColor: token.length > 0 ? '#3B82F6' : '#6B7280'}}
                                        >
                                            <Text className="text-black text-lg flex-1">
                                                {token || 'Tap to enter token'}
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
                                            placeholder="Enter token"
                                            placeholderTextColor="#6B7280"
                                            maxLength={5}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                            className="absolute inset-0 opacity-0 text-lg px-6"
                                        />
                                    </View>
                                </View>
                            </>
                        ) : (
                            /* Password Input */
                            <View className="mb-6 ">
                                <Text className="text-gray-700 font-semibold mb-3 text-lg">
                                    {step === 2 ? 'New Password' : 'Confirm Password'}
                                </Text>

                                <View className="bg-white/5 border-2 rounded-2xl py-4 px-6 flex-row items-center"
                                      style={{borderColor: (step === 2 ? newPassword : confirmPassword) ? '#10B981' : '#6B7280'}}>
                                    <Ionicons name="lock-closed-outline" size={24} color="#6B7280"/>
                                    <TextInput
                                        ref={step === 2 ? newPasswordRef : confirmPasswordRef}
                                        value={step === 2 ? newPassword : confirmPassword}
                                        onChangeText={step === 2 ? setNewPassword : setConfirmPassword}
                                        placeholder={step === 2 ? "Enter new password" : "Confirm new password"}
                                        placeholderTextColor="#6B7280"
                                        secureTextEntry={step === 2 ? !showNewPassword : !showConfirmPassword}
                                        className="flex-1 text-black text-lg ml-3"
                                        style={{fontSize: 18}}
                                    />
                                    <TouchableOpacity
                                        onPress={() => step === 2 ? setShowNewPassword(!showNewPassword) : setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <Ionicons
                                            name={(step === 2 ? showNewPassword : showConfirmPassword) ? "eye-off-outline" : "eye-outline"}
                                            size={24}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {step === 2 && newPassword && !isValidPassword(newPassword) && (
                                    <Text className="text-red-500 text-sm mt-2 ml-2">
                                        Password must be at least 6 characters
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Back Button */}
                        {step > 1 && (
                            <>
                                <View className="flex items-center justify-center mb-8">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setStep(step - 1);
                                            slideTransition();
                                        }}
                                        className="flex items-center justify-center mb-4 "
                                    >
                                        <Ionicons name="play-back-circle" size={40} color="#008585"/>
                                        <Text className="text-gray-400 text-center text-lg">
                                            Previous
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* Continue Button */}
                        <TouchableOpacity
                            onPress={handleContinue}
                            disabled={loading ||
                                (step === 1 && token.length !== 5) ||
                                (step === 2 && !isValidPassword(newPassword)) ||
                                (step === 3 && !confirmPassword)
                            }
                            className={`${stepContent.buttonColor} rounded-2xl py-4`}
                            style={{
                                opacity: loading ||
                                (step === 1 && token.length !== 5) ||
                                (step === 2 && !isValidPassword(newPassword)) ||
                                (step === 3 && !confirmPassword) ? 0.7 : 1
                            }}
                        >
                            <Text className="text-white font-semibold text-lg text-center">
                                {stepContent.buttonText}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
                {step == 1 && (
                    <>
                        <View className="flex items-center justify-center">
                            <TouchableOpacity
                                onPress={() => {
                                    router.replace('/(authentication)/forgot-password');
                                }}
                                className="flex items-center justify-center mb-4 "
                            >
                                <Ionicons name="arrow-back-circle" size={40} color="#d74a49"/>
                                <Text className="text-gray-400 text-center text-lg">
                                    Back
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            < /KeyboardAvoidingView>

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
        justifyContent:
            'center',
        flexWrap:
            'wrap',
        gap:
            15,
        marginBottom:
            10,
    }
    ,
    tokenDisplay: {
        width: 45,
        height:
            45,
        borderWidth:
            2,
        borderColor:
            '#E5E7EB',
        borderRadius:
            8,
        backgroundColor:
            'rgba(255, 255, 255, 0.8)',
        justifyContent:
            'center',
        alignItems:
            'center',
        margin:
            6,
    }
    ,
    tokenDisplayFilled: {
        borderColor: '#3B82F6',
        backgroundColor:
            'rgba(59, 130, 246, 0.8)',
        shadowColor:
            '#3B82F6',
        shadowOffset:
            {
                width: 0, height:
                    2
            }
        ,
        shadowOpacity: 0.3,
        shadowRadius:
            4,
        elevation:
            5,
    }
    ,
    tokenDisplayText: {
        fontSize: 18,
        fontWeight:
            'bold',
        color:
            '#FFFFFF',
        textAlign:
            'center',
    }
    ,
});

export default ResetPassword