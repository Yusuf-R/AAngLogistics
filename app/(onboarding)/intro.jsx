// /app/(onboarding)/intro.jsx
import React, { useRef, useState, useEffect } from 'react';
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
        title: 'Welcome to AAng Logistics',
        description: 'Experience seamless, intelligent delivery operations from request to drop-off.',
        animation: require('@/assets/animations/intro/Hello.json'),
    },
    {
        title: 'Real-time Tracking',
        description: 'Track your parcels and delivery agents in real time with map precision.',
        animation: require('@/assets/animations/intro/Tracking.json'),
    },
    {
        title: 'Speed Meets Trust',
        description: 'Your deliveries move with urgency and arrive with assurance — fast, trackable, and protected every step of the way.',
        animation: require('@/assets/animations/intro/Speed.json'),
    },
    {
        title: 'Fast & Flexible Payments',
        description: 'Multiple secure payment methods for your convenience.',
        animation: require('@/assets/animations/intro/Payment.json'),
    },
    {
        title: 'Security & Safety',
        description: 'Your packages are protected with advanced safety protocols.',
        animation: require('@/assets/animations/intro/Secured.json'),
    },
    {
        title: 'For Clients',
        description: 'Book rides, manage deliveries, and get insights effortlessly.',
        animation: require('@/assets/animations/intro/Clients.json'),
    },
    {
        title: 'For Drivers',
        description: 'Receive requests, optimize routes, and earn on your schedule.',
        animation: require('@/assets/animations/intro/Driver.json'),
    },
];

export default function OnboardingIntro() {
    const router = useRouter();
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);
    const [index, setIndex] = useState(0);
    const lastInteractionRef = useRef(Date.now());

    // Auto-scroll every 3s when idle
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            if (now - lastInteractionRef.current > 4000) {
                const nextIndex = (index + 1) % slides.length;
                flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                setIndex(nextIndex);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [index]);

    const handleScroll = (event) => {
        lastInteractionRef.current = Date.now();
        const offsetX = event.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(offsetX / width);
        setIndex(currentIndex);
    };

    const handleContinue = () => {
        router.push('/(onboarding)/role-select');
    };

    return (
        <View className="flex-1 bg-white">
            <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => i.toString()}
                onScroll={Animated.event([
                    { nativeEvent: { contentOffset: { x: scrollX } } },
                ], { useNativeDriver: false })}
                onMomentumScrollEnd={handleScroll}
                renderItem={({ item }) => (
                    <View className="w-full justify-center items-center px-6" style={{ width }}>
                        <LottieView
                            source={item.animation}
                            autoPlay
                            loop
                            style={{ width: 250, height: 250, marginBottom: 24 }}
                        />
                        <Text className="text-2xl font-['PoppinsSemiBold'] text-[#3b82f6] mb-3 text-center">
                            {item.title}
                        </Text>
                        <Text className="text-base font-['PoppinsRegular'] text-gray-700 text-center">
                            {item.description}
                        </Text>
                    </View>
                )}
            />

            {/* Pagination Dots */}
            <View className="flex-row justify-center mb-3">
                {slides.map((_, i) => (
                    <View
                        key={i}
                        className="h-2 w-2 rounded-full mx-1"
                        style={{
                            backgroundColor: i === index ? '#3b82f6' : '#d1d5db',
                        }}
                    />
                ))}
            </View>

            <View className="absolute w-full px-6" style={{ bottom: 64 }}>
                <TouchableOpacity
                    className="bg-[#3b82f6] py-4 rounded-lg"
                    onPress={handleContinue}
                >
                    <Text className="text-white text-center text-lg font-['PoppinsSemiBold']">
                        {index === slides.length - 1 ? 'Get Started' : 'Skip'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
