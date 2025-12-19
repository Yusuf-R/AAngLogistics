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
    View,
    AppState,
    Pressable,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from "expo-router";
import {MaterialCommunityIcons} from '@expo/vector-icons';

// Import utilities
import {ORDER_STEPS} from '../../../utils/Constant'

// Import components
import ProgressIndicator from './ProgressIndicator';
import FloatingActionPanel from './FloatingActionPanel';
import CustomHeader from "../../CustomHeader";
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

// Payment status constants

function OrderCreationFlow() {
    const {
        orderData,
        currentStep,
        updateOrderData,
        saveDraft,
        isResumeMode,
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
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'error',
        title: '',
        message: '',
    });
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handlePaymentNavigation = useCallback(async (paymentMethod) => {
        try {
            const walletBalance = orderData?.metadata?.walletBalance || 0;
            const totalAmount = orderData?.pricing?.totalAmount || 0;

            // Determine payment routing based on method
            if (paymentMethod === 'wallet_only') {
                // This is handled directly in Payment.jsx
                // Should never reach here, but just in case
                console.log('Wallet-only payment should be handled in Payment.jsx');
                return;
            }

            if (paymentMethod === 'wallet_card') {
                // HYBRID PAYMENT - Use wallet + card
                const walletAmount = Math.min(walletBalance, totalAmount);
                const cardAmount = totalAmount - walletAmount;

                console.log('🔄 Initiating hybrid payment:', {
                    total: totalAmount,
                    wallet: walletAmount,
                    card: cardAmount
                });

                // Navigate to payment status with hybrid flag
                router.push({
                    pathname: '/(protected)/client/orders/payment-status',
                    params: {
                        orderId: orderData._id,
                        orderRef: orderData.orderRef,
                        amount: totalAmount,
                        paymentType: 'hybrid',
                        walletAmount: walletAmount,
                        cardAmount: cardAmount
                    }
                });
            } else {
                // CARD-ONLY PAYMENT (existing flow)
                router.push({
                    pathname: '/(protected)/client/orders/payment-status',
                    params: {
                        orderId: orderData._id,
                        orderRef: orderData.orderRef,
                        amount: totalAmount,
                        paymentType: 'card'
                    }
                });
            }
        } catch (error) {
            console.log('Navigation error:', error);
            showAlert('error', 'Error', 'Unable to proceed to payment. Please try again.');
        }
    }, [orderData, router]);


    // Step refs for validation access
    const stepRefs = useRef(Array(ORDER_STEPS.length).fill(null).map(() => React.createRef()));

    // Enhanced validation function
    const validateCurrentStep = async () => {
        const ref = stepRefs.current[currentStep];
        if (!ref || !ref.submit) return {valid: false, data: null};

        try {
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
                updateOrderData(updated);
            }

            return result;
        } catch (error) {
            console.log('Step validation error:', error);
            return {valid: false, error: error.message};
        }
    };

    // Enhanced alert system
    const showAlert = useCallback((type, title, message, actions = []) => {
        setAlertConfig({type, title, message, actions});
        setAlertVisible(true);

        // Auto-dismiss success alerts
        if (type === 'success') {
            setTimeout(() => setAlertVisible(false), 3000);
        }
    }, []);

    const hideAlert = useCallback(() => {
        setAlertVisible(false);
    }, []);

    const proceedToNextStep = useCallback(async () => {
        setIsSaving(true);
        setApiError(null);
        try {
            const result = await validateCurrentStep();
            if (!result.valid) {
                setHasErrors(true);
                showAlert('error', 'Validation Error', 'Please check your inputs and try again.');
                return {valid: false};
            }
            setHasErrors(false);
            await goNext();

        } catch (error) {
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

    }, [currentStep, orderData, goNext]);

    // Back press handler
    const handleBackPress = useCallback(() => {
        setShowExitModal(true);
    }, [setShowExitModal]);

    // Enhanced exit confirmation
    const confirmExit = useCallback(() => {
        if (isResumeMode) {
            router.back();
        } else {
            clearDraft();
            resetMedia();
            setShowExitModal(false);
            router.back();
        }
    }, [clearDraft, resetMedia, router]);

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
    }, [currentStep, orderData, saveDraft]);

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
                return (
                    <Payment
                        {...stepProps}
                        onSubmit={handlePaymentNavigation}
                        isProcessing={isLoading}
                    />
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        const {images, video} = orderData?.package || {};
        useMediaStore.getState().setImages(images || []);
        useMediaStore.getState().setVideo(video || null);
    }, []);

    const headerTitle = isResumeMode ? "Resume Order" : "New Order";

    return (
        <>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" translucent/>

                <View style={styles.headerTitleContainer}>
                    <View style={styles.headerIconBox}>
                        <Pressable onPress={handleBackPress}>
                            <MaterialCommunityIcons name="arrow-left-bold-circle" size={24} color="#fff"/>
                        </Pressable>
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>{headerTitle}</Text>
                        {/*{isResumeMode && (*/}
                        {/*    <Text style={styles.headerSubtitle}>*/}
                        {/*        Ref: {orderData?.orderRef}*/}
                        {/*    </Text>*/}
                        {/*)}*/}
                    </View>
                </View>

                {/* Header */}
                {/*<CustomHeader*/}
                {/*    title="Create Order"*/}
                {/*    onBackPress={handleBackPress}*/}
                {/*/>*/}

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
                    onSubmit={handlePaymentNavigation}
                    isSaving={isSaving}
                    disableForward={currentStep === ORDER_STEPS.length - 1}
                    disableSave={currentStep === ORDER_STEPS.length - 1}
                />
                {/* Loading Overlay */}
                {isLoading && (
                    <BlurView intensity={20} style={styles.loadingOverlay}>
                        <View style={styles.loadingContent}>
                            <Animated.View style={styles.loadingSpinner}/>
                            <Text style={styles.loadingText}>
                                {paymentState.status === PAYMENT_STATUS.INITIATING
                                    ? 'Initializing payment...'
                                    : 'Processing...'
                                }
                            </Text>
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
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFF',
    },
    headerIconBox: {
        width: 35,
        height: 35,
        borderRadius: 10,
        padding: 5,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    headerTextContainer: {
        flex: 1,
    },


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