// app/(protected)/client/dashboard/index.jsx
import React from 'react';
import {View, Text, StyleSheet,} from 'react-native';
import {SafeAreaView} from "react-native-safe-area-context"
import Dashboard from "../../../../components/Client/Dashboard/Dashboard";
import {useSessionStore} from "../../../../store/useSessionStore";


function ClientDashboard() {
    const userData = useSessionStore((state) => state.user);

    return (
        <>
            <Dashboard
                userData={userData}
            />
        </>
    );
}

export default ClientDashboard;