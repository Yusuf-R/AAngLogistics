import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSessionStore } from '../../../../store/useSessionStore';

function NinVerification({ userData }) {
    const [nin, setNin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const updateUser = useSessionStore((state) => state.user);

    const handleVerify = async () => {
        if (!nin.match(/^\d{11}$/)) {
            setError('Please enter a valid 11-digit NIN');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Simulate API call - replace with actual verification logic
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock verification success
            updateUser({ ninVerified: true, ninNumber: nin });
            setSuccess(true);
        } catch (err) {
            setError('Verification failed. Please check your NIN and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (userData?.ninVerified || success) {
        return (
            <Animated.View
                entering={FadeIn.duration(500)}
                style={styles.container}
            >
                <View style={styles.successContainer}>
                    <View style={styles.iconCircle}>
                        <AntDesign name="checkcircle" size={48} color="#4BB543" />
                    </View>

                    <Text style={styles.successTitle}>NIN Verified Successfully</Text>
                    <Text style={styles.successText}>
                        Your National Identification Number has been verified and secured.
                    </Text>

                    <View style={styles.ninDisplay}>
                        <Text style={styles.ninLabel}>Your NIN:</Text>
                        <Text style={styles.ninNumber}>{userData?.ninNumber || nin}</Text>
                    </View>

                    <View style={styles.verifiedBadge}>
                        <MaterialIcons name="verified" size={20} color="#4BB543" />
                        <Text style={styles.verifiedText}>Identity Verified</Text>
                    </View>
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            entering={FadeInDown.duration(500)}
            style={styles.container}
        >
            <View style={styles.header}>
                <Text className="font-poppinsExtraBold text-3xl mb-4 ">Verify Your Identity</Text>
                <Text className="font-poppinsLight text-lg text-gray-600">
                    For security and compliance, we need to verify your National Identification Number (NIN)
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter 11-digit NIN"
                    placeholderTextColor="#999"
                    value={nin}
                    onChangeText={(text) => {
                        setNin(text);
                        setError('');
                    }}
                    keyboardType="numeric"
                    maxLength={11}
                    autoFocus
                />

                {error && (
                    <Animated.View
                        entering={FadeIn.duration(300)}
                        exiting={FadeOut.duration(200)}
                        style={styles.errorContainer}
                    >
                        <MaterialIcons name="error-outline" size={18} color="#FF3B30" />
                        <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                )}
            </View>

            <View style={styles.infoBox}>
                <FontAwesome name="info-circle" size={18} color="#007AFF" />
                <Text style={styles.infoText}>
                    Your NIN is the 11-digit number on your National ID card, NIN slip, or NIMC mobile app.
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={isLoading}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Verify NIN</Text>
                )}
            </TouchableOpacity>

            <View style={styles.securityNote}>
                <MaterialIcons name="security" size={16} color="#666" />
                <Text style={styles.securityText}>
                    Your information is secured with bank-level encryption and complies with NDPR regulations.
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
        alignItems: 'center',
        fontFamily: 'PoppinsBlack'
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    ninImage: {
        width: '100%',
        height: 150,
        marginBottom: 24,
        alignSelf: 'center',
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 12,
        backgroundColor: '#FFF0EF',
        borderRadius: 8,
    },
    errorText: {
        color: '#FF3B30',
        marginLeft: 8,
        fontSize: 14,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#F0F7FF',
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        color: '#007AFF',
        marginLeft: 12,
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    button: {
        height: 56,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,

    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'PoppinsBold'
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 8,
    },
    securityText: {
        color: '#666',
        marginLeft: 8,
        fontSize: 13,
        lineHeight: 18,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconCircle: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    successText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        maxWidth: '80%',
    },
    ninDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginBottom: 24,
    },
    ninLabel: {
        fontSize: 16,
        color: '#666',
        marginRight: 8,
    },
    ninNumber: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        letterSpacing: 1.2,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F0FFF0',
        borderRadius: 20,
    },
    verifiedText: {
        color: '#4BB543',
        marginLeft: 8,
        fontWeight: '600',
    },
});

export default NinVerification;