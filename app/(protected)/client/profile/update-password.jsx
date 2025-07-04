import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UpdatePassword from "../../../../components/Client/Profile/Security/PasswordSecurity/UpdatePassword";
import { useSessionStore } from "../../../../store/useSessionStore";

// Component for users who can't change password
const PasswordChangeRestricted = ({ userData }) => {
    const getRestrictionReason = () => {
        // Check what auth methods the user has
        const authMethods = userData.authMethods || [];
        const hasCredentials = authMethods.some(method => method.type === 'Credentials');
        const hasGoogle = authMethods.some(method => method.type === 'Google');
        const hasApple = authMethods.some(method => method.type === 'Apple');

        if (!hasCredentials && (hasGoogle || hasApple)) {
            const socialProvider = hasGoogle ? 'Google' : 'Apple';
            return {
                title: "Social Login Account",
                message: `Your account was created using ${socialProvider} sign-in and doesn't have a password. Password changes are only available for accounts created with email and password.`,
                icon: hasGoogle ? "logo-google" : "logo-apple",
                suggestion: `To manage your account security, please use your ${socialProvider} account settings.`
            };
        }

        if (!userData.passwordChangeAllowed) {
            return {
                title: "Password Change Unavailable",
                message: "Password changes are not available for your account type. This typically happens when your account was created through social login or other authentication methods.",
                icon: "lock-closed-outline",
                suggestion: "Contact support if you believe this is an error."
            };
        }

        return {
            title: "Access Restricted",
            message: "You don't have permission to change your password at this time.",
            icon: "shield-outline",
            suggestion: "Please contact support for assistance."
        };
    };

    const restriction = getRestrictionReason();

    return (
        <View style={styles.container}>
            <View style={styles.restrictionCard}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={restriction.icon}
                        size={64}
                        color="#9CA3AF"
                    />
                </View>

                <Text style={styles.title}>{restriction.title}</Text>
                <Text style={styles.message}>{restriction.message}</Text>

                {restriction.suggestion && (
                    <View style={styles.suggestionContainer}>
                        <Text style={styles.suggestionText}>{restriction.suggestion}</Text>
                    </View>
                )}

                <View style={styles.authMethodsContainer}>
                    <Text style={styles.authMethodsTitle}>Your Login Methods:</Text>
                    {userData.authMethods?.map((method, index) => (
                        <View key={index} style={styles.authMethodItem}>
                            <Ionicons
                                name={getAuthMethodIcon(method.type)}
                                size={20}
                                color="#6B7280"
                            />
                            <Text style={styles.authMethodText}>{method.type}</Text>
                            {method.verified && (
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

// Helper function to get auth method icons
const getAuthMethodIcon = (type) => {
    switch (type) {
        case 'Google':
            return 'logo-google';
        case 'Apple':
            return 'logo-apple';
        case 'Credentials':
            return 'mail-outline';
        case 'AuthPin':
            return 'keypad-outline';
        default:
            return 'person-outline';
    }
};

function UpdatePasswordScreen() {
    const userData = useSessionStore((state) => state.user);

    // Check if password change is allowed
    const canChangePassword = () => {
        // Primary check: Backend determined capability
        if (userData.passwordChangeAllowed === false) {
            return false;
        }

        // Fallback check: Ensure user has credentials auth method
        if (userData.authMethods) {
            return userData.authMethods.some(method => method.type === 'Credentials');
        }

        // Additional fallback: Check if primary provider is credentials
        if (userData.primaryProvider) {
            return userData.primaryProvider === 'Credentials';
        }

        // Default to false for safety
        return false;
    };

    const passwordChangeAllowed = canChangePassword();

    return (
        <>
            {passwordChangeAllowed ? (
                <UpdatePassword userData={userData} />
            ) : (
                <PasswordChangeRestricted userData={userData} />
            )}
        </>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16,
        justifyContent: 'center',
    },
    restrictionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 16,
    },
    suggestionContainer: {
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    suggestionText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#4F46E5',
        textAlign: 'center',
    },
    authMethodsContainer: {
        width: '100%',
        marginTop: 16,
    },
    authMethodsTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 12,
    },
    authMethodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginBottom: 8,
    },
    authMethodText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        marginLeft: 12,
        flex: 1,
    },
});

export default UpdatePasswordScreen;