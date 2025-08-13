// LocationForm.js - Separate reusable component
import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Controller, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';

import * as Location from 'expo-location';
import {useSavedLocationStore} from "../../../../store/useSavedLocationStore";
import {useRouter} from "expo-router";
import {useMutation} from "@tanstack/react-query";
import ClientUtils from "../../../../utils/ClientUtilities";
import SessionManager from "../../../../lib/SessionManager";
import {COLORS, LOCATION_ICONS, LOCATION_COLORS} from "../../../../utils/Constant";
import locationSchema from "../../../../validators/locationSchema";
import StatusModal from "../../../StatusModal/StatusModal";


function LocationForm({
                          mode,
                          initialData = null,
                          onCancel,
                          isLoading = false
                      }) {
    const {selectedMapLocation, currentEditLocation, clearMapLocation,clearEditLocation} = useSavedLocationStore();
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState(false);
    const [displayCoordinates, setDisplayCoordinates] = useState(null);
    const router = useRouter();

    //status modal rendering
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [modalMessage, setModalMessage] = useState('Saving location...');


    const isEditMode = mode === 'edit' && initialData;

    // Form setup
    const {
        control,
        handleSubmit,
        formState: {errors, isValid},
        setValue,
        reset,
        trigger,
        watch
    } = useForm({
        resolver: yupResolver(locationSchema),
        defaultValues: {
            address: '',
            coordinates: {
                lat: '',
                lng: ''
            },
            landmark: '',
            locationType: 'residential',
            contactPerson: {name: '', phone: '', alternatePhone: ''},
            building: {name: '', floor: '', unit: ''},
            extraInformation: ''
        },
        mode: 'onChange'
    });

    // Mutations
    const createLocationMutation = useMutation({
        mutationFn: ClientUtils.CreateLocation,
        mutationKey: ['CreateLocation'],
    });

    const updateLocationMutation = useMutation({
        mutationFn: ClientUtils.UpdateLocation,
        mutationKey: ['UpdateLocation'],
    });

    // Pre-populate form when editing
    useEffect(() => {
        if (isEditMode && initialData) {
            reset({
                address: initialData.address || '',
                coordinates: {
                    lat: initialData?.coordinates?.lat || '',
                    lng: initialData?.coordinates?.lng || ''
                },
                landmark: initialData.landmark || '',
                locationType: initialData.locationType || 'residential',
                contactPerson: initialData.contactPerson || {name: '', phone: '', alternatePhone: ''},
                building: initialData.building || {name: '', floor: '', unit: ''},
                extraInformation: initialData.extraInformation || ''
            });
            trigger();

            if (initialData.coordinates) {
                setCurrentLocation(initialData.coordinates);
                setDisplayCoordinates(initialData.coordinates);
            }
        } else if (selectedMapLocation) {
            reset({
                address: selectedMapLocation.address || selectedMapLocation.formattedAddress || '',
                coordinates: {
                    lat: selectedMapLocation.latitude?.toFixed(8).toString() || '',
                    lng: selectedMapLocation.longitude?.toFixed(8).toString() || ''
                },
                landmark: '',
                locationType: 'residential',
                contactPerson: {name: '', phone: '', alternatePhone: ''},
                building: {name: '', floor: '', unit: ''},
                extraInformation: ''
            });
            trigger();

            const coordinates = {
                lat: selectedMapLocation.latitude,
                lng: selectedMapLocation.longitude
            };
            setCurrentLocation(coordinates);
            setDisplayCoordinates(coordinates);
        }
    }, [trigger, isEditMode, initialData, selectedMapLocation, reset]);


    // Request location permission
    useEffect(() => {
        requestLocationPermission();
    }, []);
    const requestLocationPermission = async () => {
        try {
            const {status} = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
        } catch (error) {
            console.error('Error requesting location permission:', error);
        }
    };

    const renderLocationTypeSelector = () => {
        const types = ['residential', 'commercial', 'office', 'mall', 'hospital', 'school', 'other'];

        return (
            <>
                <View style={styles.locationTypeContainer}>
                    <Text style={styles.sectionLabel}>Location Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                        {types.map((type) => {
                            const isSelected = watch('locationType') === type;
                            const iconName = LOCATION_ICONS[type];
                            const iconColor = LOCATION_COLORS[type];

                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        isSelected && {backgroundColor: iconColor + '20', borderColor: iconColor}
                                    ]}
                                    onPress={() => setValue('locationType', type)}
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
            </>
        );
    };

    // Handle form submission for creating or updating location
    const handleFormSubmit = (data) => {
        if (!currentLocation) {
            setModalStatus('error');
            setModalMessage('Please select a location on the map first.');
            setModalVisible(true);
            return;
        }
        const locationData = {
            ...data,
            coordinates: currentLocation || {lat: 0, lng: 0}
        };
        setModalStatus('loading');
        setModalMessage(isEditMode ? 'Updating location...' : 'Saving location...');
        setModalVisible(true);

        const mutation = isEditMode
            ? updateLocationMutation
            : createLocationMutation;

        const mutationArgs = isEditMode
            ? {id: initialData._id, data: locationData}
            : locationData;

        mutation.mutate(mutationArgs, {
            onSuccess: async (respData) => {
                const {user} = respData;
                await SessionManager.updateUser(user);

                setModalStatus('success');
                setModalMessage(isEditMode ? 'Location updated successfully!' : 'Location saved successfully!');

                // Auto-close after animation finishes
                setTimeout(() => {
                    clearMapLocation();
                    setModalVisible(false);
                    onCancel();
                }, 1000);
            },
            onError: (error) => {
                setModalStatus('error');
                setModalMessage(error.message || 'Something went wrong. Please try again.');
            }
        });
    };


    return (
        <>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={
                            mode === 'create'
                                ? () => router.back()
                                : () => router.replace('/client/profile/location')
                        }
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark}/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEditMode ? 'Edit Location' : 'Add New Location'}
                    </Text>
                    <View style={styles.headerSpacer}/>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        {/* Address Input and Coordinates  */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address *</Text>
                            <View style={styles.addressInputContainer}>
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({field: {value, onChange, onBlur}}) => (
                                        <TextInput
                                            style={[
                                                styles.input,
                                                styles.addressInput,
                                                errors.address && styles.inputError
                                            ]}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholder="Enter full address"
                                            placeholderTextColor={COLORS.muted}
                                            readOnly={true}
                                            multiline
                                        />
                                    )}
                                />
                                {mode === 'edit' && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.locationButton}
                                            onPress={() => router.push('/client/profile/location/map-picker-edit')}
                                        >
                                            <Ionicons name="location" size={20} color={COLORS.primary}/>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                            {errors.address && (
                                <Text style={styles.errorText}>{errors.address.message}</Text>
                            )}
                            <Text style={styles.helperText}>
                                * To change this address, tap the location icon.
                            </Text>

                            {/* Display coordinates if available */}
                            {displayCoordinates && (
                                <>
                                    <View style={styles.coordinatesContainer}>
                                        <View style={styles.rowInputs}>
                                            <View style={{flex: 0.48}}>
                                                <Text style={styles.coordinatesLabel}>Latitude</Text>
                                                <Controller
                                                    name="coordinates.lat"
                                                    control={control}
                                                    render={({field: {value, onChange, onBlur}}) => (
                                                        <TextInput
                                                            style={[styles.input, styles.halfInput]}
                                                            value={value ? `${value}` : ''}
                                                            onChangeText={onChange}
                                                            onBlur={onBlur}
                                                            placeholder="Latitdue"
                                                            placeholderTextColor={COLORS.muted}
                                                            readOnly={true}
                                                        />
                                                    )}
                                                />
                                            </View>

                                            <View style={{flex: 0.48}}>
                                                <Text style={styles.coordinatesLabel}>Latitude</Text>
                                                <Controller
                                                    name="coordinates.lng"
                                                    control={control}
                                                    render={({field: {value, onChange, onBlur}}) => (
                                                        <TextInput
                                                            style={[styles.input, styles.halfInput]}
                                                            value={value ? `${value}` : ''}
                                                            onChangeText={onChange}
                                                            onBlur={onBlur}
                                                            placeholder="Longitude"
                                                            placeholderTextColor={COLORS.muted}
                                                            readOnly={true}
                                                        />
                                                    )}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                </>

                            )}
                        </View>

                        {/* Location Type Selector */}
                        {renderLocationTypeSelector()}

                        {/* Landmark */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Landmark</Text>
                            <Controller
                                name="landmark"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Nearby landmark (optional)"
                                        placeholderTextColor={COLORS.muted}
                                    />
                                )}
                            />
                        </View>

                        {/* Building Details */}
                        <View style={[styles.sectionContainer, {marginBottom: 20}]}>
                            <Text style={styles.sectionLabel}>Building Details (Optional)</Text>

                            <Controller
                                name="building.name"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Building name"
                                        placeholderTextColor={COLORS.muted}
                                    />
                                )}
                            />

                            <View style={styles.rowInputs}>
                                <Controller
                                    name="building.floor"
                                    control={control}
                                    render={({field: {value, onChange, onBlur}}) => (
                                        <TextInput
                                            style={[styles.input, styles.halfInput]}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholder="Floor"
                                            placeholderTextColor={COLORS.muted}
                                        />
                                    )}
                                />

                                <Controller
                                    name="building.unit"
                                    control={control}
                                    render={({field: {value, onChange, onBlur}}) => (
                                        <TextInput
                                            style={[styles.input, styles.halfInput]}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholder="Unit/Room"
                                            placeholderTextColor={COLORS.muted}
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        {/* Contact Person */}
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionLabel}>Contact Person (Optional)</Text>

                            <Controller
                                name="contactPerson.name"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Contact person name"
                                        placeholderTextColor={COLORS.muted}
                                    />
                                )}
                            />
                            {errors.contactPerson?.name && (
                                <Text style={styles.errorText}>{errors.contactPerson.name.message}</Text>
                            )}

                            <Controller
                                name="contactPerson.phone"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Phone number"
                                        placeholderTextColor={COLORS.muted}
                                        keyboardType="phone-pad"
                                    />
                                )}
                            />
                            {errors.contactPerson?.phone && (
                                <Text style={styles.errorText}>{errors.contactPerson.phone.message}</Text>
                            )}


                            <Controller
                                name="contactPerson.alternatePhone"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Alternater number"
                                        placeholderTextColor={COLORS.muted}
                                        keyboardType="phone-pad"
                                    />
                                )}
                            />
                            {errors.contactPerson?.alternatePhone && (
                                <Text style={styles.errorText}>{errors.contactPerson.alternatePhone.message}</Text>
                            )}
                        </View>


                        {/* Special Instructions */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Additional Information</Text>
                            <Controller
                                name="extraInformation"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        placeholder="Any other address information (optional)"
                                        placeholderTextColor={COLORS.muted}
                                        multiline
                                        numberOfLines={3}
                                    />
                                )}
                            />
                        </View>
                    </ScrollView>

                    {/* Form Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                (!isValid || isLoading) && styles.saveButtonDisabled
                            ]}
                            onPress={handleSubmit(handleFormSubmit)}
                            disabled={!isValid || isLoading}
                        >
                            <Text style={styles.saveButtonText}>
                                {isLoading
                                    ? 'Saving...'
                                    : isEditMode ? 'Update Location' : 'Save Location'
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
                onRetry={() => {
                    setModalVisible(false);
                    handleSubmit(handleFormSubmit)();
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        color: COLORS.text,
        textAlign: 'center',
        fontFamily: 'PoppinsSemiBold',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    form: {
        flex: 1,
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
        marginTop: 16,
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 8,
        fontFamily: 'PoppinsBold',
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.text,
        backgroundColor: COLORS.card,
        fontFamily: 'PoppinsRegular',
    },
    inputError: {
        borderColor: COLORS.error,
    },
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: 2,
        fontFamily: 'PoppinsRegular',
    },
    addressInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressInput: {
        flex: 1,
        minHeight: 60,
        textAlignVertical: 'top',
        marginRight: 8,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.muted,
        marginTop: 4,
        fontFamily: 'PoppinsRegular',
    },
    coordinatesLabel: {
        fontSize: 14,
        color: COLORS.text,
        fontFamily: 'PoppinsSemiBold',
    },
    coordinatesContainer: {
        marginTop: 8,
        backgroundColor: COLORS.light,
    },
    coordinatesText: {
        fontSize: 11,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
        marginTop: 2,
    },
    locationButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
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
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        marginRight: 8,
        minWidth: 100,
    },
    typeText: {
        fontSize: 12,
        color: COLORS.muted,
        marginLeft: 6,
        fontFamily: 'PoppinsRegular',
    },
    sectionContainer: {
        marginBottom: 10,
        justifyContent: 'space-between',
        gap: 10
    },
    rowInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    halfInput: {
        flex: 0.48,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    cancelButton: {
        flex: 0.45,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: COLORS.dark,
    },
    saveButton: {
        flex: 0.45,
        paddingVertical: 10,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: COLORS.muted,
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: 'white',
    },
});

export default LocationForm;