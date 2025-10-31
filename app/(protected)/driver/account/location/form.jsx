// app/(protected)/driver/account/location/form.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLocationStore } from '../../../../../store/Driver/useLocationStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import DriverUtils from '../../../../../utils/DriverUtilities';
import SessionManager from "../../../../../lib/SessionManager";

const LOCATION_TYPES = [
    { value: 'residential', label: 'Residential', icon: 'home' },
    { value: 'commercial', label: 'Commercial', icon: 'business' },
    { value: 'office', label: 'Office', icon: 'briefcase' },
    { value: 'mall', label: 'Mall', icon: 'cart' },
    { value: 'hospital', label: 'Hospital', icon: 'medical' },
    { value: 'school', label: 'School', icon: 'school' },
    { value: 'other', label: 'Other', icon: 'location' },
];

function LocationFormScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { mode, mapData, formData, setFormData, resetLocationStore, editingLocation } = useLocationStore();

    const [errors, setErrors] = useState({});
    const [localData, setLocalData] = useState({
        landmark: formData.landmark || '',
        contactName: formData.contactPerson?.name || '',
        contactPhone: formData.contactPerson?.phone || '',
        alternatePhone: formData.contactPerson?.alternatePhone || '',
        extraInfo: formData.extraInformation || '',
        locationType: formData.locationType || 'residential',
        buildingName: formData.building?.name || '',
        floor: formData.building?.floor || '',
        unit: formData.building?.unit || '',
    });

    // Pre-fill with map data on mount
    useEffect(() => {
        if (mapData.isReady && mode === 'new') {
            setFormData({
                address: mapData.address,
                coordinates: mapData.coordinates,
            });
        }
    }, []);

    // Save location mutation
    const saveLocationMutation = useMutation({
        mutationFn: (locationData) => {
            if (mode === 'edit') {
                return DriverUtils.UpdateLocation({
                    locationId: editingLocation._id,
                    ...locationData
                });
            }
            console.log({
                locationData,
            })
            return DriverUtils.CreateLocation(locationData);
        },
        onSuccess: async (respData) => {
            await SessionManager.updateUser(respData.user);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success(mode === 'edit' ? 'Location updated!' : 'Location saved!');
            resetLocationStore();
            router.replace('/driver/account/location');
        },
        onError: (error) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error(error.message || 'Failed to save location');
        }
    });

    const handleInputChange = (field, value) => {
        setLocalData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!localData.landmark.trim()) {
            newErrors.landmark = 'Landmark is required';
        }

        if (localData.contactPhone && !/^[0-9]{11}$/.test(localData.contactPhone)) {
            newErrors.contactPhone = 'Invalid phone number (11 digits)';
        }

        if (localData.alternatePhone && !/^[0-9]{11}$/.test(localData.alternatePhone)) {
            newErrors.alternatePhone = 'Invalid phone number (11 digits)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error('Form Validation Error');
            return;
        }

        const locationData = {
            address: mode === 'edit' ? formData.address : mapData.address,
            coordinates: mode === 'edit' ? formData.coordinates : mapData.coordinates,
            landmark: localData.landmark,
            contactPerson: {
                name: localData.contactName,
                phone: localData.contactPhone,
                alternatePhone: localData.alternatePhone,
            },
            extraInformation: localData.extraInfo,
            locationType: localData.locationType,
            building: {
                name: localData.buildingName,
                floor: localData.floor,
                unit: localData.unit,
            }
        };

        saveLocationMutation.mutate(locationData);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Location Details</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Address Display (Read-only) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Address</Text>
                    <View style={styles.addressBox}>
                        <Ionicons name="location" size={20} color="#6366F1" />
                        <Text style={styles.addressBoxText}>
                            {mode === 'edit' ? formData.address : mapData.address}
                        </Text>
                    </View>
                    <Text style={styles.helperText}>
                        From map selection • Tap back to change
                    </Text>
                </View>

                {/* Location Type */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location Type *</Text>
                    <View style={styles.typeGrid}>
                        {LOCATION_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.typeCard,
                                    localData.locationType === type.value && styles.typeCardActive
                                ]}
                                onPress={() => {
                                    handleInputChange('locationType', type.value);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Ionicons
                                    name={type.icon}
                                    size={24}
                                    color={localData.locationType === type.value ? '#6366F1' : '#6B7280'}
                                />
                                <Text style={[
                                    styles.typeLabel,
                                    localData.locationType === type.value && styles.typeLabelActive
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Landmark */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Landmark *</Text>
                    <View style={[styles.inputContainer, errors.landmark && styles.inputError]}>
                        <Ionicons name="flag-outline" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Near First Bank"
                            value={localData.landmark}
                            onChangeText={(text) => handleInputChange('landmark', text)}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                    {errors.landmark && (
                        <Text style={styles.errorText}>{errors.landmark}</Text>
                    )}
                </View>

                {/* Building Details (Optional) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Building Details (Optional)</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            placeholder="Building name"
                            value={localData.buildingName}
                            onChangeText={(text) => handleInputChange('buildingName', text)}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputContainer, styles.inputHalf]}>
                            <Ionicons name="layers-outline" size={20} color="#6B7280" />
                            <TextInput
                                style={styles.input}
                                placeholder="Floor"
                                value={localData.floor}
                                onChangeText={(text) => handleInputChange('floor', text)}
                                placeholderTextColor="#9CA3AF"
                                keyboardType="default"
                            />
                        </View>

                        <View style={[styles.inputContainer, styles.inputHalf]}>
                            <Ionicons name="home-outline" size={20} color="#6B7280" />
                            <TextInput
                                style={styles.input}
                                placeholder="Unit"
                                value={localData.unit}
                                onChangeText={(text) => handleInputChange('unit', text)}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>
                </View>

                {/* Contact Person */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Person (Optional)</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            placeholder="Contact name"
                            value={localData.contactName}
                            onChangeText={(text) => handleInputChange('contactName', text)}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={[styles.inputContainer, errors.contactPhone && styles.inputError]}>
                        <Ionicons name="call-outline" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone number"
                            value={localData.contactPhone}
                            onChangeText={(text) => handleInputChange('contactPhone', text)}
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                            maxLength={11}
                        />
                    </View>
                    {errors.contactPhone && (
                        <Text style={styles.errorText}>{errors.contactPhone}</Text>
                    )}

                    <View style={[styles.inputContainer, errors.alternatePhone && styles.inputError]}>
                        <Ionicons name="call-outline" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            placeholder="Alternate phone (optional)"
                            value={localData.alternatePhone}
                            onChangeText={(text) => handleInputChange('alternatePhone', text)}
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                            maxLength={11}
                        />
                    </View>
                    {errors.alternatePhone && (
                        <Text style={styles.errorText}>{errors.alternatePhone}</Text>
                    )}
                </View>

                {/* Extra Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Additional Instructions (Optional)</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                        <Ionicons name="information-circle-outline" size={20} color="#6B7280" style={styles.textAreaIcon} />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Any special delivery instructions..."
                            value={localData.extraInfo}
                            onChangeText={(text) => handleInputChange('extraInfo', text)}
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        saveLocationMutation.isPending && styles.saveButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={saveLocationMutation.isPending}
                >
                    {saveLocationMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>
                                {mode === 'edit' ? 'Update' : 'Create Location'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    addressBox: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        alignItems: 'flex-start',
    },
    addressBoxText: {
        flex: 1,
        marginLeft: 8,
        color: '#374151',
        fontSize: 14,
        lineHeight: 20,
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 6,
        fontStyle: 'italic',
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
        marginBottom: -8,
    },
    typeCard: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    typeCardActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#6366F1',
    },
    typeLabel: {
        marginTop: 8,
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    typeLabelActive: {
        color: '#6366F1',
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 8,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    input: {
        flex: 1,
        height: '100%',
        marginLeft: 8,
        color: '#111827',
        fontSize: 14,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: -4,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    inputHalf: {
        width: '48%',
    },
    textAreaContainer: {
        height: 100,
        alignItems: 'flex-start',
        paddingTop: 12,
    },
    textArea: {
        height: '100%',
        textAlignVertical: 'top',
        paddingVertical: 8,
    },
    textAreaIcon: {
        marginTop: 4,
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    cancelButton: {
        flex: 1,
        marginRight: 12,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    cancelButtonText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        backgroundColor: '#6366F1',
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default LocationFormScreen;
