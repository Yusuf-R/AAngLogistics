// /utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

function handleRegistrationError(errorMessage) {
    alert(errorMessage);
    throw new Error(errorMessage);
}

export async function checkNotificationPermission() {
    const { status } = await Notifications.getPermissionsAsync();
    return {
        granted: status === 'granted',
        denied: status === 'denied',
        undetermined: status === 'undetermined'
    };
}

export async function hasAskedForPermission() {
    const asked = await AsyncStorage.getItem('@notification_permission_asked');
    return asked === 'true';
}

export async function markPermissionAsked() {
    await AsyncStorage.setItem('@notification_permission_asked', 'true');
}

export async function registerForPushNotificationsAsync() {
    let token;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            handleRegistrationError('Project ID not found');
        }

        try {
            token = (await Notifications.getExpoPushTokenAsync({
                projectId
            })).data;

            console.log('Expo push token:', token);
        } catch (error) {
            console.log('Error getting push token:', error);
            return null;
        }
    } else {
        console.log('Must use physical device for Push Notifications');
        return null;
    }

    // Configure channels for Android
    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('order-alerts', {
                name: 'Order Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                sound: 'default',
            });
        } catch (error) {
            console.log('Error setting notification channel:', error);
        }
    }

    return token;
}