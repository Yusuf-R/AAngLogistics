// PaymentStatusScreen.js - Enhanced with state reset and duplicate payment protection
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
import CustomHeader from '../../CustomHeader';
import SessionManager from "../../../lib/SessionManager";

import ClientUtilities from "../../../utils/ClientUtilities";
import {queryClient} from "../../../lib/queryClient";

const STATES = {
    CHECKING_EXISTING: 'checking_existing',
    ALREADY_PAID: 'already_paid',
    INITIALIZING: 'initializing',
    BROWSER_OPEN: 'browser_open',
    VERIFYING: 'verifying',
    COOLDOWN_WAITING: 'cooldown_waiting',
    SUCCESS: 'success',
    FAILED: 'failed'
};

const PaymentStatusScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { orderData, clearDraft } = useOrderStore();
    const { resetMedia } = useMediaStore();
    const userData = useSessionStore((state) => state.user);

    // RESET ALL STATE TO DEFAULTS
    const resetAllState = useCallback(() => {
        setCurrentState(STATES.CHECKING_EXISTING);
        setPaymentReference(null);
        setErrorMessage(null);
        setSuccessCountdown(3);
        setShowManualCheck(false);

        // Reset refs
        verificationTriggeredRef.current = false;

        // Clear all timers
        if (verificationTimeoutRef.current) {
            clearTimeout(verificationTimeoutRef.current);
            verificationTimeoutRef.current = null;
        }
        if (manualCheckTimeoutRef.current) {
            clearTimeout(manualCheckTimeoutRef.current);
            manualCheckTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    // STATE MANAGEMENT
    const [currentState, setCurrentState] = useState(STATES.CHECKING_EXISTING);
    const [paymentReference, setPaymentReference] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successCountdown, setSuccessCountdown] = useState(3);
    const [showManualCheck, setShowManualCheck] = useState(false);

    const appStateRef = useRef(AppState.currentState);
    const verificationTriggeredRef = useRef(false);
    const verificationTimeoutRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const manualCheckTimeoutRef = useRef(null);

    // Add new state for cooldown
    const [cooldownTime, setCooldownTime] = useState(0);
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const cooldownIntervalRef = useRef(null);

    // Check existing payment status
    const existingPaymentMutation = useMutation({
        mutationKey: ['CheckExistingPayment'],
        mutationFn: ClientUtils.CheckPaymentStatus,
        retry: 1,
    });

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

    // STEP 0: Check if payment already exists
    const checkExistingPayment = useCallback(async () => {
        if (!orderData?._id) {
            setCurrentState(STATES.INITIALIZING);
            return;
        }

        try {
            console.log('🔍 Checking existing payment for order:', orderData.orderRef);
            setCurrentState(STATES.CHECKING_EXISTING);

            const result = await existingPaymentMutation.mutateAsync({
                orderId: orderData._id,
                reference: orderData.orderRef
            });

            if (result.status === 'paid') {
                console.log('✅ Payment already exists for this order');
                setCurrentState(STATES.ALREADY_PAID);
                return;
            }

            // No existing payment found, proceed to initialize
            console.log('💳 No existing payment found, proceeding to initialize');
            setCurrentState(STATES.INITIALIZING);
            setTimeout(() => startPayment(), 500);

        } catch (error) {
            console.log('🔍 No existing payment found or error checking:', error.message);
            // If checking fails, assume no payment exists and proceed
            setCurrentState(STATES.INITIALIZING);
            setTimeout(() => startPayment(), 500);
        }
    }, [orderData]);

    // CENTRALIZED VERIFICATION TRIGGER
    const triggerVerification = useCallback(() => {
        if (verificationTriggeredRef.current || !paymentReference) {
            console.log('⚠️ Verification already triggered or no reference');
            return;
        }

        console.log('🔄 Triggering verification for:', paymentReference);
        verificationTriggeredRef.current = true;
        setCurrentState(STATES.VERIFYING);

        if (verificationTimeoutRef.current) {
            clearTimeout(verificationTimeoutRef.current);
        }

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
            setCurrentState(STATES.BROWSER_OPEN);

            manualCheckTimeoutRef.current = setTimeout(() => {
                setShowManualCheck(true);
            }, 30000);

            await new Promise(resolve => setTimeout(resolve, 2000));

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
            if (error.code === 409) {
                console.log('⏰ Payment on cooldown, waiting:', error.timeToWait, 'seconds');
                startCooldownTimer(error.timeToWait || 30);
                return;
            }

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
                await queryClient.invalidateQueries({ queryKey: ["GetAllClientOrder"] })
                setCurrentState(STATES.SUCCESS);
                startSuccessCountdown();
            } else {
                setCurrentState(STATES.FAILED);
                setErrorMessage(result.message || 'Payment not successful');
            }

        } catch (error) {
            console.log('❌ Verification failed:', error);
            setCurrentState(STATES.FAILED);
            setErrorMessage('Unable to verify payment status');
        }
    }, [paymentReference, orderData._id]);

    // SUCCESS COUNTDOWN - Only for success state
    const startSuccessCountdown = useCallback(() => {
        setSuccessCountdown(3);
        countdownIntervalRef.current = setInterval(() => {
            setSuccessCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    setTimeout(() => {
                        clearDraft();
                        resetMedia();
                        router.replace('/(protected)/client/orders');
                    }, 0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearDraft, resetMedia, router]);

    // Stop countdown
    const stopCountdown = useCallback(() => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    // Start cooldown timer
    const startCooldownTimer = useCallback((seconds) => {
        setCooldownTime(seconds);
        setIsOnCooldown(true);
        setCurrentState(STATES.COOLDOWN_WAITING);

        cooldownIntervalRef.current = setInterval(() => {
            setCooldownTime((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownIntervalRef.current);
                    cooldownIntervalRef.current = null;
                    setIsOnCooldown(false);
                    setCurrentState(STATES.INITIALIZING);
                    // Auto retry after cooldown
                    setTimeout(() => startPayment(), 500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // Safe navigation function
    const safeGoBack = useCallback(() => {
        try {
            if (router.canGoBack?.() !== false) {
                router.back();
            } else {
                // Fallback navigation if we can't go back
                router.replace('/(protected)/client/create');
            }
        } catch (error) {
            console.log('Navigation error:', error);
            // Ultimate fallback
            router.replace('/(protected)/client/create');
        }
    }, [router]);

    // Handle return from browser
    const handleReturnFromBrowser = useCallback(() => {
        console.log('📱 App returned from browser, current state:', currentState);

        if (currentState === STATES.BROWSER_OPEN && paymentReference && !verificationTriggeredRef.current) {
            console.log('🔄 App returned, triggering verification...');
            if (manualCheckTimeoutRef.current) {
                clearTimeout(manualCheckTimeoutRef.current);
                setShowManualCheck(false);
            }
            triggerVerification();
        }
    }, [currentState, paymentReference, triggerVerification]);

    // Retry payment - COMPLETE RESET
    const retryPayment = useCallback(() => {
        console.log('🔄 Retrying payment - full reset');
        stopCountdown();
        resetAllState();

        // Start fresh after short delay
        setTimeout(() => {
            checkExistingPayment();
        }, 500);
    }, [stopCountdown, resetAllState, checkExistingPayment]);

    // Manual verify
    const manualVerify = useCallback(() => {
        if (currentState === STATES.BROWSER_OPEN && paymentReference && !verificationTriggeredRef.current) {
            console.log('🔄 Manual verification triggered');
            if (manualCheckTimeoutRef.current) {
                clearTimeout(manualCheckTimeoutRef.current);
                setShowManualCheck(false);
            }
            triggerVerification();
        }
    }, [currentState, paymentReference, triggerVerification]);

    // Go to orders (for already paid scenario)
    const goToOrders = useCallback(() => {
        clearDraft();
        resetMedia();
        router.replace('/(protected)/client/orders');
    }, [clearDraft, resetMedia, router]);

    // Handle deep links
    useEffect(() => {
        const handleDeepLink = (event) => {
            const url = event?.url || event;
            console.log('🔗 Deep link received:', url);

            if (url && url.includes('payment-status')) {
                console.log('🔄 Deep link: triggering return handler');
                setTimeout(() => handleReturnFromBrowser(), 100);
            }
        };

        const listener = Linking.addEventListener('url', handleDeepLink);
        return () => listener?.remove();
    }, [handleReturnFromBrowser]);

    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('📱 App came to foreground');
                setTimeout(() => handleReturnFromBrowser(), 100);
            }
            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [handleReturnFromBrowser]);

    // Initial setup - Start with existing payment check
    useEffect(() => {
        checkExistingPayment();
    }, [checkExistingPayment]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            return [STATES.CHECKING_EXISTING, STATES.INITIALIZING, STATES.BROWSER_OPEN, STATES.VERIFYING].includes(currentState);
        });
        return () => backHandler.remove();
    }, [currentState]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }
            if (manualCheckTimeoutRef.current) {
                clearTimeout(manualCheckTimeoutRef.current);
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, []);

    // RENDER STATES
    const renderContent = () => {
        switch (currentState) {
            case STATES.CHECKING_EXISTING:
                return (
                    <View style={styles.container}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.title}>Checking Payment Status</Text>
                        <Text style={styles.subtitle}>Verifying if payment already exists...</Text>
                    </View>
                );

            case STATES.ALREADY_PAID:
                return (
                    <View style={styles.container}>
                        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                        <Text style={styles.successTitle}>Payment Already Completed!</Text>
                        <Text style={styles.subtitle}>
                            This order (#{orderData?.orderRef}) has already been paid for.
                        </Text>
                        <Text style={styles.helpText}>
                            Amount: ₦{orderData?.pricing?.totalAmount?.toLocaleString('en-NG')}
                        </Text>

                        <Pressable style={styles.retryButton} onPress={goToOrders}>
                            <LinearGradient colors={['#10B981', '#34D399']} style={styles.gradient}>
                                <Text style={styles.retryText}>View Orders</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                );

            case STATES.INITIALIZING:
                return (
                    <View style={styles.container}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.title}>Initializing Payment</Text>
                        <Text style={styles.subtitle}>Setting up secure payment...</Text>
                    </View>
                );

            case STATES.COOLDOWN_WAITING:
                return (
                    <View style={styles.container}>
                        <Ionicons name="time-outline" size={80} color="#F59E0B" />
                        <Text style={styles.title}>Please Wait</Text>
                        <Text style={styles.subtitle}>
                            Payment cannot be initialized at this time.
                        </Text>
                        <Text style={styles.cooldownText}>
                            Retry in {cooldownTime} second{cooldownTime !== 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.helpText}>
                            We're ensuring payment security. Please wait for the timer to complete.
                        </Text>

                        {/* Disabled retry button during cooldown */}
                        <View style={[styles.retryButton, styles.disabledButton]}>
                            <View style={[styles.gradient, styles.disabledGradient]}>
                                <Text style={[styles.retryText, styles.disabledText]}>
                                    Retry ({cooldownTime}s)
                                </Text>
                            </View>
                        </View>
                    </View>
                );

            case STATES.BROWSER_OPEN:
                return (
                    <View style={styles.container}>
                        <Ionicons name="card-outline" size={80} color="#3B82F6" />
                        <Text style={styles.title}>Payment Gateway Opened</Text>
                        <Text style={styles.helpText}>
                            We'll automatically verify your payment when you return.
                        </Text>

                        {showManualCheck && (
                            <Pressable style={styles.verifyButton} onPress={manualVerify}>
                                <Text style={styles.verifyButtonText}>
                                    ✓ I've completed payment
                                </Text>
                            </Pressable>
                        )}
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
                        <Text style={styles.subtitle}>
                            Redirecting to your orders in {successCountdown} second{successCountdown !== 1 ? 's' : ''}...
                        </Text>
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

                        <Pressable style={styles.backButton} onPress={safeGoBack}>
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
                showBack={[STATES.SUCCESS, STATES.FAILED, STATES.ALREADY_PAID].includes(currentState)}
                onBackPress={() => {
                    stopCountdown();
                    safeGoBack();
                }}
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
        alignItems: 'center',
        padding: 20,
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    helpText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    successTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#10B981',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 8,
    },
    errorTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    verifyButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 20,
    },
    verifyButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    retryButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 20,
        width: 200,
    },
    gradient: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    retryText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    backText: {
        color: '#6B7280',
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        textAlign: 'center',
    },
    cooldownText: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#F59E0B',
        textAlign: 'center',
        marginBottom: 10,
    },
    disabledButton: {
        opacity: 0.6,
    },
    disabledGradient: {
        backgroundColor: '#9CA3AF',
    },
    disabledText: {
        color: '#D1D5DB',
    },
});

export default PaymentStatusScreen;