// components/Driver/Discover/OrdersList.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {useSessionStore} from "../../../store/useSessionStore";

function OrdersList() {
    const userData = useSessionStore((state) => state.user);

    console.log({
        userData
    })


    return (
        <View style={styles.container}>
            <Text style={styles.title}>📦 Available Orders</Text>
            <Text style={styles.subtitle}>Orders list will be implemented here</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default OrdersList;