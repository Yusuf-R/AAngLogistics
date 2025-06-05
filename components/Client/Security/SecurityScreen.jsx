import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {router} from "expo-router"; // or react-native-vector-icons
import {ROUTES} from "../../../utils/Constant";

const SecurityScreen = ({ navigation }) => {
    const [rememberMe, setRememberMe] = useState(true);
    const [faceID, setFaceID] = useState(true);
    const [biometricID, setBiometricID] = useState(true);

    const handleToggle = (setter, currentValue, title) => {
        setter(!currentValue);
        // Optional: Show confirmation or handle logic
        console.log(`${title} ${!currentValue ? 'enabled' : 'disabled'}`);
    };

    const verifyEmail = () => {
        // Navigate to Email change
        router.push(ROUTES["VERIFY-EMAIL"]);
    };

    const verifyNIN = () => {
        router.push(ROUTES["NIN-VERIFICATION"]);
    };


    const handleChangePIN = () => {
        // Navigate to Change PIN screen
        router.push(ROUTES["AUTH-PIN"]);
    };

    const handleChangePassword = () => {
        router.push(ROUTES["UPDATE-PASSWORD"]);
    };

    const handlePrivacyPolicy = () => {
        router.push(ROUTES["PRIVACY-POLICY"]);
    };


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Security Options */}
            <View style={styles.content}>
                {/* Remember Me Toggle */}
                <View style={styles.optionRow}>
                    <Text style={styles.optionText}>Remember me</Text>
                    <Switch
                        value={rememberMe}
                        onValueChange={(value) => handleToggle(setRememberMe, rememberMe, 'Remember me')}
                        trackColor={{ false: '#E5E5E7', true: '#60a5fa' }}
                        thumbColor="#ffffff"
                        ios_backgroundColor="#E5E5E7"
                    />
                </View>

                {/* Face ID Toggle */}
                <View style={styles.optionRow}>
                    <Text style={styles.optionText}>Face ID</Text>
                    <Switch
                        value={faceID}
                        onValueChange={(value) => handleToggle(setFaceID, faceID, 'Face ID')}
                        trackColor={{ false: '#E5E5E7', true: '#60a5fa' }}
                        thumbColor="#ffffff"
                        ios_backgroundColor="#E5E5E7"
                    />
                </View>

                {/* Biometric ID Toggle */}
                <View style={styles.optionRow}>
                    <Text style={styles.optionText}>Biometric ID</Text>
                    <Switch
                        value={biometricID}
                        onValueChange={(value) => handleToggle(setBiometricID, biometricID, 'Biometric ID')}
                        trackColor={{ false: '#E5E5E7', true: '#60a5fa' }}
                        thumbColor="#ffffff"
                        ios_backgroundColor="#E5E5E7"
                    />
                </View>

                {/* Privacy Policy */}
                <TouchableOpacity
                    style={styles.optionRow}
                    onPress={handlePrivacyPolicy}
                >
                    <Text style={styles.optionText}>Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={verifyEmail}
                    >
                        <Text style={styles.actionButtonText}>Verify Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={verifyNIN}
                    >
                        <Text style={styles.actionButtonText}>Verify NIN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleChangePIN}
                    >
                        <Text style={styles.actionButtonText}>Change PIN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleChangePassword}
                    >
                        <Text style={styles.actionButtonText}>Change Password</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    content: {
        flex: 1,
        paddingTop: 24,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
    },
    optionText: {
        fontSize: 16,
        color: '#000000',
        fontWeight: '400',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingTop: 32,
        gap: 16,
    },
    actionButton: {
        backgroundColor: '#60a5fa',
        borderRadius: 25,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default SecurityScreen;