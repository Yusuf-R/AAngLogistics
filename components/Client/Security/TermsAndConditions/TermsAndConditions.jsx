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
import ClientUtils from "../../../../utils/ClientUtilities";
import {router} from "expo-router";
import SessionManager from "../../../../lib/SessionManager";
import SecureStorage from "../../../../lib/SecureStorage";

const TermsAndConditions = ({navigation}) => {
    const userData = useSessionStore((state) => state.user);
    const [expandedSections, setExpandedSections] = useState({});
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Status Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Accepting TCs...');

    const mutation = useMutation({
        mutationKey: ['AcceptTCs'],
        mutationFn: ClientUtils.AcceptTCs,
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const sections = [
        {
            id: 'definitions',
            title: 'Definitions',
            icon: 'document-text-outline',
            content: [
                {term: 'Company', definition: 'refers to AANG Logistics, a registered logistics service provider.'},
                {term: 'Customer', definition: 'refers to the individual or entity using the Company\'s services.'},
                {
                    term: 'Goods',
                    definition: 'refers to the items being transported, stored, or handled by our logistics services.'
                },
                {term: 'Services', definition: 'refers to all logistics and related services provided by the Company.'},
            ]
        },
        {
            id: 'scope',
            title: 'Scope of Services',
            icon: 'car-outline',
            content: `AANG Logistics provides comprehensive logistics services including:

• Transportation services (road and rail)
• Last-mile delivery solutions
`
        },
        {
            id: 'obligations',
            title: 'Customer Obligations',
            icon: 'checkmark-circle-outline',
            content: `As our valued customer, you agree to:

• Provide accurate and complete shipment details (weight, dimensions, contents, destination)
• Ensure goods are properly packed, labeled, and comply with all legal and safety requirements
• Notify the Company immediately of any hazardous materials or special handling requirements
• Pay all applicable charges as per the agreed terms and conditions
• Comply with all applicable laws and regulations`
        },
        {
            id: 'pricing',
            title: 'Quotations & Pricing',
            icon: 'card-outline',
            content: `Pricing Terms:

• Quotations are valid for 30 days unless otherwise specified
• Prices may be subject to change due to fuel surcharges, customs fees, or unforeseen circumstances
• Additional charges may apply for special handling, extended storage, or incorrect documentation
• All prices are exclusive of applicable taxes unless otherwise stated
• Volume discounts available for regular customers`
        },
        {
            id: 'payment',
            title: 'Payment Terms',
            icon: 'wallet-outline',
            content: `Payment Conditions:

• Payment is due within 30 days of invoice issuance
• Late payments may incur interest at 1.5% per month
• The Company reserves the right to withhold services or goods for unpaid invoices
• Accepted payment methods: Bank transfer, credit cards, and approved digital wallets
• Payment disputes must be raised within 7 days of invoice receipt`
        },
        {
            id: 'liability',
            title: 'Liability & Insurance',
            icon: 'shield-checkmark-outline',
            content: `Liability Framework:

• The Company's liability for loss or damage is limited to 3 times the freight charges or as per applicable law
• Customers must declare high-value goods and arrange additional insurance if needed
• The Company maintains comprehensive insurance coverage for standard operations
• We are not liable for delays caused by force majeure events (e.g., natural disasters, strikes, government actions).
`
        },
        {
            id: 'delivery',
            title: 'Delivery & Service Standards',
            icon: 'time-outline',
            content: `Delivery Terms:

• Estimated delivery times are provided as guidance and are not guaranteed
• Customers must inspect goods upon delivery and report any damages within 48 hours
• Storage fees may apply if the customer fails to accept delivery within the agreed timeframe
• Delivery attempts will be made during standard business hours (8 AM - 6 PM)
• Special delivery arrangements available upon request`
        },
        {
            id: 'force-majeure',
            title: 'Force Majeure',
            icon: 'warning-outline',
            content: `The Company is not liable for failures or delays due to events beyond our reasonable control, including:

• Natural disasters, floods, earthquakes, or severe weather conditions
• War, terrorism, or civil unrest
• Government restrictions, sanctions, or regulatory changes
• Labor strikes or industrial action
• Pandemic-related restrictions or quarantine measures
• Infrastructure failures or cyber attacks`
        },
        {
            id: 'cancellation',
            title: 'Cancellation & Refunds',
            icon: 'return-up-back-outline',
            content: `Cancellation Policy:

• Cancellations must be submitted in writing or through our mobile app
• Cancellations made 24 hours before scheduled pickup: Full refund minus 5% administrative fee
• Cancellations made less than 24 hours: 50% refund
• No refunds for services already commenced or completed
• Emergency cancellations will be reviewed on a case-by-case basis`
        },
        {
            id: 'governing-law',
            title: 'Governing Law & Dispute Resolution',
            icon: 'library-outline',
            content: `Legal Framework:

• These terms are governed by the laws of Nigeria and the Federal Capital Territory
• Any disputes shall first be resolved through good-faith negotiation
• Unresolved disputes may be submitted to binding arbitration under the Nigerian Arbitration Act
• The courts of Abuja, FCT shall have exclusive jurisdiction
• All legal proceedings shall be conducted in English`
        },
        {
            id: 'amendments',
            title: 'Terms Modification',
            icon: 'create-outline',
            content: `The Company reserves the right to modify these terms at any time. Changes will be communicated through:

• Email notifications to registered customers
• In-app notifications
• Website updates
• SMS alerts for significant changes

Continued use of our services after notification constitutes acceptance of the updated terms.`
        }
    ];

    const handleAcceptTerms = () => {
        setAcceptedTerms(!acceptedTerms);
    };

    const handleProceed = async () => {
        if (!acceptedTerms) {
            // Navigate to next screen or perform action
            return null
        }

        setModalVisible(true);

        const payload = {
            acceptedTcs: acceptedTerms
        }

        mutation.mutate(payload, {
            onSuccess: async (respData) => {
                setModalStatus('success');
                setModalMessage('Terms and Conditions Accepted! 🤝');

                const {user} = respData;

                await SessionManager.updateUser(user);

                setTimeout(() => {
                    setModalStatus('success');
                    setModalMessage('Terms and Conditions Accepted! 🤝');
                }, 2000);

                setModalVisible(false);
            },
            onError: (error) => {
                let errorMessage = 'Failed to send reset instructions ⚠️';
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
            <Text style={styles.sectionContent}>{section.content}</Text>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* Company Info Banner */}
            <View style={styles.companyBanner}>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>AAng Logistics</Text>
                    <Text style={styles.lastUpdated}>Last Updated: May 04, 2025</Text>
                </View>
                <Logo width={70} height={70}/>

                {/*<Ionicons name="business-outline" size={40} color="#2C5AA0" />*/}
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{flexGrow: 1}}
                keyboardShouldPersistTaps="handled"
            >
                {/* Introduction */}
                <View style={styles.introSection}>
                    <Text style={styles.introTitle}>Welcome to AANG Logistics</Text>
                    <Text style={styles.introText}>
                        These Terms and Conditions govern your use of our logistics services.
                        Please read them carefully before using our services.
                    </Text>
                </View>

                {/* Sections */}
                {sections.map((section, index) => (
                    <View key={section.id} style={styles.sectionContainer}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection(section.id)}
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

                {/* Contact Information */}
                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Contact Information</Text>
                    <Text style={styles.contactText}>For questions or concerns, contact us:</Text>

                    <View style={styles.contactItem}>
                        <Ionicons name="business-outline" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>AANG Logistics</Text>
                    </View>

                    <View style={styles.contactItem}>
                        <Ionicons name="location-outline" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>Plot 123, Central Business District, Abuja, FCT,
                            Nigeria</Text>
                    </View>

                    <View style={styles.contactItem}>
                        <Ionicons name="call-outline" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>+234 (0) 9 123 4567</Text>
                    </View>

                    <View style={styles.contactItem}>
                        <Ionicons name="mail-outline" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>support@aanglogistics.com</Text>
                    </View>

                    <View style={styles.contactItem}>
                        <Ionicons name="globe-outline" size={20} color="#2C5AA0"/>
                        <Text style={styles.contactItemText}>www.aanglogistics.com</Text>
                    </View>
                </View>

                <View style={styles.bottomSpacing}/>
            </ScrollView>

            {/* Accept Terms Footer */}
            {!userData.tcs.isAccepted && (
                <>
                    <View style={styles.footer}>
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
                                I have read and agree to the Terms and Conditions
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.proceedButton, acceptedTerms && styles.proceedButtonActive]}
                            onPress={handleProceed}
                            disabled={!acceptedTerms}
                        >
                            <Text style={[styles.proceedButtonText, acceptedTerms && styles.proceedButtonTextActive]}>
                                Accept
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    logo: {
        width: 90,
        height: 90,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    placeholder: {
        width: 34,
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
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2C5AA0',
        marginBottom: 4,
    },
    lastUpdated: {
        fontSize: 14,
        color: '#64748B',
    },
    scrollView: {
        flex: 1,
    },
    introSection: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 10,
    },
    introTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 10,
    },
    introText: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 24,
    },
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        marginBottom: 10,
        overflow: 'hidden',
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
        fontWeight: '600',
        color: '#1E293B',
        marginLeft: 10,
    },
    sectionContentContainer: {
        padding: 20,
        paddingTop: 0,
    },
    sectionContent: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
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
        fontWeight: '600',
        color: '#2C5AA0',
        marginBottom: 5,
    },
    definitionText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
    },
    contactSection: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 10,
    },
    contactTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 10,
    },
    contactText: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    contactItemText: {
        fontSize: 15,
        color: '#475569',
        marginLeft: 15,
        flex: 1,
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
        fontSize: 15,
        color: '#475569',
        flex: 1,
        lineHeight: 22,
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
        fontWeight: '600',
        color: '#94A3B8',
    },
    proceedButtonTextActive: {
        color: '#FFFFFF',
    },
});

export default TermsAndConditions;