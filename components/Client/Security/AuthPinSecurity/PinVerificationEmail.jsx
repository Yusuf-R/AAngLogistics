// Email Verification Screen
import {useState} from "react";
import {Alert, Text, TextInput, TouchableOpacity, View} from "react-native";
import KeyboardAvoidingHook from "../../../../hooks/KeyBoardAvoidingHook";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useMutation} from "@tanstack/react-query";
import ClientUtils from "../../../../utils/ClientUtilities";
import StatusModal from "../../../StatusModal/StatusModal";
import {ROUTES} from "../../../../utils/Constant";
import {router} from "expo-router";

function PinVerificationEmail({userData, reqType}) {
    const [email, setEmail] = useState(userData?.email || '');
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [modalMessage, setModalMessage] = useState('Logging in...');

    const mutation = useMutation({
        mutationKey: ['GetPinToken'],
        mutationFn: ClientUtils.GetPinToken,
    });

    const handleSendToken = () => {
        setLoading(true);
        setModalVisible(true);
        setModalStatus('loading');
        setModalMessage('Sending verification token...');
        console.log({
            reqType
        })

        const payload = {
            email: email,
            reqType: reqType,
        }
        mutation.mutate(payload, {
            onSuccess: () => {
                setLoading(false);

                setModalStatus('success');
                setModalMessage('Verification token sent successfully!');

                // Step 1: Delay before showing "Redirecting..." message
                setTimeout(() => {
                    setModalStatus('loading');
                    setModalMessage('Redirecting...');
                }, 1500);

                // Step 2: Route after another delay
                setTimeout(() => {
                    setModalVisible(false);

                    const routePath = reqType === 'updatePin'
                        ? ROUTES['UPDATE-PIN']
                        : reqType === 'resetPin'
                            ? ROUTES['RESET-PIN']
                            : null;

                    if (routePath) {
                        router.push({ pathname: routePath });
                    }
                }, 3000);
            },
            onError: (error) => {
                setLoading(false);
                setModalStatus('error');
                setModalMessage(error.message || 'Failed to send verification token.');
            }
        });
    };

    return (
        <>
            <View className="flex-1 px-6">
                <View className="items-center mt-36 mb-4">
                    <View className="bg-purple-100 rounded-full p-4 mb-4">
                        <Ionicons name="mail-outline" size={48} color="#60a5fa"/>
                    </View>
                    <Text className="text-3xl font-bold text-black text-center mb-2">
                        Verify Your Identity
                    </Text>
                    <Text className="text-gray-500 text-center text-lg">
                        Click to receive a verification token
                    </Text>
                </View>

                <KeyboardAvoidingHook>
                    <View className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6">
                        {/* Enhanced Verified Email Display */}
                        <View className="relative">
                            <View className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                                {/* Verified Badge */}
                                <View
                                    className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-10">
                                    <Ionicons name="checkmark" size={16} color="white"/>
                                </View>

                                {/* Email Display Container */}
                                <View className="flex-row items-center">
                                    <View className="bg-green-100 rounded-full p-2 mr-3">
                                        <Ionicons name="mail" size={20} color="#10b981"/>
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-xs text-green-600 font-medium mb-1">
                                            VERIFIED EMAIL
                                        </Text>
                                        <Text className="text-gray-800 text-lg font-medium">
                                            {email}
                                        </Text>
                                    </View>

                                    <View className="bg-green-500 rounded-full p-1">
                                        <Ionicons name="shield-checkmark" size={16} color="white"/>
                                    </View>
                                </View>

                                {/* Verification Status Bar */}
                                <View className="mt-3 pt-3 border-t border-green-200">
                                    <View className="flex-row items-center justify-center">
                                        <View className="bg-green-500 rounded-full w-2 h-2 mr-2"/>
                                        <Text className="text-green-600 text-sm font-medium">
                                            Email Verified & Secured
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSendToken}
                            disabled={loading}
                            className="bg-blue-500 rounded-2xl py-4 shadow-lg"
                            style={{opacity: loading ? 0.7 : 1}}
                        >
                            <View className="flex-row items-center justify-center">
                                {loading && (
                                    <View className="mr-2">
                                        <Ionicons name="time-outline" size={20} color="white"/>
                                    </View>
                                )}
                                <Text className="text-white font-semibold text-lg text-center">
                                    {loading ? 'Sending Token...' : 'Send Verification Token'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Additional Security Info */}
                        <View className="mt-4 p-3 bg-blue-50 rounded-xl">
                            <View className="flex-row items-center">
                                <Ionicons name="information-circle" size={16} color="#3b82f6"/>
                                <Text className="text-blue-600 text-sm ml-2 flex-1">
                                    A secure verification token will be sent to your verified email address
                                </Text>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingHook>
            </View>
            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
                onRetry={() => {
                    setModalStatus('loading');
                    setModalMessage('Retrying...');
                    handleSendToken(); // retry logic
                }}
            />
        </>
    );
}

export default PinVerificationEmail;