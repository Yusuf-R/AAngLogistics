// FloatingActionPanel.js - Floating action buttons for navigation
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    Dimensions,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FloatingActionPanel = ({
                                 currentStep = 0,
                                 totalSteps = 5,
                                 onNext = () => {},
                                 onPrevious = () => {},
                                 onSubmit = () => {},
                                 isLoading = false,
                                 hasErrors = false
                             }) => {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

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

    const handleNext = () => {
        if (hasErrors) {
            // Shake animation for errors
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
            ]).start();

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onNext();
    };

    const handlePrevious = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPrevious();
    };

    const handleSubmit = () => {
        if (hasErrors) {
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
            ]).start();

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onSubmit();
    };

    const getNextButtonText = () => {
        if (isLastStep) {
            return isLoading ? 'Creating...' : 'Create Order';
        }
        return 'Continue';
    };

    const getNextButtonColors = () => {
        if (hasErrors) {
            return ['#ef4444', '#dc2626'];
        }
        if (isLastStep) {
            return ['#059669', '#047857'];
        }
        return ['#667eea', '#764ba2'];
    };

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
                <View style={styles.content}>

                    {/* Action Buttons */}
                    <View style={styles.buttonsContainer}>
                        {/* Previous Button */}
                        {!isFirstStep && (
                            <Pressable
                                style={styles.previousButton}
                                onPress={handlePrevious}
                                disabled={isLoading}
                            >
                                <View style={styles.previousButtonContent}>
                                    <Text style={styles.previousButtonText}>Back</Text>
                                </View>
                            </Pressable>
                        )}

                        {/* Next/Submit Button */}
                        <Pressable
                            style={[
                                styles.nextButton,
                                isFirstStep && styles.nextButtonFullWidth,
                                (isLoading || hasErrors) && styles.nextButtonDisabled
                            ]}
                            onPress={isLastStep ? handleSubmit : handleNext}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={getNextButtonColors()}
                                style={styles.nextButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.nextButtonContent}>
                                    {isLoading && (
                                        <Animated.View style={styles.loadingSpinner} />
                                    )}
                                    <Text style={styles.nextButtonText}>
                                        {getNextButtonText()}
                                    </Text>
                                    {!isLoading && !isLastStep && (
                                        <Text style={styles.nextButtonIcon}>→</Text>
                                    )}
                                    {!isLoading && isLastStep && (
                                        <Text style={styles.nextButtonIcon}>✓</Text>
                                    )}
                                </View>
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {/* Error Message */}
                    {/*{hasErrors && (*/}
                    {/*    <View style={styles.errorContainer}>*/}
                    {/*        <Text style={styles.errorText}>*/}
                    {/*            Please fix the errors above before continuing*/}
                    {/*        </Text>*/}
                    {/*    </View>*/}
                    {/*)}*/}
                </View>
            </BlurView>
        </Animated.View>
    );
};

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
        backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12
    },
    stepCounter: {
        alignItems: 'center',
        marginBottom: 16
    },
    stepCounterText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 8
    },
    stepDots: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    stepDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#d1d5db',
        marginHorizontal: 3
    },
    stepDotActive: {
        backgroundColor: '#667eea'
    },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    previousButton: {
        flex: 1,
        marginRight: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16
    },
    previousButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    previousButtonIcon: {
        fontSize: 16,
        color: '#374151',
        marginRight: 8
    },
    previousButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151'
    },
    nextButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8
    },
    nextButtonFullWidth: {
        flex: 1,
        marginRight: 0
    },
    nextButtonDisabled: {
        elevation: 2,
        shadowOpacity: 0.1
    },
    nextButtonGradient: {
        paddingVertical: 14,
        paddingHorizontal: 16
    },
    nextButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center'
    },
    nextButtonIcon: {
        fontSize: 16,
        color: '#ffffff',
        marginLeft: 8
    },
    loadingSpinner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderTopColor: '#ffffff',
        marginRight: 8
    },
    errorContainer: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444'
    },
    errorText: {
        fontSize: 12,
        color: '#dc2626',
        textAlign: 'center',
        fontWeight: '500'
    }
};

export default FloatingActionPanel;