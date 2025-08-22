import React, {useState, forwardRef, useImperativeHandle, useEffect, useMemo} from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    Animated,
    Dimensions,
    Alert
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepThreeSchema} from '../../../validators/orderValidationSchemas';
import {useOrderStore} from "../../../store/useOrderStore";
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {VEHICLE_PROFILES, VehicleSelectionEngine} from '../../../utils/VehicleSelectionEngine';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const Step3 = forwardRef(({defaultValues}, ref) => {
    const {orderData, updateOrderData} = useOrderStore();
    const [selectedVehicles, setSelectedVehicles] = useState(new Set());
    const [showDetails, setShowDetails] = useState({});
    const [animatedValues] = useState({});

    // Initialize form
    const {control, handleSubmit, setValue, watch, formState: {errors}} = useForm({
        resolver: yupResolver(stepThreeSchema),
        mode: 'onChange',
        defaultValues: {
            vehicleRequirements: defaultValues?.vehicleRequirements || orderData?.vehicleRequirements || []
        }
    });

    const watchedVehicles = watch('vehicleRequirements');

    // Initialize vehicle selection engine
    const vehicleEngine = useMemo(() => {
        return new VehicleSelectionEngine(orderData);
    }, [orderData]);

    const evaluations = useMemo(() => {
        return vehicleEngine.getAllEvaluations();
    }, [vehicleEngine]);

    // Initialize animated values for each vehicle
    useEffect(() => {
        Object.keys(VEHICLE_PROFILES).forEach(vehicleType => {
            if (!animatedValues[vehicleType]) {
                animatedValues[vehicleType] = new Animated.Value(0);
            }
        });
    }, []);

    // Sync form with selected vehicles
    useEffect(() => {
        setValue('vehicleRequirements', Array.from(selectedVehicles), {shouldValidate: true});
    }, [selectedVehicles, setValue]);

    // Initialize selected vehicles from default values
    useEffect(() => {
        if (watchedVehicles && watchedVehicles.length > 0) {
            setSelectedVehicles(new Set(watchedVehicles));
        }
    }, []);

    // Expose imperative API
    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise((resolve) => {
                handleSubmit(
                    (data) => {
                        if (!data.vehicleRequirements || data.vehicleRequirements.length === 0) {
                            Alert.alert(
                                'No Vehicle Selected',
                                'Please select at least one vehicle type for your delivery.'
                            );
                            return resolve({
                                valid: false,
                                errors: {vehicleRequirements: 'At least one vehicle must be selected'}
                            });
                        }

                        resolve({valid: true, data});
                    },
                    (errs) => {
                        resolve({valid: false, errors: errs});
                    }
                )();
            }),
    }));

    const handleVehicleToggle = (vehicleType, evaluation) => {
        if (evaluation.status === 'disabled') return;

        const newSelected = new Set(selectedVehicles);
        if (newSelected.has(vehicleType)) {
            newSelected.delete(vehicleType);
            // Animate out
            Animated.spring(animatedValues[vehicleType], {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8
            }).start();
        } else {
            newSelected.add(vehicleType);
            // Animate in
            Animated.spring(animatedValues[vehicleType], {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8
            }).start();
        }
        setSelectedVehicles(newSelected);
    };

    const toggleDetails = (vehicleType) => {
        setShowDetails(prev => ({
            ...prev,
            [vehicleType]: !prev[vehicleType]
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'recommended':
                return '#10B981';
            case 'allowed':
                return '#F59E0B';
            case 'disabled':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'recommended':
                return 'checkmark-circle';
            case 'allowed':
                return 'checkmark';
            case 'disabled':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const renderVehicleCard = (vehicleType, evaluation) => {
        const profile = VEHICLE_PROFILES[vehicleType];
        const isSelected = selectedVehicles.has(vehicleType);
        const isDisabled = evaluation.status === 'disabled';
        const statusColor = getStatusColor(evaluation.status);
        const isDetailsOpen = showDetails[vehicleType];

        return (
            <Animated.View
                key={vehicleType}
                style={[
                    styles.vehicleCard,
                    isSelected && styles.selectedCard,
                    isDisabled && styles.disabledCard,
                    {
                        borderColor: isSelected ? statusColor : '#E5E7EB',
                        opacity: isDisabled ? 0.6 : 1,
                        transform: [{
                            scale: animatedValues[vehicleType]?.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.98, 1.02]
                            }) || 1
                        }]
                    }
                ]}
            >
                <Pressable
                    onPress={() => handleVehicleToggle(vehicleType, evaluation)}
                    disabled={isDisabled}
                    style={styles.cardHeader}
                >
                    <View style={styles.vehicleInfo}>
                        <View style={styles.vehicleIconContainer}>
                            <Text style={styles.vehicleEmoji}>{profile.emoji}</Text>
                            {isSelected && (
                                <Animated.View
                                    style={[
                                        styles.selectionIndicator,
                                        {backgroundColor: statusColor}
                                    ]}
                                >
                                    <Ionicons name="checkmark" size={12} color="white"/>
                                </Animated.View>
                            )}
                        </View>

                        <View style={styles.vehicleDetails}>
                            <View style={styles.vehicleTitleRow}>
                                <Text style={[
                                    styles.vehicleName,
                                    isDisabled && styles.disabledText
                                ]}>
                                    {profile.name}
                                </Text>
                                <View style={[styles.statusBadge, {backgroundColor: statusColor + '20'}]}>
                                    <Ionicons
                                        name={getStatusIcon(evaluation.status)}
                                        size={12}
                                        color={statusColor}
                                    />
                                    <Text style={[styles.statusText, {color: statusColor}]}>
                                        {evaluation.status}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[
                                styles.vehicleDescription,
                                isDisabled && styles.disabledText
                            ]}>
                                {profile.description}
                            </Text>

                            <View style={styles.quickStats}>
                                <View style={styles.statItem}>
                                    <Ionicons name="time" size={14} color="#6B7280"/>
                                    <Text style={styles.statText}>
                                        {evaluation.estimatedTime ? `${evaluation.estimatedTime}min` : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="cash" size={14} color="#6B7280"/>
                                    <Text style={styles.statText}>
                                        {formatCurrency(evaluation.estimatedCost)}
                                    </Text>
                                </View>
                                {evaluation.score > 0 && (
                                    <View style={styles.statItem}>
                                        <Ionicons name="star" size={14} color="#F59E0B"/>
                                        <Text style={styles.statText}>
                                            {evaluation.score.toFixed(0)}%
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {evaluation.status === 'disabled' && (
                                <Text style={styles.disabledReason}>
                                    {evaluation.reason}
                                </Text>
                            )}
                        </View>
                    </View>

                    <Pressable
                        style={styles.detailsToggle}
                        onPress={() => toggleDetails(vehicleType)}
                    >
                        <Ionicons
                            name={isDetailsOpen ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#6B7280"
                        />
                    </Pressable>
                </Pressable>

                {isDetailsOpen && (
                    <View style={styles.expandedDetails}>
                        <View style={styles.capabilitiesGrid}>
                            <View style={styles.capabilityItem}>
                                <Text style={styles.capabilityLabel}>Max Weight</Text>
                                <Text style={styles.capabilityValue}>{profile.capabilities.maxWeight}kg</Text>
                            </View>
                            <View style={styles.capabilityItem}>
                                <Text style={styles.capabilityLabel}>Max Distance</Text>
                                <Text style={styles.capabilityValue}>{profile.capabilities.maxDistance}km</Text>
                            </View>
                            <View style={styles.capabilityItem}>
                                <Text style={styles.capabilityLabel}>Speed</Text>
                                <Text style={styles.capabilityValue}>{profile.capabilities.speedKmh}km/h</Text>
                            </View>
                            <View style={styles.capabilityItem}>
                                <Text style={styles.capabilityLabel}>Security</Text>
                                <Text style={styles.capabilityValue}>{profile.restrictions.securityLevel}</Text>
                            </View>
                        </View>

                        {Object.entries(evaluation.details).map(([key, detail]) => (
                            <View key={key} style={styles.evaluationDetail}>
                                <Text style={styles.evaluationLabel}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                                </Text>
                                <Text style={[
                                    styles.evaluationValue,
                                    {color: detail.status === 'disabled' ? '#EF4444' : '#6B7280'}
                                ]}>
                                    {detail.reason} ({detail.score}%)
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </Animated.View>
        );
    };


    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Choose Vehicle Type</Text>
                    <Text style={styles.subtitle}>
                        Select one or more vehicle types suitable for your delivery
                    </Text>
                </View>
            </ScrollView>
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16
    },
    header: {
        marginBottom: 16
    },
    title: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280'
    },
    vehicleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 2,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    selectedCard: {
        borderColor: '#10B981'
    },
    disabledCard: {
        backgroundColor: '#F3F4F6'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    vehicleList: {
        flex: 1,
        marginTop: 8,
        marginBottom: 32,
        gap: 12,

    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    vehicleIconContainer: {
        position: 'relative',
        marginRight: 12
    },
    vehicleEmoji: {
        fontSize: 32
    },
    selectionIndicator: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF'
    },
    vehicleDetails: {
        flex: 1
    },
    vehicleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    vehicleName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginRight: 8
    },
    disabledText: {
        color: '#9CA3AF'
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
        textTransform: 'capitalize'
    },
    vehicleDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8
    },
    quickStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    statText: {
        fontSize: 12,
        color: '#6B7280'
    },
    disabledReason: {
        marginTop: 8,
        fontSize: 12,
        color: '#EF4444'
    },
    detailsToggle: {
        padding: 8
    },
    expandedDetails: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 16
    },
    capabilitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16
    },
    capabilityItem: {
        width: '50%',
        marginBottom: 8
    },
    capabilityLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2
    },
    capabilityValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827'
    },
    evaluationDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    evaluationLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151'
    },
    evaluationValue: {
        fontSize: 14,
        fontWeight: '600'
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12
    },

})

export default Step3;