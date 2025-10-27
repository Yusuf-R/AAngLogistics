import React from 'react';
import {View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomHeader from "../../../CustomHeader";

// Reuse your existing colors
const COLORS = {
    primary: '#4361EE',
    secondary: '#3A0CA3',
    accent: '#7209B7',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#212529',
    muted: '#6C757D',
    error: '#DC3545',
    success: '#28A745',
    border: '#DEE2E6',
};

function PrivacyPolicy() {
    const router = useRouter();

    const handleEmailPress = () => {
        Linking.openURL('mailto:privacy@aanglogistics.com');
    };

    const openWebsite = () => {
        Linking.openURL('https://www.aanglogistics.com/privacy');
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Privacy Policy"
                onBackPress={() => router.back()}
            />
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Introduction */}
                <Text style={styles.lastUpdated}>Last Updated: May 2025</Text>
                {/*<Text style={styles.lastUpdated}>Effective Date: June 1, 2025</Text>*/}

                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.paragraph}>
                    AAng Logistics Limited ("AAng Logistics", "we", "our", or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, process, store, and disclose your information when you use our mobile application, website, and logistics services (collectively, "Services").
                </Text>
                <Text style={styles.paragraph}>
                    This policy applies to all users of our Services, including customers, drivers, merchants, and business partners. By using our Services, you agree to the collection and use of information in accordance with this policy.
                </Text>

                {/* Definitions */}
                <Text style={styles.sectionTitle}>2. Definitions</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Personal Data:</Text> Any information that identifies or can be used to identify you</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Services:</Text> Our mobile app, website, logistics, and delivery services</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Controller:</Text> AAng Logistics as the entity determining how personal data is processed</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Third Parties:</Text> External service providers, partners, or vendors</Text>
                </View>

                {/* Data Collection */}
                <Text style={styles.sectionTitle}>3. Information We Collect</Text>

                <Text style={styles.subSectionTitle}>a. Personal Information You Provide</Text>
                <Text style={styles.paragraph}>
                    When you create an account, use our Services, or contact us, we collect:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Identity Data:</Text> Full name, username, date of birth, gender</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Contact Data:</Text> Email address, phone number, postal address</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Profile Data:</Text> Profile picture, preferences, account settings</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Financial Data:</Text> Payment card details, bank account information, transaction history</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Identity Verification:</Text> Government-issued ID, driver's license, business registration documents</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Communication Data:</Text> Messages, support tickets, feedback, reviews</Text>
                </View>

                <Text style={styles.subSectionTitle}>b. Information Collected Automatically</Text>
                <Text style={styles.paragraph}>
                    When you use our Services, we automatically collect:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Device Information:</Text> Device model, operating system, unique device identifiers, mobile network information</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Usage Data:</Text> App interactions, features used, time spent, crash reports, performance data</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Log Data:</Text> IP address, browser type, access times, pages viewed, referring URLs</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Location Data:</Text> GPS coordinates, Wi-Fi access points, cell tower information (with permission)</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Cookies & Tracking:</Text> Session data, preferences, analytics information</Text>
                </View>

                <Text style={styles.subSectionTitle}>c. Information from Third Parties</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Social media platforms (if you connect your accounts)</Text>
                    <Text style={styles.bullet}>• Payment processors and financial institutions</Text>
                    <Text style={styles.bullet}>• Identity verification services</Text>
                    <Text style={styles.bullet}>• Marketing and analytics partners</Text>
                    <Text style={styles.bullet}>• Public databases and government sources</Text>
                </View>

                {/* Legal Basis */}
                <Text style={styles.sectionTitle}>4. Legal Basis for Processing</Text>
                <Text style={styles.paragraph}>
                    We process your personal data based on the following legal grounds:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Contract Performance:</Text> To provide our Services and fulfill our obligations to you</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Legitimate Interest:</Text> To improve our Services, prevent fraud, and ensure security</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Legal Compliance:</Text> To comply with applicable laws and regulations</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Consent:</Text> Where you have given explicit consent for specific processing activities</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Vital Interests:</Text> To protect your safety or the safety of others</Text>
                </View>

                {/* Data Usage */}
                <Text style={styles.sectionTitle}>5. How We Use Your Information</Text>

                <Text style={styles.subSectionTitle}>a. Service Provision</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Create and manage your account</Text>
                    <Text style={styles.bullet}>• Process and fulfill delivery requests</Text>
                    <Text style={styles.bullet}>• Facilitate payments and transactions</Text>
                    <Text style={styles.bullet}>• Provide customer support and respond to inquiries</Text>
                    <Text style={styles.bullet}>• Send service-related notifications and updates</Text>
                </View>

                <Text style={styles.subSectionTitle}>b. Service Improvement & Analytics</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Analyze usage patterns and user behavior</Text>
                    <Text style={styles.bullet}>• Develop new features and improve existing ones</Text>
                    <Text style={styles.bullet}>• Conduct research and data analysis</Text>
                    <Text style={styles.bullet}>• Optimize delivery routes and logistics operations</Text>
                    <Text style={styles.bullet}>• Personalize your experience and recommendations</Text>
                </View>

                <Text style={styles.subSectionTitle}>c. Security & Compliance</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Verify your identity and prevent unauthorized access</Text>
                    <Text style={styles.bullet}>• Detect and prevent fraud, abuse, and illegal activities</Text>
                    <Text style={styles.bullet}>• Ensure platform security and safety</Text>
                    <Text style={styles.bullet}>• Comply with legal obligations and court orders</Text>
                    <Text style={styles.bullet}>• Investigate violations of our Terms of Service</Text>
                </View>

                <Text style={styles.subSectionTitle}>d. Marketing & Communications</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Send promotional offers and marketing communications (with consent)</Text>
                    <Text style={styles.bullet}>• Conduct surveys and market research</Text>
                    <Text style={styles.bullet}>• Provide relevant advertisements and content</Text>
                    <Text style={styles.bullet}>• Measure marketing campaign effectiveness</Text>
                </View>

                {/* Data Sharing */}
                <Text style={styles.sectionTitle}>6. Information Sharing & Disclosure</Text>

                <Text style={styles.subSectionTitle}>a. Service Providers</Text>
                <Text style={styles.paragraph}>
                    We share information with trusted third-party service providers who assist us in:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Payment processing and financial services</Text>
                    <Text style={styles.bullet}>• Cloud hosting and data storage</Text>
                    <Text style={styles.bullet}>• Analytics and performance monitoring</Text>
                    <Text style={styles.bullet}>• Customer support and communication</Text>
                    <Text style={styles.bullet}>• Identity verification and background checks</Text>
                    <Text style={styles.bullet}>• Marketing and advertising services</Text>
                </View>

                <Text style={styles.subSectionTitle}>b. Business Partners</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Merchants and vendors for order fulfillment</Text>
                    <Text style={styles.bullet}>• Delivery partners and logistics providers</Text>
                    <Text style={styles.bullet}>• Insurance companies for coverage purposes</Text>
                    <Text style={styles.bullet}>• Integration partners for enhanced services</Text>
                </View>

                <Text style={styles.subSectionTitle}>c. Legal Requirements</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Law enforcement agencies and regulatory authorities</Text>
                    <Text style={styles.bullet}>• Courts and legal proceedings</Text>
                    <Text style={styles.bullet}>• Government agencies for compliance purposes</Text>
                    <Text style={styles.bullet}>• Emergency responders when safety is at risk</Text>
                </View>

                <Text style={styles.subSectionTitle}>d. Business Transactions</Text>
                <Text style={styles.paragraph}>
                    In case of merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction, subject to confidentiality agreements and applicable laws.
                </Text>

                <Text style={styles.highlightBox}>
                    <Text style={styles.boldText}>Important:</Text> We never sell, rent, or trade your personal information to third parties for their marketing purposes without your explicit consent.
                </Text>

                {/* Data Security */}
                <Text style={styles.sectionTitle}>7. Data Security & Protection</Text>
                <Text style={styles.paragraph}>
                    We implement comprehensive security measures to protect your information:
                </Text>

                <Text style={styles.subSectionTitle}>a. Technical Safeguards</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• End-to-end encryption for sensitive data transmission</Text>
                    <Text style={styles.bullet}>• Advanced encryption at rest for stored data</Text>
                    <Text style={styles.bullet}>• Secure Socket Layer (SSL) technology</Text>
                    <Text style={styles.bullet}>• Multi-factor authentication systems</Text>
                    <Text style={styles.bullet}>• Regular security monitoring and threat detection</Text>
                </View>

                <Text style={styles.subSectionTitle}>b. Organizational Measures</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Access controls and role-based permissions</Text>
                    <Text style={styles.bullet}>• Regular security training for employees</Text>
                    <Text style={styles.bullet}>• Confidentiality agreements with staff and contractors</Text>
                    <Text style={styles.bullet}>• Incident response and breach notification procedures</Text>
                    <Text style={styles.bullet}>• Regular security audits and penetration testing</Text>
                </View>

                <Text style={styles.subSectionTitle}>c. Data Breach Response</Text>
                <Text style={styles.paragraph}>
                    In the unlikely event of a data breach, we will notify affected users and relevant authorities within 72 hours as required by law, providing details about the breach and steps being taken to address it.
                </Text>

                {/* Data Retention */}
                <Text style={styles.sectionTitle}>8. Data Retention</Text>
                <Text style={styles.paragraph}>
                    We retain your personal data only as long as necessary for the purposes outlined in this policy:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Account Data:</Text> Until account deletion plus 30 days for system cleanup</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Transaction Records:</Text> 7 years for tax and accounting purposes</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Communication Data:</Text> 3 years for customer service and dispute resolution</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Marketing Data:</Text> Until you opt-out or withdraw consent</Text>
                    <Text style={styles.bullet}>• <Text style={styles.boldText}>Legal Hold Data:</Text> Until legal obligations are fulfilled</Text>
                </View>

                {/* User Rights */}
                <Text style={styles.sectionTitle}>9. Your Privacy Rights</Text>
                <Text style={styles.paragraph}>
                    Under applicable data protection laws, you have the following rights:
                </Text>

                <Text style={styles.subSectionTitle}>a. Access & Portability</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Request a copy of your personal data we hold</Text>
                    <Text style={styles.bullet}>• Receive your data in a structured, machine-readable format</Text>
                    <Text style={styles.bullet}>• Transfer your data to another service provider</Text>
                </View>

                <Text style={styles.subSectionTitle}>b. Correction & Deletion</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Correct inaccurate or incomplete information</Text>
                    <Text style={styles.bullet}>• Request deletion of your personal data (right to be forgotten)</Text>
                    <Text style={styles.bullet}>• Restrict processing of your data in certain circumstances</Text>
                </View>

                <Text style={styles.subSectionTitle}>c. Consent & Marketing</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Withdraw consent for data processing at any time</Text>
                    <Text style={styles.bullet}>• Opt-out of marketing communications</Text>
                    <Text style={styles.bullet}>• Object to processing based on legitimate interests</Text>
                </View>

                <Text style={styles.subSectionTitle}>d. How to Exercise Your Rights</Text>
                <Text style={styles.paragraph}>
                    To exercise any of these rights, contact us at privacy@aanglogistics.com or through the in-app settings. We will respond within 30 days and may request identity verification for security purposes.
                </Text>

                {/* International Transfers */}
                <Text style={styles.sectionTitle}>10. International Data Transfers</Text>
                <Text style={styles.paragraph}>
                    Your data may be transferred to and processed in countries other than Nigeria. We ensure adequate protection through:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Standard Contractual Clauses approved by data protection authorities</Text>
                    <Text style={styles.bullet}>• Adequacy decisions by relevant regulatory bodies</Text>
                    <Text style={styles.bullet}>• Certification schemes and codes of conduct</Text>
                    <Text style={styles.bullet}>• Binding corporate rules for intra-group transfers</Text>
                </View>

                {/* Children's Privacy */}
                <Text style={styles.sectionTitle}>11. Children's Privacy</Text>
                <Text style={styles.paragraph}>
                    Our Services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If we discover that we have collected information from a child, we will delete it immediately. Parents who believe their child has provided information should contact us immediately.
                </Text>

                {/* Cookies and Tracking */}
                <Text style={styles.sectionTitle}>12. Cookies & Tracking Technologies</Text>
                <Text style={styles.paragraph}>
                    We use cookies, pixels, and similar technologies to:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Remember your preferences and settings</Text>
                    <Text style={styles.bullet}>• Analyze app performance and user behavior</Text>
                    <Text style={styles.bullet}>• Provide personalized content and advertisements</Text>
                    <Text style={styles.bullet}>• Ensure security and prevent fraud</Text>
                </View>
                <Text style={styles.paragraph}>
                    You can manage cookie preferences through your device settings or by contacting us for assistance with opt-out procedures.
                </Text>

                {/* Third-Party Services */}
                <Text style={styles.sectionTitle}>13. Third-Party Links & Services</Text>
                <Text style={styles.paragraph}>
                    Our Services may contain links to third-party websites, applications, or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any information.
                </Text>

                {/* Updates to Policy */}
                <Text style={styles.sectionTitle}>14. Changes to This Privacy Policy</Text>
                <Text style={styles.paragraph}>
                    We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or other factors. We will notify users of material changes through:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• In-app notifications</Text>
                    <Text style={styles.bullet}>• Email notifications</Text>
                    <Text style={styles.bullet}>• Website banners</Text>
                    <Text style={styles.bullet}>• Push notifications (for significant changes)</Text>
                </View>
                <Text style={styles.paragraph}>
                    Continued use of our Services after changes become effective constitutes acceptance of the updated policy.
                </Text>

                {/* Contact Information */}
                <Text style={styles.sectionTitle}>15. Contact Information</Text>
                <Text style={styles.paragraph}>
                    For privacy-related questions, requests, or concerns, please contact our Data Protection Officer:
                </Text>

                <View style={styles.contactBox}>
                    <Text style={styles.contactTitle}>AAng Logistics Limited</Text>
                    <Text style={styles.contactDetail}>Data Protection Officer</Text>
                    <TouchableOpacity onPress={handleEmailPress}>
                        <Text style={styles.link}>privacy@aanglogistics.com</Text>
                    </TouchableOpacity>
                    <Text style={styles.contactDetail}>Phone: +234 (0) 800 LOGISTICS</Text>
                    <Text style={styles.contactDetail}>Address: [Your Business Address]</Text>
                    <Text style={styles.contactDetail}>Lagos, Nigeria</Text>
                </View>

                {/* Regulatory Information */}
                <Text style={styles.sectionTitle}>16. Regulatory Compliance</Text>
                <Text style={styles.paragraph}>
                    This Privacy Policy complies with:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bullet}>• Nigeria Data Protection Regulation (NDPR) 2019</Text>
                    <Text style={styles.bullet}>• General Data Protection Regulation (GDPR) where applicable</Text>
                    <Text style={styles.bullet}>• California Consumer Privacy Act (CCPA) for California residents</Text>
                    <Text style={styles.bullet}>• Other applicable regional data protection laws</Text>
                </View>

                <Text style={styles.paragraph}>
                    If you have concerns about our data practices that we cannot resolve, you have the right to lodge a complaint with the Nigerian Data Protection Bureau or your local data protection authority.
                </Text>

                {/* Full Policy Link */}
                <View style={styles.fullPolicyContainer}>
                    <Text style={styles.paragraph}>
                        For our complete Privacy Policy and additional resources, please visit:
                    </Text>
                    <TouchableOpacity onPress={openWebsite}>
                        <Text style={styles.link}>www.aanglogistics.com/privacy</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.acknowledgment}>
                    By using AAng Logistics services, you acknowledge that you have read, understood, and agree to this Privacy Policy.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContainer: {
        flex: 1,
        marginTop: 10
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 12,
        color: COLORS.muted,
        textAlign: 'right',
        marginBottom: 4,
        fontFamily: 'PoppinsRegular',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: 24,
        marginBottom: 12,
        fontFamily: 'PoppinsSemiBold',
    },
    subSectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
        marginTop: 12,
        marginBottom: 8,
        fontFamily: 'PoppinsMedium',
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.text,
        marginBottom: 12,
        fontFamily: 'PoppinsRegular',
    },
    bulletList: {
        marginLeft: 16,
        marginBottom: 16,
    },
    bullet: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
        marginBottom: 4,
    },
    boldText: {
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
    },
    link: {
        fontSize: 14,
        color: COLORS.primary,
        textDecorationLine: 'underline',
        marginBottom: 8,
        fontFamily: 'PoppinsRegular',
    },
    highlightBox: {
        backgroundColor: COLORS.card,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        padding: 16,
        marginVertical: 16,
        borderRadius: 8,
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
    },
    contactBox: {
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 12,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 8,
        fontFamily: 'PoppinsSemiBold',
    },
    contactDetail: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 4,
        fontFamily: 'PoppinsRegular',
    },
    fullPolicyContainer: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    acknowledgment: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.muted,
        textAlign: 'center',
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        fontFamily: 'PoppinsRegular',
        fontStyle: 'italic',
    },
});

export default PrivacyPolicy;