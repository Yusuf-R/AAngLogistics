// components/Review.jsx
import React, {useState, forwardRef, useImperativeHandle, useMemo} from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    TextInput,
    Switch,
    Image,
    Dimensions,
    Alert
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useOrderStore} from "../../../store/useOrderStore";
import {ORDER_TYPES, PACKAGE_CATEGORIES} from '../../../utils/Constant';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Validation Schema
const reviewSchema = yup.object({
    insurance: yup.object({
        isInsured: yup.boolean(),
        declaredValue: yup.number().when('isInsured', {
            is: true,
            then: (schema) => schema.min(1000, 'Minimum value is ₦1,000').required('Declared value is required'),
            otherwise: (schema) => schema.notRequired()
        })
    })
});

const Review = forwardRef(({defaultValues}, ref) => {
    const {orderData} = useOrderStore();

    const {control, handleSubmit, watch, formState: {errors}} = useForm({
        resolver: yupResolver(reviewSchema),
        defaultValues: {
            insurance: {
                isInsured: defaultValues?.insurance?.isInsured || false,
                declaredValue: defaultValues?.insurance?.declaredValue || 50000,
            }
        }
    });

    const watchInsurance = watch('insurance');

    // Enhanced pricing calculation with VAT included internally
    const pricingCalculation = useMemo(() => {
        // Base delivery fee (this would come from your backend)
        const baseDeliveryFee = 15000;

        // Insurance calculation
        let insuranceFee = 0;
        if (watchInsurance.isInsured && watchInsurance.declaredValue > 0) {
            insuranceFee = watchInsurance.declaredValue * 0.02; // 2% of declared value
        }

        // Subtotal before VAT
        const subtotal = baseDeliveryFee + insuranceFee;

        // VAT calculation (7.5% - included internally)
        const vat = subtotal * 0.075;

        // Final total with VAT included
        const totalWithVAT = subtotal + vat;

        return {
            deliveryFee: baseDeliveryFee,
            insuranceFee: Math.round(insuranceFee),
            subtotal: Math.round(subtotal),
            vat: Math.round(vat),
            total: Math.round(totalWithVAT)
        };
    }, [watchInsurance]);

    const formatCurrency = (amount) => {
        return `₦${amount.toLocaleString()}`;
    };

    const getCategoryDisplay = () => {
        const category = PACKAGE_CATEGORIES.find(c => c.id === orderData?.package?.category);
        return category ? category.title : orderData?.package?.category || 'Package';
    };

    const handleImageError = (index) => {
        console.log(`Image ${index} failed to load:`, orderData?.package?.images[index]?.url);
    };

    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise((resolve) => {
                handleSubmit(
                    (data) => {
                        const reviewData = {
                            ...data,
                            pricing: pricingCalculation
                        };
                        resolve({valid: true, data: reviewData});
                    },
                    (errors) => {
                        resolve({valid: false, errors});
                    }
                )();
            })
    }));

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Order Review</Text>
                            <Text style={styles.headerSubtitle}>Ref: {orderData?.orderRef}</Text>
                        </View>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Ready</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Route Information with Enhanced Icons */}
                <View style={styles.routeSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, {backgroundColor: '#f0f9ff'}]}>
                                <Ionicons name="navigate" size={22} color="#0ea5e9" />
                            </View>
                            <Text style={styles.sectionTitle}>Delivery Route</Text>
                        </View>
                    </View>

                    <View style={styles.routeContainer}>
                        {/* Pickup Location with Target Icon */}
                        <View style={styles.routeItem}>
                            <View style={styles.routeIconContainer}>
                                <View style={[styles.routeIcon, {backgroundColor: '#dcfce7'}]}>
                                    <Ionicons name="radio-button-on" size={20} color="#16a34a" />
                                </View>
                            </View>
                            <View style={styles.routeDetails}>
                                <View style={styles.routeLabelContainer}>
                                    <Text style={styles.routeLabel}>Pickup Location</Text>
                                    <View style={styles.routeTypeBadge}>
                                        <Text style={styles.routeTypeBadgeText}>FROM</Text>
                                    </View>
                                </View>
                                <Text style={styles.routeAddress}>{orderData?.location?.pickUp?.address}</Text>
                                {orderData?.location?.pickUp?.landmark && (
                                    <Text style={styles.routeLandmark}>📍 {orderData.location.pickUp.landmark}</Text>
                                )}
                                <View style={styles.contactInfo}>
                                    <Ionicons name="person" size={14} color="#6b7280" />
                                    <Text style={styles.contactText}>{orderData?.location?.pickUp?.contactPerson?.name}</Text>
                                    <Ionicons name="call" size={14} color="#6b7280" style={{marginLeft: 12}} />
                                    <Text style={styles.contactText}>{orderData?.location?.pickUp?.contactPerson?.phone}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Route Line */}
                        <View style={styles.routeLineContainer}>
                            <View style={styles.routeLine} />
                        </View>

                        {/* Drop-off Location with Map Icon */}
                        <View style={styles.routeItem}>
                            <View style={styles.routeIconContainer}>
                                <View style={[styles.routeIcon, {backgroundColor: '#fef2f2'}]}>
                                    <Ionicons name="location" size={20} color="#dc2626" />
                                </View>
                            </View>
                            <View style={styles.routeDetails}>
                                <View style={styles.routeLabelContainer}>
                                    <Text style={styles.routeLabel}>Drop-off Location</Text>
                                    <View style={[styles.routeTypeBadge, {backgroundColor: '#fef2f2', borderColor: '#dc2626'}]}>
                                        <Text style={[styles.routeTypeBadgeText, {color: '#dc2626'}]}>TO</Text>
                                    </View>
                                </View>
                                <Text style={styles.routeAddress}>{orderData?.location?.dropOff?.address}</Text>
                                {orderData?.location?.dropOff?.landmark && (
                                    <Text style={styles.routeLandmark}>📍 {orderData.location.dropOff.landmark}</Text>
                                )}
                                <View style={styles.contactInfo}>
                                    <Ionicons name="person" size={14} color="#6b7280" />
                                    <Text style={styles.contactText}>{orderData?.location?.dropOff?.contactPerson?.name}</Text>
                                    <Ionicons name="call" size={14} color="#6b7280" style={{marginLeft: 12}} />
                                    <Text style={styles.contactText}>{orderData?.location?.dropOff?.contactPerson?.phone}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Enhanced Package Details */}
                <View style={styles.packageSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, {backgroundColor: '#f3e8ff'}]}>
                                <Ionicons name="cube" size={22} color="#9333ea" />
                            </View>
                            <Text style={styles.sectionTitle}>Package Details</Text>
                        </View>
                    </View>

                    <View style={styles.packageContent}>
                        {/* Package Info */}
                        <View style={styles.packageInfo}>
                            <View style={styles.packageInfoRow}>
                                <Text style={styles.packageLabel}>Category</Text>
                                <View style={styles.packageBadgeContainer}>
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryBadgeText}>{getCategoryDisplay()}</Text>
                                    </View>
                                    {orderData?.package?.isFragile && (
                                        <View style={styles.fragileBadge}>
                                            <Ionicons name="warning" size={12} color="#f59e0b" />
                                            <Text style={styles.fragileBadgeText}>Fragile</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.packageInfoRow}>
                                <Text style={styles.packageLabel}>Description</Text>
                                <Text style={styles.packageDescription}>{orderData?.package?.description}</Text>
                            </View>

                            {orderData?.package?.specialInstructions && (
                                <View style={styles.specialInstructionsContainer}>
                                    <View style={styles.specialInstructionsHeader}>
                                        <Ionicons name="information-circle" size={16} color="#f59e0b" />
                                        <Text style={styles.specialInstructionsTitle}>Special Instructions</Text>
                                    </View>
                                    <Text style={styles.specialInstructionsText}>
                                        {orderData.package.specialInstructions}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Enhanced Package Images */}
                        {orderData?.package?.images && orderData.package.images.length > 0 && (
                            <View style={styles.imagesContainer}>
                                <Text style={styles.imagesTitle}>Package Images ({orderData.package.images.length})</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.imagesScrollView}
                                >
                                    {orderData.package.images.map((image, index) => (
                                        <View key={image.id || index} style={styles.imageContainer}>
                                            <Image
                                                source={{
                                                    uri: image.url,
                                                    headers: {
                                                        'Cache-Control': 'no-cache'
                                                    }
                                                }}
                                                style={styles.packageImage}
                                                onError={() => handleImageError(index)}
                                                // defaultSource={require('../../../assets/placeholder-image.png')} // Add a placeholder image
                                            />
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>

                {/* Enhanced Insurance Section */}
                <View style={styles.insuranceSection}>
                    <View style={styles.insuranceHeader}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, {backgroundColor: '#fef7cd'}]}>
                                <Ionicons
                                    name={watchInsurance.isInsured ? "shield-checkmark" : "shield"}
                                    size={22}
                                    color="#ca8a04"
                                />
                            </View>
                            <Text style={styles.sectionTitle}>Package Protection</Text>
                        </View>
                    </View>

                    <Controller
                        control={control}
                        name="insurance.isInsured"
                        render={({field}) => (
                            <View style={styles.insuranceToggleContainer}>
                                <View style={styles.toggleContent}>
                                    <Text style={styles.toggleTitle}>Include Package Insurance</Text>
                                    <Text style={styles.toggleSubtitle}>
                                        Protection against loss, damage, and theft during delivery
                                    </Text>
                                </View>
                                <Switch
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    trackColor={{false: "#e5e7eb", true: "#fbbf24"}}
                                    thumbColor={field.value ? "#ffffff" : "#f3f4f6"}
                                    ios_backgroundColor="#e5e7eb"
                                />
                            </View>
                        )}
                    />

                    {watchInsurance.isInsured && (
                        <View style={styles.declaredValueContainer}>
                            <Controller
                                control={control}
                                name="insurance.declaredValue"
                                render={({field}) => (
                                    <>
                                        <Text style={styles.inputLabel}>Declared Item Value</Text>
                                        <View style={[styles.valueInputContainer, errors?.insurance?.declaredValue && styles.inputError]}>
                                            <Text style={styles.currencySymbol}>₦</Text>
                                            <TextInput
                                                style={styles.valueInput}
                                                placeholder="50,000"
                                                keyboardType="numeric"
                                                value={field.value?.toLocaleString() || ''}
                                                onChangeText={(value) => {
                                                    const numValue = parseInt(value.replace(/,/g, '')) || 0;
                                                    field.onChange(numValue);
                                                }}
                                            />
                                        </View>
                                        <View style={styles.insuranceCalculation}>
                                            <Text style={styles.premiumText}>
                                                Insurance Fee: {formatCurrency(pricingCalculation.insuranceFee)} (2% of declared value)
                                            </Text>
                                        </View>
                                        {errors?.insurance?.declaredValue && (
                                            <Text style={styles.errorText}>{errors.insurance.declaredValue.message}</Text>
                                        )}
                                    </>
                                )}
                            />
                        </View>
                    )}
                </View>

                {/* Enhanced Pricing Section */}
                <View style={styles.pricingSection}>
                    <LinearGradient
                        colors={['#f8fafc', '#e2e8f0']}
                        style={styles.pricingHeader}
                    >
                        <View style={styles.pricingHeaderContent}>
                            <Ionicons name="card" size={24} color="#475569" />
                            <Text style={styles.pricingTitle}>Total Cost</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.pricingBreakdown}>
                        <View style={styles.pricingItem}>
                            <Text style={styles.pricingLabel}>Delivery Service</Text>
                            <Text style={styles.pricingValue}>{formatCurrency(pricingCalculation.deliveryFee)}</Text>
                        </View>

                        {watchInsurance.isInsured && (
                            <View style={styles.pricingItem}>
                                <Text style={styles.pricingLabel}>Package Insurance</Text>
                                <Text style={styles.pricingValue}>{formatCurrency(pricingCalculation.insuranceFee)}</Text>
                            </View>
                        )}

                        {/* VAT is included but shown for transparency */}
                        <View style={styles.pricingItem}>
                            <Text style={styles.pricingLabelSmall}>VAT (7.5%) - Included</Text>
                            <Text style={styles.pricingValueSmall}>{formatCurrency(pricingCalculation.vat)}</Text>
                        </View>
                    </View>

                    <View style={styles.pricingTotal}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>{formatCurrency(pricingCalculation.total)}</Text>
                    </View>
                </View>

                {/* Proceed to Payment Button */}
                <View style={styles.actionButtonContainer}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.actionButton}
                    >
                        <Pressable
                            style={styles.actionButtonContent}
                            onPress={() => {
                                // This will be handled by parent component or navigation
                                Alert.alert('Proceed to Payment', `Total: ${formatCurrency(pricingCalculation.total)}`);
                            }}
                        >
                            <View style={styles.buttonTextContainer}>
                                <Ionicons name="card" size={20} color="#ffffff" />
                                <Text style={styles.actionButtonText}>
                                    Proceed to Payment • {formatCurrency(pricingCalculation.total)}
                                </Text>
                            </View>
                        </Pressable>
                    </LinearGradient>
                </View>
            {/* bottom space*/}
            <View style={{height: 130}} />
            </View>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 23,
        fontFamily: 'PoppinsBold',
        color: '#ffffff',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: 'rgba(255,255,255,0.9)',

    },
    statusBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PoppinsExtraBold',
        color: '#FFF',
    },
    content: {
        flex: 1,
        marginTop: -20,
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
    },
    // Route Section Styles
    routeSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    routeContainer: {
        padding: 20,
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeIconContainer: {
        marginRight: 16,
        alignItems: 'center',
    },
    routeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    routeDetails: {
        flex: 1,
    },
    routeLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    routeLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginRight: 8,
    },
    routeTypeBadge: {
        backgroundColor: '#dcfce7',
        borderWidth: 1,
        borderColor: '#16a34a',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    routeTypeBadgeText: {
        fontSize: 10,
        fontFamily: 'PoppinsBold',
        color: '#16a34a',
    },
    routeAddress: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        marginBottom: 6,
        lineHeight: 20,
    },
    routeLandmark: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginBottom: 8,
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    contactText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginLeft: 4,
    },
    routeLineContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: '#d1d5db',
    },
    // Section Header Styles
    sectionHeader: {
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    // Package Section Styles
    packageSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    packageContent: {
        padding: 20,
    },
    packageInfo: {
        marginBottom: 20,
    },
    packageInfoRow: {
        marginBottom: 16,
    },
    packageLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
        marginBottom: 6,
    },
    packageBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    categoryBadge: {
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 8,
    },
    categoryBadgeText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#9333ea',
        textTransform: 'capitalize',
    },
    fragileBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    fragileBadgeText: {
        fontSize: 10,
        fontFamily: 'PoppinsSemiBold',
        color: '#f59e0b',
        marginLeft: 4,
    },
    packageDescription: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
    },
    specialInstructionsContainer: {
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        marginTop: 8,
    },
    specialInstructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    specialInstructionsTitle: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#92400e',
        marginLeft: 6,
    },
    specialInstructionsText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#92400e',
        lineHeight: 18,
    },
    imagesContainer: {
        marginTop: 8,
    },
    imagesTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 12,
    },
    imagesScrollView: {
        marginHorizontal: -4,
    },
    imageContainer: {
        marginHorizontal: 4,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    packageImage: {
        width: 100,
        height: 100,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
    },
    // Insurance Section Styles
    insuranceSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    insuranceHeader: {
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    insuranceToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 16,
    },
    toggleContent: {
        flex: 1,
        marginRight: 16,
    },
    toggleTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    toggleSubtitle: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        lineHeight: 18,
    },
    declaredValueContainer: {
        padding: 20,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 8,
    },
    valueInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    currencySymbol: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
        marginRight: 8,
    },
    valueInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    insuranceCalculation: {
        backgroundColor: '#fef7cd',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    premiumText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#92400e',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#ef4444',
    },
    // Pricing Section Styles
    pricingSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    pricingHeader: {
        padding: 20,
        paddingBottom: 16,
    },
    pricingHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pricingTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#1e293b',
        marginLeft: 8,
    },
    pricingBreakdown: {
        paddingHorizontal: 20,
    },
    pricingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    pricingLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
    },
    pricingLabelSmall: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    pricingValue: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    pricingValueSmall: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#9ca3af',
    },
    pricingTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#667eea',
    },
    totalLabel: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#1e293b',
    },
    totalValue: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#667eea',
    },
    // Action Button Styles
    actionButtonContainer: {
        marginHorizontal: 16,
        marginBottom: 32,
        marginTop: 8,
    },
    actionButton: {
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    actionButtonContent: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    buttonTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#ffffff',
        marginLeft: 8,
        textAlign: 'center',
    },
});

export default Review;