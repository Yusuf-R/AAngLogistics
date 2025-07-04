// ReviewConfirm.js - Final review and confirmation component
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Alert,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ReviewConfirm = ({
                           orderData,
                           estimatedPrice,
                           onEdit,
                           onSubmit,
                           isLoading = false
                       }) => {
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleEdit = (step) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onEdit(step);
    };

    const handleSubmit = () => {
        if (!acceptedTerms) {
            Alert.alert('Terms Required', 'Please accept the terms and conditions to proceed.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSubmit();
    };

    const formatPrice = (price) => {
        if (!price) return 'Calculating...';
        return `₦${price.total?.toLocaleString() || '0'}`;
    };

    const formatAddress = (address) => {
        return address.length > 40 ? `${address.substring(0, 40)}...` : address;
    };

    const getVehicleNames = (vehicles) => {
        if (!vehicles || vehicles.length === 0) return 'None selected';
        return vehicles.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
    };

    const ReviewSection = ({ title, children, onEditPress, stepIndex }) => (
        <View style={styles.reviewSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Pressable
                    style={styles.editButton}
                    onPress={() => handleEdit(stepIndex)}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>
            </View>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    const DetailRow = ({ label, value, highlight = false }) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, highlight && styles.highlightValue]}>
                {value}
            </Text>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.headerTitle}>Review Your Order</Text>
            <Text style={styles.headerSubtitle}>
                Please review all details before confirming your delivery request
            </Text>

            {/* Order Type & Priority */}
            <ReviewSection title="Order Details" stepIndex={0}>
                <DetailRow
                    label="Order Type"
                    value={orderData.orderType?.charAt(0).toUpperCase() + orderData.orderType?.slice(1) || 'Not specified'}
                />
                <DetailRow
                    label="Priority"
                    value={orderData.priority?.charAt(0).toUpperCase() + orderData.priority?.slice(1) || 'Normal'}
                />
                {orderData.scheduledPickup && (
                    <DetailRow
                        label="Scheduled Pickup"
                        value={new Date(orderData.scheduledPickup).toLocaleString()}
                    />
                )}
            </ReviewSection>

            {/* Package Details */}
            <ReviewSection title="Package Information" stepIndex={1}>
                <DetailRow
                    label="Category"
                    value={orderData.package?.category || 'Not specified'}
                />
                {orderData.package?.subcategory && (
                    <DetailRow
                        label="Subcategory"
                        value={orderData.package.subcategory}
                    />
                )}
                <DetailRow
                    label="Description"
                    value={orderData.package?.description || 'No description'}
                />
                {orderData.package?.weight?.value && (
                    <DetailRow
                        label="Weight"
                        value={`${orderData.package.weight.value} ${orderData.package.weight.unit}`}
                    />
                )}
                {orderData.package?.dimensions?.length && (
                    <DetailRow
                        label="Dimensions"
                        value={`${orderData.package.dimensions.length} × ${orderData.package.dimensions.width} × ${orderData.package.dimensions.height} ${orderData.package.dimensions.unit}`}
                    />
                )}
                {orderData.package?.isFragile && (
                    <DetailRow
                        label="Special Handling"
                        value="Fragile - Handle with care"
                        highlight={true}
                    />
                )}
            </ReviewSection>

            {/* Pickup Location */}
            <ReviewSection title="Pickup Location" stepIndex={2}>
                <DetailRow
                    label="Address"
                    value={formatAddress(orderData.pickup?.address || 'Not specified')}
                />
                {orderData.pickup?.contactPerson?.name && (
                    <DetailRow
                        label="Contact Person"
                        value={orderData.pickup.contactPerson.name}
                    />
                )}
                {orderData.pickup?.contactPerson?.phone && (
                    <DetailRow
                        label="Phone"
                        value={orderData.pickup.contactPerson.phone}
                    />
                )}
                {orderData.pickup?.instructions && (
                    <DetailRow
                        label="Instructions"
                        value={orderData.pickup.instructions}
                    />
                )}
            </ReviewSection>

            {/* Delivery Location */}
            <ReviewSection title="Delivery Location" stepIndex={2}>
                <DetailRow
                    label="Address"
                    value={formatAddress(orderData.dropoff?.address || 'Not specified')}
                />
                {orderData.dropoff?.contactPerson?.name && (
                    <DetailRow
                        label="Contact Person"
                        value={orderData.dropoff.contactPerson.name}
                    />
                )}
                {orderData.dropoff?.contactPerson?.phone && (
                    <DetailRow
                        label="Phone"
                        value={orderData.dropoff.contactPerson.phone}
                    />
                )}
                {orderData.dropoff?.instructions && (
                    <DetailRow
                        label="Instructions"
                        value={orderData.dropoff.instructions}
                    />
                )}
            </ReviewSection>

            {/* Vehicle Selection */}
            <ReviewSection title="Vehicle Requirements" stepIndex={3}>
                <DetailRow
                    label="Selected Vehicles"
                    value={getVehicleNames(orderData.vehicleRequirements)}
                />
            </ReviewSection>

            {/* Pricing Summary */}
            {estimatedPrice && (
                <View style={styles.pricingSection}>
                    <Text style={styles.pricingSectionTitle}>Pricing Summary</Text>
                    <View style={styles.pricingContent}>
                        {estimatedPrice.basePrice && (
                            <DetailRow label="Base Price" value={`₦${estimatedPrice.basePrice.toLocaleString()}`} />
                        )}
                        {estimatedPrice.distanceCharge && (
                            <DetailRow label="Distance Charge" value={`₦${estimatedPrice.distanceCharge.toLocaleString()}`} />
                        )}
                        {estimatedPrice.priorityCharge && (
                            <DetailRow label="Priority Charge" value={`₦${estimatedPrice.priorityCharge.toLocaleString()}`} />
                        )}
                        {estimatedPrice.specialHandling && (
                            <DetailRow label="Special Handling" value={`₦${estimatedPrice.specialHandling.toLocaleString()}`} />
                        )}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>{formatPrice(estimatedPrice)}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Terms and Conditions */}
            <View style={styles.termsSection}>
                <Pressable
                    style={styles.termsCheckbox}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAcceptedTerms(!acceptedTerms);
                    }}
                >
                    <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                        {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.termsText}>
                        I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
                style={[styles.submitButton, (!acceptedTerms || isLoading) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!acceptedTerms || isLoading}
            >
                <LinearGradient
                    colors={acceptedTerms && !isLoading ? ['#667eea', '#764ba2'] : ['#94a3b8', '#64748b']}
                    style={styles.submitButtonGradient}
                >
                    <Text style={styles.submitButtonText}>
                        {isLoading ? 'Creating Order...' : 'Confirm & Create Order'}
                    </Text>
                </LinearGradient>
            </Pressable>

            <View style={styles.bottomSpacing} />
        </ScrollView>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center'
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22
    },
    reviewSection: {
        backgroundColor: '#ffffff',
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151'
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 8
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#667eea'
    },
    sectionContent: {
        padding: 16
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1,
        marginRight: 16
    },
    detailValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        flex: 1.5,
        textAlign: 'right'
    },
    highlightValue: {
        color: '#dc2626',
        fontWeight: '600'
    },
    pricingSection: {
        backgroundColor: '#ffffff',
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    pricingSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    pricingContent: {
        padding: 16
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151'
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#667eea'
    },
    termsSection: {
        marginBottom: 24
    },
    termsCheckbox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 4
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 4,
        marginRight: 12,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    checkboxChecked: {
        backgroundColor: '#667eea',
        borderColor: '#667eea'
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    termsText: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        flex: 1
    },
    termsLink: {
        color: '#667eea',
        fontWeight: '500'
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8
    },
    submitButtonDisabled: {
        elevation: 0,
        shadowOpacity: 0
    },
    submitButtonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center'
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff'
    },
    bottomSpacing: {
        height: 100
    }
};

export default ReviewConfirm;