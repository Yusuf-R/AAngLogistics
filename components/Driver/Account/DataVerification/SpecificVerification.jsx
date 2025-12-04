// components/Driver/Account/Verification/SpecificVerification.js
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TextInput, Switch, Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import SingleImageUploader from './SingleImageUploader';
import DateTimePicker from '@react-native-community/datetimepicker';

function SpecificVerification({formData, updateFormData, vehicleType, userData}) {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentDateField, setCurrentDateField] = useState(null);
    const [tempDate, setTempDate] = useState(new Date());
    console.log({
        yr: formData.specificDocs.year
    })

    const updateSpecificDocs = (updates) => {
        updateFormData({
            specificDocs: {...formData.specificDocs, ...updates}
        });
    };

    const isLagosDriver = formData.operationalState?.toLowerCase() === 'lagos';

    const renderVehicleDetailsCard = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="car-outline" size={24} color="#10b981"/>
                <Text style={styles.cardTitle}>Vehicle Details</Text>
            </View>
            <Text style={styles.cardDescription}>
                Basic information about your {getVehicleTypeName().toLowerCase()}
            </Text>

            {/* Plate Number - Not for bicycle */}
            {vehicleType !== 'bicycle' && (
                <>
                    <Text style={styles.inputLabel}>Plate Number *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Plate Number: LAG123AB"
                        placeholderTextColor="#9ca3af"
                        value={formData.specificDocs.plateNumber}
                        onChangeText={(text) => updateSpecificDocs({plateNumber: text.toUpperCase()})}
                        autoCapitalize="characters"
                    />
                </>
            )}
            <View>
                <Text style={styles.inputLabel}>Model *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Model (e.g., BMX, Honda, Toyota, BMW)"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.model}
                    onChangeText={(text) => updateSpecificDocs({model: text})}
                />
            </View>

            <View>
                <Text style={styles.inputLabel}>Year *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Year"
                    value={formData.specificDocs.year?.toString()}
                    placeholderTextColor="#9ca3af"
                    onChangeText={(text) => updateSpecificDocs({
                        year: text ? parseInt(text) : '' // Convert back to number
                    })}
                    keyboardType="numeric"
                    maxLength={4}
                />
            </View>

            <View>
                <Text style={styles.inputLabel}>Color *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Color"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.color}
                    onChangeText={(text) => updateSpecificDocs({color: text})}
                />
            </View>

            {renderCapacityInputs()}
        </View>
    );

    const renderCapacityInputs = () => {
        switch (vehicleType) {
            case 'bicycle':
                return (
                    <>
                        <Text style={styles.inputLabel}>Weight Capacity (kg) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Weight Capacity (kg)"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.capacity?.weight?.toString()}
                            onChangeText={(text) => updateSpecificDocs({
                                capacity: {...formData.specificDocs.capacity, weight: parseInt(text) || 0}
                            })}
                            keyboardType="numeric"
                        />
                    </>
                );

            case 'motorcycle':
                return (
                    <>
                        <Text style={styles.inputLabel}>Weight Capacity (kg) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Weight Capacity (kg)"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.capacity?.weight?.toString()}
                            onChangeText={(text) => updateSpecificDocs({
                                capacity: {...formData.specificDocs.capacity, weight: parseInt(text) || 0}
                            })}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Passenger Capacity *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Passenger Capacity"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.capacity?.passengers?.toString()}
                            onChangeText={(text) => updateSpecificDocs({
                                capacity: {...formData.specificDocs.capacity, passengers: parseInt(text) || 0}
                            })}
                            keyboardType="numeric"
                        />
                    </>
                );

            case 'tricycle':
                return (
                    <>
                        <Text style={styles.inputLabel}>Weight Capacity (kg) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Weight Capacity (kg)"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.capacity?.weight?.toString()}
                            onChangeText={(text) => updateSpecificDocs({
                                capacity: {...formData.specificDocs.capacity, weight: parseInt(text) || 0}
                            })}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Passenger Capacity *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Passenger Capacity"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.capacity?.passengers?.toString()}
                            onChangeText={(text) => updateSpecificDocs({
                                capacity: {...formData.specificDocs.capacity, passengers: parseInt(text) || 0}
                            })}
                            keyboardType="numeric"
                        />
                    </>
                );

            case 'car':
            case 'van':
            case 'truck':
                return (
                    <>
                        <Text style={styles.inputLabel}>Weight Capacity (kg) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Weight Capacity (kg)"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.capacity?.weight?.toString()}
                            onChangeText={(text) => updateSpecificDocs({
                                capacity: {...formData.specificDocs.capacity, weight: parseInt(text) || 0}
                            })}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Volume Capacity (cubic meters) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="#9ca3af"
                            placeholder="Volume Capacity (cubic meters)"
                            value={formData.specificDocs.capacity?.volume?.toString()}
                            onChangeText={(text) => updateSpecificDocs({
                                capacity: {...formData.specificDocs.capacity, volume: parseFloat(text) || 0}
                            })}
                            keyboardType="decimal-pad"
                        />

                        <Text style={styles.inputLabel}>Passenger Capacity *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Passenger Capacity"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.capacity?.passengers?.toString()}
                            onChangeText={(text) => updateSpecificDocs({
                                capacity: {...formData.specificDocs.capacity, passengers: parseInt(text) || 0}
                            })}
                            keyboardType="numeric"
                        />
                    </>
                );

            default:
                return null;
        }
    };

    const renderBicycleVerification = () => (
        <>
            {renderVehicleDetailsCard()}

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="shield-checkmark" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Safety Equipment</Text>
                </View>

                <View style={styles.switchContainer}>
                    <View style={styles.switchLabel}>
                        <Text style={styles.switchTitle}>Do you have a helmet?</Text>
                        <Text style={styles.switchDescription}>
                            Not mandatory but highly recommended for safety
                        </Text>
                    </View>
                    <Switch
                        value={formData.specificDocs.hasHelmet || false}
                        onValueChange={(value) => updateSpecificDocs({hasHelmet: value})}
                        trackColor={{false: '#d1d5db', true: '#10b981'}}
                        thumbColor="#fff"
                    />
                </View>

                {!formData.specificDocs.hasHelmet && (
                    <View style={styles.warningCard}>
                        <Ionicons name="warning" size={20} color="#f59e0b"/>
                        <Text style={styles.warningText}>
                            Please consider getting a helmet for your safety during deliveries
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="bag-handle" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Delivery Equipment</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Upload picture of your delivery backpack
                </Text>

                <SingleImageUploader
                    title="Backpack Evidence"
                    description="Clear photo showing your delivery backpack"
                    imageUrl={formData.specificDocs.backpackEvidence}
                    onUpload={(url) => updateSpecificDocs({backpackEvidence: url})}
                    onDelete={() => updateSpecificDocs({backpackEvidence: null})}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'backPack'
                    }}
                />

            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="bicycle" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Bicycle Pictures</Text>
                </View>

                <SingleImageUploader
                    title="Front View"
                    imageUrl={formData.specificDocs.bicyclePictures?.front}
                    onUpload={(url) => updateSpecificDocs({
                        bicyclePictures: {...formData.specificDocs.bicyclePictures, front: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        bicyclePictures: {...formData.specificDocs.bicyclePictures, front: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'front'
                    }}
                />

                <SingleImageUploader
                    title="Rear View"
                    imageUrl={formData.specificDocs.bicyclePictures?.rear}
                    onUpload={(url) => updateSpecificDocs({
                        bicyclePictures: {...formData.specificDocs.bicyclePictures, rear: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        bicyclePictures: {...formData.specificDocs.bicyclePictures, rear: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'rear'
                    }}
                />


                <SingleImageUploader
                    title="Side View"
                    imageUrl={formData.specificDocs.bicyclePictures?.side}
                    onUpload={(url) => updateSpecificDocs({
                        bicyclePictures: {...formData.specificDocs.bicyclePictures, side: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        bicyclePictures: {...formData.specificDocs.bicyclePictures, side: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'side'
                    }}
                />

            </View>
        </>
    );

    const renderTricycleVerification = () => (
        <>
            {renderVehicleDetailsCard()}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="camera" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Tricycle Pictures</Text>
                </View>

                <SingleImageUploader
                    title="Front View"
                    imageUrl={formData.specificDocs.pictures?.front}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, front: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, front: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'front'
                    }}
                />

                <SingleImageUploader
                    title="Rear View"
                    imageUrl={formData.specificDocs.pictures?.rear}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, rear: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, rear: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'rear'
                    }}
                />

                <SingleImageUploader
                    title="Side View"
                    imageUrl={formData.specificDocs.pictures?.side}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, side: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, side: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'side'
                    }}
                />
                <SingleImageUploader
                    title="Inside View"
                    imageUrl={formData.specificDocs.pictures?.inside}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, inside: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, inside: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'inside'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="card" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Driver's License</Text>
                </View>

                <Text style={styles.inputLabel}>License Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="License Number"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.driversLicense?.number}
                    onChangeText={(text) => updateSpecificDocs({
                        driversLicense: {...formData.specificDocs.driversLicense, number: text}
                    })}
                />

                <DatePickerField
                    label="Expiry Date"
                    value={formData.specificDocs.driversLicense?.expiryDate}
                    fieldPath="driversLicense.expiryDate"
                    required={true}
                />

                <SingleImageUploader
                    title="License Photo"
                    imageUrl={formData.specificDocs.driversLicense?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        driversLicense: {...formData.specificDocs.driversLicense, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        driversLicense: {...formData.specificDocs.driversLicense, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'LicencePhoto'
                    }}
                />

            </View>

            {isLagosDriver && (
                <>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={24} color="#10b981"/>
                            <Text style={styles.cardTitle}>Hackney Permit</Text>
                        </View>
                        <Text style={styles.cardDescription}>Required for Lagos drivers</Text>

                        <Text style={styles.inputLabel}>Permit Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Permit Number"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.hackneyPermit?.number}
                            onChangeText={(text) => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, number: text}
                            })}
                        />

                        <SingleImageUploader
                            title="Permit Photo"
                            imageUrl={formData.specificDocs.hackneyPermit?.imageUrl}
                            onUpload={(url) => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, imageUrl: url}
                            })}
                            onDelete={() => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, imageUrl: null}
                            })}
                            required={true}
                            uploadMetadata={{
                                category: 'vehicleDocument',
                                subcategory: formData.vehicleType,
                                fileIdentifier: 'PermitPhoto'
                            }}
                        />
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={24} color="#10b981"/>
                            <Text style={styles.cardTitle}>LASDRI Card</Text>
                        </View>
                        <Text style={styles.cardDescription}>Required for Lagos drivers</Text>

                        <Text style={styles.inputLabel}>LASDRI Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="LASDRI Number"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.lasdriCard?.number}
                            onChangeText={(text) => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, number: text}
                            })}
                        />

                        <SingleImageUploader
                            title="LASDRI Card Photo"
                            imageUrl={formData.specificDocs.lasdriCard?.imageUrl}
                            onUpload={(url) => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, imageUrl: url}
                            })}
                            onDelete={() => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, imageUrl: null}
                            })}
                            required={true}
                            uploadMetadata={{
                                category: 'vehicleDocument',
                                subcategory: formData.vehicleType,
                                fileIdentifier: 'LSDRIphoto'
                            }}
                        />

                    </View>
                </>
            )}
        </>
    );

    const renderMotorcycleVerification = () => (
        <>
            {renderVehicleDetailsCard()}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="camera" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Motorcycle Pictures</Text>
                </View>

                <SingleImageUploader
                    title="Front View"
                    imageUrl={formData.specificDocs.pictures?.front}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, front: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, front: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'front'
                    }}
                />

                <SingleImageUploader
                    title="Rear View"
                    imageUrl={formData.specificDocs.pictures?.rear}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, rear: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, rear: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'rear'
                    }}
                />
                <SingleImageUploader
                    title="Side View"
                    imageUrl={formData.specificDocs.pictures?.side}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, side: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, side: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'side'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="card" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Rider's Permit/Card</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Obtained from Lagos State MVAA office
                </Text>

                <Text style={styles.inputLabel}>Card Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Card Number"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.ridersPermit?.cardNumber}
                    onChangeText={(text) => updateSpecificDocs({
                        ridersPermit: {...formData.specificDocs.ridersPermit, cardNumber: text}
                    })}
                />

                <Text style={styles.inputLabel}>Issuing Office *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Issuing Office"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.ridersPermit?.issuingOffice}
                    onChangeText={(text) => updateSpecificDocs({
                        ridersPermit: {...formData.specificDocs.ridersPermit, issuingOffice: text}
                    })}
                />

                <SingleImageUploader
                    title="Permit Photo"
                    imageUrl={formData.specificDocs.ridersPermit?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        ridersPermit: {...formData.specificDocs.ridersPermit, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        ridersPermit: {...formData.specificDocs.ridersPermit, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'PermitPhoto'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="document" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Commercial Motorcycle License</Text>
                </View>
                <Text style={styles.cardDescription}>
                    FRSC designated - Class A for motorcycles
                </Text>

                <Text style={styles.inputLabel}>License Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="License Number"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.commercialLicense?.licenseNumber}
                    onChangeText={(text) => updateSpecificDocs({
                        commercialLicense: {...formData.specificDocs.commercialLicense, licenseNumber: text}
                    })}
                />

                <Text style={styles.inputLabel}>Class (e.g., A) *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Class (e.g., A)"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.commercialLicense?.class}
                    onChangeText={(text) => updateSpecificDocs({
                        commercialLicense: {...formData.specificDocs.commercialLicense, class: text}
                    })}
                />

                <SingleImageUploader
                    title="License Photo"
                    imageUrl={formData.specificDocs.commercialLicense?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        commercialLicense: {...formData.specificDocs.commercialLicense, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        commercialLicense: {...formData.specificDocs.commercialLicense, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'LicensePhoto'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="home" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Proof of Address</Text>
                </View>
                <Text style={styles.cardDescription}>
                    NEPA bill or utility bill
                </Text>

                <SingleImageUploader
                    title="Utility Bill"
                    imageUrl={formData.specificDocs.proofOfAddress?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        proofOfAddress: {
                            ...formData.specificDocs.proofOfAddress,
                            imageUrl: url,
                            documentType: 'utility_bill'
                        }
                    })}
                    onDelete={() => updateSpecificDocs({
                        proofOfAddress: {...formData.specificDocs.proofOfAddress, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'UtilityBill'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="receipt" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Proof of Ownership</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Change of ownership document or receipt
                </Text>

                <SingleImageUploader
                    title="Ownership Document"
                    imageUrl={formData.specificDocs.proofOfOwnership?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        proofOfOwnership: {...formData.specificDocs.proofOfOwnership, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        proofOfOwnership: {...formData.specificDocs.proofOfOwnership, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'ownerShip'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="checkmark-done" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Road Worthiness</Text>
                </View>

                <Text style={styles.inputLabel}>Certificate Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Certificate Number"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.roadWorthiness?.certificateNumber}
                    onChangeText={(text) => updateSpecificDocs({
                        roadWorthiness: {...formData.specificDocs.roadWorthiness, certificateNumber: text}
                    })}
                />

                <DatePickerField
                    label="Expiry Date"
                    value={formData.specificDocs.roadWorthiness?.expiryDate}
                    fieldPath="roadWorthiness.expiryDate"
                    required={true}
                />

                <SingleImageUploader
                    title="Certificate Photo"
                    imageUrl={formData.specificDocs.roadWorthiness?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        roadWorthiness: {...formData.specificDocs.roadWorthiness, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        roadWorthiness: {...formData.specificDocs.roadWorthiness, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'roadWorthiness'
                    }}
                />
            </View>

            {isLagosDriver && (
                <>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={24} color="#10b981"/>
                            <Text style={styles.cardTitle}>Hackney Permit</Text>
                        </View>
                        <Text style={styles.cardDescription}>Required for Lagos drivers</Text>

                        <Text style={styles.inputLabel}>Hackney Permit Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Permit Number"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.hackneyPermit?.number}
                            onChangeText={(text) => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, number: text}
                            })}
                        />

                        <DatePickerField
                            label="Expiry Date"
                            value={formData.specificDocs.hackneyPermit?.expiryDate}
                            fieldPath="hackneyPermit.expiryDate"
                            required={true}
                        />

                        <SingleImageUploader
                            title="Hackney Permit"
                            imageUrl={formData.specificDocs.hackneyPermit?.imageUrl}
                            onUpload={(url) => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, imageUrl: url}
                            })}
                            onDelete={() => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, imageUrl: null}
                            })}
                            required={true}
                            uploadMetadata={{
                                category: 'vehicleDocument',
                                subcategory: formData.vehicleType,
                                fileIdentifier: 'hackneyPermit'
                            }}
                        />
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={24} color="#10b981"/>
                            <Text style={styles.cardTitle}>LASDRI Card</Text>
                        </View>
                        <Text style={styles.cardDescription}>Required for Lagos drivers</Text>

                        <Text style={styles.inputLabel}>LASDRI Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="LASDRI Number"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.lasdriCard?.number}
                            onChangeText={(text) => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, number: text}
                            })}
                        />

                        <DatePickerField
                            label="Expiry Date"
                            value={formData.specificDocs.lasdriCard?.expiryDate}
                            fieldPath="lasdriCard.expiryDate"
                            required={true}
                        />

                        <SingleImageUploader
                            title="LASDRI Card Photo"
                            imageUrl={formData.specificDocs.lasdriCard?.imageUrl}
                            onUpload={(url) => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, imageUrl: url}
                            })}
                            onDelete={() => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, imageUrl: null}
                            })}
                            required={true}
                            uploadMetadata={{
                                category: 'vehicleDocument',
                                subcategory: formData.vehicleType,
                                fileIdentifier: 'LSDRI'
                            }}
                        />
                    </View>
                </>
            )}
        </>
    );

    const renderVehicleVerification = () => (
        <>
            {renderVehicleDetailsCard()}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="camera" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Vehicle Pictures</Text>
                </View>

                <SingleImageUploader
                    title="Front View"
                    imageUrl={formData.specificDocs.pictures?.front}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, front: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, front: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'front'
                    }}
                />

                <SingleImageUploader
                    title="Rear View"
                    imageUrl={formData.specificDocs.pictures?.rear}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, rear: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, rear: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'rear'
                    }}
                />

                <SingleImageUploader
                    title="Side View"
                    imageUrl={formData.specificDocs.pictures?.side}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, side: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, side: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'side'
                    }}
                />

                <SingleImageUploader
                    title="Inside View"
                    imageUrl={formData.specificDocs.pictures?.inside}
                    onUpload={(url) => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, inside: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        pictures: {...formData.specificDocs.pictures, inside: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehiclePicture',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'inside'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="card" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Valid Driver's License</Text>
                </View>

                <Text style={styles.inputLabel}>License Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="License Number"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.driversLicense?.number}
                    onChangeText={(text) => updateSpecificDocs({
                        driversLicense: {...formData.specificDocs.driversLicense, number: text}
                    })}
                />

                <Text style={styles.inputLabel}>License Class *</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                    placeholder="License Class (e.g., C, D, E)"
                    value={formData.specificDocs.driversLicense?.class}
                    onChangeText={(text) => updateSpecificDocs({
                        driversLicense: {...formData.specificDocs.driversLicense, class: text}
                    })}
                />

                <DatePickerField
                    label="Expiry Date"
                    value={formData.specificDocs.driversLicense?.expiryDate}
                    fieldPath="driversLicense.expiryDate"
                    required={true}
                />


                <SingleImageUploader
                    title="License Photo"
                    imageUrl={formData.specificDocs.driversLicense?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        driversLicense: {...formData.specificDocs.driversLicense, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        driversLicense: {...formData.specificDocs.driversLicense, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'driverlicense'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="document-text" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Vehicle Registration</Text>
                </View>

                <Text style={styles.inputLabel}>Registration Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                    placeholder="Registration Number"
                    value={formData.specificDocs.vehicleRegistration?.registrationNumber}
                    onChangeText={(text) => updateSpecificDocs({
                        vehicleRegistration: {...formData.specificDocs.vehicleRegistration, registrationNumber: text}
                    })}
                />

                <DatePickerField
                    label="Expiry Date"
                    value={formData.specificDocs.vehicleRegistration?.expiryDate}
                    fieldPath="vehicleRegistration.expiryDate"
                    required={true}
                />

                <SingleImageUploader
                    title="Registration Papers"
                    imageUrl={formData.specificDocs.vehicleRegistration?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        vehicleRegistration: {...formData.specificDocs.vehicleRegistration, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        vehicleRegistration: {...formData.specificDocs.vehicleRegistration, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'RegistrationPapers'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="shield" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Vehicle Insurance</Text>
                </View>

                <Text style={styles.inputLabel}>Policy Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Policy Number"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.insurance?.policyNumber}
                    onChangeText={(text) => updateSpecificDocs({
                        insurance: {...formData.specificDocs.insurance, policyNumber: text}
                    })}
                />

                <Text style={styles.inputLabel}>Insurance Provider *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Insurance Provider"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.insurance?.provider}
                    onChangeText={(text) => updateSpecificDocs({
                        insurance: {...formData.specificDocs.insurance, provider: text}
                    })}
                />

                <DatePickerField
                    label="Expiry Date"
                    value={formData.specificDocs.insurance?.expiryDate}
                    fieldPath="insurance.expiryDate"
                    required={true}
                />

                <SingleImageUploader
                    title="Insurance Certificate"
                    imageUrl={formData.specificDocs.insurance?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        insurance: {...formData.specificDocs.insurance, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        insurance: {...formData.specificDocs.insurance, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'VehicleInsurance'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="checkmark-done" size={24} color="#10b981"/>
                    <Text style={styles.cardTitle}>Roadworthiness Certificate</Text>
                </View>

                <Text style={styles.inputLabel}>Certificate Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Certificate Number"
                    placeholderTextColor="#9ca3af"
                    value={formData.specificDocs.roadWorthiness?.certificateNumber}
                    onChangeText={(text) => updateSpecificDocs({
                        roadWorthiness: {...formData.specificDocs.roadWorthiness, certificateNumber: text}
                    })}
                />

                <SingleImageUploader
                    title="Certificate Photo"
                    imageUrl={formData.specificDocs.roadWorthiness?.imageUrl}
                    onUpload={(url) => updateSpecificDocs({
                        roadWorthiness: {...formData.specificDocs.roadWorthiness, imageUrl: url}
                    })}
                    onDelete={() => updateSpecificDocs({
                        roadWorthiness: {...formData.specificDocs.roadWorthiness, imageUrl: null}
                    })}
                    required={true}
                    uploadMetadata={{
                        category: 'vehicleDocument',
                        subcategory: formData.vehicleType,
                        fileIdentifier: 'roadWorthinessCertificate'
                    }}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="card" size={24} color="#6b7280"/>
                    <Text style={styles.cardTitle}>BVN Number (Optional)</Text>
                </View>

                <Text style={styles.inputLabel}>BVN Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="BVN Number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={11}
                    value={formData.specificDocs.bvnNumber?.number}
                    onChangeText={(text) => updateSpecificDocs({
                        bvnNumber: {...formData.specificDocs.bvnNumber, number: text}
                    })}
                />
            </View>

            {isLagosDriver && (
                <>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={24} color="#10b981"/>
                            <Text style={styles.cardTitle}>Hackney Permit</Text>
                        </View>
                        <Text style={styles.cardDescription}>Required for Lagos drivers</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Permit Number"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.hackneyPermit?.number}
                            onChangeText={(text) => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, number: text}
                            })}
                        />

                        <SingleImageUploader
                            title="Permit Photo"
                            imageUrl={formData.specificDocs.hackneyPermit?.imageUrl}
                            onUpload={(url) => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, imageUrl: url}
                            })}
                            onDelete={() => updateSpecificDocs({
                                hackneyPermit: {...formData.specificDocs.hackneyPermit, imageUrl: null}
                            })}
                            required={true}
                            uploadMetadata={{
                                category: 'vehicleDocument',
                                subcategory: formData.vehicleType,
                                fileIdentifier: 'HackneyPermit'
                            }}
                        />
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={24} color="#10b981"/>
                            <Text style={styles.cardTitle}>LASDRI Card</Text>
                        </View>
                        <Text style={styles.cardDescription}>Required for Lagos drivers</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="LASDRI Number"
                            placeholderTextColor="#9ca3af"
                            value={formData.specificDocs.lasdriCard?.number}
                            onChangeText={(text) => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, number: text}
                            })}
                        />

                        <SingleImageUploader
                            title="LASDRI Card Photo"
                            imageUrl={formData.specificDocs.lasdriCard?.imageUrl}
                            onUpload={(url) => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, imageUrl: url}
                            })}
                            onDelete={() => updateSpecificDocs({
                                lasdriCard: {...formData.specificDocs.lasdriCard, imageUrl: null}
                            })}
                            required={true}
                            uploadMetadata={{
                                category: 'vehicleDocument',
                                subcategory: formData.vehicleType,
                                fileIdentifier: 'LSDRI'
                            }}
                        />
                    </View>
                </>
            )}
        </>
    );

    const renderContent = () => {
        if (!vehicleType) {
            return (
                <View style={styles.noVehicleCard}>
                    <Ionicons name="alert-circle" size={48} color="#f59e0b"/>
                    <Text style={styles.noVehicleTitle}>No Vehicle Type Selected</Text>
                    <Text style={styles.noVehicleText}>
                        Please go back and select your vehicle type in the Basic Verification section
                    </Text>
                </View>
            );
        }

        switch (vehicleType) {
            case 'bicycle':
                return renderBicycleVerification();
            case 'tricycle':
                return renderTricycleVerification();
            case 'motorcycle':
                return renderMotorcycleVerification();
            case 'car':
            case 'van':
            case 'truck':
                return renderVehicleVerification();
            default:
                return null;
        }
    };

    const getVehicleTypeName = () => {
        const names = {
            bicycle: 'Bicycle',
            motorcycle: 'Motorcycle',
            tricycle: 'Tricycle',
            car: 'Car',
            van: 'Van',
            truck: 'Truck'
        };
        return names[vehicleType] || 'Vehicle';
    };

    const openDatePicker = (fieldPath, currentValue = null) => {
        setCurrentDateField(fieldPath);

        // Parse existing date or use current date
        if (currentValue) {
            try {
                const [day, month, year] = currentValue.split('/');
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                setTempDate(date.isValid() ? date : new Date());
            } catch (error) {
                setTempDate(new Date());
            }
        } else {
            setTempDate(new Date());
        }

        setShowDatePicker(true);
    };

    const handleDateSelect = (selectedDate) => {
        if (selectedDate && currentDateField) {
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            // Update the specific field using the field path
            updateDateField(currentDateField, formattedDate);
        }
        setShowDatePicker(false);
        setCurrentDateField(null);
    };

    const updateDateField = (fieldPath, value) => {
        const fieldParts = fieldPath.split('.');

        if (fieldParts.length === 1) {
            // Simple field (e.g., "expiryDate")
            updateSpecificDocs({[fieldParts[0]]: value});
        } else if (fieldParts.length === 2) {
            // Nested field (e.g., "driversLicense.expiryDate")
            updateSpecificDocs({
                [fieldParts[0]]: {
                    ...formData.specificDocs[fieldParts[0]],
                    [fieldParts[1]]: value
                }
            });
        }
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        return dateString; // Already in DD/MM/YYYY format
    };

    const DatePickerField = ({
                                 label,
                                 value,
                                 fieldPath,
                                 placeholder = "Select Date",
                                 required = false
                             }) => (
        <View>
            <Text style={styles.inputLabel}>
                {label} {required && '*'}
            </Text>
            <Pressable
                style={styles.dateInputContainer}
                onPress={() => openDatePicker(fieldPath, value)}
            >
                <Ionicons name="calendar" size={20} color="#6b7280"/>
                <Text style={[
                    styles.dateInput,
                    !value && styles.placeholderText
                ]}>
                    {value ? formatDateForDisplay(value) : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280"/>
            </Pressable>
        </View>
    );

    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Vehicle-Specific Documents</Text>
                {vehicleType && (
                    <Text style={styles.sectionSubtitle}>
                        Required for {getVehicleTypeName()} drivers
                        {isLagosDriver && ' (Lagos State)'}
                    </Text>
                )}

                {renderContent()}

                {/* Date Picker Modal */}
                {showDatePicker && (
                    <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                            if (event.type === 'set' && selectedDate) {
                                handleDateSelect(selectedDate);
                            } else {
                                setShowDatePicker(false);
                                setCurrentDateField(null);
                            }
                        }}
                    />
                )}

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3b82f6"/>
                    <Text style={styles.infoText}>
                        All documents will be verified by our team within 24-48 hours. You'll be notified once approved.
                    </Text>
                </View>
            </ScrollView>
        </>
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
        marginBottom: 4
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        fontFamily: 'PoppinsMedium',
        marginBottom: 24
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
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
        color: '#6b7280',
        fontFamily: 'PoppinsMedium',
        marginBottom: 16,
        lineHeight: 20
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        marginBottom: 16,
        color: '#111827'
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8
    },
    switchLabel: {
        flex: 1,
        marginRight: 16
    },
    switchTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4
    },
    switchDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20
    },
    warningCard: {
        flexDirection: 'row',
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        alignItems: 'flex-start',
        gap: 12
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#92400e',
        lineHeight: 20
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#dbeafe',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
        gap: 12
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 20
    },
    noVehicleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    noVehicleTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8
    },
    noVehicleText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 1,
        marginLeft: 4
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
        color: '#111827',
        fontFamily: 'PoppinsRegular'
    },
    placeholderText: {
        color: '#9ca3af'
    },
});

export default SpecificVerification;

