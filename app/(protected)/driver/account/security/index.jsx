import { View, Text } from "react-native";
import {useSessionStore} from "../../../../../store/useSessionStore";
import SecurityManagement from "../../../../../components/Driver/Security/SecurityManagement";


function SecurityScreen() {
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <SecurityManagement userData={userData}/>
        </>
    )
}

export default SecurityScreen