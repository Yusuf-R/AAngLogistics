import Notifications from "../../../../components/Client/Notifications/Notifications"
import {useSessionStore} from "../../../../store/useSessionStore";
import {StyleSheet, SafeAreaView} from "react-native";

function NotificationScreen() {
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <SafeAreaView style={styles.container}>
                <Notifications
                    userData={userData}
                />
            </SafeAreaView>
        </>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
});

export default NotificationScreen;