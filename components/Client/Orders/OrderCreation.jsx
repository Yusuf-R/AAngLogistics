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
    AppState
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from "expo-router";
import {useMutation, useQuery} from "@tanstack/react-query";

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
import ClientUtils from "../../../utils/ClientUtilities";
import {useSessionStore} from "../../../store/useSessionStore";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
// Payment status constants
const PAYMENT_STATUS = {
    IDLE: 'idle',
    INITIATING: 'initiating',
    PROCESSING: 'processing',
    VERIFYING: 'verifying',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    PENDING: 'pending'
};
const VERIFICATION_TIMEOUT = 15 * 60 * 1000;

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
    const userData = useSessionStore((state) => state.user);

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
    const [paymentState, setPaymentState] = useState({
        status: PAYMENT_STATUS.IDLE,
        reference: null,
        attemptId: null,
        error: null,
        retryCount: 2
    });

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const paymentTimeoutRef = useRef(null);
    const verificationIntervalRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);

    // Enhanced mutations with proper error handling
    const paymentMutation = useMutation({
        mutationKey: ['InitializePayment'],
        mutationFn: ClientUtils.InitializePayment,
        retry: false, // We'll handle retries manuaqueryKeylly
    });

    const paymentVerificationMutation = useMutation({
        mutationKey: ['CheckPaymentStatus'],
        mutationFn: ClientUtils.CheckPaymentStatus,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    });

    // Polling query for payment status
    const {data: paymentStatusData, refetch: refetchPaymentStatus} = useQuery({
        queryKey: ['PaymentStatus', paymentState.reference],
        queryFn: () => ClientUtils.CheckPaymentStatus({
            reference: paymentState.reference,
            orderId: orderData._id
        }),
        // DISABLE polling when browser is open or verification is in progress
        enabled: paymentState.status === PAYMENT_STATUS.PROCESSING &&
            !!paymentState.reference &&
            !paymentState.browserClosed &&
            paymentState.status !== PAYMENT_STATUS.VERIFYING,
        refetchInterval: 3000,
        staleTime: 0,
    });

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

    const initializePayment = useCallback(async () => {
        // Prevent multiple simultaneous payment attempts
        if (paymentState.status !== PAYMENT_STATUS.IDLE) {
            console.log('Payment already in progress, ignoring duplicate request');
            return;
        }

        setPaymentState(prev => ({
            ...prev,
            status: PAYMENT_STATUS.INITIATING,
            error: null,
            attemptId: Date.now().toString()
        }));

        setIsLoading(true);

        try {
            // Final validation
            if (!orderData?._id || !orderData?.pricing?.totalAmount || !userData?.email) {
                throw new Error('Invalid order data for payment');
            }

            const payload = {
                id: orderData._id,
                orderRef: orderData.orderRef,
                amount: orderData.pricing.totalAmount,
                currency: "NGN",
                email: userData.email,
                attemptId: paymentState.attemptId // For idempotency
            };

            const response = await paymentMutation.mutateAsync(payload);

            if (!response?.authorizationUrl) {
                throw new Error('Invalid payment initialization response');
            }

            setPaymentState(prev => ({
                ...prev,
                status: PAYMENT_STATUS.PROCESSING,
                reference: response.reference
            }));

            startVerificationTimeout();


            // Open payment page
            await openPaymentBrowser(response.authorizationUrl);

        } catch (error) {
            console.log('Payment initialization failed:', error);
            handlePaymentError(error);
        } finally {
            setIsLoading(false);
        }
    }, [orderData, userData, paymentState.status, paymentState.attemptId, startVerificationTimeout]);

    const startVerificationTimeout = useCallback(() => {
        if (paymentTimeoutRef.current) {
            clearTimeout(paymentTimeoutRef.current);
        }

        paymentTimeoutRef.current = setTimeout(() => {
            console.log('Verification timeout reached');

            if (verificationIntervalRef.current) {
                clearInterval(verificationIntervalRef.current);
            }

            setPaymentState(prev => ({
                ...prev,
                status: PAYMENT_STATUS.PENDING
            }));

            showAlert(
                'warning',
                'Verification Timeout',
                'Payment verification has timed out. Your payment may still be processing. Please check your order history.',
            );
        }, VERIFICATION_TIMEOUT);
    }, [router]);

    const openPaymentBrowser = async (authUrl) => {
        try {
            const result = await WebBrowser.openBrowserAsync(authUrl, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                showTitle: true,
                toolbarColor: '#3B82F6',
                controlsColor: '#ffffff',
                browserPackage: undefined,
            });

            console.log({
                result,
                stage: 'browser closed',
            });

            // Set browser closed flag and wait before verification
            setPaymentState(prev => ({
                ...prev,
                browserClosed: true,
                closeTime: Date.now()
            }));

            showAlert(
                'info',
                'Verifying Payment',
                'Please wait while we confirm your payment status...'
            );

            // Wait 3 seconds before first verification attempt
            setTimeout(() => {
                verifyPaymentWithRetry();
            }, 3000);

        } catch (error) {
            console.log('Browser opening failed:', error);
            handlePaymentError(error);
        }
    };

    const verifyPaymentWithRetry = useCallback(async (attemptCount = 1, maxAttempts = 4) => {
        if (!paymentState.reference) {
            console.log('No payment reference found');
            return;
        }

        // Only set to VERIFYING on the first attempt or if not already verifying
        if (attemptCount === 1 || paymentState.status !== PAYMENT_STATUS.VERIFYING) {
            setPaymentState(prev => ({
                ...prev,
                status: PAYMENT_STATUS.VERIFYING,
                error: null,
            }));
        }

        console.log(`Verification attempt ${attemptCount}/${maxAttempts}`);

        try {
            const verification = await paymentVerificationMutation.mutateAsync({
                reference: paymentState.reference,
                orderId: orderData._id
            });

            if (verification.status === 'paid') {
                handlePaymentSuccess(verification);
            } else if (verification.status === 'failed') {
                handlePaymentFailure(verification.message || 'Payment verification failed');
            } else {
                // Payment still pending/processing
                if (attemptCount < maxAttempts) {
                    const delay = Math.min(3000 * attemptCount, 8000); // Progressive delay

                    showAlert(
                        'info',
                        'Verifying Payment...',
                        `Please wait while we confirm your payment (${attemptCount}/${maxAttempts})`,
                    );

                    setTimeout(() => {
                        verifyPaymentWithRetry(attemptCount + 1, maxAttempts);
                    }, delay);
                } else {
                    // Max attempts reached - show pending state
                    showAlert(
                        'warning',
                        'Payment Verification Delayed',
                        'Payment verification is taking longer than expected. We\'ll continue checking in the background.'
                    );

                    // Start background polling instead of user actions
                    startBackgroundPolling();
                }
            }
        } catch (error) {
            console.log(`Verification attempt ${attemptCount} failed:`, error);

            if (attemptCount < maxAttempts) {
                // Retry after delay
                const delay = 4000 * attemptCount;
                showAlert(
                    'info',
                    'Retrying...',
                    `Connection issue. Retrying in ${delay / 1000} seconds...`
                );
                setTimeout(() => {
                    verifyPaymentWithRetry(attemptCount + 1, maxAttempts);
                }, delay);
            } else {
                // Show error but don't immediately fail
                showAlert(
                    'error',
                    'Verification Error',
                    'Unable to verify payment right now, but we\'ll keep checking. Your payment may still be processing.'
                );

                // Start background polling as fallback
                startBackgroundPolling();

            }
        }
    }, [paymentState.reference, orderData._id]);

    // Helper function for scheduled retries
    const scheduleRetry = (attemptCount, maxAttempts, message) => {
        const delay = Math.min(2000 * attemptCount, 10000); // 2s, 4s, 6s, 8s, 10s, 10s...

        showAlert(
            'info',
            'Checking Payment...',
            `${message} (${attemptCount}/${maxAttempts})`
        );

        setTimeout(() => {
            verifyPaymentWithRetry(attemptCount + 1, maxAttempts);
        }, delay);
    };

    const startBackgroundPolling = useCallback(() => {
        if (verificationIntervalRef.current) {
            clearInterval(verificationIntervalRef.current);
        }

        let pollCount = 0;
        const maxPolls = 20; // Poll for 7.5 minutes (15 * 30s)

        // Set status to a background polling state
        setPaymentState(prev => ({
            ...prev,
            status: 'background_polling' // Add this new status if needed
        }));

        verificationIntervalRef.current = setInterval(async () => {
            pollCount++;
            console.log(`Background poll attempt ${pollCount}/${maxPolls}`);

            try {
                const verification = await paymentVerificationMutation.mutateAsync({
                    reference: paymentState.reference,
                    orderId: orderData._id
                });

                if (verification.status === 'paid') {
                    clearInterval(verificationIntervalRef.current);
                    handlePaymentSuccess(verification);
                } else if (verification.status === 'failed') {
                    clearInterval(verificationIntervalRef.current);
                    handlePaymentFailure(verification.message);
                } else if (pollCount >= maxPolls) {
                    // Stop polling after max attempts
                    clearInterval(verificationIntervalRef.current);
                    showAlert(
                        'info',
                        'Payment Status Unknown',
                        'We couldn\'t confirm your payment status. Please check your order history later.'
                    );
                }
            } catch (error) {
                console.log('Background poll failed:', error);
                if (pollCount >= maxPolls) {
                    clearInterval(verificationIntervalRef.current);
                }
            }
        }, 30000); // Poll every 30 seconds
    }, [paymentState.reference, orderData._id]);

    // Payment success handler
    const handlePaymentSuccess = useCallback((verificationData) => {
        setPaymentState(prev => ({
            ...prev,
            status: PAYMENT_STATUS.SUCCESS
        }));

        clearTimeouts();

        showAlert(
            'success',
            'Payment Successful! 🎉',
            'Your order has been confirmed and is being processed.',
        );

        // Clear draft and navigate to success page
        setTimeout(() => {
            clearDraft();
            resetMedia();
            router.replace(`/(protected)/client/orders/payment-success?orderId=${orderData._id}&ref=${paymentState.reference}`);
        }, 2000);

    }, [paymentState.reference, orderData._id, clearDraft, resetMedia, router]);

    // Payment failure handler
    const handlePaymentFailure = useCallback((errorMessage) => {
        setPaymentState(prev => ({
            ...prev,
            status: PAYMENT_STATUS.FAILED,
            error: errorMessage,
            retryCount: prev.retryCount + 1
        }));

        clearTimeouts();

        const canRetry = paymentState.retryCount < 3;

        showAlert(
            'error',
            'Payment Failed',
            errorMessage || 'Your payment could not be processed. Please try again.',
            canRetry ? [
                {
                    text: 'Try Again',
                    onPress: () => {
                        setPaymentState(prev => ({
                            ...prev,
                            status: PAYMENT_STATUS.IDLE,
                            error: null
                        }));
                        hideAlert();
                        setTimeout(() => initializePayment(), 500);
                    }
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: hideAlert
                }
            ] : []
        );
    }, [paymentState.retryCount, initializePayment]);

    // Payment timeout handler
    const handlePaymentTimeout = useCallback(async () => {
        if (paymentState.status === PAYMENT_STATUS.PROCESSING) {
            showAlert(
                'warning',
                'Payment Timeout',
                'Payment verification is taking longer than expected. We\'ll continue checking in the background.',
            );

            // Continue verification attempts
            await verifyPaymentWithRetry();
        }
    }, [paymentState.status, verifyPaymentWithRetry]);

    // Generic payment error handler
    const handlePaymentError = useCallback((error) => {
        console.log({
            error,
        })
        setPaymentState(prev => ({
            ...prev,
            status: PAYMENT_STATUS.FAILED,
            error: error.message || 'An unexpected error occurred'
        }));

        clearTimeouts();

        showAlert(
            'error',
            'Payment Error',
            error.message || 'An unexpected error occurred during payment. Please try again.',
        );
    }, []);

    // Cleanup function
    const clearTimeouts = useCallback(() => {
        if (paymentTimeoutRef.current) {
            clearTimeout(paymentTimeoutRef.current);
            paymentTimeoutRef.current = null;
        }
        if (verificationIntervalRef.current) {
            clearInterval(verificationIntervalRef.current);
            verificationIntervalRef.current = null;
        }
    }, []);

    // App state change handler
    const handleAppStateChange = useCallback((nextAppState) => {
        if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
            // App came to foreground - check payment status if processing
            if (paymentState.status === PAYMENT_STATUS.PROCESSING && paymentState.reference) {
                // If browser was closed recently, wait before verifying
                const timeSinceClose = Date.now() - (paymentState.closeTime || 0);
                const delay = timeSinceClose < 5000 ? 2000 : 1000;
                setTimeout(() => verifyPaymentWithRetry(1, 3), delay);
            }
        }
        appStateRef.current = nextAppState;
    }, [paymentState.status, paymentState.reference, paymentState.closeTime, verifyPaymentWithRetry]);

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
        // Prevent exit during payment processing
        if (paymentState.status === PAYMENT_STATUS.PROCESSING) {
            showAlert(
                'warning',
                'Payment in Progress',
                'Please wait for payment to complete before leaving this page.',
            );
            return;
        }
        setShowExitModal(true);
    }, [paymentState.status]);

    // Enhanced exit confirmation
    const confirmExit = useCallback(() => {
        clearTimeouts();
        clearDraft();
        resetMedia();
        setShowExitModal(false);
        router.back();
    }, [clearTimeouts, clearDraft, resetMedia, router]);

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
                        onSubmit={initializePayment}
                        paymentState={paymentState}
                        isProcessing={paymentState.status !== PAYMENT_STATUS.IDLE}
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

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [handleAppStateChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimeouts();
        };
    }, [clearTimeouts]);

    // Monitor payment status from polling
    useEffect(() => {
        if (paymentStatusData && paymentState.status === PAYMENT_STATUS.PROCESSING) {
            if (paymentStatusData.status === 'paid') {
                handlePaymentSuccess(paymentStatusData);
            } else if (paymentStatusData.status === 'failed') {
                handlePaymentFailure(paymentStatusData.message);
            }
        }
    }, [paymentStatusData, paymentState.status, handlePaymentSuccess, handlePaymentFailure]);

    const isPaymentStep = currentStep === 4;
    const showLoadingOverlay = isLoading || (isPaymentStep && paymentState.status === PAYMENT_STATUS.INITIATING);


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
                    onSubmit={initializePayment}
                    isSaving={isSaving}
                    disableForward={currentStep === ORDER_STEPS.length - 1}
                    disableSave={currentStep === ORDER_STEPS.length - 1}
                />
                {/* Loading Overlay */}
                {showLoadingOverlay && (
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