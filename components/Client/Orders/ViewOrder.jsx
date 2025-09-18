import React, {useState, useEffect} from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Linking,
    Share,
    Dimensions
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import CustomHeader from "../CustomHeader";

const {width} = Dimensions.get('window');

function ViewOrder({selectedOrder, updateOrderStatus}) {

    // ✅ Action handlers
    const handleCallDriver = () => {
        if (selectedOrder.driver?.phone) {
            Linking.openURL(`tel:${selectedOrder.driver.phone}`);
        } else {
            Alert.alert("No Driver Contact", "Driver contact information is not available.");
        }
    };

    const handleCallRecipient = () => {
        if (selectedOrder.recipient?.phone) {
            Linking.openURL(`tel:${selectedOrder.recipient.phone}`);
        } else {
            Alert.alert("No Recipient Contact", "Recipient contact information is not available.");
        }
    };

    const handleShareOrder = async () => {
        try {
            const shareContent = `Order Details\n\nRef: ${selectedOrder.orderRef}\nStatus: ${formatStatus(selectedOrder.status)}\nFrom: ${selectedOrder.location?.pickUp?.address}\nTo: ${selectedOrder.location.dropOff?.address}\nAmount: ₦${selectedOrder.pricing?.totalAmount?.toLocaleString()}`;

            await Share.share({
                message: shareContent,
                title: `Order ${selectedOrder.orderRef}`
            });
        } catch (error) {
            console.log('Error sharing order:', error);
        }
    };

    const handleTrackOrder = () => {
        router.push('/(protected)/client/orders/track');
    };

    const handleCancelOrder = () => {
        Alert.alert(
            "Cancel Order",
            `Are you sure you want to cancel order ${selectedOrder.orderRef}?`,
            [
                {text: "No", style: "cancel"},
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: confirmCancel
                }
            ]
        );
    };

    const confirmCancel = async () => {
        try {
            // Call your cancel API here
            // await cancelOrder(selectedOrder._id);
            updateOrderStatus(selectedOrder._id, 'cancelled');
            Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to cancel order. Please try again.");
        }
    };

    const handleRateOrder = () => {
        router.push('/(protected)/client/orders/rate');
    };

    const handleReorder = () => {
        router.push({
            pathname: '/(protected)/client/orders/create',
            params: {reorderFrom: selectedOrder._id}
        });
    };

    // ✅ Helper functions
    const formatStatus = (status) => {
        const statusMap = {
            'draft': 'DRAFT',
            'pending': 'PENDING',
            'broadcast': 'FINDING DRIVER',
            'assigned': 'ASSIGNED',
            'confirmed': 'CONFIRMED',
            'en_route_pickup': 'EN ROUTE TO PICKUP',
            'arrived_pickup': 'ARRIVED AT PICKUP',
            'picked_up': 'PICKED UP',
            'in_transit': 'IN TRANSIT',
            'arrived_dropoff': 'ARRIVED AT DESTINATION',
            'delivered': 'DELIVERED',
            'cancelled': 'CANCELLED',
            'failed': 'FAILED',
            'returned': 'RETURNED'
        };
        return statusMap[status] || status.toUpperCase();
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'draft': '#F59E0B',
            'pending': '#3B82F6',
            'broadcast': '#06B6D4',
            'assigned': '#10B981',
            'confirmed': '#10B981',
            'en_route_pickup': '#8B5CF6',
            'arrived_pickup': '#8B5CF6',
            'picked_up': '#059669',
            'in_transit': '#059669',
            'arrived_dropoff': '#1D4ED8',
            'delivered': '#7C3AED',
            'cancelled': '#EF4444',
            'failed': '#EF4444',
            'returned': '#DC2626'
        };
        return colorMap[status] || '#6B7280';
    };

    const getPackageIcon = (category) => {
        const iconMap = {
            'document': 'document-text-outline',
            'parcel': 'cube-outline',
            'food': 'restaurant-outline',
            'mobilePhone': 'phone-portrait',
            'laptop': 'laptop',
            'fragile': 'alert-circle-outline',
            'electronics': 'phone-portrait-outline',
            'clothing': 'shirt-outline',
            'cake': 'pie-chart',
            'medicine': 'medical-outline',
            'furniture': 'home-outline',
            'jewelry': 'diamond-outline',
            'gifts': 'gift-outline',
            'books': 'library-outline',
            'others': 'ellipsis-horizontal-circle-outline'
        };
        return iconMap[category] || 'cube-outline';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ✅ Get available actions based on status
    const getAvailableActions = () => {
        const actions = [];

        switch (selectedOrder.status) {
            case 'pending':
            case 'broadcast':
                actions.push({
                    title: 'Cancel Order',
                    icon: 'close-circle-outline',
                    color: '#EF4444',
                    onPress: handleCancelOrder
                });
                break;

            case 'confirmed':
            case 'assigned':
            case 'en_route_pickup':
            case 'arrived_pickup':
            case 'picked_up':
            case 'in_transit':
            case 'arrived_dropoff':
                actions.push({
                    title: 'Track Order',
                    icon: 'location-outline',
                    color: '#8B5CF6',
                    onPress: handleTrackOrder
                });
                if (selectedOrder.driver?.phone) {
                    actions.push({
                        title: 'Call Driver',
                        icon: 'call-outline',
                        color: '#10B981',
                        onPress: handleCallDriver
                    });
                }
                break;

            case 'delivered':
                actions.push({
                    title: 'Rate & Review',
                    icon: 'star-outline',
                    color: '#F59E0B',
                    onPress: handleRateOrder
                });
                actions.push({
                    title: 'Reorder',
                    icon: 'refresh-outline',
                    color: '#10B981',
                    onPress: handleReorder
                });
                break;

            case 'cancelled':
            case 'failed':
                actions.push({
                    title: 'Reorder',
                    icon: 'refresh-outline',
                    color: '#F59E0B',
                    onPress: handleReorder
                });
                break;
        }

        // Always add share action
        actions.push({
            title: 'Share Order',
            icon: 'share-outline',
            color: '#6B7280',
            onPress: handleShareOrder
        });

        return actions;
    };

    const availableActions = getAvailableActions();
    const isHighValue = selectedOrder.flags?.isHighValue || selectedOrder.pricing?.totalAmount > 50000;
    const isUrgent = selectedOrder.flags?.isUrgent || selectedOrder.priority === 'urgent';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff"/>

            {/* Header */}
            <CustomHeader
                title="Order Details"
                onBackPress={() => router.back()}
                rightComponent={
                    <TouchableOpacity onPress={handleShareOrder}>
                        <Ionicons name="share-outline" size={24} color="#374151"/>
                    </TouchableOpacity>
                }
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Order Header Card */}
                <View style={[
                    styles.headerCard,
                    isHighValue && styles.highValueBorder,
                    isUrgent && styles.urgentBorder
                ]}>
                    {/* Priority Badges */}
                    <View style={styles.badgeContainer}>
                        {isUrgent && (
                            <View style={styles.urgentBadge}>
                                <Ionicons name="flash" size={12} color="#FFF"/>
                                <Text style={styles.badgeText}>URGENT</Text>
                            </View>
                        )}
                        {isHighValue && (
                            <View style={styles.highValueBadge}>
                                <Ionicons name="diamond" size={12} color="#FFF"/>
                                <Text style={styles.badgeText}>HIGH VALUE</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.orderRef}>{selectedOrder.orderRef}</Text>
                        <View
                            style={[styles.statusBadge, {backgroundColor: `${getStatusColor(selectedOrder.status)}20`}]}>
                            <Text style={[styles.statusText, {color: getStatusColor(selectedOrder.status)}]}>
                                {formatStatus(selectedOrder.status)}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.orderDate}>
                        Created: {formatDate(selectedOrder.createdAt)}
                    </Text>

                    <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amountValue}>
                            ₦{selectedOrder.pricing?.totalAmount?.toLocaleString() || '0'}
                        </Text>
                    </View>
                </View>

                {/* Package Information */}
                <View style={styles.packageCard}>
                    <Text style={styles.sectionTitle}>Package Details</Text>

                    <View style={styles.packageInfo}>
                        <View style={styles.packageHeader}>
                            <Ionicons
                                name={getPackageIcon(selectedOrder.package?.category)}
                                size={24}
                                color="#6B7280"
                            />
                            <Text style={styles.packageCategory}>
                                {selectedOrder.package?.category || 'General'} Package
                            </Text>
                        </View>

                        {selectedOrder.package?.description && (
                            <Text style={styles.packageDescription}>
                                Description: {selectedOrder.package.description}
                            </Text>
                        )}

                        <View style={styles.packageMeta}>
                            {selectedOrder.package?.weight && (
                                <View style={styles.packageMetaItem}>
                                    <Text style={styles.packageMetaLabel}>Weight:</Text>
                                    <Text style={styles.packageMetaValue}>
                                        {selectedOrder.package.weight.value}kg
                                    </Text>
                                </View>
                            )}

                            {/*{selectedOrder.package?.dimensions && (*/}
                            {/*    <View style={styles.packageMetaItem}>*/}
                            {/*        <Text style={styles.packageMetaLabel}>Size:</Text>*/}
                            {/*        <Text style={styles.packageMetaValue}>*/}
                            {/*            {selectedOrder.package.dimensions?.unit}*/}
                            {/*        </Text>*/}
                            {/*    </View>*/}
                            {/*)}*/}

                            {selectedOrder.package?.value && (
                                <View style={styles.packageMetaItem}>
                                    <Text style={styles.packageMetaLabel}>Value:</Text>
                                    <Text style={styles.packageMetaValue}>
                                        ₦{selectedOrder.package.value.toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Package Flags */}
                        <View style={styles.packageFlags}>
                            {selectedOrder.package?.isFragile && (
                                <View style={styles.packageFlag}>
                                    <Ionicons name="warning" size={14} color="#F59E0B"/>
                                    <Text style={styles.packageFlagText}>Fragile</Text>
                                </View>
                            )}
                            {selectedOrder.package?.requiresSignature && (
                                <View style={styles.packageFlag}>
                                    <Ionicons name="create-outline" size={14} color="#8B5CF6"/>
                                    <Text style={styles.packageFlagText}>Signature Required</Text>
                                </View>
                            )}
                            {selectedOrder.package?.isInsured && (
                                <View style={styles.packageFlag}>
                                    <Ionicons name="shield-checkmark" size={14} color="#10B981"/>
                                    <Text style={styles.packageFlagText}>Insured</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Route Information */}
                <View style={styles.routeCard}>
                    <Text style={styles.sectionTitle}>Route Information</Text>

                    <View style={styles.routeContainer}>
                        {/* Pickup Location */}
                        <View style={styles.locationContainer}>
                            <View style={styles.locationIcon}>
                                <Ionicons name="radio-button-on" size={20} color="#10B981"/>
                            </View>
                            <View style={styles.locationDetails}>
                                <Text style={styles.locationLabel}>Pickup Location</Text>
                                <Text style={styles.locationAddress}>
                                    {selectedOrder.location?.pickUp?.address || 'Address not specified'}
                                </Text>
                                {selectedOrder.location?.pickUp?.landmark && (
                                    <Text style={styles.locationLandmark}>
                                        Near: {selectedOrder.location?.dropOff.landmark}
                                    </Text>
                                )}
                                {selectedOrder.location?.pickUp?.instructions && (
                                    <Text style={styles.locationInstructions}>
                                        Instructions: {selectedOrder.location?.pickUp.instructions}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Route Line */}
                        <View style={styles.routeLine}>
                            <View style={styles.routeDots}>
                                <View style={styles.routeDot}/>
                                <View style={styles.routeDot}/>
                                <View style={styles.routeDot}/>
                            </View>
                        </View>

                        {/* Dropoff Location */}
                        <View style={styles.locationContainer}>
                            <View style={styles.locationIcon}>
                                <Ionicons name="location" size={20} color="#EF4444"/>
                            </View>
                            <View style={styles.locationDetails}>
                                <Text style={styles.locationLabel}>Destination</Text>
                                <Text style={styles.locationAddress}>
                                    {selectedOrder.location?.dropOff?.address || 'Address not specified'}
                                </Text>
                                {selectedOrder.location?.dropOff?.landmark && (
                                    <Text style={styles.locationLandmark}>
                                        Near: {selectedOrder.location?.dropOff.landmark}
                                    </Text>
                                )}
                                {selectedOrder.location?.dropOff?.instructions && (
                                    <Text style={styles.locationInstructions}>
                                        Instructions: {selectedOrder.location?.dropOff.instructions}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {selectedOrder.route?.distance && (
                        <View style={styles.routeStats}>
                            <View style={styles.routeStat}>
                                <Ionicons name="navigate-outline" size={16} color="#6B7280"/>
                                <Text style={styles.routeStatText}>
                                    {selectedOrder.route.distance}km
                                </Text>
                            </View>
                            {selectedOrder.route?.duration && (
                                <View style={styles.routeStat}>
                                    <Ionicons name="time-outline" size={16} color="#6B7280"/>
                                    <Text style={styles.routeStatText}>
                                        {selectedOrder.route.duration} mins
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Driver Information */}
                {selectedOrder.driver && (
                    <View style={styles.driverCard}>
                        <Text style={styles.sectionTitle}>Driver Details</Text>

                        <View style={styles.driverInfo}>
                            <View style={styles.driverHeader}>
                                <View style={styles.driverAvatar}>
                                    <Ionicons name="person" size={24} color="#6B7280"/>
                                </View>
                                <View style={styles.driverDetails}>
                                    <Text style={styles.driverName}>
                                        {selectedOrder.driver.name || 'Driver Name'}
                                    </Text>
                                    <Text style={styles.driverPhone}>
                                        {selectedOrder.driver.phone || 'Phone not available'}
                                    </Text>
                                    {selectedOrder.driver.rating && (
                                        <View style={styles.driverRating}>
                                            <Ionicons name="star" size={14} color="#F59E0B"/>
                                            <Text style={styles.driverRatingText}>
                                                {selectedOrder.driver.rating}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {selectedOrder.driver.vehicle && (
                                <View style={styles.vehicleInfo}>
                                    <Text style={styles.vehicleText}>
                                        {selectedOrder.driver.vehicle.make} {selectedOrder.driver.vehicle.model}
                                    </Text>
                                    <Text style={styles.vehiclePlate}>
                                        {selectedOrder.driver.vehicle.plateNumber}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Recipient Information */}
                {selectedOrder.recipient && (
                    <View style={styles.recipientCard}>
                        <Text style={styles.sectionTitle}>Recipient Details</Text>

                        <View style={styles.recipientInfo}>
                            <Text style={styles.recipientName}>
                                {selectedOrder.recipient.name || 'Recipient Name'}
                            </Text>
                            <Text style={styles.recipientPhone}>
                                {selectedOrder.recipient.phone || 'Phone not available'}
                            </Text>
                            {selectedOrder.recipient.email && (
                                <Text style={styles.recipientEmail}>
                                    {selectedOrder.recipient.email}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Timeline */}
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                    <View style={styles.timelineCard}>
                        <Text style={styles.sectionTitle}>Order Timeline</Text>

                        <View style={styles.timeline}>
                            {selectedOrder.timeline.map((event, index) => (
                                <View key={index} style={styles.timelineItem}>
                                    <View style={styles.timelineIcon}>
                                        <View style={[
                                            styles.timelineDot,
                                            index === 0 && styles.timelineDotActive
                                        ]}/>
                                        {index < selectedOrder.timeline.length - 1 && (
                                            <View style={styles.timelineLine}/>
                                        )}
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.timelineEvent}>
                                            {event.description}
                                        </Text>
                                        <Text style={styles.timelineDate}>
                                            {formatDateTime(event.timestamp)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Pricing Breakdown */}
                {selectedOrder.pricing && (
                    <View style={styles.pricingCard}>
                        <Text style={styles.sectionTitle}>Pricing</Text>

                        <View style={styles.pricingDetails}>
                            {/*{selectedOrder.insurance.declaredValue && (*/}
                            {/*    <View style={styles.pricingRow}>*/}
                            {/*        <Text style={styles.pricingLabel}>Item Declared Value</Text>*/}
                            {/*        <Text style={styles.pricingValue}>*/}
                            {/*            ₦{selectedOrder.insurance.declaredValue.toLocaleString()}*/}
                            {/*        </Text>*/}
                            {/*    </View>*/}
                            {/*)}*/}

                            {/*{selectedOrder.pricing.discount && (*/}
                            {/*    <View style={styles.pricingRow}>*/}
                            {/*        <Text style={[styles.pricingLabel, styles.discountLabel]}>*/}
                            {/*            Discount*/}
                            {/*        </Text>*/}
                            {/*        <Text style={[styles.pricingValue, styles.discountValue]}>*/}
                            {/*            -₦{selectedOrder.pricing.discount.toLocaleString()}*/}
                            {/*        </Text>*/}
                            {/*    </View>*/}
                            {/*)}*/}

                            <View style={styles.pricingDivider}/>

                            <View style={styles.pricingRow}>
                                <Text style={styles.pricingTotalLabel}>Total Amount</Text>
                                <Text style={styles.pricingTotalValue}>
                                    ₦{selectedOrder.pricing.totalAmount.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                {availableActions.length > 0 && (
                    <View style={styles.actionsContainer}>
                        {availableActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.actionButton, {backgroundColor: `${action.color}15`}]}
                                onPress={action.onPress}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={action.icon} size={20} color={action.color}/>
                                <Text style={[styles.actionButtonText, {color: action.color}]}>
                                    {action.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing}/>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    highValueBorder: {
        borderColor: '#F59E0B',
        borderWidth: 2,
    },
    urgentBorder: {
        borderColor: '#EF4444',
        borderWidth: 2,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    highValueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'PoppinsBold',
        marginLeft: 4,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderRef: {
        fontSize: 24,
        color: '#111827',
        fontFamily: 'PoppinsBold',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PoppinsBold',
    },
    orderDate: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        marginBottom: 16,
    },
    amountContainer: {
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 28,
        color: '#111827',
        fontFamily: 'PoppinsBold',
    },
    routeCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'PoppinsBold',
        marginBottom: 16,
    },
    routeContainer: {
        marginBottom: 16,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    locationDetails: {
        flex: 1,
        marginTop: 4,
    },
    locationLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsBold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    locationAddress: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    locationLandmark: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        fontStyle: 'italic',
        marginBottom: 2,
    },
    locationInstructions: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        backgroundColor: '#F9FAFB',
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
    },
    routeLine: {
        marginLeft: 9,
        marginVertical: 12,
    },
    routeDots: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
    },
    routeDot: {
        width: 2,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 1,
    },
    routeStats: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    routeStat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeStatText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    packageCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    packageInfo: {
        gap: 12,
    },
    packageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    packageCategory: {
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsBold',
        textTransform: 'capitalize',
    },
    packageDescription: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        lineHeight: 20,
    },
    packageMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 8,
    },
    packageMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    packageMetaLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        marginRight: 4,
    },
    packageMetaValue: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'PoppinsSemiBold',
    },
    packageFlags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    packageFlag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    packageFlagText: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        marginLeft: 4,
    },
    driverCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    driverInfo: {
        gap: 16,
    },
    driverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsBold',
        marginBottom: 2,
    },
    driverPhone: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    driverRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverRatingText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        marginLeft: 4,
    },
    vehicleInfo: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
    },
    vehicleText: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 4,
    },
    vehiclePlate: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    recipientCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    recipientInfo: {
        gap: 8,
    },
    recipientName: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsBold',
    },
    recipientPhone: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    recipientEmail: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    timelineCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    timeline: {
        marginTop: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timelineIcon: {
        width: 24,
        alignItems: 'center',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#D1D5DB',
    },
    timelineDotActive: {
        backgroundColor: '#10B981',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#D1D5DB',
        marginVertical: 4,
    },
    timelineContent: {
        flex: 1,
        marginLeft: 12,
    },
    timelineEvent: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    timelineDate: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    pricingCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    pricingDetails: {
        gap: 12,
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pricingLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    pricingValue: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
    },
    discountLabel: {
        color: '#10B981',
    },
    discountValue: {
        color: '#10B981',
    },
    pricingDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    pricingTotalLabel: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsSemiBold',
    },
    pricingTotalValue: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsBold',
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    bottomSpacing: {
        height: 32,
    },
});

export default ViewOrder;
