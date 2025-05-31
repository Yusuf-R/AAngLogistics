import PinVerificationEmail from "../../../../components/Client/Security/AuthPinSecurity/PinVerificationEmail";
import React from "react";
import {useLocalSearchParams} from "expo-router";
import {useSessionStore} from "../../../../store/useSessionStore";
import VerifyFirst from "../../../../components/Client/Security/AuthPinSecurity/VerifyFirst";
import {SafeAreaView} from "react-native";

function PinVerificationEmailScreen() {
    const { reqType } = useLocalSearchParams();
    const userData = useSessionStore((state) => state.user);

    return (
        <>
            <SafeAreaView className="flex-1">
                {!userData.emailVerified ? (
                    <VerifyFirst/>
                ) : (
                    <>
                        <PinVerificationEmail
                            userData={userData}
                            reqType={reqType}
                        />
                    </>
                )}
            </SafeAreaView>

        </>
    )
}

export default PinVerificationEmailScreen;