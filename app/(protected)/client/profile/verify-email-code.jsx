// protected/client/profile/verify-email-code.jsx
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, SafeAreaView, Text} from "react-native";
import EmailCodeVerification from "../../../../components/Client/Profile/Security/EmailSecurity/EmailCodeVerification";
import SecureStorage from "../../../../lib/SecureStorage";
import {useSessionStore} from "../../../../store/useSessionStore";

function VerifyEmailCode() {
    const userData = useSessionStore((state) => state.user);

    if (!userData) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#60a5fa" />
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