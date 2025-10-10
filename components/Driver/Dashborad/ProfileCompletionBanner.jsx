import React from 'react';
import {TouchableOpacity, Text, Animated, StyleSheet, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useRouter} from 'expo-router';

export const ProfileCompletionBanner = ({
                                            profileCompletion,
                                            isProfileComplete,
                                            completionAnimatedStyle
                                        }) => {
    const router = useRouter();

    if (isProfileComplete) return null;

    return (
        <Animated.View style={[styles.completionBanner, completionAnimatedStyle]}>
            <TouchableOpacity
                onPress={() => router.push('/driver/account')}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.completionGradient}
                >
                    <View style={styles.completionLeft}>
                        <Ionicons name="alert-circle" size={24} color="#FFF"/>
                        <View style={styles.completionTextContainer}>
                            <Text style={styles.completionTitle}>Complete Your Profile</Text>
                            <Text style={styles.completionSubtitle}>
                                {profileCompletion}% complete • Start earning today
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#FFF"/>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    /* Completion Banner */
    completionBanner: {
        marginTop: 12,
        marginBottom: 12,
        borderRadius: 20,
        // shadow/glow base (animated values will override opacity/elevation)
        shadowColor: '#2563EB',
        shadowOffset: {width: 0, height: 6},
        shadowRadius: 14,
        shadowOpacity: 0.2,
        elevation: 3,
    },
    completionGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
    },
    completionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    completionTextContainer: {flex: 1},
    completionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        fontFamily: 'PoppinsSemiBold',
    },
    completionSubtitle: {
        fontSize: 12,
        color: '#DBEAFE',
        fontFamily: 'PoppinsRegular',
    },
});
