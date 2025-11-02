import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function ScanOverlay ({ visible, onClose, onScanComplete }) {
    const [isScanning, setIsScanning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [scanResult, setScanResult] = useState(null);

    // Animation values
    const pulse1 = useSharedValue(0);
    const pulse2 = useSharedValue(0);
    const pulse3 = useSharedValue(0);
    const progress = useSharedValue(0);

    // Start scanning
    const startScanning = useCallback(() => {
        console.log('Starting scan...');
        setIsScanning(true);
        setTimeLeft(30);
        setScanResult(null);
        progress.value = 0;

        // Start pulsating animations
        pulse1.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );

        pulse2.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );

        pulse3.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );

        // Start progress animation
        progress.value = withTiming(1, { duration: 30000, easing: Easing.linear });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    // Stop scanning
    const stopScanning = useCallback(() => {
        console.log('Stopping scan...');
        setIsScanning(false);

        // Cancel all animations
        cancelAnimation(pulse1);
        cancelAnimation(pulse2);
        cancelAnimation(pulse3);
        cancelAnimation(progress);

        pulse1.value = 0;
        pulse2.value = 0;
        pulse3.value = 0;
        progress.value = 0;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // Handle close with confirmation
    const handleClose = useCallback(() => {
        if (isScanning) {
            Alert.alert(
                'Stop Scanning?',
                'Are you sure you want to stop scanning? This will cancel the current search.',
                [
                    { text: 'Continue Scanning', style: 'cancel' },
                    {
                        text: 'Stop Scanning',
                        style: 'destructive',
                        onPress: () => {
                            stopScanning();
                            onClose();
                        }
                    }
                ]
            );
        } else {
            onClose();
        }
    }, [isScanning, stopScanning, onClose]);

    // Countdown timer
    useEffect(() => {
        let interval;
        if (isScanning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        completeScan();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isScanning, timeLeft]);

    // Complete scan
    const completeScan = useCallback(() => {
        console.log('Scan completed');
        stopScanning();

        // Simulate results
        setTimeout(() => {
            const hasOrders = Math.random() > 0.4;
            const result = hasOrders
                ? {
                    success: true,
                    message: `Found ${Math.floor(Math.random() * 3) + 1} available orders nearby! 🎉`,
                    orders: [
                        { id: 1, distance: '0.8km', price: '₦2,500' },
                        { id: 2, distance: '1.2km', price: '₦1,800' }
                    ]
                }
                : {
                    success: false,
                    message: 'No orders found in your area. Try moving to a different location.',
                    orders: []
                };

            setScanResult(result);
            Haptics.notificationAsync(
                result.success
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Warning
            );

            if (onScanComplete) {
                onScanComplete(result);
            }
        }, 500);
    }, [stopScanning, onScanComplete]);

    // Reset when modal closes
    useEffect(() => {
        if (!visible) {
            stopScanning();
            setScanResult(null);
            setTimeLeft(30);
        }
    }, [visible]);

    // Animation styles
    const pulse1Style = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + pulse1.value }],
        opacity: 1 - pulse1.value,
    }));

    const pulse2Style = useAnimatedStyle(() => ({
        transform: [{ scale: 1.5 + pulse2.value }],
        opacity: 0.7 - pulse2.value * 0.7,
    }));

    const pulse3Style = useAnimatedStyle(() => ({
        transform: [{ scale: 2 + pulse3.value }],
        opacity: 0.4 - pulse3.value * 0.4,
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                {/* Main Content */}
                <View style={styles.overlay}>
                    <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                        <View style={styles.content}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>
                                    {isScanning ? 'Scanning Area' : 'Area Scanner'}
                                </Text>
                                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            {/* Scanning Visualization */}
                            <View style={styles.scanVisualization}>
                                <View style={styles.pulsatingContainer}>
                                    {/* Pulsating Rings */}
                                    {isScanning && (
                                        <>
                                            <Animated.View style={[styles.pulseRing, pulse1Style]} />
                                            <Animated.View style={[styles.pulseRing, pulse2Style]} />
                                            <Animated.View style={[styles.pulseRing, pulse3Style]} />
                                        </>
                                    )}

                                    {/* Center Icon */}
                                    <View style={styles.centerIcon}>
                                        <Ionicons
                                            name={isScanning ? "radio-sharp" : "radio-outline"}
                                            size={40}
                                            color={isScanning ? "#10B981" : "#6B7280"}
                                        />
                                    </View>
                                </View>

                                {/* Status Text */}
                                <Text style={styles.statusText}>
                                    {isScanning
                                        ? `Scanning for available orders...`
                                        : scanResult
                                            ? scanResult.message
                                            : 'Ready to scan your area for delivery orders'
                                    }
                                </Text>

                                {/* Timer */}
                                {isScanning && (
                                    <Text style={styles.timerText}>
                                        {timeLeft}s
                                    </Text>
                                )}
                            </View>

                            {/* Progress Bar */}
                            {isScanning && (
                                <View style={styles.progressContainer}>
                                    <Animated.View style={[styles.progressBar, progressStyle]} />
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.actions}>
                                {!isScanning && !scanResult ? (
                                    <TouchableOpacity
                                        style={styles.startButton}
                                        onPress={startScanning}
                                    >
                                        <Ionicons name="play" size={20} color="#FFFFFF" />
                                        <Text style={styles.startButtonText}>Start Scan</Text>
                                    </TouchableOpacity>
                                ) : isScanning ? (
                                    <TouchableOpacity
                                        style={styles.stopButton}
                                        onPress={stopScanning}
                                    >
                                        <Ionicons name="stop" size={20} color="#FFFFFF" />
                                        <Text style={styles.stopButtonText}>Stop Scan</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.resultActions}>
                                        <TouchableOpacity
                                            style={styles.scanAgainButton}
                                            onPress={startScanning}
                                        >
                                            <Ionicons name="refresh" size={20} color="#6366F1" />
                                            <Text style={styles.scanAgainText}>Scan Again</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.doneButton}
                                            onPress={onClose}
                                        >
                                            <Text style={styles.doneText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Scan Results */}
                            {scanResult?.success && scanResult.orders.length > 0 && (
                                <View style={styles.resultsContainer}>
                                    <Text style={styles.resultsTitle}>Available Orders:</Text>
                                    {scanResult.orders.map(order => (
                                        <View key={order.id} style={styles.orderItem}>
                                            <Ionicons name="cube-outline" size={16} color="#10B981" />
                                            <Text style={styles.orderText}>
                                                Order #{order.id} • {order.distance} • {order.price}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </BlurView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 20,
        overflow: 'hidden',
    },
    blurContainer: {
        borderRadius: 20,
    },
    content: {
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    scanVisualization: {
        alignItems: 'center',
        marginBottom: 20,
    },
    pulsatingContainer: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    pulseRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#10B981',
        backgroundColor: 'transparent',
    },
    centerIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statusText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#E5E7EB',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 20,
    },
    timerText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#10B981',
    },
    progressContainer: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        marginBottom: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    actions: {
        marginBottom: 16,
    },
    startButton: {
        flexDirection: 'row',
        backgroundColor: '#10B981',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    stopButton: {
        flexDirection: 'row',
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    stopButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    resultActions: {
        flexDirection: 'row',
        gap: 12,
    },
    scanAgainButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    scanAgainText: {
        color: '#6366F1',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    doneButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    doneText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    resultsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    resultsTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    orderText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#E5E7EB',
    },
});

export default ScanOverlay;