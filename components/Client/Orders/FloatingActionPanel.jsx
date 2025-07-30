// FloatingActionPanel.js - Enhanced floating action buttons with save/draft functionality
import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    Dimensions,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function FloatingActionPanel({
                                 currentStep,
                                 totalSteps,
                                 onNext,
                                 onPrevious,
                                 onSubmit,
                                 onSave,
                                 hasErrors,
                                 isSaving = false,
                                 saveEnabled = true
                             }) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const saveIconAnim = useRef(new Animated.Value(1)).current;
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    useEffect(() => {
        // Animate panel entrance
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8
        }).start();
    }, []);

    const handleNext = async () => {
        if (hasErrors) {
            // Shake animation for errors
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
            ]).start();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await onNext();
    };

    const handlePrevious = () => {
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

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await onSubmit();
    };

    const handleSave = async () => {
        if (hasErrors) {
            Alert.alert(
                'Cannot Save',
                'Please fix the errors in the current step before saving.',
                [{ text: 'OK', style: 'default' }]
            );
            return;
        }

        // Animate save icon
        Animated.sequence([
            Animated.timing(saveIconAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.timing(saveIconAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            Animated.timing(saveIconAnim, { toValue: 1, duration: 200, useNativeDriver: true })
        ]).start();

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await onSave();

            // Show success feedback
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Save Failed', 'Unable to save your progress. Please try again.');
        }
    };

    const getNextButtonText = () => {
        return isLastStep ? 'Submit Order' : 'Continue';
    };

    const getNextButtonColors = () => {
        return isLastStep ? ['#059669', '#047857'] : ['#62cff4', '#0396ff'];
    };

    const ActionButton = ({ onPress, disabled, children, style, type = 'default' }) => (
        <Pressable
            style={[
                styles.actionButton,
                type === 'primary' && styles.primaryButton,
                type === 'save' && styles.saveButton,
                disabled && styles.disabledButton,
                style
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            {type === 'primary' ? (
                <LinearGradient
                    colors={getNextButtonColors()}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    {children}
                </LinearGradient>
            ) : (
                <View style={styles.buttonContent}>
                    {children}
                </View>
            )}
        </Pressable>
    );

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    paddingBottom: insets.bottom,
                    transform: [
                        {
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [100, 0]
                            })
                        },
                        { scale: scaleAnim }
                    ]
                }
            ]}
        >
            <BlurView intensity={20} style={styles.blurContainer}>
                {showSaveSuccess && (
                    <View style={styles.saveSuccessIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        <Text style={styles.saveSuccessText}>Draft saved</Text>
                    </View>
                )}

                <View style={styles.content}>
                    <View style={styles.buttonsContainer}>
                        {!isFirstStep && (
                            <ActionButton onPress={handlePrevious} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={20} color="#666" />
                                <Text style={styles.backButtonText}>Back</Text>
                            </ActionButton>
                        )}

                        {/* Save Button - Always visible */}
                        <ActionButton
                            onPress={handleSave}
                            disabled={!saveEnabled || isSaving}
                            type="save"
                            style={[
                                styles.saveButtonContainer,
                                isFirstStep && styles.saveButtonExpanded
                            ]}
                        >
                            <Animated.View style={{ transform: [{ scale: saveIconAnim }] }}>
                                {isSaving ? (
                                    <View style={styles.savingIndicator}>
                                        <Animated.View style={styles.loadingDot} />
                                    </View>
                                ) : (
                                    <Ionicons
                                        name="save"
                                        size={20}
                                        color={saveEnabled ? "#6B7280" : "#D1D5DB"}
                                    />
                                )}
                            </Animated.View>
                            <Text style={[
                                styles.saveButtonText,
                                !saveEnabled && styles.disabledText
                            ]}>
                                Save
                            </Text>
                        </ActionButton>

                        {/* Next/Submit Button */}
                        <ActionButton
                            onPress={isLastStep ? handleSubmit : handleNext}
                            type="primary"
                            style={[
                                styles.nextButton,
                                isFirstStep && styles.nextButtonReduced
                            ]}
                        >
                            <View style={styles.nextButtonContent}>
                                <Text style={styles.nextButtonText}>
                                    {getNextButtonText()}
                                </Text>
                                <Ionicons
                                    name={isLastStep ? "checkmark" : "caret-forward"}
                                    size={20}
                                    color="#ffffff"
                                />
                            </View>
                        </ActionButton>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
}

const styles = {
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    blurContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    saveSuccessIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: '#F0FDF4',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    saveSuccessText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#059669',
        fontFamily: 'PoppinsMedium',
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionButton: {
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    saveButtonContainer: {
        flex: 0.8,
    },
    saveButtonExpanded: {
        flex: 1,
    },
    primaryButton: {
        elevation: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    nextButton: {
        flex: 2,
    },
    nextButtonReduced: {
        flex: 1.5,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 8,
    },
    backButtonText: {
        fontSize: 15,
        color: '#666',
        fontFamily: 'PoppinsRegular',
    },
    saveButtonText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    disabledText: {
        color: '#D1D5DB',
    },
    nextButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nextButtonText: {
        fontSize: 15,
        color: '#ffffff',
        fontFamily: 'PoppinsSemiBold',
    },
    savingIndicator: {
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingDot: {
        width: 4,
        height: 4,
        backgroundColor: '#6B7280',
        borderRadius: 2,
    },
};

export default FloatingActionPanel;