// OrderCreationFlow.js - Enhanced Main orchestrator component
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from "expo-router";

// Import utilities
import {ORDER_STEPS} from '../../../utils/Constant'

// Import components
import ProgressIndicator from './ProgressIndicator';
import FloatingActionPanel from './FloatingActionPanel';
import CustomHeader from "../CustomHeader";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Review from "./Review";
import Payment from "./Payment";
import CustomAlert from "./CustomAlert";
import {useOrderStore} from "../../../store/useOrderStore";
import useMediaStore from "../../../store/useMediaStore";
import ExitOrderModal from "./ExitOrderModal";


const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

function OrderCreationFlow() {
    const {
        orderData,
        currentStep,
        updateOrderData,
        saveDraft,
        goNext,
        goPrevious,
        clearDraft
    } = useOrderStore();
    const {resetMedia} = useMediaStore();

    // Core state management
    const [isLoading, setIsLoading] = useState(false);
    const [hasErrors, setHasErrors] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'error',
        title: '',
        message: '',
    });


    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Step refs for validation access
    const stepRefs = useRef(Array(ORDER_STEPS.length).fill(null).map(() => React.createRef()));

    const validateCurrentStep = async () => {
        const ref = stepRefs.current[currentStep];
        if (!ref || !ref.submit) return {valid: false, data: null};

        const result = await ref.submit();

        if (result.valid) {
            const updated = {
                ...orderData,
                ...result.data,
                metadata: {
                    ...orderData.metadata,
                    draftProgress: {
                        step: currentStep,
                        lastSaved: new Date().toISOString(),
                        completedSteps: [...new Set([...(orderData.metadata?.draftProgress?.completedSteps || []), currentStep])]
                    }
                }
            };
            console.log({
                updated,
            })
            updateOrderData(updated);
        }

        return result;
    };

    const showAlert = (type, title, message, showRetry = false) => {
        setAlertConfig({type, title, message});
        setAlertVisible(true);
    };

    const hideAlert = () => {
        setAlertVisible(false);
    };

    const proceedToNextStep = useCallback(async () => {
        setIsSaving(true);
        setApiError(null);
        try {
            const result = await validateCurrentStep();
            if (!result.valid) {
                setHasErrors(true);
                setIsSaving(false);
                showAlert('error', 'Validation Error', 'Please check your inputs and try again.');
                return {valid: false};
            }
            setHasErrors(false);
            await goNext();

        } catch (error) {
            setIsSaving(false);
            console.log('❌ Next step error :', error);
            showAlert(
                'error',
                'Unexpected Error',
                'An unexpected error occurred. Please try again.',
            );
            return {valid: false, error: error.message};
        } finally {
            setIsSaving(false);
        }

    }, [currentStep, orderData]);

    const handleBackPress = () => {
        setShowExitModal(true);
    };

    const confirmExit = () => {
        clearDraft();
        resetMedia();
        setShowExitModal(false);
        router.back();
    };

    const saveCurrentProgress = useCallback(async () => {
        setIsSaving(true);
        try {
            const result = await validateCurrentStep();

            if (!result.valid) {
                setHasErrors(true);
                showAlert('error', 'Validation Error', 'Please check your inputs and try again.');
                return result;
            }

            await saveDraft();
            setHasErrors(false);
            showAlert(
                'success',
                'Progress Saved',
                'Your progress has been saved successfully.',
            );
            return {valid: true};
        } catch (error) {
            console.log('❌ Save failed:', error);
            showAlert(
                'error',
                'Unexpected Error',
                'An unexpected error occurred. Please try again.',
            );
            return {valid: false};
        } finally {
            setIsSaving(false);
        }
    }, [currentStep, orderData]);

    const submitOrder = useCallback(async () => {
        if (currentStep !== ORDER_STEPS.length - 1) {
            Alert.alert('Error', 'Please complete all steps before submitting the order.');
            return;
        }

        setIsLoading(true);
        setHasErrors(false);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
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
            case 1:
                return <Step2 {...stepProps} />;
            case 2:
                return <Step3 {...stepProps} />;
            case 3:
                return <Review {...stepProps} />;
            case 4:
                return <Payment {...stepProps} />;
            default:
                return null; // Handle additional steps as needed
        }
    };
    useEffect(() => {
        const {images, video} = orderData?.package || {};
        useMediaStore.getState().setImages(images || []);
        useMediaStore.getState().setVideo(video || null);
    }, []);

    return (
        <>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" translucent/>

                {/* Header */}
                <CustomHeader
                    title="Create Order"
                    onBackPress={handleBackPress}
                />

                {/* Alert */}
                {alertVisible && (
                    <CustomAlert
                        visible={alertVisible}
                        type={alertConfig.type}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        onClose={hideAlert}
                    />
                )}

                {/* Progress Header */}
                <LinearGradient colors={["#FFF", "#FFF"]} style={styles.header}>
                    <ProgressIndicator steps={ORDER_STEPS} currentStep={currentStep}/>
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
                    onNext={proceedToNextStep}
                    onPrevious={goPrevious}
                    onSave={saveCurrentProgress}
                    totalSteps={ORDER_STEPS.length}
                    currentStep={currentStep}
                    hasErrors={hasErrors}
                    onSubmit={submitOrder}
                    isSaving={isSaving}
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
            <ExitOrderModal
                visible={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirm={confirmExit}
            />
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
        shadowOffset: {width: 0, height: 4},
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