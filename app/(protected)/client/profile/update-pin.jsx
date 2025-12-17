import {useSessionStore} from "../../../../store/useSessionStore";
import VerifyFirst from "../../../../components/Client/Profile/Security/AuthPinSecurity/VerifyFirst";
import UpdatePin from "../../../../components/Client/Profile/Security/AuthPinSecurity/UpdatePin"


function UpdatePinScreen() {
    const userData = useSessionStore((state) => state.user);

    return (
        <>
            {!userData.emailVerified ? (
                <VerifyFirst/>
            ) : (
                <UpdatePin
                    userData={userData}
                    reqType="UpdatePin"
                />
            )}
        </>
    )
}

export default UpdatePinScreen