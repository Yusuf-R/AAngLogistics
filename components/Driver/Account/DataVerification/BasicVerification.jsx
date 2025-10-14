// components/Driver/Account/Verification/BasicVerification.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    Alert,
    Modal,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';


// Import reusable components
import SingleImageUploader from './SingleImageUploader';
import VehicleTypeManager from './VehicleTypeManager';
import BankAccountManager from './BankAccountManager';
import {stateAndLGA} from "../../../../utils/Driver/Constants";


const  NIGERIAN_STATES_LGAS = stateAndLGA;

function BasicVerification({ formData, updateFormData, userData }) {
    const [selectedState, setSelectedState] = useState(formData.operationalState || '');
    const [availableLGAs, setAvailableLGAs] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStatePicker, setShowStatePicker] = useState(false);
    const [showLGAPicker, setShowLGAPicker] = useState(false);
    const [stateSearchQuery, setStateSearchQuery] = useState('');
    const [lgaSearchQuery, setLgaSearchQuery] = useState('');

    const getIdValidation = (idType) => {
        const validations = {
            drivers_license: {
                maxLength: 12,
                hint: '12 characters (e.g., LAG123456789)',
                pattern: /^[A-Z]{3}\d{9}$/
            },
            nigerian_passport: {
                maxLength: 9,
                hint: '9 characters (e.g., A12345678)',
                pattern: /^[A-Z]\d{8}$/
            },
            nin_card: {
                maxLength: 11,
                hint: '11 digits',
                pattern: /^\d{11}$/
            },
            nin_slip: {
                maxLength: 11,
                hint: '11 digits',
                pattern: /^\d{11}$/
            }
        };
        return validations[idType] || { maxLength: 50, hint: '' };
    };

    const handleStateChange = (state) => {
        setSelectedState(state);
        updateFormData({ operationalState: state, operationalLga: '' });

        // Update available LGAs based on selected state
        const lgas = NIGERIAN_STATES_LGAS[state] || [];
        setAvailableLGAs(lgas);
    };

    const handleLGAChange = (lga) => {
        updateFormData({ operationalLga: lga });
    };

    const handleIdentificationTypeChange = (type) => {
        updateFormData({
            identificationType: type,
            identificationNumber: '',
            identificationExpiry: null,
            identificationFrontImage: null,
            identificationBackImage: null
        });
    };

    const needsExpiryDate = () => {
        const { identificationType } = formData;
        return identificationType === 'drivers_license' || identificationType === 'nigerian_passport';
    };

    const needsBackImage = () => {
        const { identificationType } = formData;
        return identificationType === 'drivers_license' || identificationType === 'nin_card';
    };

    const filteredStates = Object.keys(NIGERIAN_STATES_LGAS).filter(state =>
        state.toLowerCase().includes(stateSearchQuery.toLowerCase())
    );

    const filteredLGAs = availableLGAs.filter(lga =>
        lga.toLowerCase().includes(lgaSearchQuery.toLowerCase())
    );

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.sectionTitle}>Basic Verification</Text>
            <Text style={styles.sectionSubtitle}>
                Required for all vehicle types
            </Text>

            {/* Vehicle Type Selection */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Vehicle Type</Text>
                <Text style={styles.cardDescription}>
                    Select your vehicle type
                </Text>
                <VehicleTypeManager
                    selectedType={formData.vehicleType}
                    onSelect={(type) => updateFormData({ vehicleType: type })}
                />
            </View>

            {/* Identification Section */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="card" size={24} color="#10b981" />
                    <Text style={styles.cardTitle}>Means of Identification</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Choose one form of ID
                </Text>

                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.identificationType}
                        onValueChange={handleIdentificationTypeChange}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select ID Type" value={null} />
                        <Picker.Item label="Driver's License" value="drivers_license" />
                        <Picker.Item label="Nigerian Passport" value="nigerian_passport" />
                        <Picker.Item label="NIN Card" value="nin_card" />
                        <Picker.Item label="NIN Slip" value="nin_slip" />
                    </Picker>
                </View>

                {formData.identificationType && (
                    <>
                        <View style={styles.inputWithHint}>
                            <TextInput
                                style={styles.input}
                                placeholder={`Enter ${formData.identificationType.replace('_', ' ')} number`}
                                value={formData.identificationNumber}
                                onChangeText={(text) => updateFormData({ identificationNumber: text })}
                                maxLength={getIdValidation(formData.identificationType).maxLength}
                                autoCapitalize="characters"
                            />
                            <Text style={styles.inputHint}>
                                Hint: {getIdValidation(formData.identificationType).hint}
                            </Text>
                        </View>

                        {needsExpiryDate() && (
                            <>
                                <Pressable
                                    style={styles.dateInputContainer}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar" size={20} color="#6b7280" />
                                    <Text style={[
                                        styles.dateInput,
                                        !formData.identificationExpiry && styles.datePlaceholder
                                    ]}>
                                        {formData.identificationExpiry || "Select Expiry Date"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                                </Pressable>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={formData.identificationExpiry
                                            ? new Date(formData.identificationExpiry.split('/').reverse().join('-'))
                                            : new Date()
                                        }
                                        mode="date"
                                        display="spinner"
                                        minimumDate={new Date()}
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(false);
                                            if (event.type === 'set' && selectedDate) {
                                                const day = selectedDate.getDate().toString().padStart(2, '0');
                                                const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                                                const year = selectedDate.getFullYear();
                                                updateFormData({ identificationExpiry: `${day}/${month}/${year}` });
                                            }
                                        }}
                                    />
                                )}
                            </>
                        )}
                        <SingleImageUploader
                            title="Front View"
                            imageUrl={formData.identificationFrontImage}
                            onUpload={(url) => updateFormData({ identificationFrontImage: url })}
                            onDelete={() => updateFormData({ identificationFrontImage: null })}
                            required={true}
                            uploadMetadata={{
                                category: 'identification',
                                subcategory: formData.identificationType,
                                fileIdentifier: 'front'
                            }}
                        />

                        {needsBackImage() && (
                            <SingleImageUploader
                                title="Back View"
                                imageUrl={formData.identificationBackImage}
                                onUpload={(url) => updateFormData({ identificationBackImage: url })}
                                onDelete={() => updateFormData({ identificationBackImage: null })}
                                required={false}
                                uploadMetadata={{
                                    category: 'identification',
                                    subcategory: formData.identificationType,
                                    fileIdentifier: 'back'
                                }}
                            />
                        )}
                    </>
                )}
            </View>

            {/* Passport Photo */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="person-circle" size={24} color="#10b981" />
                    <Text style={styles.cardTitle}>Passport Photograph</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Clear photo of your face (passport style)
                </Text>

                <SingleImageUploader
                    title="Upload Passport Photo"
                    imageUrl={formData.passportPhoto}
                    onUpload={(url) => updateFormData({ passportPhoto: url })}
                    onDelete={() => updateFormData({ passportPhoto: null })}
                    required={true}
                    uploadMetadata={{
                        category: 'identification',
                        subcategory: 'passport',
                        fileIdentifier: 'front'
                    }}
                />
            </View>

            {/* Operational Area */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="location" size={24} color="#10b981" />
                    <Text style={styles.cardTitle}>Operational Area</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Select your primary operating location
                </Text>

                {/* State Selector */}
                <Pressable
                    style={styles.locationSelector}
                    onPress={() => setShowStatePicker(true)}
                >
                    <Text style={[styles.locationSelectorText, !selectedState && styles.placeholder]}>
                        {selectedState || 'Select State'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </Pressable>

                {/* LGA Selector */}
                {selectedState && (
                    <Pressable
                        style={styles.locationSelector}
                        onPress={() => setShowLGAPicker(true)}
                    >
                        <Text style={[styles.locationSelectorText, !formData.operationalLga && styles.placeholder]}>
                            {formData.operationalLga || 'Select LGA'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </Pressable>
                )}
            </View>

            {/* Bank Account Details */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="wallet" size={24} color="#10b981" />
                    <Text style={styles.cardTitle}>Bank Account Details</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Add at least one bank account for withdrawals
                </Text>

                <BankAccountManager
                    accounts={formData.bankAccounts}
                    onUpdate={(accounts) => updateFormData({ bankAccounts: accounts })}
                />
            </View>

            <View style={styles.progressCard}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.progressText}>
                    Complete all basic information before proceeding to vehicle-specific documents
                </Text>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showStatePicker}
                onRequestClose={() => setShowStatePicker(false)}
            >
                <View style={styles.modalContainer}>
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setShowStatePicker(false)}
                    />
                    <View style={styles.pickerModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select State</Text>
                            <Pressable onPress={() => setShowStatePicker(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#6b7280" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search states..."
                                value={stateSearchQuery}
                                onChangeText={setStateSearchQuery}
                                autoFocus
                            />
                            {stateSearchQuery.length > 0 && (
                                <Pressable onPress={() => setStateSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                                </Pressable>
                            )}
                        </View>

                        <FlatList
                            data={filteredStates}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.locationItem}
                                    onPress={() => {
                                        handleStateChange(item);
                                        setShowStatePicker(false);
                                        setStateSearchQuery('');
                                    }}
                                >
                                    <Text style={styles.locationItemText}>{item}</Text>
                                    {selectedState === item && (
                                        <Ionicons name="checkmark" size={20} color="#10b981" />
                                    )}
                                </Pressable>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={() => (
                                <View style={styles.emptySearch}>
                                    <Text style={styles.emptySearchText}>No states found</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* LGA Picker Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showLGAPicker}
                onRequestClose={() => setShowLGAPicker(false)}
            >
                <View style={styles.modalContainer}>
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setShowLGAPicker(false)}
                    />
                    <View style={styles.pickerModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select LGA</Text>
                            <Pressable onPress={() => setShowLGAPicker(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#6b7280" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search LGAs..."
                                value={lgaSearchQuery}
                                onChangeText={setLgaSearchQuery}
                                autoFocus
                            />
                            {lgaSearchQuery.length > 0 && (
                                <Pressable onPress={() => setLgaSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                                </Pressable>
                            )}
                        </View>

                        <FlatList
                            data={filteredLGAs}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.locationItem}
                                    onPress={() => {
                                        handleLGAChange(item);
                                        setShowLGAPicker(false);
                                        setLgaSearchQuery('');
                                    }}
                                >
                                    <Text style={styles.locationItemText}>{item}</Text>
                                    {formData.operationalLga === item && (
                                        <Ionicons name="checkmark" size={20} color="#10b981" />
                                    )}
                                </Pressable>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={() => (
                                <View style={styles.emptySearch}>
                                    <Text style={styles.emptySearchText}>No LGAs found</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    sectionTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 2
    },
    sectionSubtitle: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginBottom: 12
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    cardDescription: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginBottom: 16,
        lineHeight: 20
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden'
    },
    picker: {
        height: 50
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        color: '#111827'
    },
    datePlaceholder: {
        color: '#9ca3af'
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        gap: 12
    },
    dateInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827'
    },
    progressCard: {
        flexDirection: 'row',
        backgroundColor: '#dbeafe',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
        gap: 12
    },
    progressText: {
        flex: 1,
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 20
    },
    inputWithHint: {
        marginBottom: 16
    },
    inputHint: {
        fontSize: 12,
        color: '#2070FA',
        fontFamily: 'PoppinsSemiBold',
        marginTop: -8,
        marginLeft: 4
    },
    locationSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },
    locationSelectorText: {
        fontSize: 16,
        color: '#111827'
    },
    placeholder: {
        color: '#9ca3af'
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    pickerModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827'
    },
    locationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16
    },
    locationItemText: {
        fontSize: 16,
        color: '#111827'
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e7eb'
    },
    emptySearch: {
        alignItems: 'center',
        paddingVertical: 32
    },
    emptySearchText: {
        fontSize: 14,
        color: '#9ca3af'
    }

});

export default BasicVerification;