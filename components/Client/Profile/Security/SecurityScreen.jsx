import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    StatusBar,
    Alert,
} from 'react-native';
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from '@expo/vector-icons';
import {router} from "expo-router"; // or react-native-vector-icons
import {ROUTES} from "../../../../utils/Constant";
import {useRouter} from 'expo-router';
import {useNavigation} from '@react-navigation/native';
import {useLayoutEffect} from 'react';
import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {axiosPrivate} from "../../../../utils/AxiosInstance";
import * as Linking from 'expo-linking';
import {checkNotificationPermission, registerForPushNotificationsAsync} from '../../../../utils/Notification';

// Add to state


const SecurityScreen = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const [pushNotifications, setPushNotifications] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [faceID, setFaceID] = useState(true);
    const [biometricID, setBiometricID] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState({granted: false, denied: false});

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

    const handlePushNotificationToggle = async (enabled) => {
        try {
            if (permissionStatus.denied) {
                // Show elegant instruction modal
                Alert.alert(
                    "Enable in Phone Settings",
                    "To receive notifications, you'll need to enable them in your phone's settings:\n\n1. Go to Settings\n2. Find AAngLogistics\n3. Tap Notifications\n4. Enable Allow Notifications",
                    [
                        {text: "Cancel", style: "cancel"},
                        {text: "Open Settings", onPress: () => Linking.openSettings()}
                    ]
                );
                return;
            }

            if (!permissionStatus.granted && enabled) {
                // First time asking - trigger system dialog
                const expoPushToken = await registerForPushNotificationsAsync();

                if (expoPushToken) {
                    await AsyncStorage.setItem('@expo_push_token', expoPushToken);
                    await AsyncStorage.setItem('@user_notification_setting', 'true');
                    await axiosPrivate.patch('/auth/update-push-token', {
                        expoPushToken,
                        enabled: true
                    });
                    setPushNotifications(true);
                    setPermissionStatus({granted: true, denied: false});
                } else {
                    // User denied
                    setPermissionStatus({granted: false, denied: true});
                }
                return;
            }

            // Permission already granted - just toggle on/off
            setPushNotifications(enabled);
            const expoPushToken = await AsyncStorage.getItem('@expo_push_token');

            if (enabled && expoPushToken) {
                await axiosPrivate.patch('/auth/update-push-token', {
                    expoPushToken,
                    enabled: true
                });
                await AsyncStorage.setItem('@user_notification_setting', 'true');
            } else {
                await axiosPrivate.patch('/auth/update-push-token', {
                    enabled: false
                });
                await AsyncStorage.setItem('@user_notification_setting', 'false');
            }
        } catch (error) {
            console.log('Push notification toggle error:', error);
            setPushNotifications(!enabled);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.push('/client/profile')}>
                    <Ionicons name="arrow-back" size={24} color="black"/>
                </TouchableOpacity>
            ),
        });
    }, []);

    useEffect(() => {
        const loadNotificationStatus = async () => {
            try {
                const status = await checkNotificationPermission();
                setPermissionStatus(status);

                if (status.granted) {
                    const setting = await AsyncStorage.getItem('@user_notification_setting');
                    setPushNotifications(setting !== 'false');
                } else {
                    setPushNotifications(false);
                }
            } catch (error) {
                console.log('Error loading notification status:', error);
            }
        };

        loadNotificationStatus();

        // Re-check when screen comes into focus (user returns from settings)
        const unsubscribe = navigation.addListener('focus', () => {
            loadNotificationStatus();
        });

        return unsubscribe;
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>
            {/* Security Options */}
            <View style={styles.content}>
                {/*Push Notifications */}
                <View style={styles.optionRow}>
                    <View style={styles.subText}>
                        <Text style={styles.optionText}>Enable Push Notifications</Text>
                        {permissionStatus.denied && (
                            <Text style={styles.helperText}>
                                Enable in phone settings to use this feature
                            </Text>
                        )}
                    </View>

                    <Switch
                        value={pushNotifications}
                        onValueChange={handlePushNotificationToggle}
                        disabled={permissionStatus.denied} // Disable if user denied permission
                        trackColor={{false: '#E5E5E7', true: permissionStatus.denied ? '#cccccc' : '#60a5fa'}}
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
                        trackColor={{false: '#E5E5E7', true: '#60a5fa'}}
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
                        trackColor={{false: '#E5E5E7', true: '#60a5fa'}}
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
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC"/>
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
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    subText: {
        flex: 1,
        flexDirection: 'column',
        alignItems: "flex-start"
    },
});

export default SecurityScreen;