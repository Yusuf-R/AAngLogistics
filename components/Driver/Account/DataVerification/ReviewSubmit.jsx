// components/Driver/Account/Verification/ReviewSubmit.js
import React, {useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useWindowDimensions, Platform} from 'react-native';

function ReviewSubmit({formData, onSubmit, onBack, loading}) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const {width} = useWindowDimensions();
    const isCompact = width < 380;

    const getVehicleTypeName = () => {
        const names = {
            bicycle: 'Bicycle',
            motorcycle: 'Motorcycle',
            tricycle: 'Tricycle',
            car: 'Car',
            van: 'Van',
            truck: 'Truck'
        };
        return names[formData.vehicleType] || 'Vehicle';
    };

    const getIdTypeName = () => {
        const names = {
            drivers_license: "Driver's License",
            nigerian_passport: 'Nigerian Passport',
            nin_card: 'NIN Card',
            nin_slip: 'NIN Slip'
        };
        return names[formData.identificationType] || 'ID';
    };

    const renderImagePreview = (url, title) => {
        if (!url) return null;

        return (
            <View style={styles.imagePreview}>
                <Image source={{uri: url}} style={styles.previewImage} resizeMode="cover"/>
                <Text style={styles.previewLabel}>{title}</Text>
            </View>
        );
    };

    const renderInfoRow = (label, value, hasValue = true) => {
        if (!hasValue) return null;

        return (
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}:</Text>
                <Text style={styles.infoValue}>{value || 'N/A'}</Text>
            </View>
        );
    };

    const renderSection = (title, icon, content) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name={icon} size={24} color="#10b981"/>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            {content}
        </View>
    );

    const renderBasicInfo = () => (
        <>
            {renderInfoRow('Vehicle Type', getVehicleTypeName())}
            {renderInfoRow('ID Type', getIdTypeName())}
            {renderInfoRow('ID Number', formData.identificationNumber)}
            {formData.identificationExpiry && renderInfoRow('ID Expiry', formData.identificationExpiry)}
            {renderInfoRow('Operating Area', `${formData.operationalLga}, ${formData.operationalState}`)}

            <Text style={styles.subheading}>Identification Pictures</Text>
            <View style={styles.imageGrid}>
                {renderImagePreview(formData.identificationFrontImage, 'ID Front')}
                {renderImagePreview(formData.identificationBackImage, 'ID Back')}
                {renderImagePreview(formData.passportPhoto, 'Passport Photo')}
            </View>

            <Text style={styles.subheading}>Bank Accounts</Text>
            {formData.bankAccounts.map((account, index) => (
                <View key={account.id || index} style={styles.bankCard}>
                    <View style={styles.bankInfo}>
                        <Text style={styles.bankName}>{account.accountName}</Text>
                        <Text style={styles.bankDetails}>
                            {account.accountNumber} • {account.bankName}
                        </Text>
                    </View>
                    {account.isPrimary && (
                        <View style={styles.primaryBadge}>
                            <Text style={styles.primaryText}>Primary</Text>
                        </View>
                    )}
                </View>
            ))}
        </>
    );

    const renderVehicleSpecificDocs = () => {
        const {specificDocs, vehicleType} = formData;

        // BICYCLE
        if (vehicleType === 'bicycle') {
            return (
                <>
                    <Text style={styles.subheadingBold}>Vehicle Details</Text>
                    {renderInfoRow('Model', specificDocs.model)}
                    {renderInfoRow('Year', specificDocs.year)}
                    {renderInfoRow('Color', specificDocs.color)}
                    {renderInfoRow('Weight Capacity', `${specificDocs.capacity?.weight || 0} kg`)}
                    {renderInfoRow('Has Helmet', specificDocs.hasHelmet ? 'Yes' : 'No')}

                    <Text style={styles.subheading}>Delivery Equipment</Text>
                    {renderImagePreview(specificDocs.backpackEvidence, 'Backpack')}

                    <Text style={styles.subheading}>Bicycle Pictures</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.bicyclePictures?.front, 'Front')}
                        {renderImagePreview(specificDocs.bicyclePictures?.rear, 'Rear')}
                        {renderImagePreview(specificDocs.bicyclePictures?.side, 'Side')}
                    </View>
                </>
            );
        }

        // TRICYCLE
        if (vehicleType === 'tricycle') {
            return (
                <>
                    <Text style={styles.subheadingBold}>Vehicle Details</Text>
                    {renderInfoRow('Plate Number', specificDocs.plateNumber)}
                    {renderInfoRow('Model', specificDocs.model)}
                    {renderInfoRow('Year', specificDocs.year)}
                    {renderInfoRow('Color', specificDocs.color)}
                    {renderInfoRow('Weight Capacity', `${specificDocs.capacity?.weight || 0} kg`)}
                    {renderInfoRow('Passenger Capacity', specificDocs.capacity?.passengers || 0)}

                    <Text style={styles.subheading}>Tricycle Pictures</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.pictures?.front, 'Front')}
                        {renderImagePreview(specificDocs.pictures?.rear, 'Rear')}
                        {renderImagePreview(specificDocs.pictures?.side, 'Side')}
                        {renderImagePreview(specificDocs.pictures?.inside, 'Inside')}
                    </View>

                    <Text style={styles.subheadingBold}>Driver's License</Text>
                    {renderInfoRow('License Number', specificDocs.driversLicense?.number)}
                    {renderInfoRow('Expiry Date', specificDocs.driversLicense?.expiryDate)}
                    {renderImagePreview(specificDocs.driversLicense?.imageUrl, 'License Photo')}

                    {specificDocs.hackneyPermit?.number && (
                        <>
                            <Text style={styles.subheadingBold}>Hackney Permit</Text>
                            {renderInfoRow('Permit Number', specificDocs.hackneyPermit?.number)}
                            {renderImagePreview(specificDocs.hackneyPermit?.imageUrl, 'Permit Photo')}
                        </>
                    )}

                    {specificDocs.lasdriCard?.number && (
                        <>
                            <Text style={styles.subheadingBold}>LASDRI Card</Text>
                            {renderInfoRow('Card Number', specificDocs.lasdriCard?.number)}
                            {renderImagePreview(specificDocs.lasdriCard?.imageUrl, 'LASDRI Photo')}
                        </>
                    )}
                </>
            );
        }

        // MOTORCYCLE
        if (vehicleType === 'motorcycle') {
            return (
                <>
                    <Text style={styles.subheadingBold}>Vehicle Details</Text>
                    {renderInfoRow('Plate Number', specificDocs.plateNumber)}
                    {renderInfoRow('Model', specificDocs.model)}
                    {renderInfoRow('Year', specificDocs.year)}
                    {renderInfoRow('Color', specificDocs.color)}
                    {renderInfoRow('Weight Capacity', `${specificDocs.capacity?.weight || 0} kg`)}
                    {renderInfoRow('Passenger Capacity', specificDocs.capacity?.passengers || 0)}

                    <Text style={styles.subheading}>Motorcycle Pictures</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.pictures?.front, 'Front')}
                        {renderImagePreview(specificDocs.pictures?.rear, 'Rear')}
                        {renderImagePreview(specificDocs.pictures?.side, 'Side')}
                    </View>

                    <Text style={styles.subheadingBold}>Rider's Permit</Text>
                    {renderInfoRow('Card Number', specificDocs.ridersPermit?.cardNumber)}
                    {renderInfoRow('Issuing Office', specificDocs.ridersPermit?.issuingOffice)}
                    {renderImagePreview(specificDocs.ridersPermit?.imageUrl, "Rider's Permit")}

                    <Text style={styles.subheadingBold}>Commercial License</Text>
                    {renderInfoRow('License Number', specificDocs.commercialLicense?.licenseNumber)}
                    {renderInfoRow('Class', specificDocs.commercialLicense?.class)}
                    {renderImagePreview(specificDocs.commercialLicense?.imageUrl, 'Commercial License')}

                    <Text style={styles.subheadingBold}>Additional Documents</Text>
                    {renderImagePreview(specificDocs.proofOfAddress?.imageUrl, 'Proof of Address')}
                    {renderImagePreview(specificDocs.proofOfOwnership?.imageUrl, 'Proof of Ownership')}

                    <Text style={styles.subheadingBold}>Road Worthiness</Text>
                    {renderInfoRow('Certificate Number', specificDocs.roadWorthiness?.certificateNumber)}
                    {renderInfoRow('Expiry Date', specificDocs.roadWorthiness?.expiryDate)}
                    {renderImagePreview(specificDocs.roadWorthiness?.imageUrl, 'Road Worthiness')}

                    {specificDocs.hackneyPermit?.number && (
                        <>
                            <Text style={styles.subheadingBold}>Hackney Permit</Text>
                            {renderInfoRow('Permit Number', specificDocs.hackneyPermit?.number)}
                            {renderInfoRow('Expiry Date', specificDocs.hackneyPermit?.expiryDate)}
                            {renderImagePreview(specificDocs.hackneyPermit?.imageUrl, 'Hackney Permit')}
                        </>
                    )}

                    {specificDocs.lasdriCard?.number && (
                        <>
                            <Text style={styles.subheadingBold}>LASDRI Card</Text>
                            {renderInfoRow('Card Number', specificDocs.lasdriCard?.number)}
                            {renderInfoRow('Expiry Date', specificDocs.lasdriCard?.expiryDate)}
                            {renderImagePreview(specificDocs.lasdriCard?.imageUrl, 'LASDRI Card')}
                        </>
                    )}
                </>
            );
        }

        // CAR/VAN/TRUCK
        if (['car', 'van', 'truck'].includes(vehicleType)) {
            return (
                <>
                    <Text style={styles.subheadingBold}>Vehicle Details</Text>
                    {renderInfoRow('Plate Number', specificDocs.plateNumber)}
                    {renderInfoRow('Model', specificDocs.model)}
                    {renderInfoRow('Year', specificDocs.year)}
                    {renderInfoRow('Color', specificDocs.color)}
                    {renderInfoRow('Weight Capacity', `${specificDocs.capacity?.weight || 0} kg`)}
                    {renderInfoRow('Volume Capacity', `${specificDocs.capacity?.volume || 0} m³`)}
                    {renderInfoRow('Passenger Capacity', specificDocs.capacity?.passengers || 0)}

                    <Text style={styles.subheading}>Vehicle Pictures</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.pictures?.front, 'Front')}
                        {renderImagePreview(specificDocs.pictures?.rear, 'Rear')}
                        {renderImagePreview(specificDocs.pictures?.side, 'Side')}
                        {renderImagePreview(specificDocs.pictures?.inside, 'Inside')}
                    </View>

                    <Text style={styles.subheadingBold}>Driver's License</Text>
                    {renderInfoRow('License Number', specificDocs.driversLicense?.number)}
                    {renderInfoRow('License Class', specificDocs.driversLicense?.class)}
                    {renderInfoRow('Expiry Date', specificDocs.driversLicense?.expiryDate)}
                    {renderImagePreview(specificDocs.driversLicense?.imageUrl, "Driver's License")}

                    <Text style={styles.subheadingBold}>Vehicle Registration</Text>
                    {renderInfoRow('Registration Number', specificDocs.vehicleRegistration?.registrationNumber)}
                    {renderInfoRow('Expiry Date', specificDocs.vehicleRegistration?.expiryDate)}
                    {renderImagePreview(specificDocs.vehicleRegistration?.imageUrl, 'Registration')}

                    <Text style={styles.subheadingBold}>Insurance</Text>
                    {renderInfoRow('Policy Number', specificDocs.insurance?.policyNumber)}
                    {renderInfoRow('Provider', specificDocs.insurance?.provider)}
                    {renderInfoRow('Expiry Date', specificDocs.insurance?.expiryDate)}
                    {renderImagePreview(specificDocs.insurance?.imageUrl, 'Insurance Certificate')}

                    <Text style={styles.subheadingBold}>Road Worthiness</Text>
                    {renderInfoRow('Certificate Number', specificDocs.roadWorthiness?.certificateNumber)}
                    {renderImagePreview(specificDocs.roadWorthiness?.imageUrl, 'Road Worthiness')}

                    {specificDocs.bvnNumber?.number && (
                        <>
                            <Text style={styles.subheadingBold}>BVN</Text>
                            {renderInfoRow('BVN Number', specificDocs.bvnNumber?.number)}
                        </>
                    )}

                    {specificDocs.hackneyPermit?.number && (
                        <>
                            <Text style={styles.subheadingBold}>Hackney Permit</Text>
                            {renderInfoRow('Permit Number', specificDocs.hackneyPermit?.number)}
                            {renderImagePreview(specificDocs.hackneyPermit?.imageUrl, 'Hackney Permit')}
                        </>
                    )}

                    {specificDocs.lasdriCard?.number && (
                        <>
                            <Text style={styles.subheadingBold}>LASDRI Card</Text>
                            {renderInfoRow('Card Number', specificDocs.lasdriCard?.number)}
                            {renderImagePreview(specificDocs.lasdriCard?.imageUrl, 'LASDRI Card')}
                        </>
                    )}
                </>
            );
        }

        return null;
    };

    const handleConfirmedSubmit = async () => {
        setShowConfirmModal(false);
        await onSubmit();
    };

    return (
        <>
            <View style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="checkmark-circle" size={48} color="#10b981"/>
                        </View>
                        <Text style={styles.title}>Review Your Information</Text>
                        <Text style={styles.subtitle}>
                            Please verify all details before submitting
                        </Text>
                    </View>

                    {renderSection('Basic Information', 'information-circle', renderBasicInfo())}
                    {renderSection(`${getVehicleTypeName()} Documents`, 'document-text', renderVehicleSpecificDocs())}

                    <View style={styles.disclaimerCard}>
                        <Ionicons name="shield-checkmark" size={24} color="#10b981"/>
                        <View style={styles.disclaimerText}>
                            <Text style={styles.disclaimerTitle}>Data Privacy</Text>
                            <Text style={styles.disclaimerDescription}>
                                Your documents will be securely stored and only used for verification purposes.
                                We comply with all data protection regulations.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.finalWarningCard}>
                        <Ionicons name="alert-circle" size={22} color="#b45309"/>
                        <View style={{flex: 1}}>
                            <Text style={styles.finalWarningTitle}>Final check before submission</Text>
                            <Text style={styles.finalWarningText}>
                                Ensure all information and photos are accurate and belong to you. Once you submit,
                                your documents will be locked and sent for review. False or misleading credentials
                                may lead to account action.
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.bottomBar} pointerEvents={loading ? 'none' : 'auto'}>
                    <View style={[styles.buttonRow, {flexDirection: isCompact ? 'column' : 'row'}]}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Go back to previous step"
                            hitSlop={8}
                            style={[
                                styles.actionButton,
                                isCompact ? {width: '100%'} : {flex: 1},
                                loading && styles.actionButtonDisabled
                            ]}
                            onPress={onBack}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#94a3b8', '#64748b']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="chevron-back" size={20} color="white"/>
                                <Text style={styles.buttonText}>Back</Text>
                            </LinearGradient>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Submit for verification"
                            hitSlop={8}
                            style={[
                                styles.actionButton,
                                isCompact ? {width: '100%'} : {flex: 1},
                                loading && styles.actionButtonDisabled
                            ]}
                            onPress={() => setShowConfirmModal(true)}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={loading ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={styles.buttonGradient}
                            >
                                {loading ? (
                                    <>
                                        <ActivityIndicator size="small" color="white"/>
                                        <Text style={styles.buttonText}>Submitting...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="send" size={20} color="white"/>
                                        <Text style={styles.buttonText}>Submit</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>

                {/* Confirmation Modal */}
                <Modal
                    transparent
                    animationType="fade"
                    visible={showConfirmModal}
                    onRequestClose={() => setShowConfirmModal(false)}
                >
                    <View style={styles.confirmOverlay}>
                        <View style={styles.confirmBox}>
                            <View style={styles.confirmIconContainer}>
                                <Ionicons name="shield-checkmark" size={48} color="#10b981"/>
                            </View>

                            <Text style={styles.confirmTitle}>Final Confirmation</Text>
                            <Text style={styles.confirmMessage}>
                                You're about to submit your verification documents for review.
                                Please ensure all information is accurate as you won't be able to
                                edit until the review is complete.
                            </Text>

                            <View style={styles.confirmActions}>
                                <Pressable
                                    style={styles.cancelButton}
                                    onPress={() => setShowConfirmModal(false)}
                                >
                                    <Text style={styles.cancelText}>Review Again</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.confirmButton}
                                    onPress={handleConfirmedSubmit}
                                >
                                    <LinearGradient
                                        colors={['#10b981', '#059669']}
                                        style={styles.confirmGradient}
                                    >
                                        <Text style={styles.confirmButtonText}>Yes, Submit</Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        paddingBottom: 100
    },
    header: {
        alignItems: 'center',
        marginBottom: 16
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        textAlign: 'center'
    },
    section: {
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    infoLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        flex: 1
    },
    infoValue: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
        flex: 1,
        textAlign: 'right'
    },
    subheading: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginTop: 20,
        marginBottom: 12
    },
    subheadingBold: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginTop: 20,
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8
    },
    imagePreview: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    previewImage: {
        width: '100%',
        height: '80%',
        backgroundColor: '#f3f4f6'
    },
    previewLabel: {
        fontSize: 11,
        color: '#6b7280',
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
        padding: 4,
        backgroundColor: '#f9fafb'
    },
    bankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8
    },
    bankInfo: {
        flex: 1
    },
    bankName: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        marginBottom: 4
    },
    bankDetails: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280'
    },
    primaryBadge: {
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    primaryText: {
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        color: '#fff'
    },
    disclaimerCard: {
        flexDirection: 'row',
        backgroundColor: '#d1fae5',
        borderRadius: 16,
        padding: 20,
        gap: 12,
        alignItems: 'flex-start'
    },
    disclaimerText: {
        flex: 1
    },
    disclaimerTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#059669',
        marginBottom: 4
    },
    disclaimerDescription: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#047857',
        lineHeight: 20
    },
    finalWarningCard: {
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#fde68a',
        marginTop: 12,
        alignItems: 'flex-start',
    },
    finalWarningTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#92400e',
        marginBottom: 4,
    },
    finalWarningText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#92400e',
        lineHeight: 18,
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.select({ios: 20, android: 16}),
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
    },
    buttonRow: {
        gap: 12,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    actionButtonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 18,
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },


    // Add to your existing styles object
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    confirmBox: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    confirmIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    confirmMessage: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
    },
    confirmButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    confirmGradient: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },
});

export default ReviewSubmit;