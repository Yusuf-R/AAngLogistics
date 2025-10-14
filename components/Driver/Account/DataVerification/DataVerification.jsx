// components/Driver/Account/DataVerification.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
    useWindowDimensions,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CustomHeader from '../../../CustomHeader';
import StatusModal from "../../../StatusModal/StatusModal";

// Import subcomponents
import IntroScreen from './IntroScreen';
import BasicVerification from './BasicVerification';
import SpecificVerification from './SpecificVerification';
import ReviewSubmit from './ReviewSubmit';
import {toast} from "sonner-native";
import DriverUtils from "../../../../utils/DriverUtilities";
import SessionManager from "../../../../lib/SessionManager";

const VERIFICATION_STEPS = [
    { id: 'intro', title: 'Welcome', icon: 'information-circle' },
    { id: 'basic', title: 'Basic Info', icon: 'document-text' },
    { id: 'specific', title: 'Vehicle Docs', icon: 'car' },
    { id: 'review', title: 'Review', icon: 'checkmark-circle' }
];

// turn "2026-10-13T23:00:00.000Z" into "13/10/2026"
const isoToDMY = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

// required checks aligned with your validateSpecificInfo
const isSpecificCompleteFor = (vehicleType, specificDocs) => {
    if (!vehicleType) return false;
    switch (vehicleType) {
        case 'bicycle': {
            const pics = specificDocs?.bicyclePictures || {};
            return Boolean(
                specificDocs?.backpackEvidence &&
                pics?.front && pics?.rear && pics?.side
            );
        }
        case 'tricycle':
        case 'motorcycle':
            // minimally require a license object (you can tighten further if needed)
            return Boolean(specificDocs?.driversLicense);
        case 'car':
        case 'van':
        case 'truck':
            return Boolean(specificDocs?.driversLicense && specificDocs?.vehicleRegistration);
        default:
            return false;
    }
};


