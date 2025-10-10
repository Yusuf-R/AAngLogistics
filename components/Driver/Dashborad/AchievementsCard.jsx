import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AchievementsCard = ({ userData }) => {
    const achievements = [
        {
            id: 1,
            title: 'First Delivery',
            description: 'Complete your first delivery',
            icon: 'rocket',
            color: '#3B82F6',
            completed: userData?.performance?.totalDeliveries > 0,
            progress: userData?.performance?.totalDeliveries > 0 ? 1 : 0,
            target: 1
        },
        {
            id: 2,
            title: 'Rising Star',
            description: 'Complete 10 deliveries',
            icon: 'star',
            color: '#F59E0B',
            completed: (userData?.performance?.totalDeliveries || 0) >= 10,
            progress: userData?.performance?.totalDeliveries || 0,
            target: 10
        },
        {
            id: 3,
            title: 'Quality Driver',
            description: 'Maintain 4.5+ rating',
            icon: 'trophy',
            color: '#10B981',
            completed: (userData?.performance?.averageRating || 0) >= 4.5,
            progress: userData?.performance?.averageRating || 0,
            target: 4.5
        },
        {
            id: 4,
            title: 'Weekend Warrior',
            description: 'Complete 5 weekend deliveries',
            icon: 'calendar',
            color: '#8B5CF6',
            completed: false, // You'll need to track this separately
            progress: 0,
            target: 5
        }
    ];

    const completedCount = achievements.filter(a => a.completed).length;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <Text style={styles.achievementCount}>{completedCount}/{achievements.length}</Text>
            </View>

            <View style={styles.achievementsContainer}>
                {achievements.map((achievement, index) => (
                    <View key={achievement.id} style={styles.achievementItem}>
                        <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                            <Ionicons
                                name={achievement.completed ? achievement.icon : 'lock-closed'}
                                size={20}
                                color="#FFF"
                            />
                        </View>

                        <View style={styles.achievementContent}>
                            <Text style={styles.achievementTitle}>
                                {achievement.title}
                            </Text>
                            <Text style={styles.achievementDescription}>
                                {achievement.description}
                            </Text>

                            {!achievement.completed && (
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                {
                                                    width: `${(achievement.progress / achievement.target) * 100}%`,
                                                    backgroundColor: achievement.color
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {achievement.progress}/{achievement.target}
                                    </Text>
                                </View>
                            )}

                            {achievement.completed && (
                                <View style={styles.completedBadge}>
                                    <Ionicons name="checkmark" size={12} color="#10B981" />
                                    <Text style={styles.completedText}>Completed</Text>
                                </View>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#1F2937',
        fontFamily: 'PoppinsBold',
    },
    achievementCount: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsMedium',
    },
    achievementsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    achievementItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    achievementIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    achievementContent: {
        flex: 1,
    },
    achievementTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'PoppinsSemiBold',
        marginBottom: 2,
    },
    achievementDescription: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'PoppinsRegular',
        marginBottom: 8,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: '#6B7280',
        fontFamily: 'PoppinsMedium',
        minWidth: 30,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    completedText: {
        fontSize: 10,
        color: '#065F46',
        fontFamily: 'PoppinsMedium',
    },
});

export default AchievementsCard;