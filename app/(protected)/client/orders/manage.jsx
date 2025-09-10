import {useSessionStore} from "../../../../store/useSessionStore";
import ManageOrder from "../../../../components/Client/Orders/ManageOrder"
import {ActivityIndicator, SafeAreaView, Text, StyleSheet, Pressable, View} from "react-native";

function ManageOrdersScreen() {
    const allOrderData = useSessionStore((state) => state.allOrderData);

    return (
            <ManageOrder
                allOrderData={allOrderData}
            />
    );
}

export default ManageOrdersScreen;