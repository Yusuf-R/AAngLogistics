// components/CustomAlert.jsx
import React, {useEffect, useRef} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Pressable
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const CustomAlert = ({
                         type = 'info',
                         title,
                         message,
                         onClose,
                         duration = 4000,
                     }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const isMounted = useRef(true);

    const alertConfig = {
        success: {
            backgroundColor: '#10b981',
            icon: 'checkmark-circle',
            shadowColor: '#059669',
        },
        error: {
            backgroundColor: '#ef4444',
            icon: 'alert-circle',
            shadowColor: '#dc2626',
        },
        warning: {
            backgroundColor: '#f59e0b',
            icon: 'warning',
            shadowColor: '#d97706',
        },
        info: {
            backgroundColor: '#3b82f6',
            icon: 'information-circle',
            shadowColor: '#2563eb',
        }
    };

    const config = alertConfig[type] || alertConfig.info;

    useEffect(() => {
        isMounted.current = true;

        // Defer the animation to the next frame to avoid useInsertionEffect conflict
        const animationTimer = setTimeout(() => {
            if (isMounted.current) {
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        }, 0);

        // Auto dismiss
        const dismissTimer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            isMounted.current = false;
            clearTimeout(animationTimer);
            clearTimeout(dismissTimer);
        };
    }, [duration]);

    const handleClose = () => {
        if (!isMounted.current) return;

        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (isMounted.current) {
                onClose?.();
            }
        });
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{translateY: slideAnim}],
                    opacity: opacityAnim,
                    backgroundColor: config.backgroundColor,
                    shadowColor: config.shadowColor,
                }
            ]}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={config.icon}
                        size={24}
                        color="#ffffff"
                    />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {message && (
                        <Text style={styles.message}>{message}</Text>
                    )}
                </View>

                <Pressable
                    style={styles.closeButton}
                    onPress={handleClose}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                    <Ionicons name="close" size={20} color="#ffffff" />
                </Pressable>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
        borderRadius: 12,
        elevation: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
});

export default CustomAlert;