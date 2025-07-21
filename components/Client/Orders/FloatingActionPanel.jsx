// FloatingActionPanel.js - Floating action buttons for navigation
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function FloatingActionPanel ({
                                 currentStep,
                                 totalSteps,
                                 onNext,
                                 onPrevious,
                                 onSubmit,
                                 hasErrors,
                             }) {
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
        return isLastStep ? 'Submit Order' : 'Continue';
    };

    const getNextButtonColors = () => {
        return isLastStep ? ['#059669', '#047857'] : ['#62cff4', '#0396ff'];
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
                    <View style={styles.buttonsContainer}>
                        {/* Back Button */}
                        {!isFirstStep && (
                            <Pressable
                                style={styles.previousButton}
                                onPress={handlePrevious}
                            >
                                <Text style={styles.previousButtonText}>Back</Text>
                            </Pressable>
                        )}

                        {/* Continue/Submit Button */}
                        <Pressable
                            style={[
                                styles.nextButton,
                                isFirstStep && styles.nextButtonFullWidth
                            ]}
                            onPress={isLastStep ? handleSubmit : handleNext}
                        >
                            <LinearGradient
                                colors={getNextButtonColors()}
                                style={styles.nextButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.nextButtonText}>
                                    {getNextButtonText()}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
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
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    previousButton: {
        flex: 1,
        marginRight: 12,
        backgroundColor: '#d4dfed',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 16
    },
    previousButtonText: {
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
        fontFamily: 'PoppinsRegular',
    },
    nextButton: {
        flex: 2,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    nextButtonFullWidth: {
        flex: 1,
        marginRight: 0
    },
    nextButtonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 16
    },
    nextButtonText: {
        fontSize: 16,
        color: '#ffffff',
        fontFamily: 'PoppinsSemiBold',
        textAlign: 'center'
    }
};

export default FloatingActionPanel;
