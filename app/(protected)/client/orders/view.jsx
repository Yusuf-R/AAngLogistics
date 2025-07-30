import React, { useEffect } from "react";
import { Alert, SafeAreaView, Text, View } from "react-native";
import { useOrderStore } from "../../../../store/useOrderStore";
import ViewOrder from "../../../../components/Client/Orders/ViewOrder";
import { router } from "expo-router";

function ViewOrderScreen() {
    const { selectedOrder, updateOrderStatus, removeOrder } = useOrderStore();

    useEffect(() => {
        if (!selectedOrder) {
            Alert.alert("Missing order", "Redirecting to manage orders");
            router.replace('/client/orders/manage');
        }
    }, [selectedOrder]);

    if (!selectedOrder) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Redirecting...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <ViewOrder
                selectedOrder={selectedOrder}
                updateOrderStatus={updateOrderStatus}
                removeOrder={removeOrder}
            />
        </SafeAreaView>
    );
}

export default ViewOrderScreen;
