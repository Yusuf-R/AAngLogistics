import React, {useEffect, useState} from 'react';
import { useNavigation } from '@react-navigation/native';
import SecureStorage from "../../../../lib/SecureStorage";
import {ActivityIndicator, SafeAreaView, Text} from "react-native";

function ResetPassword() {
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();


    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const { email } = await SecureStorage.getUserData() || {};
                setUserEmail(email || '');
            } finally {
                setLoading(false);
            }
        };
        fetchEmail();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#60a5fa"/>
            </SafeAreaView>
        );
    }
    if (!userEmail) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16 }}>No email found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <Text>
            Hi
        </Text>
    );
}

export default ResetPassword;