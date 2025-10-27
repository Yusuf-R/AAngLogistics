import React, {useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

import Logo from '../../../../assets/svg/AAng.svg';
import {useSessionStore} from "../../../../store/useSessionStore";
import StatusModal from "../../../StatusModal/StatusModal";
import {useMutation} from "@tanstack/react-query";
import DriverUtils from "../../../../utils/DriverUtilities";
import {router} from "expo-router";
import SessionManager from "../../../../lib/SessionManager";
import { tcs } from "../../../../utils/Driver/Constants";
import CustomHeader from "../../../CustomHeader"; // Updated import

const TermsConditions = () => {
    const userData = useSessionStore((state) => state.user);
    const [expandedSections, setExpandedSections] = useState({});
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Status Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Accepting Terms...');

    const mutation = useMutation({
        mutationKey: ['AcceptTCs'],
        mutationFn: DriverUtils.TermsConditions,
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleAcceptTerms = () => {
        setAcceptedTerms(!acceptedTerms);
    };

    const handleProceed = async () => {
        if (!acceptedTerms) {
            return null;
        }

        setModalVisible(true);
        setModalStatus('loading');
        setModalMessage('Accepting Terms and Conditions...');

        const payload = {
            acceptedTcs: acceptedTerms
        }

        mutation.mutate(payload, {
            onSuccess: async (respData) => {
                setModalStatus('success');
                setModalMessage('Terms Accepted Successfully! 🎉');

                const {user} = respData;
                await SessionManager.updateUser(user);

                setTimeout(() => {
                    setModalVisible(false);
                    // Navigate to driver dashboard after successful acceptance
                    router.replace('/driver/dashboard');
                }, 2000);
            },
            onError: (error) => {
                let errorMessage = 'Failed to accept terms. Please try again. ⚠️';
                if (error.message === "Network error") {
                    errorMessage = 'No internet connection 🔌';
                } else {
                    errorMessage = error.message;
                }
                setModalStatus('error');
                setModalMessage(errorMessage);
            }
        });
    };

    const renderDefinitionItem = (item, index) => (
        <View key={index} style={styles.definitionItem}>
            <Text style={styles.definitionTerm}>"{item.term}"</Text>
            <Text style={styles.definitionText}>{item.definition}</Text>
        </View>
    );

    const renderSectionContent = (section) => {
        if (section.id === 'definitions') {
            return (
                <View style={styles.definitionsContainer}>
                    {section.content.map((item, index) => renderDefinitionItem(item, index))}
                </View>
            );
        }
        return (
            <>
                <Text style={styles.sectionContent}>{section.content}</Text>
                {section.body && (
                    <Text style={styles.sectionContentBody}>{section.body}</Text>
                )}
            </>
        );
    };

    return (
        <>
            <CustomHeader
                title="Terms & Conditions"
                onBackPress={() => router.back()}
            />
            <SafeAreaView style={styles.container}>

            {/* Company Info Banner */}
            <View style={styles.companyBanner}>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>AAng Logistics</Text>
                    <Text style={styles.driverTitle}>Driver Terms & Conditions</Text>
                    <Text style={styles.lastUpdated}>Last Updated: May 04, 2025</Text>
                </View>
                <Logo width={70} height={70}/>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{flexGrow: 1}}
                keyboardShouldPersistTaps="handled"
            >
                {/* Driver-Specific Introduction */}
                <View style={styles.introSection}>
                    <View style={styles.driverBadge}>
                        <Ionicons name="car-sport" size={20} color="#FFFFFF"/>
                        <Text style={styles.driverBadgeText}>Driver Portal</Text>
                    </View>
                    <Text style={styles.introTitle}>Welcome to AANG Logistics Driver Platform</Text>
                    <Text style={styles.introText}>
                        These Terms and Conditions govern your relationship with AANG Logistics as an independent
                        contractor.
                        Please read them carefully as they outline your rights, responsibilities, and the platform's
                        policies.
                    </Text>
                    <View style={styles.importantNote}>
                        <Ionicons name="warning" size={16} color="#D97706"/>
                        <Text style={styles.importantNoteText}>
                            Important: You are an independent contractor, not an employee
                        </Text>
                    </View>
                </View>

                {/* Driver-Specific Sections */}
                {tcs.map((section, index) => (
                    <View key={section.id} style={styles.sectionContainer}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection(section.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.sectionHeaderLeft}>
                                <View style={styles.sectionNumber}>
                                    <Text style={styles.sectionNumberText}>{index + 1}</Text>
                                </View>
                                <View style={styles.sectionTitleContainer}>
                                    <Ionicons name={section.icon} size={20} color="#2C5AA0"/>
                                    <Text style={styles.sectionTitle}>{section.title}</Text>
                                </View>
                            </View>
                            <Ionicons
                                name={expandedSections[section.id] ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>

                        {expandedSections[section.id] && (
                            <View style={styles.sectionContentContainer}>
                                {renderSectionContent(section)}
                            </View>
                        )}
                    </View>
                ))}

                {/* Driver-Specific Contact Information */}
                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Driver Support & Contact</Text>
                    <Text style={styles.contactText}>
                        For driver-specific questions, support, or concerns about these terms:
                    </Text>

                    <View style={styles.contactItem}>
                        <Ionicons name="headset" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>Driver Support Hotline: +234 (0) 9 123 4567</Text>
                    </View>

                    <View style={styles.contactItem}>
                        <Ionicons name="mail" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>drivers@aanglogistics.com</Text>
                    </View>

                    <View style={styles.contactItem}>
                        <Ionicons name="time" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>Support Hours: 24/7 for emergencies</Text>
                    </View>

                    <View style={styles.contactItem}>
                        <Ionicons name="business" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>Plot 123, Central Business District, Abuja, FCT,
                            Nigeria</Text>
                    </View>
                </View>

                <View style={styles.bottomSpacing}/>
            </ScrollView>

            {/* Accept Terms Footer - Only show if TCs not accepted */}
            {!userData?.tcs?.isAccepted && (
                <View style={styles.footer}>
                    <View style={styles.termsSummary}>
                        <Ionicons name="information-circle" size={20} color="#2C5AA0"/>
                        <Text style={styles.termsSummaryText}>
                            By accepting, you acknowledge you've read and understood all {tcs.length} sections
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={handleAcceptTerms}
                    >
                        <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                            {acceptedTerms && (
                                <Ionicons name="checkmark" size={16} color="#FFFFFF"/>
                            )}
                        </View>
                        <Text style={styles.checkboxText}>
                            I have read and agree to the Driver Terms and Conditions
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.proceedButton, acceptedTerms && styles.proceedButtonActive]}
                        onPress={handleProceed}
                        disabled={!acceptedTerms}
                    >
                        <Text style={[styles.proceedButtonText, acceptedTerms && styles.proceedButtonTextActive]}>
                            Accept & Continue Driving
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
                onRetry={modalStatus === 'error' ? handleProceed : undefined}
            />
        </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    companyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#2C5AA0',
    },
    driverTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        fontWeight: '600',
        color: '#475569',
    },
    lastUpdated: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#64748B',
    },
    scrollView: {
        flex: 1,
    },
    introSection: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#2C5AA0',
    },
    driverBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#2C5AA0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 12,
    },
    driverBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    introTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 10,
        lineHeight: 28,
    },
    introText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#64748B',
        lineHeight: 24,
        marginBottom: 12,
        textAlign: 'justify'
    },
    importantNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#D97706',
    },
    importantNoteText: {
        fontFamily: 'PoppinsRegular',
        fontSize: 14,
        color: '#92400E',
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        overflow: 'hidden',
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sectionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2C5AA0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    sectionNumberText: {
        color: '#FFFFFF',
        fontFamily: 'PoppinsSemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#1E293B',
        marginLeft: 10,
        flex: 1,
    },
    sectionContentContainer: {
        padding: 15,
        paddingTop: 10,
    },
    sectionContent: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
        color: '#475569',
        textAlign: 'justify',
        marginBottom: 10,
        marginTop: 10
    },
    sectionContentBody: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#475569',
        lineHeight: 40,
        fontWeight: '400',
        textAlign: 'justify',
    },
    definitionsContainer: {
        gap: 15,
    },
    definitionItem: {
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2C5AA0',
    },
    definitionTerm: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#2C5AA0',

        marginBottom: 5,
    },
    definitionText: {
        fontSize: 15,
        textAlign: 'justify',
        fontFamily: 'PoppinsRegular',
        color: '#475569',
        lineHeight: 22,
    },
    contactSection: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    contactTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 10,
    },
    contactText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 22,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    contactItemText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#475569',
        marginLeft: 15,
        flex: 1,
        lineHeight: 22,
    },
    bottomSpacing: {
        height: 20,
    },
    footer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderRadius: 20
    },
    termsSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    termsSummaryText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#1E40AF',
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#2C5AA0',
        borderColor: '#2C5AA0',
    },
    checkboxText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#475569',
        flex: 1,
        lineHeight: 22,
        fontWeight: '500',
    },
    proceedButton: {
        backgroundColor: '#E2E8F0',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    proceedButtonActive: {
        backgroundColor: '#2C5AA0',
    },
    proceedButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        fontWeight: '600',
        color: '#94A3B8',
    },
    proceedButtonTextActive: {
        color: '#FFFFFF',
    },
});

export default TermsConditions;