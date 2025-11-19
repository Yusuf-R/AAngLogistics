// components/Driver/Delivery/ReviewModal.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReviewModal({
                                        visible,
                                        orderRef,
                                        orderId,
                                        earnings,
                                        onSubmit,
                                        onSkip,
                                        isSubmitting = false
                                    }) {
    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [categories, setCategories] = useState({
        communication: 0,
        package_condition: 0,
        location_accuracy: 0,
        payment: 0
    });
    const [wouldRecommend, setWouldRecommend] = useState(null);
    const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

    // Animate modal entrance
    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11
            }).start();
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible]);

    const categoryLabels = {
        communication: 'Communication',
        package_condition: 'Package Condition',
        location_accuracy: 'Location Accuracy',
        payment: 'Payment Experience'
    };

    const handleStarPress = (star) => {
        setRating(star);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleCategoryRating = (category, value) => {
        setCategories(prev => ({ ...prev, [category]: value }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSubmit = () => {
        if (rating === 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        const reviewData = {
            orderId,
            rating: {
                stars: rating,
                feedback: feedback.trim(),
                categories: Object.entries(categories)
                    .filter(([_, value]) => value > 0)
                    .map(([category, rating]) => ({ category, rating })),
                wouldRecommend
            }
        };

        onSubmit(reviewData);
    };

    const handleSkipPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSkip();
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
                        disabled={isSubmitting}
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
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleSkipPress}
        >
            <View style={styles.modalOverlay}>
                {/* Blur Background */}
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    {/* Celebration Header */}
                    <View style={styles.celebrationHeader}>
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={70} color="#10B981" />
                        </View>
                        <Text style={styles.celebrationTitle}>Delivery Complete! 🎉</Text>
                        <Text style={styles.orderRef}>Order {orderRef}</Text>
                        <View style={styles.earningsBadge}>
                            <Ionicons name="cash" size={18} color="#10B981" />
                            <Text style={styles.earningsText}>
                                ₦{parseFloat(earnings).toFixed(2)} earned
                            </Text>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Main Rating Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Rate Your Experience</Text>
                            <Text style={styles.cardSubtitle}>
                                How was working with this client?
                            </Text>
                            {renderStars(rating, handleStarPress, 44)}

                            {rating > 0 && (
                                <View style={styles.ratingFeedback}>
                                    <Text style={styles.ratingLabel}>
                                        {rating === 5 ? '🌟 Excellent!' :
                                            rating === 4 ? '👍 Good!' :
                                                rating === 3 ? '👌 Okay' :
                                                    rating === 2 ? '😕 Poor' :
                                                        '😞 Very Poor'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Category Ratings - Show when rating > 0 */}
                        {rating > 0 && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Detailed Rating</Text>
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
                                                    disabled={isSubmitting}
                                                >
                                                    <Ionicons
                                                        name={star <= categories[key] ? 'star' : 'star-outline'}
                                                        size={22}
                                                        color={star <= categories[key] ? '#FFD700' : '#D1D5DB'}
                                                    />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Would Recommend - Show when rating > 0 */}
                        {rating > 0 && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Would you work with them again?</Text>
                                <View style={styles.recommendRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.recommendButton,
                                            wouldRecommend === true && styles.recommendButtonYes
                                        ]}
                                        onPress={() => setWouldRecommend(true)}
                                        disabled={isSubmitting}
                                    >
                                        <Ionicons
                                            name="thumbs-up"
                                            size={26}
                                            color={wouldRecommend === true ? '#10B981' : '#9CA3AF'}
                                        />
                                        <Text style={[
                                            styles.recommendText,
                                            wouldRecommend === true && styles.recommendTextYes
                                        ]}>
                                            Yes
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.recommendButton,
                                            wouldRecommend === false && styles.recommendButtonNo
                                        ]}
                                        onPress={() => setWouldRecommend(false)}
                                        disabled={isSubmitting}
                                    >
                                        <Ionicons
                                            name="thumbs-down"
                                            size={26}
                                            color={wouldRecommend === false ? '#EF4444' : '#9CA3AF'}
                                        />
                                        <Text style={[
                                            styles.recommendText,
                                            wouldRecommend === false && styles.recommendTextNo
                                        ]}>
                                            No
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Feedback - Show when rating > 0 */}
                        {rating > 0 && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Additional Comments</Text>
                                <Text style={styles.cardSubtitle}>Optional</Text>
                                <TextInput
                                    style={styles.feedbackInput}
                                    placeholder="Share your experience..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    value={feedback}
                                    onChangeText={setFeedback}
                                    maxLength={500}
                                    editable={!isSubmitting}
                                />
                                <Text style={styles.charCount}>
                                    {feedback.length}/500
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        {rating > 0 ? (
                            <>
                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        isSubmitting && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                            <Text style={styles.submitButtonText}>Submit Review</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.skipButton}
                                    onPress={handleSkipPress}
                                    disabled={isSubmitting}
                                >
                                    <Text style={styles.skipButtonText}>Skip for Now</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={styles.skipButtonLarge}
                                onPress={handleSkipPress}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.skipButtonLargeText}>Skip Review</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.9,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10
    },
    celebrationHeader: {
        alignItems: 'center',
        paddingTop: 32,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#F0FDF4',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#D1FAE5'
    },
    successIconContainer: {
        marginBottom: 12
    },
    celebrationTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 4
    },
    orderRef: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 12
    },
    earningsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
    },
    earningsText: {
        fontSize: 17,
        fontFamily: 'PoppinsBold',
        color: '#10B981'
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 10
    },
    card: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    cardTitle: {
        fontSize: 17,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 4
    },
    cardSubtitle: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginBottom: 16
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginVertical: 8
    },
    starButton: {
        padding: 4
    },
    ratingFeedback: {
        marginTop: 12,
        alignItems: 'center'
    },
    ratingLabel: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    categoryLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
        flex: 1
    },
    categoryStars: {
        flexDirection: 'row',
        gap: 3
    },
    categoryStarButton: {
        padding: 2
    },
    recommendRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8
    },
    recommendButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    recommendButtonYes: {
        backgroundColor: '#F0FDF4',
        borderColor: '#10B981'
    },
    recommendButtonNo: {
        backgroundColor: '#FEF2F2',
        borderColor: '#EF4444'
    },
    recommendText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    recommendTextYes: {
        color: '#10B981'
    },
    recommendTextNo: {
        color: '#EF4444'
    },
    feedbackInput: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        minHeight: 90,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    charCount: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 6
    },
    actions: {
        padding: 20,
        paddingTop: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 14,
        marginBottom: 10,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    submitButtonDisabled: {
        opacity: 0.6
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#fff'
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center'
    },
    skipButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    skipButtonLarge: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    skipButtonLargeText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    }
});