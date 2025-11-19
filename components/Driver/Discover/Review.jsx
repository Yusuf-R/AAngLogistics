// components/Driver/Discover/Review.jsx
import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    BackHandler
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {router, useLocalSearchParams} from 'expo-router';
import {toast} from 'sonner-native';
import * as Haptics from 'expo-haptics';
import DriverUtils from '../../../utils/DriverUtilities';
import useLogisticStore from '../../../store/Driver/useLogisticStore';
import SessionManager from '../../../lib/SessionManager';
import useNavigationStore from "../../../store/Driver/useNavigationStore";

function Review({userData, earnings, orderRef, orderId}) {
    const setComingFromReview = useNavigationStore(state => state.setComingFromReview);
    console.log({
        earnings,
        ft: 'rv',
    })

    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [categories, setCategories] = useState({
        communication: 0,
        package_condition: 0,
        location_accuracy: 0,
        logistics: 0
    });
    const [wouldRecommend, setWouldRecommend] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);

    // Parse userData

    // ✅ Prevent back navigation with confirmation
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleBackPress();
            return true; // Prevent default back behavior
        });

        return () => backHandler.remove();
    }, [isSubmitting, isSkipping]);

    const handleBackPress = () => {
        if (isSubmitting || isSkipping) {
            return; // Don't allow back if already submitting/skipping
        }

        Alert.alert(
            'Skip Review?',
            'Are you sure you want to skip this review? You can add it later.',
            [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Skip Review', onPress: handleSkip, style: 'destructive'}
            ]
        );
    };

    const categoryLabels = {
        communication: 'Communication',
        package_condition: 'Package Condition',
        location_accuracy: 'Location Accuracy',
        logistics: 'Logistics Experience'
    };

    const handleStarPress = (star) => {
        setRating(star);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleCategoryRating = (category, value) => {
        setCategories(prev => ({...prev, [category]: value}));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // ✅ CENTRALIZED CLEANUP FUNCTION
    const performCleanupAndNavigate = async () => {
        try {
            console.log('🔄 Starting cleanup and navigation...');

            // 1. SET THE FLAG FIRST - This is crucial!
            setComingFromReview();
            console.log('🚩 Set comingFromReview flag');

            // 2. STOP ALL LOCATION TRACKING AND NAVIGATION
            useLogisticStore.getState().stopLocationTracking();
            useLogisticStore.getState().stopNavigation();

            await SessionManager.updateUser(userData);
            console.log('✅ Session updated at the review');

            // 2. Finalize delivery in store
            useLogisticStore.getState().finalizeDelivery();
            useLogisticStore.getState().resetStore();

            console.log('✅ Store finalized');

            // 3. Small delay before navigation
            await new Promise(resolve => setTimeout(resolve, 500));

            // 4. Navigate to discover
            router.replace('/driver/discover');
            console.log('✅ Navigated to discover');

        } catch (error) {
            console.error('❌ Cleanup error:', error);
            toast.error('Navigation error. Please restart the app.');

            // Force navigate anyway
            setTimeout(() => {
                router.replace('/driver/discover');
            }, 1000);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a star rating');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setIsSubmitting(true);

        try {
            const ratingData = {
                orderId,
                rating: {
                    stars: rating,
                    feedback: feedback.trim(),
                    categories: Object.entries(categories)
                        .filter(([_, value]) => value > 0)
                        .map(([category, rating]) => ({category, rating})),
                    wouldRecommend
                }
            };

            console.log('📝 Submitting review...');
            const result = await DriverUtils.submitClientRating(ratingData);

            if (result.success) {
                toast.success('Thank you for your feedback! 🎉');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // ✅ Cleanup and navigate
                await performCleanupAndNavigate();
            } else {
                toast.error(result.message || 'Failed to submit rating');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('❌ Submit rating error:', error);
            toast.error('Failed to submit rating');
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        setIsSkipping(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toast.info('Review skipped. You can add it later!');

        // ✅ Cleanup and navigate
        await performCleanupAndNavigate();
    };

    const renderStars = (currentRating, onPress, size = 40) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => onPress(star)}
                        onPressIn={() => setHoveredStar(star)}
                        onPressOut={() => setHoveredStar(0)}
                        style={styles.starButton}
                        disabled={isSubmitting || isSkipping}
                    >
                        <Ionicons
                            name={star <= (hoveredStar || currentRating) ? 'star' : 'star-outline'}
                            size={size}
                            color={star <= (hoveredStar || currentRating) ? '#FFD700' : '#D1D5DB'}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={60} color="#10B981"/>
                </View>
                <Text style={styles.headerTitle}>Delivery Completed! 🎉</Text>
                <Text style={styles.headerSubtitle}>Order {orderRef}</Text>
                <View style={styles.earningsBadge}>
                    <Text style={styles.earningsText}>
                        Earned: ₦{parseFloat(earnings.final).toFixed(2)}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Rating */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>How was your experience?</Text>
                    <Text style={styles.cardSubtitle}>
                        Rate your experience with this client
                    </Text>
                    {renderStars(rating, handleStarPress, 48)}

                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>
                            {rating === 5 ? 'Excellent! 🌟' :
                                rating === 4 ? 'Good! 👍' :
                                    rating === 3 ? 'Okay 👌' :
                                        rating === 2 ? 'Poor 😕' :
                                            'Very Poor 😞'}
                        </Text>
                    )}
                </View>

                {/* Category Ratings */}
                {rating > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Rate specific aspects</Text>
                        <Text style={styles.cardSubtitle}>Optional but helpful</Text>

                        {Object.entries(categoryLabels).map(([key, label]) => (
                            <View key={key} style={styles.categoryRow}>
                                <Text style={styles.categoryLabel}>{label}</Text>
                                <View style={styles.categoryStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => handleCategoryRating(key, star)}
                                            style={styles.categoryStarButton}
                                            disabled={isSubmitting || isSkipping}
                                        >
                                            <Ionicons
                                                name={star <= categories[key] ? 'star' : 'star-outline'}
                                                size={24}
                                                color={star <= categories[key] ? '#FFD700' : '#D1D5DB'}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Would Recommend */}
                {rating > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Would you deliver for this client again?</Text>
                        <View style={styles.recommendRow}>
                            <TouchableOpacity
                                style={[
                                    styles.recommendButton,
                                    wouldRecommend === true && styles.recommendButtonActive
                                ]}
                                onPress={() => {
                                    setWouldRecommend(true);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                }}
                                disabled={isSubmitting || isSkipping}
                            >
                                <Ionicons
                                    name="thumbs-up"
                                    size={28}
                                    color={wouldRecommend === true ? '#10B981' : '#9CA3AF'}
                                />
                                <Text style={[
                                    styles.recommendText,
                                    wouldRecommend === true && styles.recommendTextActive
                                ]}>
                                    Yes
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.recommendButton,
                                    wouldRecommend === false && styles.recommendButtonActive
                                ]}
                                onPress={() => {
                                    setWouldRecommend(false);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                }}
                                disabled={isSubmitting || isSkipping}
                            >
                                <Ionicons
                                    name="thumbs-down"
                                    size={28}
                                    color={wouldRecommend === false ? '#EF4444' : '#9CA3AF'}
                                />
                                <Text style={[
                                    styles.recommendText,
                                    wouldRecommend === false && styles.recommendTextActive
                                ]}>
                                    No
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Feedback */}
                {rating > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Additional Feedback (Optional)</Text>
                        <TextInput
                            style={styles.feedbackInput}
                            placeholder="Share your experience with this client..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={feedback}
                            onChangeText={setFeedback}
                            maxLength={500}
                            editable={!isSubmitting && !isSkipping}
                        />
                        <Text style={styles.charCount}>
                            {feedback.length}/500
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (rating === 0 || isSubmitting || isSkipping) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={rating === 0 || isSubmitting || isSkipping}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff"/>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff"/>
                                <Text style={styles.submitButtonText}>Submit Review</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {!isSubmitting && !isSkipping && (
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleBackPress}
                        >
                            <Text style={styles.skipButtonText}>Skip for Now</Text>
                        </TouchableOpacity>
                    )}

                    {isSkipping && (
                        <View style={styles.skippingIndicator}>
                            <ActivityIndicator size="small" color="#6B7280"/>
                            <Text style={styles.skippingText}>Returning to dashboard...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomSpace}/>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#F9FAFB'},
    header: {
        backgroundColor: '#fff',
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    successIcon: {marginBottom: 16},
    headerTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 4
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 12
    },
    earningsBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20
    },
    earningsText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#10B981'
    },
    scrollView: {flex: 1},
    scrollContent: {padding: 20},
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4
    },
    cardSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 20
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16
    },
    starButton: {padding: 4},
    ratingLabel: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        textAlign: 'center'
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    categoryLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
        flex: 1
    },
    categoryStars: {flexDirection: 'row', gap: 4},
    categoryStarButton: {padding: 2},
    recommendRow: {flexDirection: 'row', gap: 12, marginTop: 12},
    recommendButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    recommendButtonActive: {
        backgroundColor: '#F0FDF4',
        borderColor: '#10B981'
    },
    recommendText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    recommendTextActive: {color: '#10B981'},
    feedbackInput: {
        backgroundColor: '#F9FAFB',
        padding: 14,
        borderRadius: 12,
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    charCount: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4
    },
    actions: {marginTop: 8},
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        paddingVertical: 18,
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: '#10B981',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    submitButtonDisabled: {opacity: 0.5},
    submitButtonText: {
        fontSize: 17,
        fontFamily: 'PoppinsBold',
        color: '#fff'
    },
    skipButton: {paddingVertical: 14, alignItems: 'center'},
    skipButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    skippingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 14
    },
    skippingText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    bottomSpace: {height: 40}
});

export default Review;