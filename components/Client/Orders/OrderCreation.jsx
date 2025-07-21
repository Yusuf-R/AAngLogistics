// OrderCreationFlow.js - Enhanced Main orchestrator component
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";

// Import utilities
import {
    ORDER_STEPS
} from '../../../utils/Constant'

// Import components
import ProgressIndicator from './ProgressIndicator';
import FloatingActionPanel from './FloatingActionPanel';
import CustomHeader from "../CustomHeader";
import Step1 from "./Step1";


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function OrderCreationFlow({userData}) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [orderData, setOrderData] = useState({
        // Basic order info
        orderType: 'instant',
        priority: 'normal',
        scheduledPickup: null,

        // Package details
        package: {
            category: '',
            subcategory: '',
            dimensions: { length: '', width: '', height: '', unit: 'cm' },
            weight: { value: '', unit: 'kg' },
            value: '',
            isFragile: false,
            requiresSpecialHandling: false,
            description: '',
            specialInstructions: '',
            images: [],
        },

        // Location details
        pickup: {
            address: '',
            coordinates: { lat: null, lng: null },
            contactPerson: { name: '', phone: '', alternatePhone: '' },
            instructions: '',
            locationType: 'residential',
            building: { name: '', floor: '', unit: '' },
            landmark: ''
        },

        dropoff: {
            address: '',
            coordinates: { lat: null, lng: null },
            contactPerson: { name: '', phone: '', alternatePhone: '' },
            instructions: '',
            locationType: 'residential',
            building: { name: '', floor: '', unit: '' },
            landmark: ''
        },

        // Vehicle and scheduling
        vehicleRequirements: ['bicycle', 'motorcycle'],
        deliveryWindow: { start: null, end: null },

        // Payment and special requirements
        payment: { method: 'wallet', status: 'pending' },
        specialRequirements: [],

        // Metadata
        metadata: {
            channel: 'mobile',
            createdBy: 'client'
        }
    });

    // Step refs for validation access
    const stepRefs = useRef(Array(ORDER_STEPS.length).fill(null).map(() => React.createRef()));
    // Core state management
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasErrors, setHasErrors] = useState(false);

    const goToNextStep = useCallback(async () => {
        if (currentStep >= ORDER_STEPS.length - 1) {
            Alert.alert('Error', 'You are already at the last step.');
            return;
        }

        const currentStepRef = stepRefs.current[currentStep];
        if (!currentStepRef || !currentStepRef.submit) {
            Alert.alert('Error', 'This step is not properly connected.');
            return;
        }

        const result = await currentStepRef.submit();

        if (!result.valid) {
            setHasErrors(true);
            // Optionally trigger haptics or alert
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Merge the returned data into orderData
        setOrderData(prev => ({
            ...prev,
            ...result.data
        }));

        setHasErrors(false);

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentStep(prev => prev + 1);
    }, [currentStep]);

    const goToPreviousStep = useCallback(async () => {
        if (currentStep <= 0) {
            Alert.alert('Error', 'You are already at the first step.');
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentStep(prev => prev - 1);
    }, [currentStep]);

    const submitOrder = useCallback(async () => {
        if (currentStep !== ORDER_STEPS.length - 1) {
            Alert.alert('Error', 'Please complete all steps before submitting the order.');
            return;
        }

        setIsLoading(true);
        setHasErrors(false);

        try {
            // Simulate order submission
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Navigate to confirmation screen
            router.push('/client/orders/confirmation');
        } catch (error) {
            console.error('❌ Order submission failed:', error);
            setHasErrors(true);
            Alert.alert('Error', 'Failed to submit order. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [currentStep, orderData, router]);

    const renderStep = () => {
        const stepProps = {
            ref: (el) => {
                stepRefs.current[currentStep] = el
            },
            defaultValues: orderData,
        };

        switch (currentStep) {
            case 0:
                return <Step1 {...stepProps} />;
            default:
                return null;
        }
    };

    return (
        <>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" translucent/>

                {/* Header */}
                <CustomHeader
                    title="Create Order"
                    onBackPress={() => router.back()}
                />

                {/* Progress Header */}
                <LinearGradient
                    colors={['#FFF', '#FFF']}
                    style={styles.header}
                >
                    <ProgressIndicator
                        steps={ORDER_STEPS}
                        currentStep={currentStep}
                    />
                </LinearGradient>

                {/* Main Content */}
                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === 'ios' ? 'padding' : null}
                    keyboardVerticalOffset={insets.top + 100}
                >
                        {renderStep()}
                </KeyboardAvoidingView>

                {/* Floating Actions */}
                <FloatingActionPanel
                    onNext={goToNextStep}
                    onPrevious={goToPreviousStep}
                    totalSteps={ORDER_STEPS.length}
                    currentStep={currentStep}
                    hasErrors={hasErrors}
                    onSubmit={submitOrder}
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <BlurView intensity={20} style={styles.loadingOverlay}>
                        <View style={styles.loadingContent}>
                            <Animated.View style={styles.loadingSpinner}/>
                            <Text style={styles.loadingText}>Processing...</Text>
                        </View>
                    </BlurView>
                )}
            </View>

        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    content: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    stepContainer: {
        flex: 1,
        width: SCREEN_WIDTH,
        paddingHorizontal: 20,
        paddingTop: 20
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
    },
    loadingContent: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    loadingSpinner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#E5E7EB',
        borderTopColor: '#3B82F6',
        marginBottom: 12
    },
    loadingText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500'
    }
});

export default OrderCreationFlow;