// OrderCreationFlow.js - Main orchestrator component
import React, {useState, useRef, useCallback, useMemo} from 'react';
import {
    View,
    Text,
    ScrollView,
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Alert
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
    calculateOrderPricing,
    getDeviceIP,
    getDeviceInfo,
    validateOrderData,
    formatCurrency,
    generateOrderRef,
    generateDeliveryToken
} from '../../../utils/Constant'; // Adjust path based on your file structure


// Import custom components
import {LocationSelector} from './LocationSelector';
import {VehicleSelector} from './VehicleSelector';
import ReviewConfirm from './ReviewConfirm';
import ProgressIndicator from './ProgressIndicator';
import OrderStep1 from './OrderStep1';
import FloatingActionPanel from './FloatingActionPanel';
import OrdersHub from "./OrdersHub";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const ORDER_STEPS = [
    {id: 'type', title: 'Type', icon: 'package'},
    {id: 'locations', title: 'Locations', icon: 'map-pin'},
    {id: 'vehicle', title: 'Vehicle', icon: 'truck'},
    {id: 'payment', title: 'Payment', icon: 'credit-card'},
    {id: 'review', title: 'Review', icon: 'check-circle'}
];

const OrderCreationFlow = ({
                               userData,
                               onOrderCreate,
                               userLocation,
                               savedLocations = [],
                               recentOrders = [],
                               navigation,
                               onAddSavedLocation,
                               onUpdateSavedLocation,
                               onRemoveSavedLocation,
                               locationPermission,
                               onRefreshLocation
                           }) => {
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef(null);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Order state management
    const [currentStep, setCurrentStep] = useState(0);
    const [orderData, setOrderData] = useState({
        orderType: 'instant',
        priority: 'normal',
        package: {
            category: '',
            subcategory: '',
            dimensions: {length: '', width: '', height: '', unit: 'cm'},
            weight: {value: '', unit: 'kg'},
            value: '',
            isFragile: false,
            requiresSpecialHandling: false,
            temperature: {controlled: false},
            description: '',
            specialInstructions: ''
        },
        pickup: {
            address: '',
            coordinates: {lat: null, lng: null},
            contactPerson: {name: '', phone: ''},
            instructions: '',
            locationType: 'residential'
        },
        dropoff: {
            address: '',
            coordinates: {lat: null, lng: null},
            contactPerson: {name: '', phone: ''},
            instructions: '',
            locationType: 'residential'
        },
        vehicleRequirements: [],
        scheduledPickup: null,
        deliveryWindow: {start: null, end: null},
        payment: {method: 'wallet'},
        specialRequirements: []
    });

    const [validationErrors, setValidationErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [estimatedPrice, setEstimatedPrice] = useState(null);

    // Smart suggestions based on user data
    const smartSuggestions = useMemo(() => {
        return {
            quickReorder: recentOrders?.slice(0, 3) || null,
            savedLocations: savedLocations?.slice(0, 5) || null,
            popularCategories: ['document', 'parcel', 'food'],
            recommendedVehicles: getRecommendedVehicles(orderData.package)
        };
    }, [recentOrders, savedLocations, orderData.package]);

    // Navigation handlers with smooth animations
    const goToNextStep = useCallback(async () => {
        const isValid = await validateCurrentStep();
        if (!isValid) return;

        if (currentStep < ORDER_STEPS.length - 1) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -(currentStep + 1) * SCREEN_WIDTH,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(progressAnim, {
                    toValue: (currentStep + 1) / (ORDER_STEPS.length - 1),
                    duration: 300,
                    useNativeDriver: false
                })
            ]).start();

            setCurrentStep(currentStep + 1);

            // Auto-calculate pricing when reaching review step
            if (currentStep === ORDER_STEPS.length - 2) {
                calculateEstimatedPrice();
            }
        }
    }, [currentStep, orderData]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -(currentStep - 1) * SCREEN_WIDTH,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(progressAnim, {
                    toValue: (currentStep - 1) / (ORDER_STEPS.length - 1),
                    duration: 300,
                    useNativeDriver: false
                })
            ]).start();

            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    // Data update handler with real-time validation
    const updateOrderData = useCallback((section, data) => {
        setOrderData(prev => ({
            ...prev,
            [section]: {...prev[section], ...data}
        }));

        // Clear validation errors for updated fields
        setValidationErrors(prev => {
            const newErrors = {...prev};
            Object.keys(data).forEach(key => {
                delete newErrors[`${section}.${key}`];
            });
            return newErrors;
        });

        // Auto-calculate price if locations or package details change
        if (section === 'pickup' || section === 'dropoff' || section === 'package') {
            debounceCalculatePrice();
        }
    }, []);

    // Step validation
    const validateCurrentStep = useCallback(async () => {
        const step = ORDER_STEPS[currentStep];
        const errors = {};

        switch (step.id) {
            case 'type':
                if (!orderData.orderType) {
                    errors['orderType'] = 'Please select an order type';
                }
                break;

            case 'package':
                if (!orderData.package.category) {
                    errors['package.category'] = 'Package category is required';
                }
                if (!orderData.package.description.trim()) {
                    errors['package.description'] = 'Package description is required';
                }
                break;

            case 'locations':
                if (!orderData.pickup.address) {
                    errors['pickup.address'] = 'Pickup address is required';
                }
                if (!orderData.dropoff.address) {
                    errors['dropoff.address'] = 'Delivery address is required';
                }
                break;

            case 'vehicle':
                if (orderData.vehicleRequirements.length === 0) {
                    errors['vehicleRequirements'] = 'Please select at least one vehicle type';
                }
                break;
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [currentStep, orderData]);

    // Price calculation with debouncing
    const debounceCalculatePrice = useCallback(
        debounce(() => calculateEstimatedPrice(), 500),
        [orderData]
    );

    const calculateEstimatedPrice = useCallback(async () => {
        if (!orderData.pickup.coordinates.lat || !orderData.dropoff.coordinates.lat) {
            return;
        }

        try {
            setIsLoading(true);
            // Call your pricing API here
            const pricing = await calculateOrderPricing(orderData);
            setEstimatedPrice(pricing);
        } catch (error) {
            console.error('Price calculation error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [orderData]);

    // Final order submission
    const submitOrder = useCallback(async () => {
        try {
            setIsLoading(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            const finalOrderData = {
                ...orderData,
                orderRef: generateOrderRef(),
                deliveryToken: generateDeliveryToken(),
                status: 'draft',
                pricing: estimatedPrice,
                metadata: {
                    createdBy: 'client',
                    channel: 'mobile',
                    sourceIP: await getDeviceIP(),
                    userAgent: await getDeviceInfo()
                }
            };

            const result = await onOrderCreate(finalOrderData);

            if (result.success) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                navigation.navigate('OrderTracking', {orderId: result.orderId});
            } else {
                throw new Error(result.error || 'Failed to create order');
            }
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Order Creation Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    }, [orderData, estimatedPrice, onOrderCreate, navigation]);

    return (
        <>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent/>

                {/* Gradient Header */}
                <LinearGradient
                    colors={['#FFF', '#FFF']}
                    style={[styles.header]}
                >
                    <ProgressIndicator
                        steps={ORDER_STEPS}
                        currentStep={currentStep}
                        progress={progressAnim}
                        onStepPress={(index) => index < currentStep && setCurrentStep(index)}
                    />
                </LinearGradient>

                {/*/!* Main Content *!/*/}
                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={insets.top + 1}
                >
                        <View style={styles.stepView}>
                            <OrderStep1
                                orderData={orderData}
                                onUpdate={(section, data) => {
                                    if (section === 'orderType') {
                                        setOrderData(prev => ({...prev, orderType: data}));
                                    } else {
                                        setOrderData(prev => ({...prev, [section]: data}));
                                    }
                                }}
                                smartSuggestions={{
                                    quickReorder: recentOrders?.slice(0, 3) || [],
                                    popularCategories: ['document', 'parcel', 'food']
                                }}
                                validationErrors={validationErrors}
                            />
                        </View>



                        {/*        /!* Location Selection Step *!/*/}
                        {/*        <View style={styles.stepView}>*/}
                        {/*            <LocationSelector*/}
                        {/*                pickup={orderData.pickup}*/}
                        {/*                dropoff={orderData.dropoff}*/}
                        {/*                onPickupUpdate={(data) => updateOrderData('pickup', data)}*/}
                        {/*                onDropoffUpdate={(data) => updateOrderData('dropoff', data)}*/}
                        {/*                userLocation={userLocation}*/}
                        {/*                savedLocations={smartSuggestions.savedLocations}*/}
                        {/*                validationErrors={validationErrors}*/}
                        {/*            />*/}
                        {/*        </View>*/}

                        {/*        /!* Vehicle Selection Step *!/*/}
                        {/*        <View style={styles.stepView}>*/}
                        {/*            <VehicleSelector*/}
                        {/*                selectedVehicles={orderData.vehicleRequirements}*/}
                        {/*                onVehicleSelect={(vehicles) => updateOrderData('vehicleRequirements', vehicles)}*/}
                        {/*                recommendedVehicles={smartSuggestions.recommendedVehicles}*/}
                        {/*                packageData={orderData.package}*/}
                        {/*                estimatedPrice={estimatedPrice}*/}
                        {/*            />*/}
                        {/*        </View>*/}

                        {/*        /!* Review & Confirm Step *!/*/}
                        {/*        <View style={styles.stepView}>*/}
                        {/*            <ReviewConfirm*/}
                        {/*                orderData={orderData}*/}
                        {/*                estimatedPrice={estimatedPrice}*/}
                        {/*                onEdit={(step) => setCurrentStep(step)}*/}
                        {/*                onSubmit={submitOrder}*/}
                        {/*                isLoading={isLoading}*/}
                        {/*            />*/}
                        {/*        </View>*/}
                </KeyboardAvoidingView>

                {/* /!*Floating Action Panel *!/*/}
                <FloatingActionPanel
                    currentStep={currentStep}
                    totalSteps={ORDER_STEPS.length}
                    onNext={goToNextStep}
                    onPrevious={goToPreviousStep}
                    onSubmit={submitOrder}
                    isLoading={isLoading}
                    hasErrors={Object.keys(validationErrors).length > 0}
                />

                {/*/!* Loading Overlay *!/*/}
                {/*{isLoading && (*/}
                {/*    <BlurView intensity={20} style={styles.loadingOverlay}>*/}
                {/*        <View style={styles.loadingContent}>*/}
                {/*            <Animated.View style={styles.loadingSpinner} />*/}
                {/*            <Text style={styles.loadingText}>Processing your order...</Text>*/}
                {/*        </View>*/}
                {/*    </BlurView>*/}
                {/*)}*/}
            </View>
        </>
    );
};

// Utility functions
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const getRecommendedVehicles = (packageData) => {
    const {weight, dimensions, category} = packageData;

    if (category === 'document') return ['bicycle', 'motorcycle'];
    if (weight?.value > 20 || (dimensions?.length > 50 && dimensions?.width > 50)) {
        return ['van', 'truck'];
    }
    return ['motorcycle', 'tricycle'];
};
// const generateDeliveryToken = () => {
//     return Math.random().toString(36).substr(2, 8).toUpperCase();
// };

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 12
    },
    content: {
        flex: 1,
    },
    stepsContainer: {
        flexDirection: 'row',
        width: SCREEN_WIDTH * ORDER_STEPS.length,
        flex: 1,
    },
    stepView: {
        width: SCREEN_WIDTH,
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.25,
        shadowRadius: 20
    },
    loadingSpinner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#667eea',
        borderTopColor: 'transparent',
        marginBottom: 15
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#374151'
    }
});

export default OrderCreationFlow;