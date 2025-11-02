import Utility from "../../../../components/Driver/Account/Utility/Utility"
import React, {useState} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import { toast } from "sonner-native"

function UtilityScreen() {
    const [showScan, setShowScan] = useState(false);

    const handleScanComplete = (result) => {
        console.log('Scan completed:', result);
        toast.info('Scan completed');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Scan Overlay Test</Text>
            <Text style={styles.subtitle}>Test the beautiful scanning overlay</Text>

            <TouchableOpacity
                style={styles.testButton}
                onPress={() => setShowScan(true)}
            >
                <Ionicons name="scan-outline" size={24} color="#FFFFFF"/>
                <Text style={styles.testButtonText}>Test Scan Overlay</Text>
            </TouchableOpacity>

            <Utility
                visible={showScan}
                onClose={() => setShowScan(false)}
                onScanComplete={handleScanComplete}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 40,
        textAlign: 'center',
    },
    testButton: {
        flexDirection: 'row',
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    testButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
    },
});

export default UtilityScreen;