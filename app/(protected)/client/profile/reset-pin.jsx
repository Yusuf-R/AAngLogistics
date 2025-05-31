import React from 'react';
import {SafeAreaView, Text} from 'react-native';
import {useSessionStore} from "../../../../store/useSessionStore";
import VerifyFirst from "../../../../components/Client/Security/AuthPinSecurity/VerifyFirst";
import AuthPinSecurity from "../../../../components/Client/Security/AuthPinSecurity/AuthPinSecurity";
import ResetPin from "../../../../components/Client/Security/AuthPinSecurity/ResetPin";

function ResetPinScreen() {
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <SafeAreaView className="flex-1">
                {!userData.emailVerified ? (
                    <VerifyFirst/>
                ) : (
                    <>
                        <ResetPin
                            userData={userData}
                        />
                    </>
                )}
            </SafeAreaView>
        </>
    )
}

export default ResetPinScreen;