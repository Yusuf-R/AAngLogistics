import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Dashboard from "../../../../components/Client/Dashboard/Dashboard";
import {useSessionStore} from "../../../../store/useSessionStore";


function ClientDashboard() {
    const userData = useSessionStore((state) => state.user);

    return (
        <SafeAreaView style={styles.container}>
            <Dashboard
                userData={userData}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
});

export default ClientDashboard;