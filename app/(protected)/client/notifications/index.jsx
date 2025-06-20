import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { useSessionStore } from "../../../../store/useSessionStore";
import { useNotificationStore } from "../../../../store/useNotificationStore";
import Notifications from "../../../../components/Client/Notifications/Notifications";

function NotificationScreen() {
    const userData = useSessionStore((state) => state.user);
    const { notifications, stats } = useNotificationStore();

    if (!stats) {
        return (
            <View style={styles.loaderContainer}>
                <Text style={{ color: '#6B7280' }}>Loading notifications...</Text>
            </View>
        );
    }

    if (!notifications.length) {
        return (
            <View style={styles.loaderContainer}>
                <Text style={{ color: '#9CA3AF' }}>No notifications yet.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Notifications userData={userData} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    }
});

export default NotificationScreen;
