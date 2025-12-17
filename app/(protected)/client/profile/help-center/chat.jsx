// app/(protected)/client/account/support/chat.jsx
import { useSessionStore } from "../../../../../store/useSessionStore";
import ClientSupportHub from "../../../../../components/Client/Profile/HelpCenter/ClientSupportHub";
import { useQuery } from "@tanstack/react-query";
import ClientUtils from "../../../../../utils/ClientUtilities";
import {
    ActivityIndicator,
    Text,
    View,
    StyleSheet,
    TouchableOpacity
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw } from 'lucide-react-native'; // Import refresh icon

function ChatScreen() {
    const userData = useSessionStore((state) => state.user);

    const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
        queryKey: ["ClientChatHub"],
        queryFn: ClientUtils.getOrCreateClientSupportConversation,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 2,
    });

    const handleRetry = () => {
        refetch();
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading your conversation...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isError) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredContent}>
                    <View style={styles.errorIconContainer}>
                        <Text style={styles.errorEmoji}>😓</Text>
                    </View>
                    <Text style={styles.errorTitle}>Connection Failed</Text>
                    <Text style={styles.errorMessage}>
                        {error?.message || "Unable to load conversation. Please try again."}
                    </Text>

                    <TouchableOpacity
                        style={[styles.retryButton, isRefetching && styles.retryButtonDisabled]}
                        onPress={handleRetry}
                        disabled={isRefetching}
                    >
                        <RefreshCw
                            size={20}
                            color="#FFFFFF"
                            style={isRefetching ? styles.rotatingIcon : null}
                        />
                        <Text style={styles.retryButtonText}>
                            {isRefetching ? 'Retrying...' : 'Try Again'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => {
                            // Optional: Add alternative action like going back or contacting support
                            console.log("Alternative action");
                        }}
                    >
                        <Text style={styles.secondaryButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!data?.success || !data?.data) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredContent}>
                    <View style={styles.errorIconContainer}>
                        <Text style={styles.errorEmoji}>⚠️</Text>
                    </View>
                    <Text style={styles.errorTitle}>No Data Available</Text>
                    <Text style={styles.errorMessage}>
                        Unable to load chat data. Please try again.
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleRetry}
                    >
                        <RefreshCw size={20} color="#FFFFFF" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <ClientSupportHub
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
        fontFamily: 'PoppinsRegular',
    },
    errorIconContainer: {
        marginBottom: 20,
    },
    errorEmoji: {
        fontSize: 48,
    },
    errorTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsBold',
        color: "#0F172A",
        marginBottom: 12,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        color: "#64748B",
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        fontFamily: 'PoppinsRegular',
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
        minWidth: 160,
        shadowColor: '#3B82F6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    retryButtonDisabled: {
        backgroundColor: '#93C5FD',
        opacity: 0.8,
    },
    retryButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#FFFFFF',
    },
    rotatingIcon: {
        transform: [{ rotate: '360deg' }],
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
    },
    secondaryButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#64748B',
    },
});

export default ChatScreen;