import { View, Text } from "react-native";
import {useSessionStore} from "../../../../../store/useSessionStore";
import UnderConstruction from "../../../../../components/UnderConstruction";


function PaymentScreen() {
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <UnderConstruction
                title="Payment"
                description="We're building something amazing!"
                subtitle="This feature is currently under construction."

            />
        </>
    )
}

export default PaymentScreen
