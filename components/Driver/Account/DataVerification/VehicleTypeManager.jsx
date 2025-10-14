// components/Driver/Account/Verification/VehicleTypeManager.js
import React from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Image,
    Dimensions
} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const vehicleImages = {
    bicycle: require('../../../../assets/images/bicycle.jpg'),
    motorcycle: require('../../../../assets/images/motorcycle.jpg'),
    tricycle: require('../../../../assets/images/tricycle.jpg'),
    car: require('../../../../assets/images/car.jpg'),
    van: require('../../../../assets/images/van.jpg'),
    truck: require('../../../../assets/images/truck.jpg')
};

const VEHICLE_TYPES = [
    { id: 'bicycle', name: 'Bicycle', image: vehicleImages.bicycle },
    { id: 'motorcycle', name: 'Motorcycle', image: vehicleImages.motorcycle },
    { id: 'tricycle', name: 'Tricycle', image: vehicleImages.tricycle },
    { id: 'car', name: 'Car', image: vehicleImages.car },
    { id: 'van', name: 'Van', image: vehicleImages.van },
    { id: 'truck', name: 'Truck', image: vehicleImages.truck }
];

function VehicleTypeManager({ selectedType, onSelect }) {
    return (
        <View style={styles.grid}>
            {VEHICLE_TYPES.map((vehicle) => {
                const isSelected = selectedType === vehicle.id;

                return (
                    <View key={vehicle.id} style={styles.cardContainer}>
                        <Pressable
                            style={[
                                styles.vehicleCard,
                                isSelected && styles.selectedCard
                            ]}
                            onPress={() => onSelect(vehicle.id)}
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

                            {isSelected && (
                                <View style={styles.selectedBadge}>
                                    <Text style={styles.checkmark}>✓</Text>
                                </View>
                            )}
                        </Pressable>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12
    },
    cardContainer: {
        width: (SCREEN_WIDTH - 100) / 2,
        height: 160,
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
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
        shadowColor: '#10b981',
        shadowOpacity: 0.15,
        elevation: 4
    },
    imageContainer: {
        width: '100%',
        height: 120,
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
        fontFamily: 'Poppins-SemiBold',
        color: '#374151',
        letterSpacing: 0.5
    },
    selectedText: {
        color: '#10b981',
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10b981',
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
    }
});

export default VehicleTypeManager;