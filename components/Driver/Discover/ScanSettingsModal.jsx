// components/Driver/Discover/ScanSettingsModal.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
// import Slider from '@react-native-community/slider';
import useLogisticStore from '../../../store/Driver/useLogisticStore';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';

const VEHICLE_TYPES = [
    { id: 'bicycle', label: 'Bicycle', icon: 'bicycle' },
    { id: 'motorcycle', label: 'Motorcycle', icon: 'bicycle' },
    { id: 'tricycle', label: 'Tricycle', icon: 'car-sport' },
    { id: 'car', label: 'Car', icon: 'car' },
    { id: 'van', label: 'Van', icon: 'bus' },
    { id: 'truck', label: 'Truck', icon: 'bus' }
];

const PRIORITY_OPTIONS = [
    { id: 'all', label: 'All Orders', description: 'Show all available orders' },
    { id: 'high_priority', label: 'High Priority+', description: 'High and urgent priority only' },
    { id: 'urgent', label: 'Urgent Only', description: 'Only urgent orders' }
];

function ScanSettingsModal({ visible, onClose }) {
    const { scanSettings, updateScanSettings, resetScanSettings } = useLogisticStore();

    // Local state for immediate UI updates
    const [area, setArea] = useState(scanSettings.area);
    const [radius, setRadius] = useState(scanSettings.radius);
    const [vehicleFilter, setVehicleFilter] = useState(scanSettings.vehicleFilter);
    const [priorityFilter, setPriorityFilter] = useState(scanSettings.priorityFilter);
    const [maxDistance, setMaxDistance] = useState(scanSettings.maxDistance);

    const handleVehicleToggle = (vehicleId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (vehicleFilter.includes(vehicleId)) {
            setVehicleFilter(vehicleFilter.filter(v => v !== vehicleId));
        } else {
            setVehicleFilter([...vehicleFilter, vehicleId]);
        }
    };

    const handleSaveSettings = () => {
        const newSettings = {
            area,
            radius,
            vehicleFilter,
            priorityFilter,
            maxDistance
        };

        updateScanSettings(newSettings);
        toast.success('Settings saved successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
    };

    const handleReset = () => {
        resetScanSettings();

        // Update local state to reflect reset
        setArea('current');
        setRadius(5);
        setVehicleFilter([]);
        setPriorityFilter('all');
        setMaxDistance(10);

        toast.info('Settings reset to defaults');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleClose = () => {
        // Revert to saved settings if user cancels
        setArea(scanSettings.area);
        setRadius(scanSettings.radius);
        setVehicleFilter(scanSettings.vehicleFilter);
        setPriorityFilter(scanSettings.priorityFilter);
        setMaxDistance(scanSettings.maxDistance);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Ionicons name="settings" size={24} color="#111827" />
                        <Text style={styles.title}>Scan Settings</Text>
                    </View>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Scan Area Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Scan Area</Text>
                        <Text style={styles.sectionDescription}>
                            Choose how wide you want to search for orders
                        </Text>

                        <View style={styles.optionsContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.areaOption,
                                    area === 'current' && styles.areaOptionActive
                                ]}
                                onPress={() => {
                                    setArea('current');
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <View style={styles.areaOptionHeader}>
                                    <Ionicons
                                        name="location"
                                        size={20}
                                        color={area === 'current' ? '#6366F1' : '#6B7280'}
                                    />
                                    <Text style={[
                                        styles.areaOptionTitle,
                                        area === 'current' && styles.areaOptionTitleActive
                                    ]}>
                                        Current Location
                                    </Text>
                                </View>
                                <Text style={styles.areaOptionDescription}>
                                    Search within {radius}km radius of your location
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.areaOption,
                                    area === 'territorial' && styles.areaOptionActive
                                ]}
                                onPress={() => {
                                    setArea('territorial');
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <View style={styles.areaOptionHeader}>
                                    <Ionicons
                                        name="map"
                                        size={20}
                                        color={area === 'territorial' ? '#6366F1' : '#6B7280'}
                                    />
                                    <Text style={[
                                        styles.areaOptionTitle,
                                        area === 'territorial' && styles.areaOptionTitleActive
                                    ]}>
                                        Territorial (State-wide)
                                    </Text>
                                </View>
                                <Text style={styles.areaOptionDescription}>
                                    Search across your entire state
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Radius Slider (only for current location) */}

                    {area === 'current' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Search Radius</Text>
                            <View style={styles.presetContainer}>
                                {[5, 10, 15, 25, 50].map(preset => (
                                    <TouchableOpacity
                                        key={preset}
                                        style={[
                                            styles.presetButton,
                                            radius === preset && styles.presetButtonActive
                                        ]}
                                        onPress={() => setRadius(preset)}
                                    >
                                        <Text style={[
                                            styles.presetText,
                                            radius === preset && styles.presetTextActive
                                        ]}>
                                            {preset}km
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/*{area === 'current' && (*/}
                    {/*    <View style={styles.section}>*/}
                    {/*        <View style={styles.sliderHeader}>*/}
                    {/*            <Text style={styles.sectionTitle}>Search Radius</Text>*/}
                    {/*            <View style={styles.radiusBadge}>*/}
                    {/*                <Text style={styles.radiusText}>{radius}km</Text>*/}
                    {/*            </View>*/}
                    {/*        </View>*/}
                    {/*        <Slider*/}
                    {/*            style={styles.slider}*/}
                    {/*            minimumValue={1}*/}
                    {/*            maximumValue={50}*/}
                    {/*            step={1}*/}
                    {/*            value={radius}*/}
                    {/*            onValueChange={setRadius}*/}
                    {/*            minimumTrackTintColor="#6366F1"*/}
                    {/*            maximumTrackTintColor="#E5E7EB"*/}
                    {/*            thumbTintColor="#6366F1"*/}
                    {/*        />*/}
                    {/*        <View style={styles.sliderLabels}>*/}
                    {/*            <Text style={styles.sliderLabel}>1km</Text>*/}
                    {/*            <Text style={styles.sliderLabel}>50km</Text>*/}
                    {/*        </View>*/}
                    {/*    </View>*/}
                    {/*)}*/}

                    {/* Max Distance */}
                    <View style={styles.section}>
                        <View style={styles.sliderHeader}>
                            <Text style={styles.sectionTitle}>Maximum Distance</Text>
                            <View style={styles.radiusBadge}>
                                <Text style={styles.radiusText}>{maxDistance}km</Text>
                            </View>
                        </View>
                        <Text style={styles.sectionDescription}>
                            Maximum distance you're willing to travel for pickup
                        </Text>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Maximum Distance</Text>
                            <View style={styles.presetContainer}>
                                {[10, 25, 50, 75, 100].map(preset => (
                                    <TouchableOpacity
                                        key={preset}
                                        style={[
                                            styles.presetButton,
                                            maxDistance === preset && styles.presetButtonActive
                                        ]}
                                        onPress={() => setMaxDistance(preset)}
                                    >
                                        <Text style={[
                                            styles.presetText,
                                            maxDistance === preset && styles.presetTextActive
                                        ]}>
                                            {preset}km
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Vehicle Filter */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vehicle Types</Text>
                        <Text style={styles.sectionDescription}>
                            Select vehicle types you can use (leave empty for all)
                        </Text>

                        <View style={styles.vehicleGrid}>
                            {VEHICLE_TYPES.map(vehicle => (
                                <TouchableOpacity
                                    key={vehicle.id}
                                    style={[
                                        styles.vehicleCard,
                                        vehicleFilter.includes(vehicle.id) && styles.vehicleCardActive
                                    ]}
                                    onPress={() => handleVehicleToggle(vehicle.id)}
                                >
                                    <Ionicons
                                        name={vehicle.icon}
                                        size={24}
                                        color={vehicleFilter.includes(vehicle.id) ? '#6366F1' : '#6B7280'}
                                    />
                                    <Text style={[
                                        styles.vehicleLabel,
                                        vehicleFilter.includes(vehicle.id) && styles.vehicleLabelActive
                                    ]}>
                                        {vehicle.label}
                                    </Text>
                                    {vehicleFilter.includes(vehicle.id) && (
                                        <View style={styles.checkmark}>
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Priority Filter */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Priority Filter</Text>
                        <Text style={styles.sectionDescription}>
                            Choose which priority levels to show
                        </Text>

                        <View style={styles.priorityContainer}>
                            {PRIORITY_OPTIONS.map(option => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.priorityOption,
                                        priorityFilter === option.id && styles.priorityOptionActive
                                    ]}
                                    onPress={() => {
                                        setPriorityFilter(option.id);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <View style={styles.radioOuter}>
                                        {priorityFilter === option.id && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <View style={styles.priorityContent}>
                                        <Text style={[
                                            styles.priorityLabel,
                                            priorityFilter === option.id && styles.priorityLabelActive
                                        ]}>
                                            {option.label}
                                        </Text>
                                        <Text style={styles.priorityDescription}>
                                            {option.description}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Bottom spacing */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleReset}
                    >
                        <Ionicons name="refresh" size={20} color="#6B7280" />
                        <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveSettings}
                    >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Save Settings</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: Platform.OS === 'ios' ? 60 : 20
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    title: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    closeButton: {
        padding: 4
    },

    content: {
        flex: 1,
        paddingHorizontal: 20
    },

    section: {
        marginTop: 24
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 6
    },
    sectionDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 18
    },

    // Scan Area
    optionsContainer: {
        gap: 12
    },
    areaOption: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    areaOptionActive: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF'
    },
    areaOptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6
    },
    areaOptionTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151'
    },
    areaOptionTitleActive: {
        color: '#6366F1'
    },
    areaOptionDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },

    // Slider
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    radiusBadge: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12
    },
    radiusText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },
    slider: {
        width: '100%',
        height: 40
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -8
    },
    sliderLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9CA3AF'
    },

    // Vehicle Grid
    vehicleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    vehicleCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        position: 'relative'
    },
    vehicleCardActive: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF'
    },
    vehicleLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginTop: 8
    },
    vehicleLabelActive: {
        color: '#6366F1'
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#6366F1',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Priority
    priorityContainer: {
        gap: 12
    },
    priorityOption: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    priorityOptionActive: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF'
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        marginRight: 12
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#6366F1'
    },
    priorityContent: {
        flex: 1
    },
    priorityLabel: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 4
    },
    priorityLabelActive: {
        color: '#6366F1'
    },
    priorityDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },

    // Footer
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    resetButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 12
    },
    resetButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        borderRadius: 12
    },
    saveButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff'
    },

    presetContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    presetButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    presetButtonActive: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF'
    },
    presetText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    presetTextActive: {
        color: '#6366F1'
    }
});

export default ScanSettingsModal;