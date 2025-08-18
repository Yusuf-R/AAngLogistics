// components/order/PickUpPanel.jsx
import React, {useState} from 'react';
import {View, Text, TextInput, Pressable, FlatList, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {Controller, useWatch, useFormContext} from 'react-hook-form';
import {COLORS, LOCATION_ICONS, LOCATION_COLORS} from "../../../utils/Constant";
import {Ionicons} from "@expo/vector-icons";

export default function PickUpPanel({
                                        control,
                                        errors,
                                        savedPlaces = [],
                                        onLocationUpdate = () => {
                                        },
                                        onPersist = () => {
                                        },
                                    }) {
    const {setValue} = useFormContext();
    const [savedOpen, setSavedOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('address');
    const types = ['residential', 'commercial', 'office', 'mall', 'hospital', 'school', 'other'];

    const coords = useWatch({control, name: 'location.pickUp.coordinates.coordinates'});
    const address = useWatch({control, name: 'location.pickUp.address'});
    const contactName = useWatch({control, name: 'location.pickUp.contactPerson.name'});
    const contactPhone = useWatch({control, name: 'location.pickUp.contactPerson.phone'});
    const currentLocationType = useWatch({control, name: 'location.pickUp.locationType'});

    const onOpenAutocomplete = () => {
        // Implement Google Places autocomplete
        console.log('Opening autocomplete...');
    };

    const onSelectSavedPlace = (place) => {
        const locationData = {
            address: place.address || '',
            coordinates: {
                type: 'Point',
                coordinates: [place.coordinates?.lng ?? 0, place.coordinates?.lat ?? 0]
            },
            landmark: place.landmark || '',
            contactPerson: place.contactPerson || {name: '', phone: '', alternatePhone: ''},
            extraInformation: place.extraInformation || '',
            locationType: place.locationType || 'residential',
            building: place.building || {name: '', floor: '', unit: ''}
        };
        onLocationUpdate(locationData);
        setSavedOpen(false);
    };

    const isAddressComplete = address && coords && coords.length === 2;
    const isContactComplete = contactName && contactPhone;

    const renderLocationTypeSelector = () => {

        return (
            <View style={styles.locationTypeContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {types.map((type) => {

                        const isSelected = currentLocationType === type;
                        const iconName = LOCATION_ICONS[type];
                        const iconColor = LOCATION_COLORS[type];
                        return (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeButton,
                                    isSelected && {backgroundColor: iconColor + '20', borderColor: iconColor}
                                ]}
                                onPress={() => {
                                    setValue('location.pickUp.locationType', type, {
                                        shouldDirty: true,
                                        shouldTouch: true
                                    });
                                    // onPersist();
                                }}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={20}
                                    color={isSelected ? iconColor : COLORS.muted}
                                />
                                <Text style={[
                                    styles.typeText,
                                    isSelected && {color: iconColor, fontWeight: '600'}
                                ]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>📍</Text>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Pick-up Location</Text>
                    <Text style={styles.headerSubtitle}>Where should we collect your package?</Text>
                </View>
            </View>

            {/* Progress Steps */}
            <View style={styles.progressSteps}>
                <View style={[styles.progressStep, isAddressComplete && styles.progressStepComplete]}>
                    <Text style={[styles.progressStepText, isAddressComplete && styles.progressStepTextComplete]}>
                        {isAddressComplete ? '✓' : '1'}
                    </Text>
                </View>
                <View style={[styles.progressLine, isAddressComplete && styles.progressLineComplete]}/>
                <View style={[styles.progressStep, isContactComplete && styles.progressStepComplete]}>
                    <Text style={[styles.progressStepText, isContactComplete && styles.progressStepTextComplete]}>
                        {isContactComplete ? '✓' : '2'}
                    </Text>
                </View>
            </View>

            {/* Address Section */}
            <View style={[styles.section]}>
                <Pressable onPress={() => setActiveSection('address')} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📍 Address & Location</Text>
                    <Text style={[styles.sectionStatus, isAddressComplete && styles.sectionStatusComplete]}>
                        {isAddressComplete ? 'Complete' : 'Required'}
                    </Text>
                </Pressable>

                {(activeSection === 'address' || isAddressComplete) && (
                    <View style={styles.sectionContent}>
                        {/* Address Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Search Location</Text>
                            <Controller
                                control={control}
                                name="location.pickUp.address"
                                render={({field}) => (
                                    <Pressable onPress={onOpenAutocomplete} style={[
                                        styles.addressInput,
                                        errors?.location?.pickUp?.address && styles.inputError
                                    ]}>
                                        <View style={styles.addressInputContent}>
                                            <Text style={styles.searchIcon}>🔍</Text>
                                            <Text style={[
                                                styles.addressInputText,
                                                !field.value && styles.addressInputPlaceholder
                                            ]}>
                                                {field.value || 'Search or choose saved place...'}
                                            </Text>
                                        </View>
                                    </Pressable>
                                )}
                            />
                            {errors?.location?.pickUp?.address && (
                                <Text style={styles.errorText}>{errors.location.pickUp.address.message}</Text>
                            )}
                        </View>

                        {/* Saved Places */}
                        {savedPlaces.length > 0 && (
                            <View style={styles.inputGroup}>
                                <Pressable
                                    onPress={() => setSavedOpen(!savedOpen)}
                                    style={styles.savedPlacesHeader}
                                >
                                    <Text style={styles.savedPlacesTitle}>⭐ Saved Places</Text>
                                    <Text style={styles.savedPlacesToggle}>{savedOpen ? '▲' : '▼'}</Text>
                                </Pressable>

                                {savedOpen && (
                                    <View style={styles.savedPlacesList}>
                                        {savedPlaces.map((place, index) => (
                                            <Pressable
                                                key={index}
                                                onPress={() => onSelectSavedPlace(place)}
                                                style={styles.savedPlaceItem}
                                            >
                                                <View style={styles.savedPlaceIcon}>
                                                    <Ionicons
                                                        name={LOCATION_ICONS[place.locationType] || LOCATION_ICONS.other}
                                                        size={20}
                                                        color={LOCATION_COLORS[place.locationType] || LOCATION_COLORS.other}
                                                    />
                                                </View>
                                                <View style={styles.savedPlaceContent}>
                                                    <Text style={styles.savedPlaceTitle} numberOfLines={1}>
                                                        {place.locationType.charAt(0).toUpperCase() + place.locationType.slice(1)}
                                                    </Text>
                                                    <Text style={styles.savedPlaceAddress} numberOfLines={1}>
                                                        {place.address}
                                                    </Text>
                                                </View>
                                                <Text style={styles.savedPlaceArrow}>→</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Coordinates Display */}
                        {coords && coords.length === 2 && (
                            <View style={styles.coordinatesDisplay}>
                                <Text style={styles.coordinatesLabel}>📍 Coordinates</Text>
                                <Text style={styles.coordinatesValue}>
                                    {coords[1].toFixed(6)}, {coords[0].toFixed(6)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Location Type */}
            <View style={[styles.section]}>
                <Pressable onPress={() => setActiveSection('locationType')} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🏢 Location Type</Text>
                    <Text style={styles.sectionStatus}>Optional</Text>
                </Pressable>

                <View style={styles.sectionContent}>
                    {renderLocationTypeSelector()}
                </View>
            </View>

            {/* Contact Section */}
            <View style={[styles.section]}>
                <Pressable onPress={() => setActiveSection('contact')} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>👤 Contact Information</Text>
                    <Text style={[styles.sectionStatus, isContactComplete && styles.sectionStatusComplete]}>
                        {isContactComplete ? 'Complete' : 'Required'}
                    </Text>
                </Pressable>

                <View style={styles.sectionContent}>
                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, {flex: 1}]}>
                            <Text style={styles.label}>Contact Name *</Text>
                            <Controller
                                control={control}
                                name="location.pickUp.contactPerson.name"
                                render={({field}) => (
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors?.location?.pickUp?.contactPerson?.name && styles.inputError
                                        ]}
                                        placeholder="Enter full name"
                                        value={field.value || ''}
                                        onChangeText={(text) => {
                                            field.onChange(text);
                                            onPersist();
                                        }}
                                    />
                                )}
                            />
                            {errors?.location?.pickUp?.contactPerson?.name && (
                                <Text style={styles.errorText}>
                                    {errors.location.pickUp.contactPerson.name.message}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <Controller
                            control={control}
                            name="location.pickUp.contactPerson.phone"
                            render={({field}) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors?.location?.pickUp?.contactPerson?.phone && styles.inputError
                                    ]}
                                    placeholder="e.g., 07012345678 or +2347012345678"
                                    keyboardType="phone-pad"
                                    value={field.value || ''}
                                    onChangeText={(text) => {
                                        field.onChange(text);
                                        onPersist();
                                    }}
                                />
                            )}
                        />
                        {errors?.location?.pickUp?.contactPerson?.phone && (
                            <Text style={styles.errorText}>
                                {errors.location.pickUp.contactPerson.phone.message}
                            </Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Alternate Number *</Text>
                        <Controller
                            control={control}
                            name="location.pickUp.contactPerson.alternatePhone"
                            render={({field}) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors?.location?.pickUp?.contactPerson?.alternatePhone && styles.inputError
                                    ]}
                                    placeholder="e.g., 07012345678 or +2347012345678"
                                    keyboardType="phone-pad"
                                    value={field.value || ''}
                                    onChangeText={(text) => {
                                        field.onChange(text);
                                        onPersist();
                                    }}
                                />
                            )}
                        />
                        {errors?.location?.pickUp?.contactPerson?.phone && (
                            <Text style={styles.errorText}>
                                {errors.location.pickUp.contactPerson.phone.message}
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            {/* Additional Details Section */}
            <View style={styles.section}>
                <Pressable onPress={() => setActiveSection('details')} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🏢 Additional Details</Text>
                    <Text style={styles.sectionStatus}>Optional</Text>
                </Pressable>

                <View style={styles.sectionContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Landmark</Text>
                        <Controller
                            control={control}
                            name="location.pickUp.landmark"
                            render={({field}) => (
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Near the big oak tree"
                                    value={field.value || ''}
                                    onChangeText={(text) => {
                                        field.onChange(text);
                                        onPersist();
                                    }}
                                />
                            )}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Building</Text>
                        <Controller
                            control={control}
                            name="location.pickUp.building.name"
                            render={({field}) => (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Building name"
                                    value={field.value || ''}
                                    onChangeText={(text) => {
                                        field.onChange(text);
                                        onPersist();
                                    }}
                                />
                            )}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                            <Text style={styles.label}>Floor</Text>
                            <Controller
                                control={control}
                                name="location.pickUp.building.floor"
                                render={({field}) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Floor"
                                        value={field.value || ''}
                                        onChangeText={(text) => {
                                            field.onChange(text);
                                            onPersist();
                                        }}
                                    />
                                )}
                            />
                        </View>
                        <View style={[styles.inputGroup, {flex: 1}]}>
                            <Text style={styles.label}>Unit</Text>
                            <Controller
                                control={control}
                                name="location.pickUp.building.unit"
                                render={({field}) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Unit/Apt"
                                        value={field.value || ''}
                                        onChangeText={(text) => {
                                            field.onChange(text);
                                            onPersist();
                                        }}
                                    />
                                )}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Extra Information</Text>
                        <Controller
                            control={control}
                            name="location.pickUp.extraInformation"
                            render={({field}) => (
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Any additional information for the driver..."
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    value={field.value || ''}
                                    onChangeText={(text) => {
                                        field.onChange(text);
                                        onPersist();
                                    }}
                                />
                            )}
                        />
                    </View>
                </View>
            </View>

            {/* Bottom Spacer */}
            <View style={styles.bottomSpacer}/>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
        backgroundColor: '#fee2e2',
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
        fontFamily: 'PoppinsRegular',
        color: '#64748b',
    },
    progressSteps: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    progressStep: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressStepComplete: {
        backgroundColor: '#ef4444',
    },
    progressStepText: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
        color: '#64748b',
    },
    progressStepTextComplete: {
        color: '#ffffff',
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 12,
    },
    progressLineComplete: {
        backgroundColor: '#ef4444',
    },
    section: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    sectionActive: {
        borderColor: '#ef4444',
        shadowColor: '#ef4444',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fafafa',
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#1e293b',
    },
    sectionStatus: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#64748b',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
    },
    sectionStatusComplete: {
        color: '#059669',
        backgroundColor: '#dcfce7',
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
    },
    sectionContent: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#1f2937',
        backgroundColor: '#ffffff',
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    addressInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        minHeight: 48,
    },
    addressInputContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
        color: '#6b7280',
    },
    addressInputText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#1f2937',
        flex: 1,
    },
    addressInputPlaceholder: {
        color: '#9ca3af',
    },
    savedPlacesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    savedPlacesTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
    },
    savedPlacesToggle: {
        fontSize: 12,
        color: '#6b7280',
    },
    savedPlacesList: {
        marginTop: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    savedPlaceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    savedPlaceIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    savedPlaceContent: {
        flex: 1,
    },
    savedPlaceTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#1f2937',
        marginBottom: 2,
    },
    savedPlaceAddress: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
    },
    savedPlaceArrow: {
        fontSize: 16,
        color: '#6b7280',
    },
    coordinatesDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    coordinatesLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#166534',
    },
    coordinatesValue: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#166534',
    },
    locationTypeContainer: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    typeScroll: {
        flexDirection: 'row',
    },
    typeButton: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        minWidth: 80,
    },
    typeText: {
        fontSize: 12,
        color: COLORS.muted,
        marginTop: 4,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
        fontFamily: 'PoppinsRegular',
    },
    bottomSpacer: {
        height: 100,
    },
});