// components/Step3.jsx
import React, {useState, forwardRef, useImperativeHandle, useEffect} from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Animated,
    Dimensions,
    Image,
    ScrollView
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepThreeSchema} from '../../../validators/orderValidationSchemas';
import {useOrderStore} from "../../../store/useOrderStore";
import CustomAlert from "./CustomAlert";

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const vehicleImages = {
    bicycle: require('../../../assets/images/bicycle.jpg'),
    motorcycle: require('../../../assets/images/motorcycle.jpg'),
    tricycle: require('../../../assets/images/tricycle.jpg'),
    car: require('../../../assets/images/car.jpg'),
    van: require('../../../assets/images/van.jpg'),
    truck: require('../../../assets/images/truck.jpg')
};

const VEHICLES = [
    {id: 'bicycle', name: 'Bicycle', image: vehicleImages.bicycle},
    {id: 'motorcycle', name: 'Motorcycle', image: vehicleImages.motorcycle},
    {id: 'tricycle', name: 'Tricycle', image: vehicleImages.tricycle},
    {id: 'car', name: 'Car', image: vehicleImages.car},
    {id: 'van', name: 'Van', image: vehicleImages.van},
    {id: 'truck', name: 'Truck', image: vehicleImages.truck}
];

const VEHICLE_CONSTRAINTS = {
    bicycle: {
        maxWeight: 5,
        maxDistance: 15,
        cannotHandle: ['fragile', 'cake', 'furniture', 'electronics']
    },
    motorcycle: {
        maxWeight: 25,
        maxDistance: 150,
        cannotHandle: ['furniture']
    },
    tricycle: {
        maxWeight: 100,
        maxDistance: 170,
        cannotHandle: []
    },
    car: {
        maxWeight: 300,
        maxDistance: Infinity,
        cannotHandle: []
    },
    van: {
        maxWeight: 500,
        maxDistance: Infinity,
        cannotHandle: []
    },
    truck: {
        maxWeight: Infinity,
        maxDistance: Infinity,
        cannotHandle: []
    }
};

const VALID_VEHICLES = ['bicycle', 'motorcycle', 'tricycle', 'car', 'van', 'truck'];

