import React, {useRef, useState} from "react";
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from "react-native";
import {useMutation} from "@tanstack/react-query";
import ClientUtils from "../../utils/ClientUtilities";
import {router} from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import StatusModal from "../StatusModal/StatusModal";

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Status Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Sending reset link...');

    // Animation
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const emailInputRef = useRef(null);

    const mutation = useMutation({
        mutationKey: ['RequestPasswordReset'],
        mutationFn: ClientUtils.RequestPasswordReset,
    });

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle email input
    const handleEmailChange = (text) => {
        setEmail(text.toLowerCase().trim());
    };

    // Shake animation for errors
    const shakeAnimation = () => {
        Vibration.vibrate(100);
        Animated.sequence([
            Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: -10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
        ]).start();
    };

    // Handle submit
    const handleSubmit = () => {
        if (!email) {
            shakeAnimation();
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!isValidEmail(email)) {
            shakeAnimation();
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setModalStatus('loading');
        setModalMessage('Sending reset instructions...');
        setModalVisible(true);

        const payload = {
            email,
            reqType: 'requestPasswordReset'
        };

        mutation.mutate(payload, {
            onSuccess: () => {
                setModalStatus('success');
                setModalMessage('Reset instructions sent! 📧');

                setTimeout(() => {
                    setModalStatus('loading');
                    setModalMessage('Redirecting to reset page...');
                }, 2000);

                // Navigate to reset screen after 3.5s
                setTimeout(() => {
                    setModalVisible(false);
                    router.push(`/(authentication)/reset-password?email=${encodeURIComponent(email)}`);
                }, 3500);
            },
            onError: (error) => {
                let errorMessage = 'Failed to send reset instructions ⚠️';
                if (error.message === "Network error") {
                    errorMessage = 'No internet connection 🔌';
                } else if (error.message.toLowerCase().includes('not found')) {
                    errorMessage = 'Email address not found 📧';
                } else {
                    errorMessage = error.message;
                }
                setModalStatus('error');
                setModalMessage(errorMessage);
            }
        });
    };

    // Fade in animation on mount
    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <Animated.View
                    style={{opacity: fadeAnim}}
                    className="flex px-6 justify-center mt-20"
                >
                    {/* Header */}
                    <View className="items-center mb-8">
                        <View className="bg-blue-100 rounded-full p-6 mb-6">
                            <MaterialIcons name="lock-reset" size={64} color="#3B82F6"/>
                        </View>
                        <Text className="text-3xl font-bold text-gray-950 text-center mb-2">
                            Reset Password
                        </Text>
                        <Text className="text-gray-600 text-center text-lg px-4">
                            Enter your email address and we'll send you instructions to reset your password
                        </Text>
                    </View>

                    {/* Email Input Card */}
                    <Animated.View
                        className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-2"
                        style={{transform: [{translateX: shakeAnim}]}}
                    >
                        <View className="mb-14">
                            <Text className="text-gray-700 font-semibold mb-3 text-lg">
                                Email Address
                            </Text>

                            <TouchableOpacity
                                onPress={() => emailInputRef.current?.focus()}
                                className="bg-white/5 border-2 rounded-2xl py-4 px-6 flex-row items-center"
                                style={{borderColor: email && isValidEmail(email) ? '#10B981' : '#6B7280'}}
                            >
                                <Ionicons
                                    name="mail-outline"
                                    size={24}
                                    color={email && isValidEmail(email) ? '#10B981' : '#6B7280'}
                                />
                                <TextInput
                                    ref={emailInputRef}
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    placeholder="Enter your email address"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="email"
                                    className="flex-1 text-black text-lg ml-3"
                                    style={{fontSize: 18}}
                                />
                                {email && isValidEmail(email) && (
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981"/>
                                )}
                            </TouchableOpacity>

                            {email && !isValidEmail(email) && (
                                <Text className="text-red-500 text-sm mt-2 ml-2">
                                    Please enter a valid email address
                                </Text>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading || !email || !isValidEmail(email)}
                            className="bg-blue-600 rounded-2xl py-4"
                            style={{
                                opacity: loading || !email || !isValidEmail(email) ? 0.7 : 1
                            }}
                        >
                            <Text className="text-white font-semibold text-lg text-center">
                                {loading ? "Sending..." : "Send Reset Instructions"}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>

            </KeyboardAvoidingView>

            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
}

export default ForgotPassword;