// /hooks/useSocket.js
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import SecureStorage from "../lib/SecureStorage";
import ClientUtils from "../utils/ClientUtilities";
import { useNotificationStore } from '../store/useNotificationStore';
import { queryClient } from '../lib/queryClient';
import {useOrderStore} from "../store/useOrderStore";

const localIP = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';

const SOCKET_SERVER_URL = Platform.select({
    ios: `http://${localIP}:5000`,
    android: `http://${localIP}:5000`,
    default: `http://${localIP}:5000`
});

let activeSocket = null; // <== this will be used outside the hook

export function getSocket() {
    return activeSocket;
}

export default function useSocket(userId) {
    const socketRef = useRef(null);

    useEffect(() => {
        const setupSocket = async () => {
            try {
                // Force refresh if needed
                await ClientUtils.Dashboard(); // instead we will upgrade it to a ping

                const token = await SecureStorage.getAccessToken();

                if (!token || !userId) return;

                socketRef.current = io(SOCKET_SERVER_URL, {
                    auth: { token },
                    transports: ['websocket'],
                    reconnection: true,
                });

                activeSocket = socketRef.current;

                socketRef.current.on('connect', () => {
                    console.log('✅ Socket connected', socketRef.current.id);
                });

                socketRef.current.on('disconnect', () => {
                    console.log('❌ Socket disconnected');
                });

                // ✅ Handle incoming notifications globally
                socketRef.current.on('notification', (notification) => {
                    queryClient.invalidateQueries({
                        queryKey: ['GetUnreadCount'],
                    });
                    queryClient.invalidateQueries({
                        queryKey: ['GetNotifications'],
                    });
                    useNotificationStore.getState().addNotification(notification); // 👈 add to Zustand store
                    console.log('📬 New notification received and queries invalidated -- New Notification gotten');
                });

                // ✅ Handle read notification success
                socketRef.current.on('notification:read:success', ({notificationId}) => {
                    queryClient.invalidateQueries({queryKey: ['GetNotifications']});
                    queryClient.invalidateQueries({queryKey: ['GetUnreadCount']});

                    console.log('✅ Notification marked as read:', notificationId);
                });

                // ✅ Handle read ALL notification success
                socketRef.current.on('notification:read:all:success', ({notificationId}) => {
                    queryClient.invalidateQueries({queryKey: ['GetNotifications']});
                    queryClient.invalidateQueries({queryKey: ['GetUnreadCount']});

                    console.log('✅ Notification marked as read:', notificationId);
                });

                // ✅ Handle delete notification success
                socketRef.current.on('notification:delete:success', ({notificationId}) => {
                    queryClient.invalidateQueries({queryKey: ['GetNotifications']});
                    queryClient.invalidateQueries({queryKey: ['GetUnreadCount']});

                    console.log('🗑️ Notification deleted:', notificationId);
                });

                // ✅ Handle delete all notification success
                socketRef.current.on('notification:delete:all:success', ({notificationId}) => {
                    queryClient.invalidateQueries({queryKey: ['GetNotifications']});
                    queryClient.invalidateQueries({queryKey: ['GetUnreadCount']});

                    console.log('🗑️ All Notification deleted:', notificationId);
                });

                // Handle order notifications
                // when an order is completed + payment is successful
                socketRef.current.on('order:completed', (order) => {
                    console.log('🛒 Order completed:', order);
                });
                // Add these order tracking event handlers
                socketRef.current.on('order:status:updated', (orderUpdate) => {
                    useOrderStore.getState().updateOrderTracking(orderUpdate);
                    queryClient.invalidateQueries({
                        queryKey: ['GetOrder', orderUpdate.orderId]
                    });
                    queryClient.invalidateQueries({
                        queryKey: ['GetActiveOrders']
                    });
                    console.log('📦 Order status updated:', orderUpdate.status);
                });

                socketRef.current.on('order:location:updated', (locationUpdate) => {
                    useOrderStore.getState().updateDriverLocation(locationUpdate);
                    console.log('📍 Driver location updated for order:', locationUpdate.orderId);
                });

                socketRef.current.on('order:driver:assigned', (driverData) => {
                    useOrderStore.getState().updateDriverAssignment(driverData);
                    queryClient.invalidateQueries({
                        queryKey: ['GetOrder', driverData.orderId]
                    });
                    console.log('🚗 Driver assigned:', driverData.driverName);
                });


                socketRef.current.on('connect_error', (err) => {
                    console.log('Socket connection error:', err.message);
                });

            } catch (err) {
                console.log('Socket setup failed:', err.message);
            }
        };

        setupSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                activeSocket = null;
            }
        };
    }, [userId]);

    return socketRef;
}
