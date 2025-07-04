// /components/SocketStatusMonitor.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import io from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const localIP = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';

const SOCKET_SERVER_URL = Platform.select({
    ios: `http://${localIP}:5000`,
    android: `http://${localIP}:5000`,
    default: `http://${localIP}:5000`
});


const SocketStatusMonitor = () => {
    const [status, setStatus] = useState('idle'); // idle | connecting | connected | error | disconnected
    const [latency, setLatency] = useState(null);
    const [socket, setSocket] = useState(null);
    const [checking, setChecking] = useState(false);

    // Clean up socket on unmount
    useEffect(() => {
        return () => {
            if (socket) socket.disconnect();
        };
    }, [socket]);

    const handleTestConnection = () => {
        setChecking(true);
        setStatus('connecting');
        setLatency(null);

        const s = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 2,
        });

        const pingStart = Date.now();

        s.on('connect', () => {
            setStatus('connected');
            s.emit('ping:health', pingStart, (data) => {
                if (data && typeof data.latency === 'number') {
                    setLatency(data.latency);
                }
                setChecking(false);
            });
        });

        s.on('connect_error', () => {
            setStatus('error');
            setChecking(false);
        });

        s.on('disconnect', () => {
            setStatus('disconnected');
        });

        setSocket(s);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Socket Connectivity Check</Text>

            <View style={[styles.indicator, statusStyles[status]]} />
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            {latency !== null && <Text style={styles.latency}>Latency: {latency}ms</Text>}

            <TouchableOpacity
                style={[styles.button, styles.buttonActive]}
                onPress={handleTestConnection}
                disabled={checking}
            >
                {checking ? <ActivityIndicator size="small" color="#fff" /> : (
                    <Text style={styles.buttonText}>Run Connection Test</Text>
                )}
            </TouchableOpacity>

            {status === 'error' && (
                <Text style={styles.errorText}>
                    Could not connect. Ensure the server is running and reachable.
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#1F2937',
    },
    indicator: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginBottom: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    latency: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
    },
    errorText: {
        marginTop: 10,
        color: '#DC2626',
        fontSize: 12,
    },
    button: {
        marginTop: 10,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonActive: {
        backgroundColor: '#2563EB',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    }
});

const statusStyles = {
    idle: { backgroundColor: '#D1D5DB' },         // gray
    connecting: { backgroundColor: '#FBBF24' },   // yellow
    connected: { backgroundColor: '#10B981' },    // green
    disconnected: { backgroundColor: '#EF4444' }, // red
    error: { backgroundColor: '#B91C1C' },        // dark red
};

export default SocketStatusMonitor;
