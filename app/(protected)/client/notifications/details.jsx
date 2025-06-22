import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNotificationStore } from "../../../../store/useNotificationStore";
import NotificationDetails from "../../../../components/Client/Notifications/NotifcationDetails";
import { router } from "expo-router";
import { ArrowLeft } from 'lucide-react-native';

export default function NotificationDetailsScreen() {
    const notification = useNotificationStore(state => state.selectedNotification);

    // 🧤 If no notification, show graceful fallback
    if (!notification) {
        return (
            <SafeAreaView style={styles.fallbackContainer}>
                <ArrowLeft size={32} color="#2563EB" onPress={() => router.back()} style={styles.backIcon} />
                <Text style={styles.fallbackTitle}>Notification Not Found</Text>
                <Text style={styles.fallbackText}>
                    The selected notification is no longer available or was never loaded.
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // ✅ Render full notification details
    return (
        <SafeAreaView style={styles.container}>
            <NotificationDetails notification={notification} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
    },
    fallbackTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginTop: 12,
        marginBottom: 8,
    },
    fallbackText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: 'PoppinsRegular',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
    },
    backIcon: {
        position: 'absolute',
        top: 20,
        left: 20,
    },
});
