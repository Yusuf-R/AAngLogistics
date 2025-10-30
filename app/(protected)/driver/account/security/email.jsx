// app/driver/account/security/email.jsx
import { useSessionStore } from "../../../../../store/useSessionStore";
import EmailManagement from "../../../../../components/Driver/Security/EmailManagement";

function EmailScreen() {
    const userData = useSessionStore((state) => state.user);
    return <EmailManagement userData={userData} />;
}

export default EmailScreen;