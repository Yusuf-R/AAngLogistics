import {Text} from "react-native";
import {useSessionStore} from "../../../../store/useSessionStore";
import ManageOrder from "../../../../components/Client/Orders/ManageOrder"

function ManageOrdersScreen() {
    const userData = useSessionStore((state) => state.user);

    return (
        <>
           <ManageOrder userData={userData} />
        </>
    )

}

export default ManageOrdersScreen;