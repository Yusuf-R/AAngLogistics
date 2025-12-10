// app/(protected)/driver/finance/index.jsx
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import FloatingFinanceTab from "../../../../components/Client/Finance/FloatingFinanceTab";
import { useSessionStore } from "../../../../store/useSessionStore";

function FinanceScreen() {
    const userData = useSessionStore((state) => state.user);
    const floatingTabsRef = useRef(null);

    return (
        <View style={styles.container}>
            <FloatingFinanceTab
                ref={floatingTabsRef}
                userData={userData}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});

export default FinanceScreen;