const Step3 = forwardRef(({defaultValues}, ref) => {
    const orderData = useOrderStore((state) => state.orderData);

    // Initialize with proper persisted data
    const [selectedVehicles, setSelectedVehicles] = useState(() => {
        const savedVehicles = defaultValues?.vehicleRequirements || orderData?.vehicleRequirements || [];
        const validVehicles = savedVehicles.filter(vehicle =>
            VALID_VEHICLES.includes(vehicle)
        );
        return new Set(validVehicles);
    });

    const [recommendations, setRecommendations] = useState(new Set());
    const [alert, setAlert] = useState(null);
    const [maxLimitNotification, setMaxLimitNotification] = useState(false);
    const [rejectedVehicles, setRejectedVehicles] = useState(new Set());



    const [animatedValues] = useState(
        VEHICLES.reduce((acc, vehicle) => {
            acc[vehicle.id] = {
                scale: new Animated.Value(1)
            };
            return acc;
        }, {})
    );

    const {control, handleSubmit, setValue, formState: {errors}, clearErrors} = useForm({
        resolver: yupResolver(stepThreeSchema),
        mode: 'onChange',
        defaultValues: {
            vehicleRequirements: Array.from(selectedVehicles)
        }
    });

    // Smart recommendation engine
    useEffect(() => {
        const generateRecommendations = () => {
            const recs = new Set();
            const packageWeight = orderData?.package?.weight?.value || 0;
            const distance = calculateDistance();
            const category = orderData?.package?.category;
            const isFragile = orderData?.package?.isFragile;

            const weightKg = orderData?.package?.weight?.unit === 'g' ? packageWeight / 1000 : packageWeight;

            if (weightKg <= 5 && distance <= 15) recs.add('bicycle');
            if (weightKg <= 25 && distance <= 40) recs.add('motorcycle');
            if (category === 'food' || weightKg <= 50) recs.add('motorcycle');
            if (isFragile || category === 'electronics') recs.add('car');
            if (weightKg > 80) recs.add('van');
            if (weightKg > 200) recs.add('truck');

            if (recs.size >= 4) {
                return new Set();
            }

            if (recs.size === 0) {
                recs.add('motorcycle');
            }

            return recs;
        };

        setRecommendations(generateRecommendations());
    }, [orderData]);

    const calculateDistance = () => {
        const pickup = orderData?.location?.pickUp?.coordinates?.coordinates;
        const dropoff = orderData?.location?.dropOff?.coordinates?.coordinates;
        if (!pickup || !dropoff) return 10;

        const R = 6371;
        const dLat = (dropoff[1] - pickup[1]) * Math.PI / 180;
        const dLon = (dropoff[0] - pickup[0]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pickup[1] * Math.PI / 180) * Math.cos(dropoff[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    useEffect(() => {
        const vehicleArray = Array.from(selectedVehicles);
        setValue('vehicleRequirements', vehicleArray, {shouldValidate: false});
    }, [selectedVehicles, setValue]);

    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise((resolve) => {
                handleSubmit(
                    (data) => {
                        if (!data.vehicleRequirements || data.vehicleRequirements.length === 0) {
                            setAlert({
                                type: 'error',
                                title: 'Validation Failed',
                                message: 'Select at least one vehicle type',
                                duration: 2000
                            });
                            return resolve({
                                valid: false,
                                errors: {vehicleRequirements: 'Select at least one vehicle type'}
                            });
                        }

                        if (data.vehicleRequirements.length > 4) {
                            setAlert({
                                type: 'error',
                                title: 'Validation Failed',
                                message: 'Maximum 4 vehicle types allowed',
                                duration: 2000
                            });
                            return resolve({
                                valid: false,
                                errors: {vehicleRequirements: 'Maximum 4 vehicle types allowed'}
                            });
                        }

                        resolve({valid: true, data});
                    },
                    (errs) => {
                        setAlert({
                            type: 'error',
                            title: 'Validation Failed',
                            message: 'Please fix all validation errors',
                            duration: 2000
                        });
                        resolve({valid: false, errors: errs});
                    }
                )();
            })
    }));

    const handleVehicleToggle = (vehicleId) => {
        if (errors.vehicleRequirements) {
            clearErrors('vehicleRequirements');
        }

        const newSelected = new Set(selectedVehicles);

        if (newSelected.has(vehicleId)) {
            newSelected.delete(vehicleId);
        } else {
            if (newSelected.size >= 4) {
                setMaxLimitNotification(true);

                // Auto-hide the notification after 3 seconds
                setTimeout(() => {
                    setMaxLimitNotification(false);
                }, 3000);
                setAlert({
                    type: 'error',
                    title: 'Selection Limit Reached',
                    message: 'You can select up to 4 vehicle types only.',
                    duration: 2000
                });
                return;
            }
            // Validate if vehicle can handle the package
            const validation = canVehicleHandlePackage(vehicleId);

            if (!validation.canHandle) {
                showRejectionFeedback(vehicleId, validation.reason);
                return;
            }
            newSelected.add(vehicleId);
        }

        Animated.sequence([
            Animated.timing(animatedValues[vehicleId].scale, {
                toValue: 0.95,
                duration: 80,
                useNativeDriver: true
            }),
            Animated.spring(animatedValues[vehicleId].scale, {
                toValue: 1,
                tension: 500,
                friction: 10,
                useNativeDriver: true
            })
        ]).start();

        setSelectedVehicles(newSelected);
    };

    const canVehicleHandlePackage = (vehicleId) => {
        const packageCategory = orderData?.package?.category;
        const packageWeight = orderData?.package?.weight?.value || 0;
        const weightInKg = orderData?.package?.weight?.unit === 'g' ? packageWeight / 1000 : packageWeight;

        const deliveryDistance = calculateDistance();

        const constraints = VEHICLE_CONSTRAINTS[vehicleId];
        if (!constraints) return true;



        // Check distance limit first (most restrictive for short-range vehicles)
        if (deliveryDistance > constraints.maxDistance) {
            return {
                canHandle: false,
                reason: `Distance too far (${deliveryDistance.toFixed(1)}km )`
            };
        }

        // Check weight limit
        if (weightInKg > constraints.maxWeight) {
            return {
                canHandle: false,
                reason: `Weight limit exceeded (${weightInKg}kg > ${constraints.maxWeight}kg)`
            };
        }

        // Check category restrictions
        if (constraints.cannotHandle.includes(packageCategory)) {
            return {
                canHandle: false,
                reason: `Cannot handle ${packageCategory} items`
            };
        }

        return { canHandle: true };
    };

    // Add this function to handle rejected selections with visual feedback
    const showRejectionFeedback = (vehicleId, reason) => {
        // Add to rejected set
        setRejectedVehicles(prev => new Set([...prev, vehicleId]));

        // Show alert
        setAlert({
            type: 'error',
            title: 'Invalid Selection',
            message: `${VEHICLES.find(v => v.id === vehicleId)?.name} ${reason}`,
            duration: 2500
        });

        // Animate rejection (shake effect)
        Animated.sequence([
            Animated.timing(animatedValues[vehicleId].scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(animatedValues[vehicleId].scale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
            Animated.timing(animatedValues[vehicleId].scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(animatedValues[vehicleId].scale, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();

        // Remove from rejected set after 2 seconds
        setTimeout(() => {
            setRejectedVehicles(prev => {
                const newSet = new Set(prev);
                newSet.delete(vehicleId);
                return newSet;
            });
        }, 2000);
    };


    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>📦</Text>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Delivery Method</Text>
                    <Text style={styles.headerSubtitle}>Choose how you want your package delivered</Text>
                </View>
            </View>

            {alert && (
                <CustomAlert
                    type={alert.type}
                    title={alert.title}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    duration={alert.duration}
                />
            )}

            <View style={styles.content}>
                <Controller
                    control={control}
                    name="vehicleRequirements"
                    render={() => (
                        <View style={styles.grid}>
                            {VEHICLES.map((vehicle) => {
                                const isSelected = selectedVehicles.has(vehicle.id);
                                const isRecommended = recommendations.has(vehicle.id);

                                return (
                                    <Animated.View
                                        key={vehicle.id}
                                        style={[
                                            styles.cardContainer,
                                            {
                                                transform: [{scale: animatedValues[vehicle.id].scale}]
                                            }
                                        ]}
                                    >
                                        <Pressable
                                            style={[
                                                styles.vehicleCard,
                                                isSelected && styles.selectedCard, // ONLY border changes here
                                                rejectedVehicles.has(vehicle.id) && styles.rejectedCard
                                            ]}
                                            onPress={() => handleVehicleToggle(vehicle.id)}
                                        >
                                            <View style={styles.imageContainer}>
                                                <Image
                                                    source={vehicle.image}
                                                    style={styles.vehicleImage}
                                                    resizeMode="cover"
                                                />
                                                <View style={styles.imageOverlay}/>
                                            </View>

                                            <View style={styles.textContainer}>
                                                <Text style={[
                                                    styles.vehicleName,
                                                    isSelected && styles.selectedText
                                                ]}>
                                                    {vehicle.name}
                                                </Text>
                                            </View>

                                            {isRecommended && !isSelected && !rejectedVehicles.has(vehicle.id) && (
                                                <View style={styles.recommendedBadge}>
                                                    <Text style={styles.recommendedIcon}>⭐</Text>
                                                    <Text style={styles.recommendedText}>Recommended</Text>
                                                </View>
                                            )}

                                            {isSelected && !rejectedVehicles.has(vehicle.id) && (
                                                <View style={styles.selectedBadge}>
                                                    <Text style={styles.checkmark}>✓</Text>
                                                </View>
                                            )}

                                            {rejectedVehicles.has(vehicle.id) && (
                                                <View style={styles.rejectedBadge}>
                                                    <Text style={styles.rejectedIcon}>✗</Text>
                                                </View>
                                            )}
                                        </Pressable>
                                    </Animated.View>
                                );
                            })}
                        </View>
                    )}
                />

                <View style={styles.errorContainer}>
                    {maxLimitNotification && (
                        <View style={styles.notificationBubble}>
                            <Text style={styles.notificationText}>Max 4 allowed</Text>
                        </View>
                    )}
                </View>

                {errors?.vehicleRequirements && (
                    <Text style={styles.errorText}>
                        {errors.vehicleRequirements?.message}
                    </Text>
                )}
            </View>

            <View style={styles.bottomSpacer}/>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    headerIconText: {
        fontSize: 20,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#1e293b',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
        color: '#64748b',
    },
    content: {
        flex: 1,
        padding: 16
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12
    },
    cardContainer: {
        width: (SCREEN_WIDTH - 48) / 2,
        height: 200,
        marginBottom: 12
    },
    vehicleCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden'
    },
    selectedCard: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        shadowColor: '#3B82F6',
        shadowOpacity: 0.15,
        elevation: 4
    },
    imageContainer: {
        width: '100%',
        height: 150,
        position: 'relative'
    },
    vehicleImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
    },
    textContainer: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        alignItems: 'center'
    },
    vehicleName: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
        color: '#374151',
        letterSpacing: 0.5
    },
    selectedText: {
        color: '#DD5E89',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 3
    },
    recommendedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    recommendedIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    recommendedText: {
        fontSize: 10,
        fontFamily: 'PoppinsBold',
        color: '#64748B',
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold'
    },
    errorContainer: {
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        alignItems: 'center'
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        fontFamily: 'PoppinsBold',
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '500'
    },
    notificationBubble: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    notificationText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'PoppinsBold',
    },
    bottomSpacer: {
        height: 150,
    },
    rejectedCard: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
        shadowColor: '#EF4444',
        shadowOpacity: 0.2,
    },
    rejectedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3
    },
    rejectedIcon: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold'
    },
});

export default Step3;