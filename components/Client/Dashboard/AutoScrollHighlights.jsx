// components/Client/Dashboard/AutoScrollHighlights.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 60;

const HighlightCard = ({ highlight, index, scrollX }) => {
    const inputRange = [
        (index - 1) * (CARD_WIDTH * 0.75 + 16),
        index * (CARD_WIDTH * 0.75 + 16),
        (index + 1) * (CARD_WIDTH * 0.75 + 16),
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

    return (
        <Animated.View
            style={[
                styles.highlightCard,
                {
                    transform: [{ scale }],
                    opacity,
                },
            ]}
        >
            <View style={[styles.highlightGradient, { backgroundColor: highlight.color }]}>
                <View style={styles.highlightContent}>
                    <View style={styles.highlightIconContainer}>
                        <View style={styles.highlightIconBackground}>
                            {React.createElement(highlight.icon, { size: 28, color: '#FFF' })}
                        </View>
                    </View>
                    <View style={styles.highlightTextContainer}>
                        <Text style={styles.highlightTitle}>{highlight.title}</Text>
                        <Text style={styles.highlightDescription}>
                            {highlight.description}
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const AutoScrollHighlights = ({ highlights }) => {
    const scrollViewRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const autoScrollTimer = useRef(null);

    useEffect(() => {
        const startAutoScroll = () => {
            autoScrollTimer.current = setInterval(() => {
                setCurrentIndex(prev => {
                    const nextIndex = (prev + 1) % highlights.length;
                    scrollViewRef.current?.scrollTo({
                        x: nextIndex * (CARD_WIDTH * 0.75 + 16),
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
            event.nativeEvent.contentOffset.x / (CARD_WIDTH * 0.75 + 16)
        );
        setCurrentIndex(newIndex);
    };

    return (
        <View style={styles.highlightsWrapper}>
            <Text style={styles.sectionTitle}>Why Choose AAngLogistics</Text>
            <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH * 0.75 + 16}
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
                {highlights.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            currentIndex === index && styles.paginationDotActive
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    highlightsWrapper: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 16,
    },
    highlightsContainer: {
        paddingVertical: 12,
        gap: 16,
    },
    highlightCard: {
        width: CARD_WIDTH * 0.75,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    highlightGradient: {
        flex: 1,
        padding: 20,
    },
    highlightContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    highlightIconContainer: {
        marginBottom: 12,
    },
    highlightIconBackground: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    highlightTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    highlightTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#FFF',
        marginBottom: 6,
    },
    highlightDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'PoppinsMedium',
        justifyContent:'center',
        lineHeight: 18,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#d1d5db',
    },
    paginationDotActive: {
        backgroundColor: '#3b82f6',
        width: 24,
    },
});

export default AutoScrollHighlights;
