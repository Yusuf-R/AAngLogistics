// app/driver/account/security/password.jsx
import { useSessionStore } from "../../../../../store/useSessionStore";
import PasswordManagement from "../../../../../components/Driver/Security/PasswordManagement";

function PasswordScreen() {
    const userData = useSessionStore((state) => state.user);
    return <PasswordManagement userData={userData} />;
}

export default PasswordScreen;