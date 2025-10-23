// app/(protected)/driver/account/data-verification.jsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import DataVerification from "/components/Driver/Account/DataVerification/DataVerification";
import PendingReviewScreen from "/components/Driver/Account/DataVerification/PendingReviewScreen";
import ApprovedScreen from "/components/Driver/Account/DataVerification/ApprovedScreen";
import RejectedScreen from "/components/Driver/Account/DataVerification/RejectedScreen";
import { useSessionStore } from "../../../../store/useSessionStore";
import DriverUtils from "../../../../utils/DriverUtilities";

function DataVerificationScreen() {
    const userData = useSessionStore((state) => state.user);
    const params = useLocalSearchParams();
    const forceEdit = params?.edit === 'true';
    const [verificationData, setVerificationData] = useState(null);

    const { data, isSuccess, isLoading, error, refetch } = useQuery({
        queryKey: ['GetValidationData'],
        queryFn: DriverUtils.Verification,
        staleTime: 'infinity', // 5 minutes
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
    });

    useEffect(() => {
        if (isSuccess && data) {
            setVerificationData(data.verification);
        }
    }, [isSuccess, data]);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading verification status...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>
                    Error loading verification data: {error.message}
                </Text>
            </View>
        );
    }

    if (!data && !isLoading) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>No verification data available</Text>
            </View>
        );
    }

    const verification = verificationData || data?.verification;
    const overallStatus = verification?.overallStatus || 'incomplete';

    if (forceEdit) {
        return (
            <DataVerification
                userData={userData}
                verification={verification}
                isEditMode={true}
                onUpdateSuccess={refetch}
            />
        );
    }

    // Route based on status
    switch (overallStatus) {
        case 'incomplete':
        case 'pending':
            return (
                <DataVerification
                    userData={userData}
                    verification={verification}
                    isEditMode={false}
                    onUpdateSuccess={refetch}
                />
            );

        case 'submitted':
            return (
                <PendingReviewScreen
                    verification={verification}
                    userData={userData}
                    onRefresh={refetch}
                />
            );

        case 'approved':
            return (
                <ApprovedScreen
                    verification={verification}
                    userData={userData}
                    onRefresh={refetch}
                />
            );

        case 'rejected':
            return (
                <RejectedScreen
                    verification={verification}
                    userData={userData}
                    onRefresh={refetch}
                />
            );

        case 'suspended':
        case 'expired':
            return (
                <RejectedScreen
                    verification={verification}
                    userData={userData}
                    onRefresh={refetch}
                    statusType={overallStatus}
                />
            );

        default:
            return (
                <DataVerification
                    userData={userData}
                    verification={verification}
                    isEditMode={false}
                    onUpdateSuccess={refetch}
                />
            );
    }
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginHorizontal: 20,
    },
});

export default DataVerificationScreen;