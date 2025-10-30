// app/(protected)/driver/account/index.jsx
import React, {useEffect, useState} from 'react';
import {
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator
} from 'react-native';
import SecureStorage from "../../../../lib/SecureStorage";
import DriverAccount from "../../../../components/Driver/Account/DriverAccount"
import PushNotificationModal from "../../../../components/PushNotificatonModal";
import {markPermissionAsked, registerForPushNotificationsAsync, checkNotificationPermission, hasAskedForPermission,} from "../../../../utils/Notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {axiosPrivate} from "../../../../utils/AxiosInstance";
import {toast} from "sonner-native";

function DriverAccountScreen() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    const handleEnableNotifications = async () => {
        try {
            setShowNotificationModal(false);
            await markPermissionAsked();

            const expoPushToken = await registerForPushNotificationsAsync();

            if (expoPushToken) {
                await AsyncStorage.setItem('@expo_push_token', expoPushToken);
                await AsyncStorage.setItem('@driver_notification_setting', 'true');

                await axiosPrivate.patch('/auth/update-push-token', {
                    expoPushToken,
                    enabled: true
                });

                setNotificationsEnabled(true);
                toast.success('Notifications enabled!');
            } else {
                await AsyncStorage.setItem('@driver_notification_setting', 'false');
                toast.info('Notifications disabled');
            }
        } catch (error) {
            console.log('Enable notifications error:', error);
            toast.error('Failed to enable notifications');
        }
    };

    const handleMaybeLater = async () => {
        setShowNotificationModal(false);
        await markPermissionAsked();
        await AsyncStorage.setItem('@driver_notification_setting', 'false');
        toast.info('Notifications disabled');
    };

    const checkAndPromptNotifications = async (currentUserData) => {
        try {
            const hasAsked = await hasAskedForPermission();
            if (hasAsked) return;

            const permission = await checkNotificationPermission();

            if (permission.undetermined) {
                setTimeout(() => {
                    setShowNotificationModal(true);
                }, 1000);
            }
        } catch (error) {
            console.log('Notification check error:', error);
        }
    };

    // Single useEffect for data initialization
    useEffect(() => {
        const initializeData = async () => {
            try {
                const storedUser = await SecureStorage.getUserData();
                setUserData(storedUser);
                await checkAndPromptNotifications(storedUser);
            } catch (error) {
                console.log('Failed to fetch user data:', error);
            } finally {
                setLoading(false);
            }
        };
        initializeData();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#60a5fa"/>
            </SafeAreaView>
        );
    }

    if (!userData) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text>Failed to load profile data</Text>
            </SafeAreaView>
        );
    }

    return (
        <>
            <DriverAccount userData={userData}/>
            <PushNotificationModal
                visible={showNotificationModal}
                onEnable={handleEnableNotifications}
                onMaybeLater={handleMaybeLater}
            />
        </>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

export default DriverAccountScreen;