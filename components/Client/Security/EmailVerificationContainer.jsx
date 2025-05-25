// protected/client/profile/verify-email.jsx
import React, { useEffect, useState } from 'react';
import {ActivityIndicator, SafeAreaView, Text} from "react-native";
import EmailMethodSelection from "../../../components/Client/Security/EmailMethodSelection";
import SecureStorage from "../../../lib/SecureStorage";
import {useNavigation} from "@react-navigation/native";
import { router } from 'expo-router';

function EmailVerificationContainer() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

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
        <EmailMethodSelection
            userData={userData}
        />
    );
}

export default EmailVerificationContainer;