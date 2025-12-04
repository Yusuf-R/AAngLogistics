// components/Driver/Dashboard/ProfileCompletionBanner.jsx
import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useProfileCompletion} from '../../../hooks/useDriverDashboard';

export const ProfileCompletionBanner = ({userData, completionAnimatedStyle}) => {
    const router = useRouter();
    const [showChecklist, setShowChecklist] = useState(false);

    const {data: completion, isLoading} = useProfileCompletion(userData);

    if (isLoading || !completion) {
        return null;
    }

    const {percent, isComplete, checklist, completedCount, totalCount} = completion;

    // Don't show banner if profile is complete
    if (isComplete) {
        return (
            <View style={styles.completedBanner}>
                <View style={styles.completedContent}>
                    <View style={styles.completedIcon}>
                        <Ionicons name="checkmark-circle" size={32} color="#10B981"/>
                    </View>
                    <View style={styles.completedText}>
                        <Text style={styles.completedTitle}>Profile Complete! 🎉</Text>
                        <Text style={styles.completedDesc}>
                            You're all set to maximize your earnings
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <Animated.View style={[styles.section, completionAnimatedStyle]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setShowChecklist(!showChecklist)}
                style={styles.completionCard}
            >
                <View style={styles.completionHeader}>
                    <View style={styles.completionIconContainer}>
                        <Ionicons name="person-circle-outline" size={32} color="#3B82F6"/>
                    </View>
                    <View style={styles.completionTextContainer}>
                        <Text style={styles.completionTitle}>Complete Your Profile</Text>
                        <Text style={styles.completionSubtitle}>
                            {completedCount} of {totalCount} completed
                        </Text>
                    </View>
                    <View style={styles.completionPercentage}>
                        <Text style={styles.percentageText}>{percent}%</Text>
                    </View>
                </View>

                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, {width: `${percent}%`}]}/>
                    </View>
                </View>

                {showChecklist && (
                    <View style={styles.checklistContainer}>
                        <View style={styles.checklistDivider}/>
                        {checklist.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.checklistItem}
                                onPress={() => handleNavigateToStep(item.id, router)}
                            >
                                <View style={styles.checklistLeft}>
                                    <View
                                        style={[
                                            styles.checkbox,
                                            item.completed && styles.checkboxCompleted,
                                        ]}
                                    >
                                        {item.completed && (
                                            <Ionicons name="checkmark" size={16} color="#FFF"/>
                                        )}
                                    </View>
                                    <View style={styles.checklistText}>
                                        <Text
                                            style={[
                                                styles.checklistLabel,
                                                item.completed && styles.checklistLabelCompleted,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                        <Text style={styles.checklistDesc}>
                                            {item.description}
                                        </Text>
                                    </View>
                                </View>
                                {!item.completed && (
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF"/>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.expandIndicator}>
                    <Ionicons
                        name={showChecklist ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#6B7280"
                    />
                    <Text style={styles.expandText}>
                        {showChecklist ? 'Hide' : 'View'} checklist
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Helper function to navigate to appropriate screen based on item
const handleNavigateToStep = (itemId, router) => {
    const navigationMap = {
        email: '/driver/account/security',
        avatar: '/driver/account/profile',
        authPin: '/driver/account/security',
        tcs: '/driver/tcs',
        bank: '/driver/account/verification',
        verification: '/driver/verification',
    };

    const route = navigationMap[itemId];
    if (route) {
        router.push(route);
    }
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
    },
    completedBanner: {
        backgroundColor: '#D1FAE5',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    completedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    completedIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedText: {
        flex: 1,
    },
    completedTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#065F46',
        fontFamily: 'PoppinsBold',
        marginBottom: 4,
    },
    completedDesc: {
        fontSize: 14,
        color: '#047857',
        fontFamily: 'PoppinsRegular',
    },
    completionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    completionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    completionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    completionTextContainer: {
        flex: 1,
    },
    completionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'PoppinsBold',
        marginBottom: 2,
    },
    completionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    completionPercentage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#3B82F6',
    },
    percentageText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#3B82F6',
        fontFamily: 'PoppinsBold',
    },
    progressBarContainer: {
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 4,
    },
    checklistContainer: {
        marginTop: 8,
    },
    checklistDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    checklistLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxCompleted: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    checklistText: {
        flex: 1,
    },
    checklistLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 2,
    },
    checklistLabelCompleted: {
        color: '#6B7280',
        textDecorationLine: 'line-through',
    },
    checklistDesc: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
    },
    expandIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 8,
    },
    expandText: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'PoppinsMedium',
    },
});