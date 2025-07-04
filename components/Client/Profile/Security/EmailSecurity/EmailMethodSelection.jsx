import React, {useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Image,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Toast} from "toastify-react-native";
import ClientUtils from '../../../../../utils/ClientUtilities';
import {useMutation} from "@tanstack/react-query";
import {useGetToken} from "../../../../../hooks/useGetToken";
import StatusModal from "../../../../StatusModal/StatusModal"
import {router} from "expo-router";

const EmailVet = require('../../../../../assets/images/emailVet.png')


const EmailMethodSelection = ({ userData }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Sending request...');

    // Check if email is already verified
    const isEmailVerified = userData?.emailVerified || false;

    const mutation = useGetToken();

    const handleMethodSelect = (method) => {
        // Prevent selection if email is already verified
        if (method === 'email' && isEmailVerified) {
            Toast.show({
                type: 'info',
                text1: 'Email Already Verified',
                visibilityTime: 2000,
            });
            return;
        }
        setSelectedMethod(method);
    };

    const handleContinue = () => {
        if (!selectedMethod) return;

        // Check again before proceeding
        if (selectedMethod === 'email' && isEmailVerified) {
            Toast.show({
                type: 'info',
                text1: 'Email Already Verified',
                visibilityTime: 2000,
            });
            return;
        }

        setModalMessage('Sending request...');
        setModalStatus('loading');
        setModalVisible(true);

        const data = {
            reqType: 'Email',
            email: userData.email,
        }

        mutation.mutate(data, {
            onSuccess: () => {
                setModalStatus('success');
                setModalMessage('Request sent successfully!');

                // delay navigation slightly after success animation plays
                setTimeout(() => {
                    setModalVisible(false);
                    router.push({
                        pathname: '/client/profile/verify-email-code',
                    });
                }, 1500);
            },
            onError: () => {
                setModalStatus('error');
                setModalMessage('Network error occurred. Please try again.');
            }
        })
    };

    return (
        <SafeAreaView style={styles.container}>
            <View className='justify-center items-center mb-4'>
                <Image
                    source={EmailVet}
                    resizeMode='contain'
                    style={{width: 350, height: 350}}
                />
            </View>
            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.instructionText}>
                    {isEmailVerified
                        ? 'Your email has been verified'
                        : 'Select to verify your email'
                    }
                </Text>

                {/* Email Option */}
                <TouchableOpacity
                    style={[
                        styles.methodOption,
                        selectedMethod === 'email' && styles.selectedMethod,
                        isEmailVerified && styles.verifiedMethod
                    ]}
                    disabled={isEmailVerified}
                    onPress={() => handleMethodSelect('email')}
                >
                    <View style={[
                        styles.methodIcon,
                        isEmailVerified && styles.verifiedIcon
                    ]}>
                        <Ionicons
                            name="mail"
                            size={24}
                            color={isEmailVerified ? "#10B981" : "#60a5fa"}
                        />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodLabel}>via Email:</Text>
                        <Text style={styles.methodValue}>{userData.email}</Text>
                    </View>

                    {/* Verification Status */}
                    {isEmailVerified && (
                        <View style={styles.verificationStatus}>
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981"/>
                            </View>
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Continue Button - Hide if already verified */}
                {!isEmailVerified && (
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !selectedMethod && styles.disabledButton
                        ]}
                        onPress={handleContinue}
                        disabled={!selectedMethod}
                    >
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>
                )}

                {/* Already Verified Message */}
                {isEmailVerified && (
                    <View style={styles.alreadyVerifiedContainer}>
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={48} color="#10B981"/>
                        </View>
                        <Text style={styles.alreadyVerifiedTitle}>Email Verified!</Text>
                        <Text style={styles.alreadyVerifiedMessage}>
                            Your email address has been successfully verified.
                            You're all set!
                        </Text>
                    </View>
                )}
            </View>
            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onRetry={() => {
                    setModalStatus('loading');
                    setModalMessage('Retrying...');
                    handleContinue(); // retry logic
                }}
                onClose={() => setModalVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E7',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginLeft: 16,
    },
    illustrationContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    instructionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    methodOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E5E7',
        marginBottom: 16,
    },
    selectedMethod: {
        borderColor: '#60a5fa',
        backgroundColor: '#F0FDF9',
    },
    verifiedMethod: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
        opacity: 0.8,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    verifiedIcon: {
        backgroundColor: '#D1FAE5',
    },
    methodInfo: {
        flex: 1,
    },
    methodLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    methodValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    verificationStatus: {
        alignItems: 'center',
        marginLeft: 12,
    },
    verifiedBadge: {
        marginBottom: 4,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
        textAlign: 'center',
    },
    continueButton: {
        backgroundColor: '#60a5fa',
        borderRadius: 25,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: '#E5E5E7',
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    alreadyVerifiedContainer: {
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    successIconContainer: {
        marginBottom: 16,
    },
    alreadyVerifiedTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 8,
        textAlign: 'center',
    },
    alreadyVerifiedMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default EmailMethodSelection;