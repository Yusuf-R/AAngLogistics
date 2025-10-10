// components/Driver/Dashboard/AutoScrollHighlights.jsx
import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 60;

// HighlightCard component - make sure this is defined BEFORE AutoScrollHighlights
const HighlightCard = ({ highlight, index, scrollX }) => {
    const inputRange = [
        (index - 1) * (CARD_WIDTH * 0.7 + 12),
        index * (CARD_WIDTH * 0.7 + 12),
        (index + 1) * (CARD_WIDTH * 0.7 + 12),
    ];

    const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.9, 1, 0.9],
        extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.7, 1, 0.7],
        extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
        inputRange,
        outputRange: [8, 0, 8],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View
            style={[
                styles.highlightCard,
                {
                    transform: [{ scale }, { translateY }],
                    opacity,
                },
            ]}
        >
            <LinearGradient
                colors={highlight.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.highlightGradient}
            >
                {/* Background Pattern */}
                <View style={styles.cardPattern}>
                    <View style={[styles.patternCircle, { top: -20, right: -20 }]} />
                    <View style={[styles.patternCircle, { bottom: -30, left: -10 }]} />
                </View>

                {/* Content */}
                <View style={styles.highlightContent}>
                    <Animated.View
                        style={[
                            styles.highlightIconContainer,
                            {
                                transform: [{
                                    rotate: scrollX.interpolate({
                                        inputRange,
                                        outputRange: ['-5deg', '0deg', '5deg'],
                                        extrapolate: 'clamp',
                                    }),
                                }],
                            },
                        ]}
                    >
                        <View style={styles.highlightIconBackground}>
                            <Ionicons name={highlight.icon} size={28} color="#FFF" />
                        </View>
                    </Animated.View>

                    <View style={styles.highlightTextContainer}>
                        <Text style={styles.highlightTitle}>{highlight.title}</Text>
                        <Text style={styles.highlightDescription}>
                            {highlight.description}
                        </Text>
                    </View>

                    {/* Shine Effect */}
                    <View style={styles.shineOverlay} />
                </View>

                {/* Floating Particles */}
                <View style={styles.particleContainer}>
                    <View style={[styles.particle, { top: '20%', left: '10%' }]} />
                    <View style={[styles.particle, { top: '60%', right: '15%' }]} />
                    <View style={[styles.particle, { bottom: '30%', left: '20%' }]} />
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

// Main AutoScrollHighlights component
const AutoScrollHighlights = ({ highlights }) => {
    const scrollViewRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const autoScrollTimer = useRef(null);

    // Auto-scroll functionality
    useEffect(() => {
        const startAutoScroll = () => {
            autoScrollTimer.current = setInterval(() => {
                setCurrentIndex(prev => {
                    const nextIndex = (prev + 1) % highlights.length;

                    scrollViewRef.current?.scrollTo({
                        x: nextIndex * (CARD_WIDTH * 0.7 + 12),
                        animated: true,
                    });

                    return nextIndex;
                });
            }, 4000);
        };

        startAutoScroll();

        return () => {
            if (autoScrollTimer.current) {
                clearInterval(autoScrollTimer.current);
            }
        };
    }, [highlights.length]);

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const onMomentumScrollEnd = (event) => {
        const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / (CARD_WIDTH * 0.7 + 12)
        );
        setCurrentIndex(newIndex);
    };

    const handleManualScroll = (index) => {
        setCurrentIndex(index);
        scrollViewRef.current?.scrollTo({
            x: index * (CARD_WIDTH * 0.7 + 12),
            animated: true,
        });
    };

    return (
        <View style={styles.highlightsWrapper}>
            <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled={false}
                snapToInterval={CARD_WIDTH * 0.7 + 12}
                decelerationRate="fast"
                onScroll={onScroll}
                onMomentumScrollEnd={onMomentumScrollEnd}
                scrollEventThrottle={16}
                contentContainerStyle={styles.highlightsContainer}
            >
                {highlights.map((highlight, index) => (
                    <HighlightCard
                        key={index}
                        highlight={highlight}
                        index={index}
                        scrollX={scrollX}
                    />
                ))}
            </Animated.ScrollView>

            <View style={styles.paginationContainer}>
                {highlights.map((highlight, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.paginationDotWrapper}
                        onPress={() => handleManualScroll(index)}
                    >
                        <Animated.View
                            style={[
                                styles.paginationDot,
                                {
                                    backgroundColor: currentIndex === index
                                        ? highlight.gradient[0]
                                        : '#E5E7EB',
                                    transform: [{
                                        scale: currentIndex === index
                                            ? scrollX.interpolate({
                                                inputRange: [
                                                    (index - 1) * (CARD_WIDTH * 0.7 + 12),
                                                    index * (CARD_WIDTH * 0.7 + 12),
                                                    (index + 1) * (CARD_WIDTH * 0.7 + 12),
                                                ],
                                                outputRange: [0.8, 1.2, 0.8],
                                                extrapolate: 'clamp',
                                            })
                                            : 1,
                                    }],
                                },
                            ]}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default AutoScrollHighlights;

// Styles - make sure to include all the styles
const styles = {
    highlightsWrapper: {
        marginBottom: 8,
    },
    highlightsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        gap: 16,
    },
    highlightCard: {
        width: CARD_WIDTH * 0.75,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        height: 200,
    },
    highlightGradient: {
        flex: 1,
        padding: 0,
        position: 'relative',
    },
    cardPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    patternCircle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    highlightContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 2,
    },
    highlightIconContainer: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    highlightIconBackground: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    highlightTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    highlightTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        fontFamily: 'PoppinsBold',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    highlightDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.95)',
        fontFamily: 'PoppinsRegular',
        lineHeight: 20,
        opacity: 0.95,
    },
    shineOverlay: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 50,
        transform: [{ rotate: '45deg' }],
    },
    particleContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    paginationDotWrapper: {
        padding: 4,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
};