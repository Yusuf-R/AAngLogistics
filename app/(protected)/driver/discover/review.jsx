// app/(protected)/driver/discover/review.jsx
import React, {useState, useEffect} from 'react';
import Review from "../../../../components/Driver/Discover/Review";
import { useQuery } from "@tanstack/react-query";
import DriverUtils from "../../../../utils/DriverUtilities";
import { toast } from "sonner-native";
import {
    ActivityIndicator,
    View,
    StyleSheet,
    Text,
    Alert,
} from "react-native";
import { router, useLocalSearchParams } from 'expo-router';

function ReviewScreen() {
    const params = useLocalSearchParams();
    const { orderId, orderRef, earnings } = params;
    console.log({
        params,
    })
    const [maxRetriesReached, setMaxRetriesReached] = useState(false);

    const {data, isLoading, error, isError, failureCount, refetch} = useQuery({
        queryKey: ['DriverData'],
        queryFn: DriverUtils.getData,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        onError: (error, errorCount) => {
            console.log(`Retry attempt ${errorCount} failed:`, error);
        },
    });

    // Handle max retries reached
    useEffect(() => {
        if (isError && failureCount >= 3) {
            setMaxRetriesReached(true);
            toast.error("Unable to load user data after multiple attempts");

            // Show alert with options
            Alert.alert(
                "Insufficient Data",
                "Review is impossible because of insufficient data requirements",
                [
                    {
                        text: "Retry",
                        onPress: async () => {
                            setMaxRetriesReached(false);
                            await refetch();
                        }
                    },
                    {
                        text: "Go Home",
                        onPress: () => {
                            router.replace('/app/(protected)/driver/discover/index');
                        },
                        style: "destructive"
                    }
                ]
            );
        }
    }, [isError, failureCount]);

    // Show loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading user data...</Text>
            </View>
        );
    }

    // Show error state (but not if we're showing the alert)
    if (isError && !maxRetriesReached) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Failed to load driver data</Text>
                <Text style={styles.retryText}>Retrying... ({failureCount}/3)</Text>
            </View>
        );
    }

    // Don't render Review component until we have data
    if (!data) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No user data available</Text>
            </View>
        );
    }

    // Only render Review when we successfully have user data
    return (
        <Review
            userData={data}
            orderId={orderId}
            orderRef={orderRef}
            earnings={earnings}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    retryText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default ReviewScreen;