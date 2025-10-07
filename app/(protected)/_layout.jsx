// ProtectedLayout.js
import React, {useEffect, useState} from 'react';
import {usePathname, router, Slot} from 'expo-router';
import SessionManager from '../../lib/SessionManager';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {SafeAreaView, StatusBar} from "react-native";
import {registerForPushNotificationsAsync} from '../../utils/Notification';
import {axiosPrivate} from "../../utils/AxiosInstance";
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_STORAGE_KEY = '@expo_push_token';
const TOKEN_LAST_SENT_KEY = '@push_token_last_sent';

export default function ProtectedLayout() {
    const pathname = usePathname();
    const [allowed, setAllowed] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const verify = async () => {
            const {token, role} = await SessionManager.getCurrentSession();

            if (!token || !role) {
                return router.replace('/(authentication)/login');
            }

            const authorized = SessionManager.isAuthorizedRoute(role, pathname);

            if (authorized) {
                setAllowed(true);
                // Setup push notifications after authorization
                await setupPushNotifications();
            } else {
                return router.replace('/(authentication)/login');
            }
        };

        verify();
    }, [pathname]);

    /**
     * Setup push notifications for the authenticated user
     * Only sends to backend if token changed or not sent before
     */
    const setupPushNotifications = async () => {
        try {
            // Get push token from Expo
            const expoPushToken = await registerForPushNotificationsAsync();

            if (!expoPushToken) {
                console.log('Push notifications not granted or not available');
                return;
            }

            // Check if we need to send this token to backend
            const shouldSendToken = await checkIfTokenNeedsUpdate(expoPushToken);

            if (!shouldSendToken) {
                console.log('✅ Push token already up-to-date');
                return;
            }

            // Send token to backend for this user
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/auth/update-push-token',
                data: {
                    expoPushToken,
                }
            });

            if (!response.data?.success) {
                console.log('Failed to save push token');
            } else {
                console.log('✅ Push token successfully registered');
                // Store the token and timestamp locally
                await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoPushToken);
                await AsyncStorage.setItem(TOKEN_LAST_SENT_KEY, Date.now().toString());
            }
        } catch (error) {
            console.log('Error setting up push notifications:', error);
        }
    };

    /**
     * Checks if token needs to be sent to backend
     * Returns true if:
     * - No token stored locally
     * - Token has changed
     * - Token hasn't been verified in 7 days
     */
    const checkIfTokenNeedsUpdate = async (currentToken) => {
        try {
            const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
            const lastSent = await AsyncStorage.getItem(TOKEN_LAST_SENT_KEY);

            // No token stored, need to send
            if (!storedToken) {
                return true;
            }

            // Token has changed
            if (storedToken !== currentToken) {
                console.log('Token changed, updating backend');
                return true;
            }

            // Check if token is older than 7 days (optional periodic verification)
            if (lastSent) {
                const daysSinceLastSent = (Date.now() - parseInt(lastSent)) / (1000 * 60 * 60 * 24);
                if (daysSinceLastSent > 7) {
                    console.log('Token older than 7 days, reverifying');
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking token status:', error);
            // If we can't determine, send it to be safe
            return true;
        }
    };

    if (!allowed) return null;

    return (
        <>
            <SafeAreaView style={{flex: 1, backgroundColor: '#FFF', paddingTop: insets.top}}>
                <StatusBar barStyle="dark-content"/>
                <Slot/>
            </SafeAreaView>
        </>
    );
}