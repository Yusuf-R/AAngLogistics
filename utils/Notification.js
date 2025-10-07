// /utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

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

        try {
            // Get the Expo push token
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: "fc46b4cb-5fc5-4c6c-929b-392d484af562"
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