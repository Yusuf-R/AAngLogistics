// components/Driver/Account/Support/SupportMessage.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Send,
    CheckCircle,
    AlertCircle,
    FileText,
    Image as ImageIcon
} from 'lucide-react-native';
import { router } from 'expo-router';
import DriverUtils from '../../../../utils/DriverUtilities';
import { queryClient } from "../../../../lib/queryClient.js"

const CATEGORIES = [
    { value: 'account_issue', label: 'Account Issue' },
    { value: 'verification_issue', label: 'Verification Issue' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'order_issue', label: 'Order Issue' },
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'other', label: 'Other' },
];

function Message() {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('other');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [ticketRef, setTicketRef] = useState('');

    const handleSubmit = async () => {
        // Validation
        if (!subject.trim()) {
            Alert.alert('Required', 'Please enter a subject');
            return;
        }

        if (!description.trim()) {
            Alert.alert('Required', 'Please describe your issue');
            return;
        }

        if (description.trim().length < 20) {
            Alert.alert('Too Short', 'Please provide more details (minimum 20 characters)');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await DriverUtils.createSupportTicket({
                subject: subject.trim(),
                description: description.trim(),
                category: selectedCategory,
            });

            if (response.success) {
                setTicketRef(response.data.ticketRef);
                setIsSuccess(true);
                await  queryClient.invalidateQueries({ queryKey: ['Tickets'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'open'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'all'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'closed'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'in_progress'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'resolved'] });
                // Auto-close after 3 seconds
                setTimeout(() => {
                    router.back();
                }, 3000);
            }
        } catch (error) {
            console.error('Failed to create ticket:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to submit your message. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <CheckCircle color="#10B981" size={64} strokeWidth={2} />
                    </View>
                    <Text style={styles.successTitle}>Message Sent!</Text>
                    <Text style={styles.successMessage}>
                        Your support ticket has been created successfully
                    </Text>
                    <View style={styles.ticketRefContainer}>
                        <Text style={styles.ticketRefLabel}>Ticket Reference:</Text>
                        <Text style={styles.ticketRef}>{ticketRef}</Text>
                    </View>
                    <Text style={styles.successSubtext}>
                        Our support team will respond within 2-4 hours via email
                    </Text>
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft color="#0F172A" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Send Message</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <AlertCircle color="#3B82F6" size={20} />
                    <Text style={styles.infoBannerText}>
                        Describe your issue in detail. We'll respond within 2-4 hours.
                    </Text>
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Category</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                    >
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category.value}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === category.value && styles.categoryChipActive
                                ]}
                                onPress={() => setSelectedCategory(category.value)}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        selectedCategory === category.value && styles.categoryChipTextActive
                                    ]}
                                >
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Subject */}
                <View style={styles.section}>
                    <Text style={styles.label}>
                        Subject <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Brief summary of your issue"
                        value={subject}
                        onChangeText={setSubject}
                        maxLength={100}
                        editable={!isSubmitting}
                    />
                    <Text style={styles.charCount}>{subject.length}/100</Text>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.label}>
                        Description <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe your issue in detail..."
                        value={description}
                        onChangeText={setDescription}
                        maxLength={1000}
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                        editable={!isSubmitting}
                    />
                    <Text style={styles.charCount}>{description.length}/1000</Text>
                </View>

                {/* Attachments (Coming Soon) */}
                <View style={styles.section}>
                    <Text style={styles.label}>Attachments (Coming Soon)</Text>
                    <View style={styles.attachmentsPlaceholder}>
                        <ImageIcon color="#94A3B8" size={32} />
                        <Text style={styles.attachmentsPlaceholderText}>
                            Image & file attachments coming soon
                        </Text>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!subject.trim() || !description.trim() || isSubmitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={!subject.trim() || !description.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Send color="#FFFFFF" size={20} />
                            <Text style={styles.submitButtonText}>Send Message</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#0F172A',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 20,
        fontFamily: 'PoppinsRegular',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#0F172A',
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    categoryScroll: {
        marginTop: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        fontFamily: 'PoppinsRegular',
    },
    categoryChipTextActive: {
        color: '#FFFFFF',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#0F172A',
    },
    textArea: {
        minHeight: 150,
        paddingTop: 12,
    },
    charCount: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'right',
        marginTop: 4,
    },
    attachmentsPlaceholder: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    attachmentsPlaceholderText: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 8,
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'PoppinsSemiBold',
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    successIcon: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'PoppinsSemiBold',
        color: '#0F172A',
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'PoppinsRegular',
    },
    ticketRefContainer: {
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    ticketRefLabel: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 4,
        fontFamily: 'PoppinsRegular',
    },
    ticketRef: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3B82F6',
        fontFamily: 'PoppinsSemiBold',
    },
    successSubtext: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 32,
        fontFamily: 'PoppinsRegular',
    },
    doneButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 48,
        paddingVertical: 12,
        borderRadius: 12,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'PoppinsSemiBold',
    },
});

export default Message;