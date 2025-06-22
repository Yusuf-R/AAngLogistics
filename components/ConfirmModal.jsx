import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
    Platform
} from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function ConfirmModal({
                                         visible,
                                         title = 'Delete All Notifications?',
                                         message = 'This will permanently remove all your notifications. This action cannot be undone.',
                                         onConfirm,
                                         onCancel,
                                         confirmText = 'Delete All',
                                         cancelText = 'Keep Them',
                                         type = 'danger', // 'danger', 'warning', 'info'
                                     }) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const iconRotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            // Entrance animation sequence
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();

            // Icon rotation animation
            Animated.timing(iconRotateAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.elastic(1.2),
                useNativeDriver: true,
            }).start();

            // Pulsing effect for icon
            const pulseLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseLoop.start();

            return () => pulseLoop.stop();
        } else {
            // Reset animations
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
            iconRotateAnim.setValue(0);
            pulseAnim.setValue(1);
        }
    }, [visible]);

    const handleCancel = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onCancel());
    };

    const handleConfirm = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1.05,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => onConfirm());
    };

    const iconRotation = iconRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const getThemeColors = () => {
        switch (type) {
            case 'danger':
                return {
                    primary: '#FF3B30',
                    secondary: '#FF6B6B',
                    background: '#FFF5F5',
                    icon: '#FF3B30',
                    gradient: ['#FF6B6B', '#FF3B30']
                };
            case 'warning':
                return {
                    primary: '#FF9500',
                    secondary: '#FFB84D',
                    background: '#FFFBF0',
                    icon: '#FF9500',
                    gradient: ['#FFB84D', '#FF9500']
                };
            default:
                return {
                    primary: '#007AFF',
                    secondary: '#4DA6FF',
                    background: '#F0F7FF',
                    icon: '#007AFF',
                    gradient: ['#4DA6FF', '#007AFF']
                };
        }
    };

    const colors = getThemeColors();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleCancel}
        >
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        opacity: fadeAnim,
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.overlayTouch}
                    activeOpacity={1}
                    onPress={handleCancel}
                />

                <Animated.View
                    style={[
                        styles.modal,
                        {
                            transform: [
                                { scale: scaleAnim },
                                { translateY: slideAnim }
                            ],
                        }
                    ]}
                >
                    {/* Gradient Header */}
                    <View style={[styles.header, { backgroundColor: colors.background }]}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleCancel}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <X size={20} color="#8E8E93" />
                        </TouchableOpacity>

                        <Animated.View
                            style={[
                                styles.iconContainer,
                                {
                                    transform: [
                                        { rotate: iconRotation },
                                        { scale: pulseAnim }
                                    ]
                                }
                            ]}
                        >
                            <View style={[styles.iconBg, { backgroundColor: colors.primary + '15' }]}>
                                {type === 'danger' ? (
                                    <Trash2 size={28} color={colors.icon} />
                                ) : (
                                    <AlertTriangle size={28} color={colors.icon} />
                                )}
                            </View>
                        </Animated.View>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    {/* Enhanced Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={handleCancel}
                            style={styles.cancelButton}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleConfirm}
                            style={[
                                styles.confirmButton,
                                { backgroundColor: colors.primary }
                            ]}
                            activeOpacity={0.9}
                        >
                            <View style={styles.confirmButtonContent}>
                                <Text style={styles.confirmText}>{confirmText}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTouch: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modal: {
        width: Math.min(width * 0.88, 400),
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.25,
                shadowRadius: 25,
            },
            android: {
                elevation: 25,
            },
        }),
    },
    header: {
        paddingTop: 24,
        paddingBottom: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
        padding: 4,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
    },
    iconContainer: {
        marginTop: 8,
    },
    iconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    title: {
        fontSize: 22,
        color: '#1D1D1F',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
        fontFamily: 'PoppinsSemiBold',

    },
    message: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
        letterSpacing: -0.3,
        fontFamily: 'PoppinsRegular',
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#FF3B30',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    confirmButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        color: '#1D1D1F',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.3,
        textTransform: 'uppercase',
    },
    confirmText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
        textTransform: 'uppercase',
    },
});