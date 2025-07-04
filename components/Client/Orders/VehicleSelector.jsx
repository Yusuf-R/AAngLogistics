// components/VehicleSelector.js
import Ionicons from "@expo/vector-icons/Ionicons";
import {Pressable, ScrollView, Text, StyleSheet} from "react-native";
import * as Haptics from "expo-haptics";

export const VehicleSelector = ({
                                    selectedVehicles,
                                    onVehicleSelect,
                                    recommendedVehicles = [],
                                    packageData,
                                    estimatedPrice
                                }) => {
    const VEHICLE_TYPES = [
        {
            id: 'bicycle',
            name: 'Bicycle',
            icon: 'bicycle',
            capacity: '< 5kg',
            time: '20-30 mins',
            price: 500,
            eco: true,
            suitable: ['document', 'small parcels']
        },
        {
            id: 'motorcycle',
            name: 'Motorcycle',
            icon: 'car-sport',
            capacity: '< 20kg',
            time: '15-25 mins',
            price: 800,
            popular: true,
            suitable: ['document', 'parcel', 'food']
        },
        {
            id: 'tricycle',
            name: 'Tricycle',
            icon: 'car',
            capacity: '< 50kg',
            time: '25-35 mins',
            price: 1200,
            suitable: ['parcel', 'fragile', 'electronics']
        },
        {
            id: 'van',
            name: 'Van',
            icon: 'bus',
            capacity: '< 200kg',
            time: '30-45 mins',
            price: 2000,
            suitable: ['bulk', 'furniture', 'electronics']
        },
        {
            id: 'truck',
            name: 'Truck',
            icon: 'car-outline',
            capacity: '< 1000kg',
            time: '45-60 mins',
            price: 3500,
            suitable: ['heavy items', 'bulk delivery']
        }
    ];

    const handleVehicleToggle = (vehicleId) => {
        const isSelected = selectedVehicles.includes(vehicleId);
        let newSelection;

        if (isSelected) {
            newSelection = selectedVehicles.filter(id => id !== vehicleId);
        } else {
            newSelection = [...selectedVehicles, vehicleId];
        }

        onVehicleSelect(newSelection);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Choose your delivery vehicle</Text>
            <Text style={styles.sectionSubtitle}>
                Select one or more vehicle types. We'll find the best available option.
            </Text>

            {/* Recommended Section */}
            {recommendedVehicles.length > 0 && (
                <View style={styles.recommendedSection}>
                    <Text style={styles.recommendedTitle}>Recommended for your package</Text>
                    <View style={styles.recommendedChips}>
                        {recommendedVehicles.map(vehicleId => {
                            const vehicle = VEHICLE_TYPES.find(v => v.id === vehicleId);
                            return (
                                <Pressable
                                    key={vehicleId}
                                    style={styles.recommendedChip}
                                    onPress={() => handleVehicleToggle(vehicleId)}
                                >
                                    <Text style={styles.recommendedChipText}>{vehicle?.name}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Vehicle Options */}
            <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map(vehicle => {
                    const isSelected = selectedVehicles.includes(vehicle.id);
                    const isRecommended = recommendedVehicles.includes(vehicle.id);

                    return (
                        <Pressable
                            key={vehicle.id}
                            style={[
                                styles.vehicleCard,
                                isSelected && styles.vehicleCardSelected,
                                isRecommended && styles.vehicleCardRecommended
                            ]}
                            onPress={() => handleVehicleToggle(vehicle.id)}
                        >
                            <View style={styles.vehicleHeader}>
                                <View style={styles.vehicleIconContainer}>
                                    <Ionicons name={vehicle.icon} size={32} color={isSelected ? '#fff' : '#667eea'} />
                                </View>

                                <View style={styles.vehicleBadges}>
                                    {vehicle.eco && <View style={styles.ecoBadge}><Text style={styles.badgeText}>ECO</Text></View>}
                                    {vehicle.popular && <View style={styles.popularBadge}><Text style={styles.badgeText}>POPULAR</Text></View>}
                                    {isRecommended && <View style={styles.recommendedBadge}><Text style={styles.badgeText}>BEST</Text></View>}
                                </View>
                            </View>

                            <Text style={[styles.vehicleName, isSelected && styles.vehicleNameSelected]}>
                                {vehicle.name}
                            </Text>

                            <View style={styles.vehicleSpecs}>
                                <View style={styles.specRow}>
                                    <Ionicons name="cube-outline" size={16} color={isSelected ? '#fff' : '#6b7280'} />
                                    <Text style={[styles.specText, isSelected && styles.specTextSelected]}>
                                        {vehicle.capacity}
                                    </Text>
                                </View>
                                <View style={styles.specRow}>
                                    <Ionicons name="time-outline" size={16} color={isSelected ? '#fff' : '#6b7280'} />
                                    <Text style={[styles.specText, isSelected && styles.specTextSelected]}>
                                        {vehicle.time}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.vehiclePrice}>
                                <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                                    from ₦{vehicle.price}
                                </Text>
                            </View>

                            {isSelected && (
                                <View style={styles.selectedIndicator}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>

            {/* Price Estimate */}
            {estimatedPrice && (
                <View style={styles.priceEstimate}>
                    <Text style={styles.estimateTitle}>Estimated Price</Text>
                    <Text style={styles.estimateAmount}>₦{estimatedPrice.totalAmount}</Text>
                    <Text style={styles.estimateNote}>
                        Final price may vary based on distance and availability
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};


// Styles object
const styles = StyleSheet.create({
    container: {flex: 1, padding: 20},
    sectionTitle: {fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8},
    sectionSubtitle: {fontSize: 16, color: '#6b7280', marginBottom: 20},

    // Order Type Styles
    typeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 30},
    typeCardContainer: {flex: 1, minWidth: '45%'},
    typeCard: {borderRadius: 16, overflow: 'hidden', position: 'relative'},
    typeGradient: {padding: 20, minHeight: 120},
    typeHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
    typeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    popularBadge: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    popularText: {fontSize: 10, fontWeight: 'bold', color: '#111827'},
    typeContent: {marginTop: 'auto'},
    typeTitle: {fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4},
    typeSubtitle: {fontSize: 14, color: 'rgba(255,255,255,0.8)'},
    selectionBorder: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16},

    // Quick Reorder Styles
    quickReorderSection: {marginTop: 30},
    quickReorderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2
    },
    reorderIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    reorderContent: {flex: 1},
    reorderTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
    reorderSubtitle: {fontSize: 14, color: '#6b7280', marginTop: 2},
    reorderPrice: {alignItems: 'flex-end'},
    priceText: {fontSize: 16, fontWeight: 'bold', color: '#667eea'},

    // Package Form Styles
    categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24},
    categoryCard: {
        flex: 1,
        minWidth: '30%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: 'white',
        alignItems: 'center'
    },
    categorySelected: {backgroundColor: '#f8fafc'},
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    categoryTitle: {fontSize: 14, fontWeight: '600', textAlign: 'center'},
    popularDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f59e0b'
    },

    inputContainer: {marginBottom: 20},
    inputLabel: {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8},
    textInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 16
    },
    multilineInput: {minHeight: 80, textAlignVertical: 'top'},
    inputError: {borderColor: '#ef4444'},
    errorText: {fontSize: 14, color: '#ef4444', marginTop: 4},

    dimensionsContainer: {marginBottom: 20},
    dimensionsRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    dimensionInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16
    },
    dimensionSeparator: {fontSize: 18, color: '#6b7280', fontWeight: 'bold'},
    unitText: {fontSize: 14, color: '#6b7280', marginLeft: 8},

    weightContainer: {marginBottom: 20},
    weightRow: {flexDirection: 'row', alignItems: 'center'},
    weightInput: {flex: 1, marginRight: 8},

    specialHandlingContainer: {marginBottom: 20},
    toggleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12},
    toggleInfo: {flex: 1},
    toggleTitle: {fontSize: 16, fontWeight: '600', color: '#374151'},
    toggleSubtitle: {fontSize: 14, color: '#6b7280', marginTop: 2},

    advancedToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: '#e5e7eb'
    },
    advancedToggleText: {fontSize: 16, fontWeight: '600', color: '#667eea'},
    advancedContainer: {overflow: 'hidden'},

    // Location Styles
    locationCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb'
    },
    locationCardActive: {borderColor: '#667eea', backgroundColor: '#f8fafc'},
    locationCardError: {borderColor: '#ef4444'},
    locationHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 16},
    locationTypeIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    locationTypeActive: {backgroundColor: '#667eea'},
    locationTypeText: {fontSize: 16, fontWeight: '600', color: '#374151'},
    locationTypeTextActive: {color: '#667eea'},
    locationInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 12
    },
    locationDetails: {flexDirection: 'row', gap: 12, marginBottom: 12},
    contactInput: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        fontSize: 14
    },
    instructionsInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 50,
        textAlignVertical: 'top'
    },

    searchResults: {backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 4},
    searchResultsTitle: {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12},
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    searchResultText: {flex: 1, marginLeft: 12},
    searchResultTitle: {fontSize: 16, fontWeight: '500', color: '#111827'},
    searchResultAddress: {fontSize: 14, color: '#6b7280', marginTop: 2},

    savedLocations: {marginBottom: 20},
    savedLocationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        elevation: 2
    },
    savedLocationText: {fontSize: 14, color: '#374151', marginLeft: 8},

    mapContainer: {marginBottom: 20},
    mapWrapper: {position: 'relative', height: 200, borderRadius: 16, overflow: 'hidden'},
    map: {flex: 1},
    currentLocationButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4
    },

    // Vehicle Styles
    recommendedSection: {marginBottom: 24},
    recommendedTitle: {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12},
    recommendedChips: {flexDirection: 'row', gap: 8},
    recommendedChip: {backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20},
    recommendedChipText: {fontSize: 14, fontWeight: '500', color: 'white'},

    vehicleGrid: {gap: 16, marginBottom: 24},
    vehicleCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        position: 'relative'
    },
    vehicleCardSelected: {borderColor: '#667eea', backgroundColor: '#f8fafc'},
    vehicleCardRecommended: {borderColor: '#f59e0b'},
    vehicleHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16},
    vehicleIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    vehicleBadges: {gap: 4},
    ecoBadge: {backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
    recommendedBadge: {backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
    badgeText: {fontSize: 10, fontWeight: 'bold', color: 'white'},
    vehicleName: {fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12},
    vehicleNameSelected: {color: '#667eea'},
    vehicleSpecs: {gap: 8, marginBottom: 16},
    specRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    specTextSelected: {color: 'white'},
    vehiclePrice: {alignItems: 'center', marginBottom: 12},
    priceTextSelected: {color: 'white'},
    selectedIndicator: {position: 'absolute', top: 16, right: 16},

    // Price Estimate Styles
    priceEstimate: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        elevation: 4
    },
    estimateTitle: {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8},
    estimateAmount: {fontSize: 32, fontWeight: 'bold', color: '#667eea', marginBottom: 8},
    estimateNote: {fontSize: 14, color: '#6b7280', textAlign: 'center'},

    // Suggestions Styles
    suggestionsContainer: {
        marginTop: 8,
        maxHeight: 40
    },
    suggestionChip: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8
    },
    suggestionText: {fontSize: 14, color: '#374151'},

    // Order Summary Styles
    summaryContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        margin: 20,
        elevation: 4
    },
    summaryTitle: {fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16},
    summarySection: {marginBottom: 20},
    summaryLabel: {fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 4},
    summaryValue: {fontSize: 16, color: '#111827', marginBottom: 8},
    summaryDivider: {height: 1, backgroundColor: '#e5e7eb', marginVertical: 16},

    // Pricing Breakdown
    pricingRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
    pricingLabel: {fontSize: 14, color: '#6b7280'},
    pricingValue: {fontSize: 14, fontWeight: '500', color: '#111827'},
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
    },
    totalLabel: {fontSize: 16, fontWeight: 'bold', color: '#111827'},
    totalValue: {fontSize: 18, fontWeight: 'bold', color: '#667eea'},

    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center'
    },
    primaryButton: {
        flex: 2,
        backgroundColor: '#667eea',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center'
    },
    buttonText: {fontSize: 16, fontWeight: '600', color: '#111827'},
    primaryButtonText: {fontSize: 16, fontWeight: '600', color: 'white'},

    // Loading and Error States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {fontSize: 16, color: '#6b7280', marginTop: 16},
    errorContainer: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 16,
        margin: 20,
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    retryButton: {
        backgroundColor: '#dc2626',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 12,
        alignSelf: 'center'
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    }
});

