// protected/client/profile/verify-email.jsx
import React, { useEffect, useState } from 'react';
import {ActivityIndicator, SafeAreaView, Text} from "react-native";
import EmailMethodSelection from "./EmailMethodSelection";
import { useSessionStore } from "../../../../../store/useSessionStore";

function EmailVerificationContainer() {
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
        <EmailMethodSelection
            userData={userData}
        />
    );
}

export default EmailVerificationContainer;