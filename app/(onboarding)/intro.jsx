// /app/(onboarding)/intro.jsx
import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Welcome to AAng Logistics',
        description: 'Experience seamless, intelligent delivery operations from request to drop-off.',
        animation: require('@/assets/animations/intro/Hello.json'),
    },
    {
        id: '2',
        title: 'Real-time Tracking',
        description: 'Track your parcels and delivery agents in real time with map precision.',
        animation: require('@/assets/animations/intro/Tracking.json'),
    },
    {
        id: '3',
        title: 'Speed Meets Trust',
        description: 'Your deliveries move with urgency and arrive with assurance — fast, trackable, and protected every step of the way.',
        animation: require('@/assets/animations/intro/Speed.json'),
    },
    {
        id: '4',
        title: 'Fast & Flexible Payments',
        description: 'Multiple secure payment methods for your convenience.',
        animation: require('@/assets/animations/intro/Payment.json'),
    },
    {
        id: '5',
        title: 'Security & Safety',
        description: 'Your packages are protected with advanced safety protocols.',
        animation: require('@/assets/animations/intro/Secured.json'),
    },
    {
        id: '6',
        title: 'For Clients',
        description: 'Book rides, manage deliveries, and get insights effortlessly.',
        animation: require('@/assets/animations/intro/Clients.json'),
    },
    {
        id: '7',
        title: 'For Drivers',
        description: 'Receive requests, optimize routes, and earn on your schedule.',
        animation: require('@/assets/animations/intro/Driver.json'),
    },
];

// Memoized slide component to prevent unnecessary re-renders
const SlideItem = memo(({ item }) => (
    <View className="w-full justify-center items-center px-6" style={{ width }}>
        <LottieView
            source={item.animation}
            autoPlay
            loop
            style={{ width: 250, height: 250, marginBottom: 24 }}
            resizeMode="contain"
        />
        <Text className="text-2xl font-['PoppinsSemiBold'] text-[#3b82f6] mb-3 text-center">
            {item.title}
        </Text>
        <Text className="text-base font-['PoppinsRegular'] text-gray-700 text-center">
            {item.description}
        </Text>
    </View>
));

// Memoized pagination dot component
const PaginationDot = memo(({ isActive }) => (
    <View
        className="h-2 w-2 rounded-full mx-1"
        style={{
            backgroundColor: isActive ? '#3b82f6' : '#d1d5db',
        }}
    />
));

export default function OnboardingIntro() {
    const router = useRouter();
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);
    const [index, setIndex] = useState(0);
    const lastInteractionRef = useRef(Date.now());
    const autoScrollRef = useRef(null);
    const isUserInteractingRef = useRef(false);

    // Memoized scroll handler
    const handleScroll = useCallback((event) => {
        lastInteractionRef.current = Date.now();
        isUserInteractingRef.current = true;

        const offsetX = event.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(offsetX / width);

        if (currentIndex !== index) {
            setIndex(currentIndex);
        }
    }, [index, width]);

    // Memoized scroll end handler
    const handleScrollEnd = useCallback(() => {
        // Reset user interaction flag after a delay
        setTimeout(() => {
            isUserInteractingRef.current = false;
        }, 1000);
    }, []);

    // Auto-scroll functionality
    useEffect(() => {
        const startAutoScroll = () => {
            autoScrollRef.current = setInterval(() => {
                const now = Date.now();

                // Only auto-scroll if user hasn't interacted recently and isn't currently scrolling
                if (now - lastInteractionRef.current > 4000 && !isUserInteractingRef.current) {
                    setIndex(prevIndex => {
                        const nextIndex = (prevIndex + 1) % slides.length;

                        // Use requestAnimationFrame for smoother animation
                        requestAnimationFrame(() => {
                            flatListRef.current?.scrollToIndex({
                                index: nextIndex,
                                animated: true
                            });
                        });

                        return nextIndex;
                    });
                }
            }, 3000);
        };

        startAutoScroll();

        return () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
                autoScrollRef.current = null;
            }
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }
        };
    }, []);

    // Memoized continue handler
    const handleContinue = useCallback(() => {
        // Clear interval before navigation
        if (autoScrollRef.current) {
            clearInterval(autoScrollRef.current);
            autoScrollRef.current = null;
        }
        router.push('/(onboarding)/role-select');
    }, [router]);

    // Memoized render item function
    const renderItem = useCallback(({ item }) => (
        <SlideItem item={item} />
    ), []);

    // Memoized key extractor
    const keyExtractor = useCallback((item) => item.id, []);

    // Memoized get item layout for better performance
    const getItemLayout = useCallback((data, index) => ({
        length: width,
        offset: width * index,
        index,
    }), [width]);

    return (
        <View className="flex-1 bg-white">
            <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                onScroll={Animated.event([
                    { nativeEvent: { contentOffset: { x: scrollX } } },
                ], {
                    useNativeDriver: false,
                    listener: handleScroll
                })}
                onMomentumScrollEnd={handleScrollEnd}
                onScrollBeginDrag={() => {
                    lastInteractionRef.current = Date.now();
                    isUserInteractingRef.current = true;
                }}
                // Performance optimizations
                removeClippedSubviews={true}
                maxToRenderPerBatch={2}
                windowSize={3}
                initialNumToRender={1}
                updateCellsBatchingPeriod={50}
                // Disable scroll on momentum for smoother auto-scroll
                decelerationRate="fast"
            />

            {/* Pagination Dots */}
            <View className="flex-row justify-center mb-3">
                {slides.map((_, i) => (
                    <PaginationDot key={i} isActive={i === index} />
                ))}
            </View>

            <View className="absolute w-full px-6" style={{ bottom: 64 }}>
                <TouchableOpacity
                    className="bg-[#3b82f6] py-4 rounded-lg"
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text className="text-white text-center text-lg font-['PoppinsSemiBold']">
                        {index === slides.length - 1 ? 'Get Started' : 'Skip'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}