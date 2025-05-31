// this component will be used to set or change the authentication pin for the user

import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../../../store/useSessionStore';
import { ROUTES } from '../../../../utils/Constant';
import AuthPinSecurity from '../../../../components/Client/Security/AuthPinSecurity/AuthPinSecurity';
import VerifyFirst from "../../../../components/Client/Security/AuthPinSecurity/VerifyFirst";
import SecureStorage from '../../../../lib/SecureStorage';

export default function AuthPinScreen() {
    const userData = useSessionStore((state) => state.user);

    return (
        <>
            <SafeAreaView className="flex-1">
                {!userData.emailVerified ? (
                    <VerifyFirst />
                ) : (
                    <AuthPinSecurity
                        userData={userData}
                    />
                )}
            </SafeAreaView>

        </>
    )
}