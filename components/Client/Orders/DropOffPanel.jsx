// components/order/DropOffPanel.jsx
import React, {useState} from 'react';
import {View, Alert, Text, TextInput, Pressable, FlatList, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {COLORS, LOCATION_ICONS, LOCATION_COLORS} from "../../../utils/Constant";
import {Controller, useWatch, useFormContext} from 'react-hook-form';


import {Ionicons, Octicons} from "@expo/vector-icons";


export default function DropOffPanel({
                                         control,
                                         errors,
                                         savedPlaces = [],
                                         onPersist = () => {
                                         },
                                         onOpenMap = () => {
                                         },
                                         onValidateAndSave = () => {
                                         },
                                         notify = () => {
                                         },
                                     }) {
    const {setValue, getValues} = useFormContext();
    const [savedOpen, setSavedOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('address');
    const [isValidating, setIsValidating] = useState(false);
    const types = ['residential', 'commercial', 'office', 'mall', 'hospital', 'school', 'other'];

    const coords = useWatch({control, name: 'location.dropOff.coordinates.coordinates'});
    const address = useWatch({control, name: 'location.dropOff.address'});
    const contactName = useWatch({control, name: 'location.dropOff.contactPerson.name'});
    const contactPhone = useWatch({control, name: 'location.dropOff.contactPerson.phone'});
    const currentLocationType = useWatch({control, name: 'location.dropOff.locationType'});

    const isAddressComplete = address && coords && coords.length === 2;
    const isContactComplete = contactName && contactPhone;

    const onSelectSavedPlace = (place) => {
        // Update ALL relevant fields from the saved place
        setValue('location.dropOff.address', place.address || '', {
            shouldValidate: true, shouldDirty: true
        });

        setValue('location.dropOff.coordinates', {
            type: 'Point',
            coordinates: [place.coordinates?.lng ?? 0, place.coordinates?.lat ?? 0]
        }, {shouldValidate: true, shouldDirty: true});

        setValue('location.dropOff.landmark', place.landmark || '', {
            shouldValidate: true, shouldDirty: true
        });

        setValue('location.dropOff.contactPerson', place.contactPerson || {
            name: '',
            phone: '',
            alternatePhone: ''
        }, {shouldValidate: true, shouldDirty: true});

        setValue('location.dropOff.extraInformation', place.extraInformation || '', {
            shouldValidate: true,
            shouldDirty: true
        });

        setValue('location.dropOff.locationType', place.locationType || 'residential', {
            shouldValidate: true,
            shouldDirty: true
        });

        setValue('location.dropOff.building', place.building || {name: '', floor: '', unit: ''}, {
            shouldValidate: true,
            shouldDirty: true
        });

        setSavedOpen(false);
        notify('info', 'Place applied', 'Address and coordinates filled from saved place.');
    };

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
                                    setValue('location.dropOff.locationType', type, {
                                        shouldValidate: true,
                                        shouldDirty: true
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

    const handleSavePickupData = async () => {
        setIsValidating(true);
        try {
            await onValidateAndSave();
        } finally {
            setIsValidating(false);
        }
    };

    const handleClearPickupData = () => {
        Alert.alert(
            'Clear Pick-Up Data',
            'Are you sure you want to clear all pick-up data?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setValue('location.dropOff', {
                            address: '',
                            coordinates: {type: 'Point', coordinates: []},
                            contactPerson: {name: '', phone: '', alternatePhone: ''},
                            landmark: '',
                            extraInformation: '',
                            locationType: 'residential',
                            building: {name: '', floor: '', unit: ''}
                        }, {shouldValidate: true, shouldDirty: true});
                        notify('success', 'Data Cleared', 'Pick-up data has been cleared successfully.');
                    }
                }
            ],
            {cancelable: true}
        );
    };

    console.log({
        dt: 'pickOff',
        errors,
    })
    return (
        <>
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
                                <View style={styles.addressInputRow}>
                                    <Controller
                                        control={control}
                                        name="location.dropOff.address"
                                        render={({field}) => (
                                            <Pressable onPress={onOpenMap} style={[
                                                styles.addressInput,
                                                styles.addressInputExpanded, // New style for when there's a button
                                                errors?.location?.dropOff?.address && styles.inputError
                                            ]}>
                                                <View style={styles.addressInputContent}>
                                                    <Text style={[
                                                        styles.addressInputText,
                                                        !field.value && styles.addressInputPlaceholder
                                                    ]}>
                                                        {field.value || 'Search dropOff address...'}
                                                    </Text>
                                                </View>
                                            </Pressable>
                                        )}
                                    />

                                    {/* Map Icon Button */}
                                    <Pressable
                                        style={styles.mapIconButton}
                                        onPress={onOpenMap}
                                    >
                                        <Ionicons name="location-sharp" size={20} color={COLORS.error}/>
                                    </Pressable>
                                </View>
                                {errors?.location?.dropOff?.address && (
                                    <Text style={styles.errorText}>{errors.location.dropOff.address.message}</Text>
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
                                    name="location.dropOff.contactPerson.name"
                                    render={({field}) => (
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors?.location?.dropOff?.contactPerson?.name && styles.inputError
                                            ]}
                                            placeholder="Enter full name"
                                            value={field.value || ''}
                                            onChangeText={(text) => {
                                                field.onChange(text);
                                                // onPersist();
                                            }}
                                        />
                                    )}
                                />
                                {errors?.location?.dropOff?.contactPerson?.name && (
                                    <Text style={styles.errorText}>
                                        {errors.location.dropOff.contactPerson.name.message}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <Controller
                                control={control}
                                name="location.dropOff.contactPerson.phone"
                                render={({field}) => (
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors?.location?.dropOff?.contactPerson?.phone && styles.inputError
                                        ]}
                                        placeholder="e.g., 07012345678 or +2347012345678"
                                        keyboardType="phone-pad"
                                        value={field.value || ''}
                                        onChangeText={(text) => {
                                            field.onChange(text);
                                            // onPersist();
                                        }}
                                    />
                                )}
                            />
                            {errors?.location?.dropOff?.contactPerson?.phone && (
                                <Text style={styles.errorText}>
                                    {errors.location.dropOff.contactPerson.phone.message}
                                </Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Alternate Number</Text>
                            <Controller
                                control={control}
                                name="location.dropOff.contactPerson.alternatePhone"
                                render={({field}) => (
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors?.location?.dropOff?.contactPerson?.alternatePhone && styles.inputError
                                        ]}
                                        placeholder="e.g., 07012345678 or +2347012345678"
                                        keyboardType="phone-pad"
                                        value={field.value || ''}
                                        onChangeText={(text) => {
                                            field.onChange(text);
                                            // onPersist();
                                        }}
                                    />
                                )}
                            />
                            {errors?.location?.dropOff?.contactPerson?.alternatePhone && (
                                <Text style={styles.errorText}>
                                    {errors.location.dropOff.contactPerson.alternatePhone.message}
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
                                name="location.dropOff.landmark"
                                render={({field}) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., Near the big oak tree"
                                        value={field.value || ''}
                                        onChangeText={(text) => {
                                            field.onChange(text);
                                            // onPersist();
                                        }}
                                    />
                                )}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Building</Text>
                            <Controller
                                control={control}
                                name="location.dropOff.building.name"
                                render={({field}) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Building name"
                                        value={field.value || ''}
                                        onChangeText={(text) => {
                                            field.onChange(text);
                                            // onPersist();
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
                                    name="location.dropOff.building.floor"
                                    render={({field}) => (
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Floor"
                                            value={field.value || ''}
                                            onChangeText={(text) => {
                                                field.onChange(text);
                                                // onPersist();
                                            }}
                                        />
                                    )}
                                />
                            </View>
                            <View style={[styles.inputGroup, {flex: 1}]}>
                                <Text style={styles.label}>Unit</Text>
                                <Controller
                                    control={control}
                                    name="location.dropOff.building.unit"
                                    render={({field}) => (
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Unit/Apt"
                                            value={field.value || ''}
                                            onChangeText={(text) => {
                                                field.onChange(text);
                                                // onPersist();
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
                                name="location.dropOff.extraInformation"
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
                                            // onPersist();
                                        }}
                                    />
                                )}
                            />
                        </View>
                    </View>
                </View>

                {/* Control buttons */}
                <View style={styles.buttonSection}>
                    <Pressable style={styles.clearButton} onPress={handleClearPickupData}>
                        <Octicons name="repo-deleted" size={24} color="red"/>
                        {/*<Text style={styles.clearButtonText}>Clear</Text>*/}
                    </Pressable>

                    <Pressable style={styles.saveButton} onPress={handleSavePickupData}>
                        <Ionicons name="save" size={24} color="green"/>
                    </Pressable>
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer}/>
            </ScrollView>
        </>
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
        backgroundColor: '#dcfce7',
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
        tFamily: 'PoppinsRegular',
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
        backgroundColor: '#10b981',
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
        backgroundColor: '#10b981',
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
        borderColor: '#10b981',
        shadowColor: '#10b981',
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
        fontFamily: 'PoppinsMedium',
        backgroundColor: '#dcfce7',
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
        fontSize: 15,
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
    addressInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressInputExpanded: {
        flex: 1, // Takes up remaining space
    },
    mapIconButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 14,
        color: COLORS.text,
        marginTop: 4,
        fontFamily: 'PoppinsSemiBold',
    },
    typeScroll: {
        flexDirection: 'row',
    },
    typeText: {
        fontSize: 12,
        color: COLORS.muted,
        marginLeft: 6,
        fontFamily: 'PoppinsRegular',
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
    locationTypeOption: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    locationTypeOptionActive: {
        borderColor: '#10b981',
        backgroundColor: '#dcfce7',
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#ef4444',
        marginTop: 4,
    },
    buttonSection: {
        marginHorizontal: 50,
        marginVertical: 20,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    saveActions: {
        marginTop: 20,
        marginBottom: 10,
    },
    saveHint: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'green',
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    saveHintIcon: {
        fontSize: 22,
        marginRight: 8,
    },
    saveHintText: {
        flex: 1,
        fontSize: 14,
        color: '#FFF',
        fontFamily: 'PoppinsRegular',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 55
    },
    clearButton: {
        backgroundColor: '#fee2e2',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 80,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    clearButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsMedium',
        color: '#dc2626',
    },
    saveButton: {
        backgroundColor: '#dcfce7',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 80,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#22c55e',
    },
    saveButtonText: {
        fontSize: 15,
        color: '#16a34a',
        fontFamily: 'PoppinsMedium'
    },
    bottomSpacer: {
        height: 100,
    },
});