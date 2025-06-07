import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import MapScreen from "../../../components/MapScreen";

function ClientDashboard() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>AAng Logistics</Text>
            </View>

            <View style={styles.mapContainer}>
                <MapScreen />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    mapContainer: {
        flex: 1,
    },
});

export default ClientDashboard;