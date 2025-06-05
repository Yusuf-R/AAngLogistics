import NinVerification from "../../../../components/Client/Security/NINVerification/NinVerification";
import {useSessionStore} from "../../../../store/useSessionStore";

function NinVerificationScreen(){
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <NinVerification
                userData={userData}
            />
        </>
    )
}

export default NinVerificationScreen;