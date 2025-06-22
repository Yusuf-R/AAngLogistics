import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { useSessionStore } from "../../../../store/useSessionStore";
import { useNotificationStore } from "../../../../store/useNotificationStore";
import Notifications from "../../../../components/Client/Notifications/Notifications";
import LottieView from 'lottie-react-native';

const animation = require("@/assets/animations/notifications/null.json");


function NotificationScreen() {
    const userData = useSessionStore((state) => state.user);
    const { notifications, stats } = useNotificationStore();

    if (!stats || stats.total === 0) {
        return (
            <View style={styles.emptyContainer}>
                <LottieView
                    source={animation}
                    autoPlay
                    loop={true}
                    style={{width: 220, height: 220}}
                />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptySubtitle}>
                    You're all caught up. We'll notify you when something comes up.
                </Text>
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFFFFF',
    },
    emptyIcon: {
        fontSize: 50,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
        fontFamily: 'PoppinsSemiBold',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: 'PoppinsRegular',
        lineHeight: 22,
    },
});

export default NotificationScreen;
