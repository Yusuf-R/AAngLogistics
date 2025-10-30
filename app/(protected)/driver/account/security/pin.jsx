// app/driver/account/security/pin.jsx
import { useSessionStore } from "../../../../../store/useSessionStore";
import PinManagement from "../../../../../components/Driver/Security/PinManagement";

function PinScreen() {
    const userData = useSessionStore((state) => state.user);
    return <PinManagement userData={userData} />;
}

export default PinScreen;