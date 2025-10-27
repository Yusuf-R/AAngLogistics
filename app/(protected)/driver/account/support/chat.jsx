// app/(protected)/driver/account/support/chat.jsx
import { useSessionStore } from "../../../../../store/useSessionStore";
import DriverSupportHub from "../../../../../components/Driver/Account/Support/DriverSupportHub";
import { useQuery } from "@tanstack/react-query";
import DriverUtils from "../../../../../utils/DriverUtilities";
import { ActivityIndicator, Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

function ChatScreen() {
    const userData = useSessionStore((state) => state.user);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["DriverChatHub", userData?._id],
        queryFn: DriverUtils.getOrCreateDriverSupportConversation,
        refetchOnMount: true,
        refetchOnWindowFocus: true, // ✅ Refresh when driver returns to screen
        refetchOnReconnect: true,
        retry: 2,
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading your conversations...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isError) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredContent}>
                    <Text style={styles.errorTitle}>😓 Connection Failed</Text>
                    <Text style={styles.errorMessage}>
                        {error?.message || "Unable to load conversations. Please try again."}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!data?.success || !data?.data) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredContent}>
                    <Text style={styles.errorTitle}>⚠️ No Data</Text>
                    <Text style={styles.errorMessage}>
                        Unable to load chat data. Please try again.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <DriverSupportHub
            userData={userData}
            chatData={data.data}
            onRefresh={refetch}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centeredContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    loadingText: {
        fontSize: 16,
        marginTop: 16,
        color: "#64748B",
        fontWeight: '500',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#EF4444",
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 16,
        color: "#64748B",
        textAlign: 'center',
    },
});

export default ChatScreen;