function DataVerification({ userData, verification, isEditMode = false, onUpdateSuccess }) {
    console.log({
        verification
    })
    const { width } = useWindowDimensions();
    const isCompact = width < 380;
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState('intro');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Basic Verification
        identificationType: null,
        identificationNumber: '',
        identificationExpiry: null,
        identificationFrontImage: null,
        identificationBackImage: null,
        passportPhoto: null,
        operationalState: '',
        operationalLga: '',
        vehicleType: userData?.vehicleDetails?.type || null,
        bankAccounts: [],

        // Specific Verification (populated based on vehicle type)
        specificDocs: {}
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Submitting your verification...');

    // Define validation functions FIRST using useCallback
    const validateBasicInfo = useCallback(() => {
        const {
            identificationType,
            identificationNumber,
            passportPhoto,
            operationalState,
            operationalLga,
            vehicleType,
            bankAccounts
        } = formData;

        // Basic validation - adjust based on your requirements
        return !!(
            identificationType &&
            identificationNumber &&
            passportPhoto &&
            operationalState &&
            operationalLga &&
            vehicleType &&
            bankAccounts.length > 0
        );
    }, [formData]);

    const validateSpecificInfo = useCallback(() => {
        const { vehicleType, specificDocs } = formData;

        if (!vehicleType) return false;

        // Simplified validation - expand based on your requirements
        switch (vehicleType) {
            case 'bicycle':
                return !!(
                    specificDocs.backpackEvidence &&
                    specificDocs.bicyclePictures?.front &&
                    specificDocs.bicyclePictures?.rear &&
                    specificDocs.bicyclePictures?.side
                );
            case 'tricycle':
            case 'motorcycle':
                return !!(specificDocs.driversLicense);
            case 'car':
            case 'van':
            case 'truck':
                return !!(
                    specificDocs.driversLicense &&
                    specificDocs.vehicleRegistration
                );
            default:
                return false;
        }
    }, [formData]);

    // NOW use them in useMemo
    const canProceedToNext = useMemo(() => {
        switch (currentStep) {
            case 'intro':
                return true;
            case 'basic':
                return validateBasicInfo();
            case 'specific':
                return validateSpecificInfo();
            case 'review':
                return false;
            default:
                return false;
        }
    }, [currentStep, validateBasicInfo, validateSpecificInfo]);

    const currentStepIndex = useMemo(() => {
        return VERIFICATION_STEPS.findIndex(step => step.id === currentStep);
    }, [currentStep]);

    useEffect(() => {
        if (verification?.overallStatus === "pending") {
            setCurrentStep('intro');
            return;
        }

        // 1) populate form state from server blob
        populateFormFromVerification(verification);

        // 2) then decide the correct step (after state updates flush on next tick)
        // queue the step determination at the end of the event loop
        setTimeout(() => determineInitialStep(verification), 0);
    }, [verification]);



    const populateFormFromVerification = (raw) => {
        if (!raw) return;

        // support both shapes:
        // raw = { basicVerification, specificVerification, ... }
        // or raw = { verification: { basicVerification, specificVerification, ... } }
        const v = raw.verification ? raw.verification : raw;

        const basic = v.basicVerification || {};
        const id = basic.identification || {};
        const passport = basic.passportPhoto || {};
        const area = basic.operationalArea || {};
        const banks = Array.isArray(basic.bankAccounts) ? basic.bankAccounts : [];

        // choose vehicle type from user, or active type, or existing state
        const vehicleTypeFromServer = v?.specificVerification?.activeVerificationType || null;
        const chosenVehicleType = userData?.vehicleDetails?.type || vehicleTypeFromServer || null;

        // normalize specific docs into the structure your UI expects
        const sv = v.specificVerification || {};
        const spec = {};

        if (chosenVehicleType === 'bicycle') {
            const b = sv.bicycle || {};
            spec.hasHelmet = Boolean(b.hasHelmet);
            spec.backpackEvidence = b?.backpackEvidence?.imageUrl || null;
            spec.bicyclePictures = {
                front: b?.bicyclePictures?.front?.imageUrl || null,
                rear:  b?.bicyclePictures?.rear?.imageUrl  || null,
                side:  b?.bicyclePictures?.side?.imageUrl  || null,
            };
        } else if (chosenVehicleType === 'tricycle') {
            const t = sv.tricycle || {};
            spec.pictures = {
                front:  t?.pictures?.front?.imageUrl  || null,
                rear:   t?.pictures?.rear?.imageUrl   || null,
                side:   t?.pictures?.side?.imageUrl   || null,
                inside: t?.pictures?.inside?.imageUrl || null,
            };
            spec.driversLicense = {
                number: t?.driversLicense?.number || null,
                expiryDate: t?.driversLicense?.expiryDate || null,
                imageUrl: t?.driversLicense?.imageUrl || null,
            };
            spec.hackneyPermit = {
                number: t?.hackneyPermit?.number || null,
                expiryDate: t?.hackneyPermit?.expiryDate || null,
                imageUrl: t?.hackneyPermit?.imageUrl || null,
            };
            spec.lasdriCard = {
                number: t?.lasdriCard?.number || null,
                expiryDate: t?.lasdriCard?.expiryDate || null,
                imageUrl: t?.lasdriCard?.imageUrl || null,
            };
        } else if (chosenVehicleType === 'motorcycle') {
            const m = sv.motorcycle || {};
            spec.pictures = {
                front: m?.pictures?.front?.imageUrl || null,
                rear:  m?.pictures?.rear?.imageUrl  || null,
                side:  m?.pictures?.side?.imageUrl  || null,
            };
            spec.ridersPermit = {
                cardNumber: m?.ridersPermit?.cardNumber || null,
                issuingOffice: m?.ridersPermit?.issuingOffice || null,
                imageUrl: m?.ridersPermit?.imageUrl || null,
            };
            spec.commercialLicense = {
                licenseNumber: m?.commercialLicense?.licenseNumber || null,
                class: m?.commercialLicense?.class || null,
                imageUrl: m?.commercialLicense?.imageUrl || null,
            };
            spec.proofOfAddress = { imageUrl: m?.proofOfAddress?.imageUrl || null };
            spec.proofOfOwnership = { imageUrl: m?.proofOfOwnership?.imageUrl || null };
            spec.roadWorthiness = {
                certificateNumber: m?.roadWorthiness?.certificateNumber || null,
                expiryDate: m?.roadWorthiness?.expiryDate || null,
                imageUrl: m?.roadWorthiness?.imageUrl || null,
            };
            spec.hackneyPermit = {
                number: m?.hackneyPermit?.number || null,
                expiryDate: m?.hackneyPermit?.expiryDate || null,
                imageUrl: m?.hackneyPermit?.imageUrl || null,
            };
            spec.lasdriCard = {
                number: m?.lasdriCard?.number || null,
                expiryDate: m?.lasdriCard?.expiryDate || null,
                imageUrl: m?.lasdriCard?.imageUrl || null,
            };
        } else if (['car', 'van', 'truck'].includes(chosenVehicleType)) {
            const veh = sv.vehicle || {};
            spec.pictures = {
                front:  veh?.pictures?.front?.imageUrl  || null,
                rear:   veh?.pictures?.rear?.imageUrl   || null,
                side:   veh?.pictures?.side?.imageUrl   || null,
                inside: veh?.pictures?.inside?.imageUrl || null,
            };
            spec.driversLicense = {
                number: veh?.driversLicense?.number || null,
                class: veh?.driversLicense?.class || null,
                expiryDate: veh?.driversLicense?.expiryDate || null,
                imageUrl: veh?.driversLicense?.imageUrl || null,
            };
            spec.vehicleRegistration = {
                registrationNumber: veh?.vehicleRegistration?.registrationNumber || null,
                expiryDate: veh?.vehicleRegistration?.expiryDate || null,
                imageUrl: veh?.vehicleRegistration?.imageUrl || null,
            };
            spec.insurance = {
                policyNumber: veh?.insurance?.policyNumber || null,
                provider: veh?.insurance?.provider || null,
                expiryDate: veh?.insurance?.expiryDate || null,
                imageUrl: veh?.insurance?.imageUrl || null,
            };
            spec.roadWorthiness = {
                certificateNumber: veh?.roadWorthiness?.certificateNumber || null,
                expiryDate: veh?.roadWorthiness?.expiryDate || null,
                imageUrl: veh?.roadWorthiness?.imageUrl || null,
            };
            spec.hackneyPermit = {
                number: veh?.hackneyPermit?.number || null,
                expiryDate: veh?.hackneyPermit?.expiryDate || null,
                imageUrl: veh?.hackneyPermit?.imageUrl || null,
            };
            spec.lasdriCard = {
                number: veh?.lasdriCard?.number || null,
                expiryDate: veh?.lasdriCard?.expiryDate || null,
                imageUrl: veh?.lasdriCard?.imageUrl || null,
            };
        }

        setFormData(prev => ({
            ...prev,
            identificationType: id?.type || null,
            identificationNumber: id?.number || '',
            identificationExpiry: isoToDMY(id?.expiryDate) || null,
            identificationFrontImage: id?.frontImageUrl || null,
            identificationBackImage: id?.backImageUrl || null,
            passportPhoto: passport?.imageUrl || null,
            operationalState: area?.state || '',
            operationalLga: area?.lga || '',
            vehicleType: chosenVehicleType,
            bankAccounts: banks.map(b => ({
                accountName: b.accountName,
                accountNumber: b.accountNumber,
                bankName: b.bankName,
                bankCode: b.bankCode,
                isPrimary: !!b.isPrimary,
                id: b._id || undefined,
            })),
            specificDocs: spec,
        }));
    };

    const mapSpecificDocs = (verificationData) => {
        const docs = verificationData.documentUploads || {};
        const specificDocs = {};

        // Map vehicle-specific documents
        if (docs.license) specificDocs.driversLicense = docs.license.image;
        if (docs.vehicleRegistration) specificDocs.vehicleRegistration = docs.vehicleRegistration.image;
        if (docs.insurance) specificDocs.insurance = docs.insurance.image;
        if (docs.roadWorthiness) specificDocs.roadWorthiness = docs.roadWorthiness.image;
        if (docs.hackneyPermit) specificDocs.hackneyPermit = docs.hackneyPermit.image;
        if (docs.lasdriCard) specificDocs.lasdriCard = docs.lasdriCard.image;

        return specificDocs;
    };

    const determineInitialStep = (raw) => {
        const v = raw?.verification ? raw.verification : raw;

        const overall = v?.overallStatus;
        const basic = v?.basicVerification || {};
        const specific = v?.specificVerification || {};
        const chosenVehicleType =
            formData.vehicleType ||
            userData?.vehicleDetails?.type ||
            specific?.activeVerificationType ||
            null;

        // compute basic completeness in the same way your UI expects
        const basicComplete = Boolean(
            (basic?.identification?.type) &&
            (basic?.identification?.number) &&
            (basic?.passportPhoto?.imageUrl) &&
            (basic?.operationalArea?.state) &&
            (basic?.operationalArea?.lga) &&
            Array.isArray(basic?.bankAccounts) && basic.bankAccounts.length > 0
        );

        // reuse your normalized form state for specific completeness
        const specComplete = isSpecificCompleteFor(chosenVehicleType, formData.specificDocs);

        if (overall === 'approved') {
            setCurrentStep('review');
            return;
        }

        if (!basicComplete) {
            setCurrentStep('basic');
            return;
        }

        if (!specComplete) {
            setCurrentStep('specific');
            return;
        }

        setCurrentStep('review');
    };

    const handleNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < VERIFICATION_STEPS.length) {
            setCurrentStep(VERIFICATION_STEPS[nextIndex].id);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1;
            setCurrentStep(VERIFICATION_STEPS[prevIndex].id);
        } else {
            router.back();
        }
    };

    const handleSubmit = async () => {
        if (loading) return;
        try {
            setLoading(true);
            setModalVisible(true);
            setModalStatus('loading');
            setModalMessage('Submitting your verification...');
            const submissionData = {
                basicInfo: {
                    identification: {
                        type: formData.identificationType,
                        number: formData.identificationNumber,
                        expiry: formData.identificationExpiry,
                        frontImage: formData.identificationFrontImage,
                        backImage: formData.identificationBackImage
                    },
                    passportPhoto: formData.passportPhoto,
                    operationalArea: {
                        state: formData.operationalState,
                        lga: formData.operationalLga
                    },
                    vehicleType: formData.vehicleType,
                    bankAccounts: formData.bankAccounts.map(account => ({
                        accountName: account.accountName,
                        accountNumber: account.accountNumber,
                        bankName: account.bankName,
                        bankCode: account.bankCode,
                        isPrimary: account.isPrimary
                    }))
                },
                specificDocs: formData.specificDocs
            };
            const data = await DriverUtils.SubmitVerification(submissionData);
            console.log({data});
            await SessionManager.updateUser(data?.dashboardData);
            toast.success('Verification Successful');
            setModalStatus('success');
            setModalMessage('Submitted! Your documents are now pending review.');
            if (onUpdateSuccess) {
                await onUpdateSuccess();
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Error: Failed to submit verification');
            setModalStatus('error');
            setModalMessage('Submission failed. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            {VERIFICATION_STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                    {/* Step Circle with Icon/Number */}
                    <View style={styles.stepItem}>
                        <View
                            style={[
                                styles.stepCircle,
                                index <= currentStepIndex && styles.stepCircleActive,
                                index < currentStepIndex && styles.stepCircleComplete
                            ]}
                        >
                            {index < currentStepIndex ? (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            ) : (
                                <Ionicons
                                    name={step.icon}
                                    size={16}
                                    color={index <= currentStepIndex ? "#fff" : "#9ca3af"}
                                />
                            )}
                        </View>
                        <Text style={[
                            styles.stepTitle,
                            index <= currentStepIndex && styles.stepTitleActive
                        ]}>
                            {step.title}
                        </Text>
                    </View>

                    {/* Connecting Line (except for last step) */}
                    {index < VERIFICATION_STEPS.length - 1 && (
                        <View style={[
                            styles.stepLine,
                            index < currentStepIndex && styles.stepLineComplete
                        ]} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );

    const renderStepContent = () => {
        if (loading && currentStep !== 'intro') {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            );
        }

        switch (currentStep) {
            case 'intro':
                return (
                    <IntroScreen
                        onStart={() => setCurrentStep('basic')}
                        verificationStatus={verification?.overallStatus}
                        existingData={!!verification}
                    />
                );
            case 'basic':
                return (
                    <BasicVerification
                        formData={formData}
                        updateFormData={updateFormData}
                        userData={userData}
                        existingVerification={verification}
                    />
                );
            case 'specific':
                return (
                    <SpecificVerification
                        formData={formData}
                        updateFormData={updateFormData}
                        vehicleType={formData.vehicleType}
                        userData={userData}
                        existingVerification={verification}
                    />
                );
            case 'review':
                return (
                    <ReviewSubmit
                        formData={formData}
                        onSubmit={handleSubmit}
                        loading={loading}
                        onBack={() => setCurrentStep('specific')}
                        verificationStatus={verification?.overallStatus}
                        existingVerification={verification}
                    />
                );
            default:
                return null;
        }
    };

    const renderNavigationButtons = () => {
        if (currentStep === 'intro' || currentStep === 'review') return null;

        const isActionDisabled = !canProceedToNext || loading;
        const showReview = currentStep === 'specific';

        return (
            <View style={styles.bottomBar}>
                <View style={[styles.navRow, { flexDirection: isCompact ? 'column' : 'row' }]}>
                    {/* Back */}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        hitSlop={8}
                        onPress={handleBack}
                        disabled={loading}
                        style={[styles.actionButton, isCompact ? { width: '100%' } : { flex: 1 }, loading && styles.actionButtonDisabled]}
                    >
                        <LinearGradient
                            colors={['#94a3b8', '#64748b']}  // slate-400 → slate-600
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.actionGradient}
                        >
                            <Ionicons name="chevron-back" size={20} color="#fff" />
                            <Text style={styles.actionText}>Back</Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Next / Review */}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={showReview ? 'Proceed to review' : 'Continue to next step'}
                        hitSlop={8}
                        onPress={showReview ? () => setCurrentStep('review') : handleNext}
                        disabled={isActionDisabled}
                        style={[styles.actionButton, isCompact ? { width: '100%' } : { flex: 1 }, isActionDisabled && styles.actionButtonDisabled]}
                    >
                        <LinearGradient
                            colors={isActionDisabled ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.actionGradient}
                        >
                            <Text style={styles.actionText}>{showReview ? 'Review' : 'Continue'}</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Driver Verification"
                onBackPress={handleBack}
            />

            {currentStep !== 'intro' && renderProgressBar()}

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {renderStepContent()}
            </ScrollView>

            {renderNavigationButtons()}

            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                showRetryOnError={false}
                onClose={() => setModalVisible(false)}
                onFinish={() => {
                    setModalVisible(false);
                    router.replace('/driver/account');
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb'
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
        minWidth: 80,
        maxWidth: 90,
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#d1d5db',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    stepCircleActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    stepCircleComplete: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    stepTitle: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9ca3af',
        textAlign: 'center',
        flexShrink: 0,
        flexGrow: 0,
        flexWrap: 'nowrap',
        width: '100%',
    },
    stepTitleActive: {
        color: '#374151',
        fontWeight: '600',
    },
    stepLine: {
        flex: 1,
        height: 3,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 1,
        borderRadius: 2,
        marginTop: -20, // Adjust to align with circle center
    },
    stepLineComplete: {
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 1,
    },
    content: {
        flex: 1
    },
    contentContainer: {
        padding: 15,
        paddingBottom: 100
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500'
    },
    navigationButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        gap: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280'
    },
    nextButton: {
        flex: 2,
        borderRadius: 40,
        overflow: 'hidden',
    },
    nextButtonDisabled: {
        opacity: 0.5
    },
    nextGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8
    },
    nextButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#fff'
    },
    submitButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden'
    },
    submitButtonDisabled: {
        opacity: 0.5
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#fff'
    },
    // append to your StyleSheet.create({...})
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.select({ ios: 20, android: 16 }),
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    navRow: {
        gap: 12,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 18,
        gap: 8,
    },
    actionText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#fff',
        fontWeight: '600',
    },

});

export default DataVerification;