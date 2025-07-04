import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    TextInput,
    Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router'; // or react-native-vector-icons
import StatusModal from "../../../../StatusModal/StatusModal";
import {useGetToken} from "../../../../../hooks/useGetToken";
import {useMutation} from '@tanstack/react-query';
import ClientUtils from "../../../../../utils/ClientUtilities";
import VerificationSuccessModal from "./VerificationSuccessModal";
import SecureStorage from "../../../../../lib/SecureStorage";
import SessionManager from "../../../../../lib/SessionManager";

const EmailCodeVerification = ({
                                   userEmail,
                               }) => {
    const email = userEmail;
    const [timer, setTimer] = useState(10); // 15 minutes in seconds
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [retryContext, setRetryContext] = useState('verify'); // or 'resend'
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [modalMessage, setModalMessage] = useState('Sending new code...');

    const resendMutation = useGetToken();

    const mutation = useMutation({
        mutationKey: ['VerifyEmail'],
        mutationFn: ClientUtils.VerifyEmail,
    });

    // Timer effect
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(timer - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Format timer display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle code input
    const handleCodeInput = (text, index) => {
        const newCode = [...verificationCode];
        newCode[index] = text;
        setVerificationCode(newCode);
    };

    // Handle verification
    const handleVerify = async () => {
        const token = verificationCode.join('');
        if (token.length !== 6) {
            Alert.alert('Error', 'Please enter complete verification code');
            return;
        }

        setRetryContext('verify');
        setModalStatus('loading');
        setModalMessage('Verifying Email request...');
        setModalVisible(true);

        const data = {
            reqType: 'Email',
            token,
        };

        mutation.mutate(data, {
            onSuccess: async (respData) => {
                const { user } = respData;

                // STEP 1: Save updated user securely before any UI transitions
                await SessionManager.updateUser(user);


                // STEP 2: Update modal to show success
                setModalStatus('success');
                setModalMessage('Verification successful!');

                // STEP 3: Delay to let user see success, then show fancy success modal
                setTimeout(() => {
                    setModalVisible(false);
                    setShowSuccessModal(true);
                }, 1500); // subtle, human-friendly pause

                // STEP 4: Navigate after another short delay
                setTimeout(() => {
                    setShowSuccessModal(false);
                    router.replace('/client/profile');
                }, 4500); // 3s + 1.2s = smooth experience
            },
            onError: () => {
                setModalStatus('error');
                setModalMessage('Verification Failed. Please try again.');
            },
        });
    };


    // Handle resend code
    const handleResendCode = async () => {
        const payload = {reqType: 'Email', email};

        setRetryContext('resend');
        setModalStatus('loading');
        setModalMessage('Sending new code...');
        setModalVisible(true);

        resendMutation.mutate(payload, {
            onSuccess: () => {
                setModalStatus('success');
                setModalMessage('New token sent to your email.');

                setVerificationCode(['', '', '', '', '', '']);
                setTimer(10); // restart countdown

                setTimeout(() => {
                    setModalVisible(false);
                }, 1500);
            },
            onError: () => {
                setModalStatus('error');
                setModalMessage('Failed to resend code. Please try again.');
            },
        });
    };

    const handleSuccessNavigation = () => {
        setShowSuccessModal(false);
        router.replace('/client/profile');
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false); // fallback in case modal is dismissed manually
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.instructionText}>
                    Token has been sent to {email}
                </Text>

                {/* Code Input */}
                <View style={styles.codeInputContainer}>
                    {verificationCode.map((digit, index) => (
                        <TextInput
                            key={index}
                            style={[
                                styles.codeInput,
                                digit && styles.codeInputFilled
                            ]}
                            value={digit}
                            onChangeText={(text) => handleCodeInput(text.slice(-1), index)}
                            keyboardType="numeric"
                            maxLength={1}
                            textAlign="center"
                            autoFocus={index === 0}
                        />
                    ))}
                </View>

                {/* Timer */}
                <Text style={styles.timerText}>
                    Resend code in{' '}
                    <Text style={styles.timerHighlight}>{formatTime(timer)}</Text> s
                </Text>

                {/* Resend Button */}
                {timer === 0 && (
                    <TouchableOpacity onPress={handleResendCode} style={styles.resendButton}>
                        <Text style={styles.resendButtonText}>Resend Code</Text>
                    </TouchableOpacity>
                )}

                {/* Verify Button */}
                <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={handleVerify}
                >
                    <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>

                {/* Number Pad */}
                <View style={styles.numberPad}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0].map((num, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.numberKey}
                            onPress={() => {
                                if (typeof num === 'number') {
                                    const emptyIndex = verificationCode.findIndex(digit => digit === '');
                                    if (emptyIndex !== -1) {
                                        handleCodeInput(num.toString(), emptyIndex);
                                    }
                                }
                            }}
                        >
                            <Text style={styles.numberKeyText}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.numberKey}
                        onPress={() => {
                            const lastFilledIndex = verificationCode.findLastIndex(digit => digit !== '');
                            if (lastFilledIndex !== -1) {
                                handleCodeInput('', lastFilledIndex);
                            }
                        }}
                    >
                        <Ionicons name="backspace" size={24} color="#666"/>
                    </TouchableOpacity>
                </View>
            </View>
            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onRetry={retryContext === 'verify' ? handleVerify : handleResendCode}
                onClose={() => setModalVisible(false)}
            />
            <VerificationSuccessModal
                visible={showSuccessModal}
                onClose={handleCloseSuccessModal}
                onNavigate={handleSuccessNavigation}
                title="Congratulations!"
                message="Your email has been verified successfully. Redirecting..."
                autoCloseDelay={3000}
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    instructionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    codeInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    codeInput: {
        width: 45,
        height: 45,
        borderWidth: 2,
        borderColor: '#E5E5E7',
        borderRadius: 8,
        fontSize: 20,
        fontWeight: 'bold',
    },
    codeInputFilled: {
        borderColor: '#60a5fa',
        backgroundColor: '#F0FDF9',
    },
    timerText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    timerHighlight: {
        color: '#60a5fa',
        fontWeight: '600',
    },
    resendButton: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    resendButtonText: {
        color: '#60a5fa',
        fontSize: 16,
        fontWeight: '600',
    },
    verifyButton: {
        backgroundColor: '#60a5fa',
        borderRadius: 25,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 30,
    },
    disabledButton: {
        backgroundColor: '#E5E5E7',
    },
    verifyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    numberKey: {
        width: '30%',
        aspectRatio: 1.2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    numberKeyText: {
        fontSize: 24,
        fontWeight: '300',
        color: '#333',
    },
});

export default EmailCodeVerification;