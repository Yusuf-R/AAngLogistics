// app/(protected)/driver/tcs-required.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TCGuard() {
    const handleAcceptTCs = () => {
        router.push('/driver/tcs');
    };

    const handleGoToDashboard = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="document-text" size={64} color="#3B82F6" />
                    </View>
                    <Text style={styles.title}>Action Required</Text>
                    <Text style={styles.subtitle}>
                        Please review and accept our Terms & Conditions to access all features
                    </Text>
                </View>

                {/* Benefits Section */}
                <View style={styles.benefitsSection}>
                    <Text style={styles.sectionTitle}>Why This Matters</Text>

                    <View style={styles.benefitItem}>
                        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                        <View style={styles.benefitText}>
                            <Text style={styles.benefitTitle}>Protect Your Rights</Text>
                            <Text style={styles.benefitDescription}>
                                Understand your earnings, insurance coverage, and legal protections
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Ionicons name="cash" size={20} color="#10B981" />
                        <View style={styles.benefitText}>
                            <Text style={styles.benefitTitle}>Payment & Earnings</Text>
                            <Text style={styles.benefitDescription}>
                                Learn about commission structure, payment schedules, and bonus opportunities
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Ionicons name="car" size={20} color="#10B981" />
                        <View style={styles.benefitText}>
                            <Text style={styles.benefitTitle}>Safety Guidelines</Text>
                            <Text style={styles.benefitDescription}>
                                Review safety protocols, emergency procedures, and insurance coverage
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Ionicons name="star" size={20} color="#10B981" />
                        <View style={styles.benefitText}>
                            <Text style={styles.benefitTitle}>Performance Standards</Text>
                            <Text style={styles.benefitDescription}>
                                Understand rating systems, performance expectations, and growth opportunities
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Facts */}
                <View style={styles.factsSection}>
                    <Text style={styles.factsTitle}>What to Expect</Text>
                    <View style={styles.factItem}>
                        <Ionicons name="time" size={16} color="#6B7280" />
                        <Text style={styles.factText}>Takes about 5-7 minutes to read</Text>
                    </View>
                    <View style={styles.factItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#6B7280" />
                        <Text style={styles.factText}>One-time acceptance required</Text>
                    </View>
                    <View style={styles.factItem}>
                        <Ionicons name="lock-closed" size={16} color="#6B7280" />
                        <Text style={styles.factText}>Your data is protected and secure</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleAcceptTCs}
                >
                    <Ionicons name="document-text" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Review Terms & Conditions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleGoToDashboard}
                >
                    <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        paddingTop: 20,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    benefitsSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    benefitText: {
        flex: 1,
        marginLeft: 12,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    benefitDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    factsSection: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    factsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    factItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    factText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
    },
    actions: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
});