// components/Driver/Account/Verification/ReviewSubmit.js
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import { useWindowDimensions, Platform } from 'react-native';



function ReviewSubmit({formData, onSubmit, onBack, loading}) {
    const { width } = useWindowDimensions();
    const isCompact = width < 380; // stack buttons on very small phones
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
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vehicle Type:</Text>
                <Text style={styles.infoValue}>{getVehicleTypeName()}</Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID Type:</Text>
                <Text style={styles.infoValue}>{getIdTypeName()}</Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID Number:</Text>
                <Text style={styles.infoValue}>{formData.identificationNumber}</Text>
            </View>

            {formData.identificationExpiry && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID Expiry:</Text>
                    <Text style={styles.infoValue}>{formData.identificationExpiry}</Text>
                </View>
            )}

            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Operating Area:</Text>
                <Text style={styles.infoValue}>
                    {formData.operationalLga}, {formData.operationalState}
                </Text>
            </View>

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

        if (vehicleType === 'bicycle') {
            return (
                <>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Has Helmet:</Text>
                        <Text style={styles.infoValue}>
                            {specificDocs.hasHelmet ? 'Yes' : 'No'}
                        </Text>
                    </View>

                    {renderImagePreview(specificDocs.backpackEvidence, 'Backpack Evidence')}

                    <Text style={styles.subheading}>Bicycle Pictures</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.bicyclePictures?.front, 'Front')}
                        {renderImagePreview(specificDocs.bicyclePictures?.rear, 'Rear')}
                        {renderImagePreview(specificDocs.bicyclePictures?.side, 'Side')}
                    </View>
                </>
            );
        }

        if (vehicleType === 'tricycle') {
            return (
                <>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>License Number:</Text>
                        <Text style={styles.infoValue}>
                            {specificDocs.driversLicense?.number || 'N/A'}
                        </Text>
                    </View>

                    <Text style={styles.subheading}>Tricycle Pictures</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.pictures?.front, 'Front')}
                        {renderImagePreview(specificDocs.pictures?.rear, 'Rear')}
                        {renderImagePreview(specificDocs.pictures?.side, 'Side')}
                        {renderImagePreview(specificDocs.pictures?.inside, 'Inside')}
                    </View>

                    {specificDocs.driversLicense?.imageUrl && (
                        <>
                            <Text style={styles.subheading}>Driver's License</Text>
                            {renderImagePreview(specificDocs.driversLicense.imageUrl, 'License')}
                        </>
                    )}

                    {specificDocs.hackneyPermit?.imageUrl && (
                        <>
                            <Text style={styles.subheading}>Hackney Permit</Text>
                            {renderImagePreview(specificDocs.hackneyPermit.imageUrl, 'Permit')}
                        </>
                    )}

                    {specificDocs.lasdriCard?.imageUrl && (
                        <>
                            <Text style={styles.subheading}>LASDRI Card</Text>
                            {renderImagePreview(specificDocs.lasdriCard.imageUrl, 'LASDRI')}
                        </>
                    )}
                </>
            );
        }

        if (vehicleType === 'motorcycle') {
            return (
                <>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Rider's Permit:</Text>
                        <Text style={styles.infoValue}>
                            {specificDocs.ridersPermit?.cardNumber || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Commercial License:</Text>
                        <Text style={styles.infoValue}>
                            {specificDocs.commercialLicense?.licenseNumber || 'N/A'}
                        </Text>
                    </View>

                    <Text style={styles.subheading}>Motorcycle Pictures</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.pictures?.front, 'Front')}
                        {renderImagePreview(specificDocs.pictures?.rear, 'Rear')}
                        {renderImagePreview(specificDocs.pictures?.side, 'Side')}
                    </View>

                    <Text style={styles.subheading}>Documents</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.ridersPermit?.imageUrl, "Rider's Permit")}
                        {renderImagePreview(specificDocs.commercialLicense?.imageUrl, 'Commercial License')}
                        {renderImagePreview(specificDocs.proofOfAddress?.imageUrl, 'Proof of Address')}
                        {renderImagePreview(specificDocs.proofOfOwnership?.imageUrl, 'Proof of Ownership')}
                        {renderImagePreview(specificDocs.roadWorthiness?.imageUrl, 'Road Worthiness')}
                    </View>
                </>
            );
        }

        if (['car', 'van', 'truck'].includes(vehicleType)) {
            return (
                <>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>License Number:</Text>
                        <Text style={styles.infoValue}>
                            {specificDocs.driversLicense?.number || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Registration Number:</Text>
                        <Text style={styles.infoValue}>
                            {specificDocs.vehicleRegistration?.registrationNumber || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Insurance Policy:</Text>
                        <Text style={styles.infoValue}>
                            {specificDocs.insurance?.policyNumber || 'N/A'}
                        </Text>
                    </View>

                    <Text style={styles.subheading}>Vehicle Pictures</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.pictures?.front, 'Front')}
                        {renderImagePreview(specificDocs.pictures?.rear, 'Rear')}
                        {renderImagePreview(specificDocs.pictures?.side, 'Side')}
                        {renderImagePreview(specificDocs.pictures?.inside, 'Inside')}
                    </View>

                    <Text style={styles.subheading}>Documents</Text>
                    <View style={styles.imageGrid}>
                        {renderImagePreview(specificDocs.driversLicense?.imageUrl, "Driver's License")}
                        {renderImagePreview(specificDocs.vehicleRegistration?.imageUrl, 'Registration')}
                        {renderImagePreview(specificDocs.insurance?.imageUrl, 'Insurance')}
                        {renderImagePreview(specificDocs.roadWorthiness?.imageUrl, 'Road Worthiness')}
                    </View>
                </>
            );
        }

        return null;
    };

    return (
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
                {renderSection('Vehicle-Specific Documents', 'document-text', renderVehicleSpecificDocs())}

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
                    <Ionicons name="alert-circle" size={22} color="#b45309" />
                    <View style={{ flex: 1 }}>
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
                <View style={[styles.buttonRow, { flexDirection: isCompact ? 'column' : 'row' }]}>
                    {/* Back */}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back to previous step"
                        hitSlop={8}
                        style={[
                            styles.actionButton,
                            isCompact ? { width: '100%' } : { flex: 1 },
                            loading && styles.actionButtonDisabled
                        ]}
                        onPress={onBack}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#94a3b8', '#64748b']}  // slate-400 → slate-600
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.buttonGradient}
                        >
                            <Ionicons name="chevron-back" size={20} color="white" />
                            <Text style={styles.buttonText}>Back</Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Submit */}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Submit for verification"
                        hitSlop={8}
                        style={[
                            styles.actionButton,
                            isCompact ? { width: '100%' } : { flex: 1 },
                            loading && styles.actionButtonDisabled
                        ]}
                        onPress={onSubmit}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={loading ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.buttonGradient}
                        >
                            {loading ? (
                                <>
                                    <ActivityIndicator size="small" color="white" />
                                    <Text style={styles.buttonText}>Submitting...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="send" size={20} color="white" />
                                    <Text style={styles.buttonText}>Submit</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </View>
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
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
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
    },
    infoValue: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
    },
    subheading: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        marginTop: 16,
        marginBottom: 12
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
        fontFamily: 'PoppinsRegular',
        color: '#059669',
        marginBottom: 4
    },
    disclaimerDescription: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#047857',
        lineHeight: 20
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.select({ ios: 20, android: 16 }),
    },
    buttonRow: {
        gap: 12,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        // shadows for iOS + elevation for Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
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
        fontFamily: 'PoppinsRegular',
        color: '#fff',
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

});

export default ReviewSubmit;