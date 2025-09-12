// PaymentStatusScreen.js - BULLETPROOF APPROACH
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    AppState,
    BackHandler,
    Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrderStore } from '../../../store/useOrderStore';
import { useSessionStore } from '../../../store/useSessionStore';
import useMediaStore from '../../../store/useMediaStore';
import ClientUtils from '../../../utils/ClientUtilities';
import CustomHeader from '../CustomHeader';

const STATES = {
    INITIALIZING: 'initializing',
    BROWSER_OPEN: 'browser_open',
    VERIFYING: 'verifying',
    SUCCESS: 'success',
    FAILED: 'failed'
};

const PaymentStatusScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { orderData, clearDraft } = useOrderStore();
    const { resetMedia } = useMediaStore();
    const userData = useSessionStore((state) => state.user);

    // SIMPLE STATE
    const [currentState, setCurrentState] = useState(STATES.INITIALIZING);
    const [paymentReference, setPaymentReference] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const appStateRef = useRef(AppState.currentState);
    const verificationTriggeredRef = useRef(false);
    const verificationTimeoutRef = useRef(null);

    // Payment initialization
    const paymentMutation = useMutation({
        mutationKey: ['InitializePayment'],
        mutationFn: ClientUtils.InitializePayment,
        retry: false,
    });

    // Payment verification
    const verificationMutation = useMutation({
        mutationKey: ['CheckPaymentStatus'],
        mutationFn: ClientUtils.CheckPaymentStatus,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
    });

    // CENTRALIZED VERIFICATION TRIGGER - Only ONE way to trigger verification
    const triggerVerification = useCallback(() => {
        if (verificationTriggeredRef.current || !paymentReference) {
            console.log('⚠️ Verification already triggered or no reference');
            return;
        }

        console.log('🔄 Triggering verification for:', paymentReference);
        verificationTriggeredRef.current = true;
        setCurrentState(STATES.VERIFYING);

        // Clear any existing timeout
        if (verificationTimeoutRef.current) {
            clearTimeout(verificationTimeoutRef.current);
        }

        // Start verification after small delay
        verificationTimeoutRef.current = setTimeout(() => {
            verifyPayment();
        }, 1000);

    }, [paymentReference]);

    // STEP 1: Initialize payment and open browser
    const startPayment = useCallback(async () => {
        try {
            console.log('🚀 Starting payment...');
            setCurrentState(STATES.INITIALIZING);
            verificationTriggeredRef.current = false;

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

            if (!response?.authorizationUrl || !response?.reference) {
                throw new Error('Invalid payment response');
            }

            console.log('💳 Payment initialized, reference:', response.reference);
            setPaymentReference(response.reference);

            // Set to browser open
            setCurrentState(STATES.BROWSER_OPEN);

            // Small delay to ensure state is set
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Open browser
            console.log('🌐 Opening browser...');
            const result = await WebBrowser.openBrowserAsync(response.authorizationUrl, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                showTitle: true,
                toolbarColor: '#3B82F6',
                controlsColor: '#ffffff',
            });

            console.log('🌐 Browser result:', result.type);

        } catch (error) {
            console.log('❌ Payment initialization failed:', error);
            setCurrentState(STATES.FAILED);
            setErrorMessage(error.message || 'Payment initialization failed');
        }
    }, [orderData, userData]);

    // STEP 2: Verify payment status
    const verifyPayment = useCallback(async () => {
        if (!paymentReference) {
            console.log('❌ No payment reference for verification');
            setCurrentState(STATES.FAILED);
            setErrorMessage('No payment reference available');
            return;
        }

        console.log('🔍 Verifying payment:', paymentReference);

        try {
            const result = await verificationMutation.mutateAsync({
                reference: paymentReference,
                orderId: orderData._id
            });

            console.log('✅ Verification result:', result.status);

            if (result.status === 'paid') {
                setCurrentState(STATES.SUCCESS);
                setTimeout(() => {
                    clearDraft();
                    resetMedia();
                    router.replace('/(protected)/client/orders');
                }, 3000);
            } else {
                setCurrentState(STATES.FAILED);
                setErrorMessage(result.message || 'Payment not successful');
                setTimeout(() => router.back(), 4000);
            }

        } catch (error) {
            console.log('❌ Verification failed:', error);
            setCurrentState(STATES.FAILED);
            setErrorMessage('Unable to verify payment status');
            setTimeout(() => router.back(), 4000);
        }
    }, [paymentReference, orderData._id, clearDraft, resetMedia, router]);

    // SINGLE RETURN HANDLER - Handles both deep link and app state change
    const handleReturnFromBrowser = useCallback(() => {
        console.log('📱 App returned from browser, current state:', currentState);

        if (currentState === STATES.BROWSER_OPEN && paymentReference && !verificationTriggeredRef.current) {
            console.log('🔄 App returned, triggering verification...');
            triggerVerification();
        }
    }, [currentState, paymentReference, triggerVerification]);

    // Handle deep links - Just trigger the return handler
    useEffect(() => {
        const handleDeepLink = (event) => {
            const url = event?.url || event;
            console.log('🔗 Deep link received:', url);

            if (url && url.includes('payment-status')) {
                console.log('🔄 Deep link: triggering return handler');
                // Use setTimeout to ensure this runs after state updates
                setTimeout(() => handleReturnFromBrowser(), 100);
            }
        };

        const listener = Linking.addEventListener('url', handleDeepLink);
        return () => listener?.remove();
    }, [handleReturnFromBrowser]);

    // Handle app state changes - Just trigger the return handler
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('📱 App came to foreground');
                // Use setTimeout to ensure this runs after state updates
                setTimeout(() => handleReturnFromBrowser(), 100);
            }
            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [handleReturnFromBrowser]);

    // Retry payment
    const retryPayment = useCallback(() => {
        setCurrentState(STATES.INITIALIZING);
        setPaymentReference(null);
        setErrorMessage(null);
        verificationTriggeredRef.current = false;
        if (verificationTimeoutRef.current) {
            clearTimeout(verificationTimeoutRef.current);
        }
        setTimeout(() => startPayment(), 500);
    }, [startPayment]);

    // Manual verify
    const manualVerify = useCallback(() => {
        if (currentState === STATES.BROWSER_OPEN && paymentReference && !verificationTriggeredRef.current) {
            console.log('🔄 Manual verification triggered');
            triggerVerification();
        }
    }, [currentState, paymentReference, triggerVerification]);

    // Setup effects
    useEffect(() => {
        startPayment();
    }, []);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            return [STATES.INITIALIZING, STATES.BROWSER_OPEN, STATES.VERIFYING].includes(currentState);
        });
        return () => backHandler.remove();
    }, [currentState]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }
        };
    }, []);

    // RENDER STATES
    const renderContent = () => {
        switch (currentState) {
            case STATES.INITIALIZING:
                return (
                    <View style={styles.container}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.title}>Initializing Payment</Text>
                        <Text style={styles.subtitle}>Setting up secure payment...</Text>
                    </View>
                );

            case STATES.BROWSER_OPEN:
                return (
                    <View style={styles.container}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.title}>Opening Payment Gateway</Text>
                        <Text style={styles.subtitle}>
                            Return to this app when done - we'll automatically verify your payment.
                        </Text>
                        <Pressable style={styles.verifyButton} onPress={manualVerify}>
                            <Text style={styles.verifyButtonText}>Check Payment Status</Text>
                        </Pressable>
                    </View>
                );

            case STATES.VERIFYING:
                return (
                    <View style={styles.container}>
                        <ActivityIndicator size="large" color="#F59E0B" />
                        <Text style={styles.title}>Verifying Payment</Text>
                        <Text style={styles.subtitle}>Please wait while we confirm your payment...</Text>
                    </View>
                );

            case STATES.SUCCESS:
                return (
                    <View style={styles.container}>
                        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                        <Text style={styles.successTitle}>Payment Successful!</Text>
                        <Text style={styles.subtitle}>Redirecting to your orders...</Text>
                    </View>
                );

            case STATES.FAILED:
                return (
                    <View style={styles.container}>
                        <Ionicons name="close-circle" size={80} color="#EF4444" />
                        <Text style={styles.errorTitle}>Payment Failed</Text>
                        <Text style={styles.errorMessage}>{errorMessage}</Text>

                        <Pressable style={styles.retryButton} onPress={retryPayment}>
                            <LinearGradient colors={['#3B82F6', '#60A5FA']} style={styles.gradient}>
                                <Text style={styles.retryText}>Try Again</Text>
                            </LinearGradient>
                        </Pressable>

                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                            <Text style={styles.backText}>Back to Payment</Text>
                        </Pressable>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.screen}>
            <CustomHeader
                title="Payment Status"
                showBack={currentState === STATES.SUCCESS || currentState === STATES.FAILED}
                onBackPress={() => router.back()}
            />
            <View style={[styles.content, { paddingTop: insets.top }]}>
                {renderContent()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    container: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    title: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    successTitle: {
        fontSize: 28,
        fontFamily: 'PoppinsBold',
        color: '#10B981',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 12,
    },
    errorTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 16,
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
    verifyButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    verifyButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 24,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
    },
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    retryText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: 'white',
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    backText: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default PaymentStatusScreen;