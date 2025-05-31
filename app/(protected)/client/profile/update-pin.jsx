import PinVerificationEmail from "../../../../components/Client/Security/AuthPinSecurity/PinVerificationEmail";
import {useSessionStore} from "../../../../store/useSessionStore";
import {SafeAreaView, Text, TextInput, TouchableOpacity, View} from "react-native";
import VerifyFirst from "../../../../components/Client/Security/AuthPinSecurity/VerifyFirst";
import React, {useRef} from "react";
import UpdatePin from "../../../../components/Client/Security/AuthPinSecurity/UpdatePin"





function UpdatePinScreen () {
    const userData = useSessionStore((state) => state.user);

    return (
        <>
            <SafeAreaView className="flex-1">
                {!userData.emailVerified ? (
                    <VerifyFirst />
                ) : (
                    <UpdatePin
                        userData={userData}
                        reqType="UpdatePin"
                    />
                )}
            </SafeAreaView>

        </>
    )
}

export default UpdatePinScreen