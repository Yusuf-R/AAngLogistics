import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VerificationSuccessModal = ({
                                      visible,
                                      onClose,
                                      onNavigate,
                                      title = "Congratulations!",
                                      message = "Your email has been verified successfully. You will be redirected to your profile in a few seconds..",
                                      autoCloseDelay = 3000
                                  }) => {
    const [animatedValue] = useState(new Animated.Value(0));
    const [dotAnimations] = useState([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);

    useEffect(() => {
        if (visible) {
            startAnimations();

            // Auto close and navigate after delay
            const timer = setTimeout(() => {
                handleClose();
                if (onNavigate) {
                    onNavigate(redirectRoute);
                }
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const startAnimations = () => {
        // Main icon animation
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Floating dots animation
        const dotAnimationsSequence = dotAnimations.map((animation, index) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(index * 200),
                    Animated.timing(animation, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animation, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            )
        );

        Animated.stagger(100, dotAnimationsSequence).start();
    };

    const handleClose = () => {
        Animated.timing(animatedValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            if (onClose) {
                onClose();
            }
        });
    };

    const scaleAnimation = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 1.1, 1],
    });

    const opacityAnimation = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <Animated.View
                    style={[
                        styles.successModal,
                        {
                            opacity: opacityAnimation,
                            transform: [{ scale: scaleAnimation }]
                        }
                    ]}
                >
                    {/* Success Animation */}
                    <View style={styles.successAnimation}>
                        <Animated.View
                            style={[
                                styles.successCircle,
                                {
                                    transform: [{ scale: scaleAnimation }]
                                }
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.successIcon,
                                    {
                                        opacity: opacityAnimation,
                                    }
                                ]}
                            >
                                <Ionicons name="shield-checkmark" size={40} color="#fff" />
                            </Animated.View>
                        </Animated.View>

                        {/* Animated floating dots */}
                        <View style={styles.animatedDots}>
                            {dotAnimations.map((animation, index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        {
                                            transform: [
                                                {
                                                    translateY: animation.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, -20],
                                                    }),
                                                },
                                                {
                                                    scale: animation.interpolate({
                                                        inputRange: [0, 0.5, 1],
                                                        outputRange: [1, 1.5, 1],
                                                    }),
                                                },
                                            ],
                                            opacity: animation.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [0.6, 1, 0.3],
                                            }),
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Success Content */}
                    <Animated.View
                        style={{
                            opacity: opacityAnimation,
                        }}
                    >
                        <Text style={styles.successTitle}>{title}</Text>
                        <Text style={styles.successMessage}>{message}</Text>
                    </Animated.View>

                    {/* Loading dots indicator */}
                    <View style={styles.loadingDotsContainer}>
                        {[0, 1, 2, 3, 4].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.loadingDot,
                                    {
                                        opacity: animatedValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 1],
                                        }),
                                        transform: [
                                            {
                                                scale: animatedValue.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.5, 1],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        marginHorizontal: 20,
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    successAnimation: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#00D4AA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#00D4AA',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    successIcon: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    animatedDots: {
        flexDirection: 'row',
        position: 'absolute',
        top: -10,
        justifyContent: 'space-around',
        width: 150,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00D4AA',
        marginHorizontal: 4,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00D4AA',
        marginBottom: 16,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    loadingDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00D4AA',
        marginHorizontal: 3,
    },
});

export default VerificationSuccessModal;