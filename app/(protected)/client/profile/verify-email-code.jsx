// protected/client/profile/verify-email-code.jsx
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, SafeAreaView, Text} from "react-native";
import EmailCodeVerification from "../../../../components/Client/Security/EmailCodeVerification";
import VerificationSuccessModal from "../../../../components/Client/Security/VerificationSuccessModal";
import { router } from 'expo-router';
import SecureStorage from "../../../../lib/SecureStorage";

function VerifyEmailCode() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUser = await SecureStorage.getUserData() || {};
                setUserData(storedUser);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#60a5fa"/>
            </SafeAreaView>
        );
    }

    if (!userData.email) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16 }}>No email found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <EmailCodeVerification
                userEmail={userData.email}
            />
        </SafeAreaView>
    );
}

export default VerifyEmailCode;