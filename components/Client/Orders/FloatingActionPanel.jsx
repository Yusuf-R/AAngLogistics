// FloatingActionPanel.jsx - Music player inspired floating controls
import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Pressable,
    Animated,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

function FloatingActionPanel({
                                 currentStep,
                                 totalSteps,
                                 onNext,
                                 onPrevious,
                                 onSubmit,
                                 onSave,
                                 hasErrors,
                                 isSaving = false,
                             }) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const saveIconAnim = useRef(new Animated.Value(1)).current;
    const rippleAnim = useRef(new Animated.Value(0)).current;
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8
        }).start();
    }, []);

    const createRippleEffect = () => {
        rippleAnim.setValue(0);
        Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    };

    const handleNext = async () => {
        if (hasErrors) {
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
            ]).start();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        createRippleEffect();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const result = await onNext();
        } catch (err) {
            console.log('❌ onNext threw an error:', err);
        }
    };

    const handlePrevious = () => {
        createRippleEffect();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPrevious();
    };

    const handleSubmit = async () => {
        if (hasErrors) {
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
            ]).start();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        createRippleEffect();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await onSubmit();
    };

    const handleSave = async () => {
        createRippleEffect();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Validate current step imperatively
            const result = await onSave();  // <-- run validateCurrentStep internally

            if (!result?.valid) {
                Animated.sequence([
                    Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
                ]).start();
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2500);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.log('❌ Save failed:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Save Failed', 'Unable to save your progress. Please try again.');
        }
    };

    const ControlButton = ({ onPress, disabled, children, style, type = 'default', size = 'medium' }) => {
        const buttonSize = size === 'large' ? 55 : size === 'medium' ? 56 : 48;
        const iconScale = size === 'large' ? 1.2 : 1;

        return (
            <Pressable
                style={[
                    styles.controlButton,
                    {
                        width: buttonSize,
                        height: buttonSize,
                        borderRadius: buttonSize / 2,
                    },
                    type === 'primary' && styles.primaryButton,
                    type === 'secondary' && styles.secondaryButton,
                    type === 'save' && styles.saveButton,
                    disabled && styles.disabledButton,
                    style
                ]}
                onPress={onPress}
                disabled={disabled}
            >
                {type === 'primary' ? (
                    <>
                        <Animated.View
                            style={[
                                styles.rippleEffect,
                                {
                                    transform: [{
                                        scale: rippleAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 2]
                                        })
                                    }],
                                    opacity: rippleAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0, 0.3, 0]
                                    })
                                }
                            ]}
                        />
                        <LinearGradient
                            colors={isLastStep ? ['#10B981', '#059669', '#047857'] : ['#3B82F6', '#2563EB', '#1E40AF']}
                            style={[styles.buttonContent, { transform: [{ scale: iconScale }] }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {children}
                        </LinearGradient>
                    </>
                ) : (
                    <View style={[styles.buttonContent, { transform: [{ scale: iconScale }] }]}>
                        {children}
                    </View>
                )}
            </Pressable>
        );
    };

    return (
        <>
            {showSaveSuccess && (
                <Animated.View
                    style={[
                        styles.saveToast,
                        {
                            bottom: insets.bottom + 120,
                            opacity: slideAnim,
                            transform: [{
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0]
                                })
                            }]
                        }
                    ]}
                >
                    <BlurView intensity={25} style={styles.toastBlur}>
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </BlurView>
                </Animated.View>
            )}

            <Animated.View
                style={[
                    styles.container,
                    {
                        paddingBottom: insets.bottom + 24,
                        transform: [
                            {
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [120, 0]
                                })
                            },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
                <BlurView intensity={20} tint="light" style={styles.controlPanel}>
                    <View style={styles.controlsRow}>
                        {/* Previous Button */}
                        <View style={styles.controlSlot}>
                            {!isFirstStep && (
                                <ControlButton
                                    onPress={handlePrevious}
                                    type="secondary"
                                    size="medium"
                                >
                                    <Ionicons name="caret-back" size={24} color="#6B7280" />
                                </ControlButton>
                            )}
                        </View>

                        {/* Save Button */}
                        <View style={styles.controlSlot}>
                            <ControlButton
                                onPress={handleSave}
                                disabled={isSaving}
                                type="save"
                                size="small"
                            >
                                <Animated.View style={{ transform: [{ scale: saveIconAnim }] }}>
                                    {isSaving ? (
                                        <Animated.View
                                            style={[
                                                styles.spinner,
                                                {
                                                    transform: [{
                                                        rotate: slideAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: ['0deg', '360deg']
                                                        })
                                                    }]
                                                }
                                            ]}
                                        />
                                    ) : (
                                        <Ionicons
                                            name="save"
                                            size={20}
                                            color="#64aff5"
                                        />
                                    )}
                                </Animated.View>
                            </ControlButton>
                        </View>

                        {/* Primary Action Button */}
                        <View style={styles.controlSlot}>
                            <ControlButton
                                onPress={isLastStep ? handleSubmit : handleNext}
                                type="primary"
                                size="large"
                            >
                                <Ionicons
                                    name={isLastStep ? "checkmark" : "caret-forward"}
                                    size={isLastStep ? 28 : 26}
                                    color="#FFFFFF"
                                />
                            </ControlButton>
                        </View>
                    </View>
                </BlurView>
            </Animated.View>
        </>
    );
}

const styles = {
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        alignItems: 'center',
    },
    controlPanel: {
        borderRadius: 42,
        paddingHorizontal: 24,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 250, // Fixed width for consistent spacing
    },
    controlSlot: {
        width: 40, // Equal spacing for each control
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlButton: {
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    secondaryButton: {
        backgroundColor: 'rgba(249, 250, 251, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(229, 231, 235, 0.8)',
    },
    saveButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(229, 231, 235, 0.6)',
    },
    primaryButton: {
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonContent: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rippleEffect: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 32,
    },
    spinner: {
        width: 18,
        height: 18,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderTopColor: '#6B7280',
        borderRadius: 9,
    },
    saveToast: {
        position: 'absolute',
        left: '50%',
        marginLeft: -24,
        zIndex: 1001,
    },
    toastBlur: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
};

export default FloatingActionPanel;