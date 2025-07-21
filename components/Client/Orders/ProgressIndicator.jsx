import React, {useEffect, useRef} from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    Dimensions,
    StyleSheet
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const ProgressIndicator = ({
                               steps = [],
                               currentStep = 0,
                           }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const dotScale = useRef(new Animated.Value(1)).current;
    const activeDotIndex = useRef(currentStep);

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: currentStep / (steps.length - 1),
            duration: 500,
            useNativeDriver: false,
        }).start();

        if (currentStep !== activeDotIndex.current) {
            Animated.sequence([
                Animated.timing(dotScale, {
                    toValue: 1.3,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(dotScale, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
            activeDotIndex.current = currentStep;
        }
    }, [currentStep]);

    const getStepStatus = (index) => {
        if (index < currentStep) return 'completed';
        if (index === currentStep) return 'active';
        return 'inactive';
    };

    const getStepIcon = (step, status) => {
        const iconConfig = {
            'package': {active: 'cube', default: 'cube-outline'},
            'map-pin': {active: 'location', default: 'location-outline'},
            'truck': {active: 'car', default: 'car-outline'},
            'credit-card': {active: 'card', default: 'card-outline'},
            'check-circle': {active: 'checkmark-circle', default: 'checkmark-circle-outline'}
        };

        const iconName = iconConfig[step.icon]?.[status === 'active' ? 'active' : 'default'] || 'ellipse-outline';
        const iconColor = {
            completed: 'white',
            active: 'white',
            inactive: '#9ca3af'
        }[status];

        return (
            <Ionicons
                name={iconName}
                size={28}
                color={iconColor}
            />
        );
    };

    const StepDot = ({step, index, status}) => {
        const scale = index === currentStep ? dotScale : 1;

        return (
            <View style={styles.stepDotContainer}>
                <Animated.View style={[
                    styles.stepDot,
                    status === 'completed' && styles.stepDotCompleted,
                    status === 'active' && styles.stepDotActive,
                    status === 'inactive' && styles.stepDotInactive,
                    {transform: [{scale}]}
                ]}>
                    {status === 'completed' ? (
                        <Ionicons name="checkmark" size={26} color="white"/>
                    ) : (
                        getStepIcon(step, status)
                    )}
                </Animated.View>
            </View>
        );
    };

    const ProgressLine = ({index}) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep - 1;

        return (
            <View style={styles.progressLineContainer}>
                <View style={styles.progressLineBackground}>
                    <View style={[
                        styles.progressLineBase,
                        isCompleted && styles.progressLineCompleted
                    ]}/>
                    {isActive && (
                        <Animated.View
                            style={[
                                styles.progressLineFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [
                                            index / (steps.length - 1),
                                            (index + 1) / (steps.length - 1)
                                        ],
                                        outputRange: ['0%', '100%'],
                                        extrapolate: 'clamp'
                                    })
                                }
                            ]}
                        />
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.stepsRow}>
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <View style={styles.stepContainer}>
                            <StepDot
                                step={step}
                                index={index}
                                status={getStepStatus(index)}
                            />
                            <Text
                                style={[
                                    styles.stepLabel,
                                    styles[`stepLabel${getStepStatus(index).charAt(0).toUpperCase() + getStepStatus(index).slice(1)}`]
                                ]}
                                numberOfLines={1}
                            >
                                {step.title}
                            </Text>
                        </View>
                        {index < steps.length - 1 && (
                            <ProgressLine index={index}/>
                        )}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepContainer: {
        alignItems: 'center',
        zIndex: 2,
    },
    stepDotContainer: {
        paddingHorizontal: 1,
    },
    stepDot: {
        width: 40,
        height: 40,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 3,
    },
    stepDotCompleted: {
        backgroundColor: '#10b981',
    },
    stepDotActive: {
        backgroundColor: '#3b82f6',
    },
    stepDotInactive: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    stepLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
    },
    stepLabelCompleted: {
        color: '#10b981',
        fontWeight: '600',
    },
    stepLabelActive: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    stepLabelInactive: {
        color: '#9ca3af',
    },
    progressLineContainer: {
        position: 'absolute',
        left: 0,
        right: 5,
        top: 20,
        height: 2,
        zIndex: 1,

    },
    progressLineBackground: {
        flex: 1,
        flexDirection: 'row',
        height: '100%',
    },
    progressLineBase: {
        flex: 1,
        height: '100%',
        backgroundColor: '#e5e7eb',
    },
    progressLineCompleted: {
        backgroundColor: '#10b981',
    },
    progressLineFill: {
        position: 'absolute',
        height: '100%',
        backgroundColor: '#3b82f6',
    },
});

export default ProgressIndicator;