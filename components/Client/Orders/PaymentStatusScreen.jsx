// PaymentStatusScreen.js - Comprehensive payment status management
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    AppState,
    BackHandler,
    Pressable
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useOrderStore} from '../../../store/useOrderStore';
import {useSessionStore} from '../../../store/useSessionStore';
import useMediaStore from '../../../store/useMediaStore';
import ClientUtils from '../../../utils/ClientUtilities';
import CustomHeader from '../CustomHeader';

const PAYMENT_STATUS = {
    INITIALIZING: 'initializing',
    OPENING_BROWSER: 'opening_browser',
    WAITING_FOR_PAYMENT: 'waiting_for_payment',
    VERIFYING: 'verifying',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

const PaymentStatusScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    // Extract reference from URL params (deep link callback)
    const urlReference = params.reference || null;
    const urlOrderId = params.orderId || null;
    const urlStatus = params.status || null; // success/failed from deep link
    const urlReason = params.reason || null; // failure reason


    const {orderData, clearDraft} = useOrderStore();
    const {resetMedia} = useMediaStore();
    const userData = useSessionStore((state) => state.user);

    // State management
    const [paymentState, setPaymentState] = useState({
        status: urlStatus === 'success' ? PAYMENT_STATUS.VERIFYING :
            urlStatus === 'failed' ? PAYMENT_STATUS.FAILED :
                PAYMENT_STATUS.INITIALIZING,
        reference: urlReference || null,
        error: urlStatus === 'failed' ? decodeURIComponent(urlReason || 'Payment failed') : null,
        retryCount: 0,
        startTime: Date.now(),
        fromDeepLink: !!(urlReference || urlStatus)
    });

    // Refs for cleanup
    const verificationTimeoutRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);
    const linkingListenerRef = useRef(null);

    useEffect(() => {
        const handleDeepLink = (event) => {
            const url = event?.url || event;

            console.log({dy: 'Deep link received:', url, event});

            if (!url || typeof url !== 'string') {
                console.log('Invalid URL received:', url);
                return;
            }

            if (url.includes('payment-status')) {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const reference = urlParams.get('reference');
                const orderId = urlParams.get('orderId');
                const status = urlParams.get('status');
                const reason = urlParams.get('reason');

                if (reference) {
                    if (status === 'failed') {
                        setPaymentState(prev => ({
                            ...prev,
                            status: PAYMENT_STATUS.FAILED,
                            reference: reference,
                            error: reason ? decodeURIComponent(reason) : 'Payment failed',
                            fromDeepLink: true
                        }));
                    } else {
                        // Success or no status - verify the payment
                        setPaymentState(prev => ({
                            ...prev,
                            status: PAYMENT_STATUS.VERIFYING,
                            reference: reference,
                            fromDeepLink: true
                        }));
                        setTimeout(() => verifyPayment(), 1000);
                    }
                }
            }
        };

        // Listen for URL changes (deep links)
        linkingListenerRef.current = Linking.addEventListener('url', handleDeepLink);

        return () => {
            if (linkingListenerRef.current) {
                linkingListenerRef.current.remove();
            }
        };
    }, []);

    // Payment initialization mutation
    const paymentMutation = useMutation({
        mutationKey: ['InitializePayment'],
        mutationFn: ClientUtils.InitializePayment,
        retry: false,
    });

    // Payment verification mutation
    const verificationMutation = useMutation({
        mutationKey: ['CheckPaymentStatus'],
        mutationFn: ClientUtils.CheckPaymentStatus,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
    });

    // Initialize payment on component mount
    const initializePayment = useCallback(async () => {
        // If we have a reference from URL callback, skip to verification
        if (paymentState.reference && paymentState.fromDeepLink) {
            console.log('Payment reference from deep link, verifying...');
            setPaymentState(prev => ({...prev, status: PAYMENT_STATUS.VERIFYING}));
            setTimeout(() => verifyPayment(), 1000);
            return;
        }

        setPaymentState(prev => ({...prev, status: PAYMENT_STATUS.INITIALIZING}));

        try {
            if (!orderData?._id || !orderData?.pricing?.totalAmount || !userData?.email) {
                throw new Error('Invalid order data for payment');
            }

            const payload = {
                id: orderData._id,
                orderRef: orderData.orderRef,
                amount: orderData.pricing.totalAmount,
                currency: "NGN",
                email: userData.email,
                attemptId: Date.now().toString()
            };

            const response = await paymentMutation.mutateAsync(payload);

            if (!response?.authorizationUrl) {
                throw new Error('Invalid payment initialization response');
            }

            setPaymentState(prev => ({
                ...prev,
                status: PAYMENT_STATUS.OPENING_BROWSER,
                reference: response.reference
            }));

            // Open browser after short delay
            setTimeout(() => openPaymentBrowser(response.authorizationUrl), 1000);

        } catch (error) {
            console.log('Payment initialization failed:', error);
            handlePaymentError(error);
        }
    }, [orderData, userData, paymentState.reference, paymentState.fromDeepLink]);

    // Open payment browser
    const openPaymentBrowser = async (authUrl) => {
        try {
            setPaymentState(prev => ({...prev, status: PAYMENT_STATUS.WAITING_FOR_PAYMENT}));

            const result = await WebBrowser.openBrowserAsync(authUrl, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                showTitle: true,
                toolbarColor: '#3B82F6',
                controlsColor: '#ffffff',
            });

            console.log('Browser result:', result);

            // Handle browser close
            if (result.type === 'dismiss' || result.type === 'cancel') {
                console.log('Browser was closed/dismissed');
                setPaymentState(prev => ({...prev, status: PAYMENT_STATUS.VERIFYING}));

                // Wait a bit longer before verifying to allow for deep link processing
                setTimeout(() => {
                    // Only verify if we don't have a deep link callback
                    if (!paymentState.fromDeepLink) {
                        verifyPayment();
                    }
                }, 3000);
            }

        } catch (error) {
            console.log('Browser opening failed:', error);
            handlePaymentError(error);
        }
    };

    // Verify payment with retries
    const verifyPayment = useCallback(async (attemptCount = 1) => {
        const currentReference = paymentState.reference;

        if (!currentReference) {
            handlePaymentError(new Error('No payment reference available'));
            return;
        }

        console.log(`Verification attempt ${attemptCount}/5 for reference: ${currentReference}`);

        try {
            const verification = await verificationMutation.mutateAsync({
                reference: currentReference,
                orderId: orderData._id
            });

            console.log('Verification result:', verification);

            if (verification.status === 'paid') {
                handlePaymentSuccess(verification);
            } else if (verification.status === 'failed') {
                handlePaymentFailure(verification.message || 'Payment verification failed');
            } else if (attemptCount < 5) { // Increased retry count
                // Still pending/processing - retry with exponential backoff
                const delay = Math.min(2000 * Math.pow(1.5, attemptCount - 1), 15000);
                console.log(`Payment still processing, retrying in ${delay}ms...`);
                setTimeout(() => verifyPayment(attemptCount + 1), delay);
            } else {
                // Max attempts reached
                handlePaymentFailure('Payment verification timed out. Please check your order history or contact support.');
            }

        } catch (error) {
            console.log(`Verification attempt ${attemptCount} failed:`, error);

            if (attemptCount < 5) {
                const delay = 3000 * attemptCount;
                console.log(`Verification failed, retrying in ${delay}ms...`);
                setTimeout(() => verifyPayment(attemptCount + 1), delay);
            } else {
                handlePaymentFailure('Unable to verify payment. Please contact support if payment was deducted.');
            }
        }
    }, [paymentState.reference, orderData._id]);

    // Handle successful payment
    const handlePaymentSuccess = useCallback((verificationData) => {
        setPaymentState(prev => ({...prev, status: PAYMENT_STATUS.SUCCESS}));

        // Navigate to success page after 2 seconds
        setTimeout(() => {
            clearDraft();
            resetMedia();
            router.replace('/(protected)/client/orders');
        }, 3000);
    }, [clearDraft, resetMedia, router]);

    // Handle failed payment
    const handlePaymentFailure = useCallback((errorMessage) => {
        setPaymentState(prev => ({
            ...prev,
            status: PAYMENT_STATUS.FAILED,
            error: errorMessage,
            retryCount: prev.retryCount + 1
        }));
        setTimeout(() => {
            router.back(); // Go back one step to payment page
        }, 4000);
    }, [router]);

    // Handle payment errors
    const handlePaymentError = useCallback((error) => {
        setPaymentState(prev => ({
            ...prev,
            status: PAYMENT_STATUS.FAILED,
            error: error.message || 'An unexpected error occurred'
        }));
    }, []);

    // Retry payment
    const retryPayment = useCallback(() => {
        setPaymentState({
            status: PAYMENT_STATUS.INITIALIZING,
            reference: null,
            error: null,
            retryCount: paymentState.retryCount,
            startTime: Date.now()
        });
        setTimeout(initializePayment, 500);
    }, [paymentState.retryCount, initializePayment]);

    // Go back to payment step
    const goBackToPayment = useCallback(() => {
        router.back();
    }, [router]);

    // Handle app state changes
    const handleAppStateChange = useCallback((nextAppState) => {
        console.log('App state changed:', appStateRef.current, '->', nextAppState);

        if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
            // App came to foreground
            console.log('App returned to foreground, current status:', paymentState.status);

            if (paymentState.status === PAYMENT_STATUS.WAITING_FOR_PAYMENT && paymentState.reference) {
                // Only start verification if we haven't already started from deep link
                if (!paymentState.fromDeepLink) {
                    console.log('Starting verification after app foreground...');
                    setPaymentState(prev => ({...prev, status: PAYMENT_STATUS.VERIFYING}));
                    setTimeout(() => verifyPayment(), 2000);
                }
            }
        }
        appStateRef.current = nextAppState;
    }, [paymentState.status, paymentState.reference, paymentState.fromDeepLink, verifyPayment]);

    // Prevent back navigation during payment
    const handleBackPress = useCallback(() => {
        if ([PAYMENT_STATUS.INITIALIZING, PAYMENT_STATUS.OPENING_BROWSER, PAYMENT_STATUS.WAITING_FOR_PAYMENT, PAYMENT_STATUS.VERIFYING].includes(paymentState.status)) {
            return true; // Prevent back
        }
        return false; // Allow back
    }, [paymentState.status]);

    useEffect(() => {
        if (paymentState.fromDeepLink && paymentState.status === PAYMENT_STATUS.VERIFYING) {
            // Deep link callback, start verification
            verifyPayment();
        } else if (!paymentState.fromDeepLink && paymentState.status === PAYMENT_STATUS.INITIALIZING) {
            // Normal initialization
            initializePayment();
        }
    }, [paymentState.fromDeepLink]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [handleAppStateChange]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => backHandler.remove();
    }, [handleBackPress]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }
        };
    }, []);

    // Render status content
    const renderStatusContent = () => {
        switch (paymentState.status) {
            case PAYMENT_STATUS.INITIALIZING:
                return (
                    <View style={styles.statusContainer}>
                        <View style={styles.pulseContainer}>
                            <Ionicons name="card-outline" size={64} color="#3B82F6"/>
                        </View>
                        <Text style={styles.statusTitle}>Complete Your Payment</Text>
                        <Text style={styles.statusSubtitle}>
                            Please complete the payment in the opened browser.{'\n\n'}
                            After successful payment, the browser will redirect back to this app automatically.{'\n\n'}
                            If the redirect doesn't work, you can close the browser manually - we'll verify your payment
                            automatically.
                        </Text>

                        {/* Add a manual verification button */}
                        <Pressable
                            style={styles.manualVerifyButton}
                            onPress={() => {
                                setPaymentState(prev => ({...prev, status: PAYMENT_STATUS.VERIFYING}));
                                setTimeout(() => verifyPayment(), 500);
                            }}
                        >
                            <Text style={styles.manualVerifyText}>Check Payment Status</Text>
                        </Pressable>
                    </View>
                );

            case PAYMENT_STATUS.OPENING_BROWSER:
                return (
                    <View style={styles.statusContainer}>
                        <ActivityIndicator size="large" color="#3B82F6"/>
                        <Text style={styles.statusTitle}>Opening Payment Page</Text>
                        <Text style={styles.statusSubtitle}>
                            Redirecting to secure payment gateway...
                        </Text>
                    </View>
                );

            case PAYMENT_STATUS.WAITING_FOR_PAYMENT:
                return (
                    <View style={styles.statusContainer}>
                        <View style={styles.pulseContainer}>
                            <Ionicons name="card-outline" size={64} color="#3B82F6"/>
                        </View>
                        <Text style={styles.statusTitle}>Complete Your Payment</Text>
                        <Text style={styles.statusSubtitle}>
                            Please complete the payment in the opened browser.{'\n'}
                            The browser will redirect automatically when done.{'\n\n'}
                            You can also close the browser manually after payment completion.
                        </Text>
                    </View>
                );

            case PAYMENT_STATUS.VERIFYING:
                return (
                    <View style={styles.statusContainer}>
                        <ActivityIndicator size="large" color="#F59E0B"/>
                        <Text style={styles.statusTitle}>Verifying Payment</Text>
                        <Text style={styles.statusSubtitle}>
                            Please wait while we confirm your payment...{'\n'}
                            {paymentState.fromDeepLink ? 'Payment completed, verifying...' : 'This may take a few moments.'}
                        </Text>
                    </View>
                );

            case PAYMENT_STATUS.SUCCESS:
                return (
                    <View style={styles.statusContainer}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={80} color="#10B981"/>
                        </View>
                        <Text style={styles.successTitle}>Payment Successful!</Text>
                        <Text style={styles.statusSubtitle}>
                            Your order has been confirmed and is being processed.{'\n'}
                            Redirecting to order details...
                        </Text>
                        {/* Optional: Show countdown */}
                        <Text style={styles.countdownText}>Redirecting in 3 seconds...</Text>
                    </View>
                );

            case PAYMENT_STATUS.FAILED:
                return (
                    <View style={styles.statusContainer}>
                        <View style={styles.errorIcon}>
                            <Ionicons name="close-circle" size={80} color="#EF4444"/>
                        </View>
                        <Text style={styles.errorTitle}>Payment Failed</Text>
                        <Text style={styles.errorMessage}>
                            {paymentState.error || 'Payment could not be processed'}
                        </Text>

                        <View style={styles.actionButtons}>
                            {paymentState.retryCount < 3 && (
                                <Pressable style={styles.retryButton} onPress={retryPayment}>
                                    <LinearGradient colors={['#3B82F6', '#60A5FA']} style={styles.buttonGradient}>
                                        <Ionicons name="reload" size={20} color="white"/>
                                        <Text style={styles.buttonText}>Try Again</Text>
                                    </LinearGradient>
                                </Pressable>
                            )}

                            <Pressable style={styles.backButton} onPress={goBackToPayment}>
                                <Text style={styles.backButtonText}>Back to Payment</Text>
                            </Pressable>
                            <Text style={styles.autoRedirectText}>
                                Automatically returning to payment in 4 seconds...
                            </Text>
                        </View>
                    </View>
                );

            default:
                return null;
            // return renderOriginalStatusContent();
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Payment Status"
                showBack={![PAYMENT_STATUS.INITIALIZING, PAYMENT_STATUS.OPENING_BROWSER, PAYMENT_STATUS.WAITING_FOR_PAYMENT, PAYMENT_STATUS.VERIFYING].includes(paymentState.status)}
                onBackPress={goBackToPayment}
            />

            <View style={[styles.content, {paddingTop: insets.top}]}>
                {renderStatusContent()}
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    pulseContainer: {
        marginBottom: 24,
    },
    statusTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 12,
    },
    statusSubtitle: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    successIcon: {
        marginBottom: 8,
    },
    successTitle: {
        fontSize: 28,
        fontFamily: 'PoppinsBold',
        color: '#10B981',
        textAlign: 'center',
        marginBottom: 12,
    },
    errorIcon: {
        marginBottom: 8,
    },
    errorTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 12,
    },
    errorMessage: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    actionButtons: {
        width: '100%',
        alignItems: 'center',
    },
    retryButton: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: 'white',
        marginLeft: 8,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    backButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
    },
    manualVerifyButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
        backgroundColor: 'transparent'
    },
    manualVerifyText: {
        color: '#3B82F6',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        textAlign: 'center'
    },
    countdownText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 12,
        textAlign: 'center',
    },
    autoRedirectText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default PaymentStatusScreen;