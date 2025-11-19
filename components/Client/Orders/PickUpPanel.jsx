// components/order/PickUpPanel.jsx
import React, {useCallback, useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal
} from 'react-native';
import {Controller, useWatch, useFormContext} from 'react-hook-form';
import {COLORS, LOCATION_ICONS, LOCATION_COLORS} from "../../../utils/Constant";
import {Ionicons, Octicons} from "@expo/vector-icons";
import {stateAndLGA} from '../../../utils/Driver/Constants';

// Convert stateAndLGA object to array format
const NIGERIAN_STATES = Object.keys(stateAndLGA).map(state => ({
    value: state,
    label: state
}));

export default function PickUpPanel({
                                        control,
                                        errors,
                                        savedPlaces = [],
                                        onPersist = () => {},
                                        onOpenMap = () => {},
                                        onValidateAndSave = () => {},
                                        notify = () => {},
                                    }) {
    const {setValue, getValues} = useFormContext();
    const [savedOpen, setSavedOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('address');
    const [isValidating, setIsValidating] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [showLGAModal, setShowLGAModal] = useState(false);
    const [lgas, setLgas] = useState([]);

    const types = ['residential', 'commercial', 'office', 'mall', 'hospital', 'school', 'other'];

    const coords = useWatch({control, name: 'location.pickUp.coordinates.coordinates'});
    const address = useWatch({control, name: 'location.pickUp.address'});
    const contactName = useWatch({control, name: 'location.pickUp.contactPerson.name'});
    const contactPhone = useWatch({control, name: 'location.pickUp.contactPerson.phone'});
    const currentLocationType = useWatch({control, name: 'location.pickUp.locationType'});
    const currentState = useWatch({control, name: 'location.pickUp.state'});
    const currentLga = useWatch({control, name: 'location.pickUp.lga'});

    const isAddressComplete = address && coords && coords.length === 2;
    const isContactComplete = contactName && contactPhone;

    // Update LGAs when state changes
    useEffect(() => {
        if (currentState) {
            setLgas(stateAndLGA[currentState] || []);
            // Reset LGA if it doesn't belong to the new state
            if (currentLga && !stateAndLGA[currentState]?.includes(currentLga)) {
                setValue('location.pickUp.lga', '', {shouldValidate: true});
            }
        }
    }, [currentState]);

    const onSelectSavedPlace = (place) => {
        // Update ALL relevant fields from the saved place
        setValue('location.pickUp.address', place.address || '', {
            shouldValidate: true, shouldDirty: true
        });

        setValue('location.pickUp.coordinates', {
            type: 'Point',
            coordinates: [place.coordinates?.lng ?? 0, place.coordinates?.lat ?? 0]
        }, {shouldValidate: true, shouldDirty: true});

        // Set state and LGA from saved place
        setValue('location.pickUp.state', place.state || '', {
            shouldValidate: true, shouldDirty: true
        });

        setValue('location.pickUp.lga', place.lga || '', {
            shouldValidate: true, shouldDirty: true
        });

        setValue('location.pickUp.landmark', place.landmark || '', {
            shouldValidate: true, shouldDirty: true
        });

        setValue('location.pickUp.contactPerson', place.contactPerson || {
            name: '',
            phone: '',
            alternatePhone: null
        }, {shouldValidate: true, shouldDirty: true});

        setValue('location.pickUp.extraInformation', place.extraInformation || '', {
            shouldValidate: true,
            shouldDirty: true
        });

        setValue('location.pickUp.locationType', place.locationType || 'residential', {
            shouldValidate: true,
            shouldDirty: true
        });

        setValue('location.pickUp.building', place.building || {name: '', floor: '', unit: ''}, {
            shouldValidate: true,
            shouldDirty: true
        });

        setSavedOpen(false);
        notify('info', 'Place applied', 'All location details filled from saved place.');
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
                                    setValue('location.pickUp.locationType', type, {
                                        shouldValidate: true,
                                        shouldDirty: true
                                    });
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
                        setValue('location.pickUp', {
                            address: '',
                            state: '',
                            lga: '',
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

    const renderStateItem = ({item}) => (
        <TouchableOpacity
            style={styles.modalItem}
            onPress={() => {
                setValue('location.pickUp.state', item.value, {
                    shouldValidate: true,
                    shouldDirty: true
                });
                setShowStateModal(false);
            }}
        >
            <Text style={styles.modalItemText}>{item.label}</Text>
            {currentState === item.value && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );

    const renderLGAItem = ({item}) => (
        <TouchableOpacity
            style={styles.modalItem}
            onPress={() => {
                setValue('location.pickUp.lga', item, {
                    shouldValidate: true,
                    shouldDirty: true
                });
                setShowLGAModal(false);
            }}
        >
            <Text style={styles.modalItemText}>{item}</Text>
            {currentLga === item && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );

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
                                        name="location.pickUp.address"
                                        render={({field}) => (
                                            <Pressable onPress={onOpenMap} style={[
                                                styles.addressInput,
                                                styles.addressInputExpanded,
                                                errors?.location?.pickUp?.address && styles.inputError
                                            ]}>
                                                <View style={styles.addressInputContent}>
                                                    <Text style={[
                                                        styles.addressInputText,
                                                        !field.value && styles.addressInputPlaceholder
                                                    ]}>
                                                        {field.value || 'Search pickup address...'}
                                                    </Text>
                                                </View>
                                            </Pressable>
                                        )}
                                    />
                                    <Pressable style={styles.mapIconButton} onPress={onOpenMap}>
                                        <Ionicons name="location-sharp" size={20} color={COLORS.error}/>
                                    </Pressable>
                                </View>
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

                {/* State & LGA Section - NEW */}
                <View style={[styles.section]}>
                    <Pressable onPress={() => setActiveSection('statelga')} style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🗺️ State & LGA</Text>
                        <Text style={[styles.sectionStatus, (currentState && currentLga) && styles.sectionStatusComplete]}>
                            {(currentState && currentLga) ? 'Complete' : 'Required'}
                        </Text>
                    </Pressable>

                    <View style={styles.sectionContent}>
                        {/* State */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>State *</Text>
                            <Controller
                                name="location.pickUp.state"
                                control={control}
                                render={({field: {value}}) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.input,
                                            styles.selectInput,
                                            errors?.location?.pickUp?.state && styles.inputError
                                        ]}
                                        onPress={() => setShowStateModal(true)}
                                    >
                                        <Text style={value ? styles.selectText : styles.selectPlaceholder}>
                                            {value || 'Select State'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={COLORS.muted}/>
                                    </TouchableOpacity>
                                )}
                            />
                            {errors?.location?.pickUp?.state && (
                                <Text style={styles.errorText}>
                                    {errors.location.pickUp.state.message}
                                </Text>
                            )}
                        </View>

                        {/* LGA */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Local Government Area *</Text>
                            <Controller
                                name="location.pickUp.lga"
                                control={control}
                                render={({field: {value}}) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.input,
                                            styles.selectInput,
                                            errors?.location?.pickUp?.lga && styles.inputError,
                                            !currentState && styles.disabledSelect
                                        ]}
                                        onPress={() => currentState && setShowLGAModal(true)}
                                        disabled={!currentState}
                                    >
                                        <Text style={value ? styles.selectText : styles.selectPlaceholder}>
                                            {value || 'Select LGA'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={COLORS.muted}/>
                                    </TouchableOpacity>
                                )}
                            />
                            {errors?.location?.pickUp?.lga && (
                                <Text style={styles.errorText}>
                                    {errors.location.pickUp.lga.message}
                                </Text>
                            )}
                            {!currentState && (
                                <Text style={styles.disabledHint}>
                                    Please select a state first
                                </Text>
                            )}
                        </View>
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
                                            onChangeText={field.onChange}
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
                                        onChangeText={field.onChange}
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
                            <Text style={styles.label}>Alternate Number</Text>
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
                                        onChangeText={field.onChange}
                                    />
                                )}
                            />
                            {errors?.location?.pickUp?.contactPerson?.alternatePhone && (
                                <Text style={styles.errorText}>
                                    {errors.location.pickUp.contactPerson.alternatePhone.message}
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
                                        onChangeText={field.onChange}
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
                                        onChangeText={field.onChange}
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
                                            onChangeText={field.onChange}
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
                                            onChangeText={field.onChange}
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
                                        onChangeText={field.onChange}
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
                    </Pressable>

                    <Pressable style={styles.saveButton} onPress={handleSavePickupData}>
                        <Ionicons name="save" size={24} color="green"/>
                    </Pressable>
                </View>

                <View style={styles.bottomSpacer}/>
            </ScrollView>

            {/* State Modal */}
            <Modal
                visible={showStateModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select State</Text>
                        <TouchableOpacity
                            onPress={() => setShowStateModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <Ionicons name="close" size={24} color={COLORS.text}/>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={NIGERIAN_STATES}
                        keyExtractor={(item) => item.value}
                        renderItem={renderStateItem}
                    />
                </View>
            </Modal>

            {/* LGA Modal */}
            <Modal
                visible={showLGAModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Select LGA ({currentState || 'No State Selected'})
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowLGAModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <Ionicons name="close" size={24} color={COLORS.text}/>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={lgas}
                        keyExtractor={(item) => item}
                        renderItem={renderLGAItem}
                        ListEmptyComponent={
                            <Text style={styles.emptyListText}>
                                No LGAs available for {currentState}
                            </Text>
                        }
                    />
                </View>
            </Modal>
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
    section: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
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
    addressInputText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#1f2937',
        flex: 1,
    },
    addressInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressInputExpanded: {
        flex: 1,
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
    selectInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 16,
        color: '#1f2937',
        fontFamily: 'PoppinsRegular',
    },
    selectPlaceholder: {
        fontSize: 16,
        color: '#9ca3af',
        fontFamily: 'PoppinsRegular',
    },
    disabledSelect: {
        opacity: 0.6,
        backgroundColor: '#f9fafb',
    },
    disabledHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        fontFamily: 'PoppinsRegular',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
        fontFamily: 'PoppinsRegular',
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
    clearButton: {
        backgroundColor: '#fee2e2',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 80,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ef4444',
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
    bottomSpacer: {
        height: 100,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#1e293b',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    modalItemText: {
        fontSize: 16,
        color: '#1f2937',
        fontFamily: 'PoppinsRegular',
    },
    emptyListText: {
        fontSize: 16,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
        padding: 20,
    },
});