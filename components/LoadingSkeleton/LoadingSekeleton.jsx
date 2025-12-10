// components/Client/Dashboard/LoadingSkeleton.jsx

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

function LoadingSkeleton() {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.walletCard, { opacity }]} />
            <Animated.View style={[styles.highlightCard, { opacity }]} />
            <View style={styles.actionsRow}>
                <Animated.View style={[styles.actionCard, { opacity }]} />
                <Animated.View style={[styles.actionCard, { opacity }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    walletCard: {
        height: 200,
        backgroundColor: '#e5e7eb',
        borderRadius: 20,
        marginBottom: 20,
    },
    highlightCard: {
        height: 180,
        backgroundColor: '#e5e7eb',
        borderRadius: 20,
        marginBottom: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        height: 120,
        backgroundColor: '#e5e7eb',
        borderRadius: 16,
    },
});

export default LoadingSkeleton;