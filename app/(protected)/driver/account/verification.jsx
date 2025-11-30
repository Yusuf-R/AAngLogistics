// app/(protected)/driver/account/data-verification.jsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

// Import all screens
import VerificationManagementCenter from "/components/Driver/Account/DataVerification/VerificationManagementCenter";
import DataVerification from "/components/Driver/Account/DataVerification/DataVerification";
import PendingReviewScreen from "/components/Driver/Account/DataVerification/PendingReviewScreen";
import ApprovedScreen from "/components/Driver/Account/DataVerification/ApprovedScreen";
import RejectedScreen from "/components/Driver/Account/DataVerification/RejectedScreen";
import SubmissionHistoryScreen from "/components/Driver/Account/DataVerification/SubmissionHistoryScreen";

import { useSessionStore } from "../../../../store/useSessionStore";
import DriverUtils from "../../../../utils/DriverUtilities";

function DataVerificationScreen() {
    const userData = useSessionStore((state) => state.user);
    const params = useLocalSearchParams();
    const [verificationData, setVerificationData] = useState(null);

    // Get action parameter to determine what screen to show
    const action = params?.action; // 'status', 'new', 'update', 'submissions', null (home)
    const forceEdit = params?.edit === 'true'; // Legacy support
    const mode = params?.mode; // Legacy support

    const { data, isSuccess, isLoading, error, refetch } = useQuery({
        queryKey: ['GetValidationData'],
        queryFn: DriverUtils.Verification,
        staleTime: 'infinity',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
    });

    useEffect(() => {
        if (isSuccess && data) {
            setVerificationData(data.verification);
        }
    }, [isSuccess, data]);

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading verification status...</Text>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>
                    Error loading verification data: {error.message}
                </Text>
            </View>
        );
    }

    // No data state
    if (!data && !isLoading) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>No verification data available</Text>
            </View>
        );
    }

    const verification = verificationData || data?.verification;
    const overallStatus = verification?.overallStatus || 'incomplete';

    // ============================================
    // ROUTING LOGIC
    // ============================================

    // 1. HOME/MANAGEMENT CENTER (default - no action param)
    if (!action && !forceEdit && mode !== 'update') {
        return (
            <VerificationManagementCenter
                verification={verification}
                userData={userData}
                onRefresh={refetch}
            />
        );
    }

    // 2. CHECK STATUS - Show appropriate status screen
    if (action === 'status') {
        switch (overallStatus) {
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

            case 'incomplete':
            case 'pending':
            default:
                // No submission yet, show verification form
                return (
                    <DataVerification
                        userData={userData}
                        verification={verification}
                        isEditMode={false}
                        isUpdateRequest={false}
                        onUpdateSuccess={refetch}
                    />
                );
        }
    }

    // 3. START NEW VERIFICATION
    if (action === 'new') {
        return (
            <DataVerification
                userData={userData}
                verification={verification}
                isEditMode={false}
                isUpdateRequest={false}
                onUpdateSuccess={refetch}
            />
        );
    }

    // 4. UPDATE VERIFICATION (for approved drivers)
    if (action === 'update' || mode === 'update' || forceEdit) {
        return (
            <DataVerification
                userData={userData}
                verification={verification}
                isEditMode={true}
                isUpdateRequest={true}
                onUpdateSuccess={refetch}
            />
        );
    }

    // 5. VIEW SUBMISSION HISTORY
    if (action === 'submissions') {
        return (
            <SubmissionHistoryScreen
                verification={verification}
                userData={userData}
                onRefresh={refetch}
            />
        );
    }

    // 6. FALLBACK - Show management center
    return (
        <VerificationManagementCenter
            verification={verification}
            userData={userData}
            onRefresh={refetch}
        />
    );
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