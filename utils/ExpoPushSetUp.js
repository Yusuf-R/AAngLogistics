// /utils/ExpoPushSetup.js
import { registerForPushNotificationsAsync } from './Notification';
import { axiosPrivate } from "./AxiosInstance";
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_STORAGE_KEY = '@expo_push_token';
let pushSetupCompleted = false; // Module-level flag to prevent multiple runs

export async function expoPushSetUp() {
    // Prevent multiple simultaneous calls
    if (pushSetupCompleted) {
        console.log('🔔 Push setup already completed');
        return;
    }

    try {
        console.log('🔔 Setting up push notifications...');

        const expoPushToken = await registerForPushNotificationsAsync();

        if (!expoPushToken) {
            console.log('Push notifications not available');
            return;
        }

        // Check if we already have this token
        const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

        if (storedToken === expoPushToken) {
            console.log('✅ Push token already up-to-date');
            pushSetupCompleted = true;
            return;
        }

        // Send to backend only if token is new/changed
        const response = await axiosPrivate({
            method: "PATCH",
            url: '/auth/update-push-token',
            data: { expoPushToken }
        });

        if (response.data?.success) {
            await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoPushToken);
            pushSetupCompleted = true;
            console.log('✅ Push token registered successfully');
        }
    } catch (error) {
        console.log('Push notification setup error:', error);
        // Don't mark as completed if there was an error
        pushSetupCompleted = false;
    }
}