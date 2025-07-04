import React, { useEffect, useRef } from 'react';
import {
    Image,
    SafeAreaView,
    Text,
    View,
    TouchableOpacity,
    Animated,
    StatusBar
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';


function VerifyFirst() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations sequence
        Animated.sequence([
            // Initial fade and slide in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
            // Bounce animation for alert box
            Animated.spring(bounceAnim, {
                toValue: 1,
                tension: 80,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous pulse animation for the verify button
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();

        return () => pulseAnimation.stop();
    }, []);

    const handleContinue = () => {
        // Add a subtle animation before navigation
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            router.replace('/client/profile/verify-email');
        });
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            <LinearGradient
                // colors={['#4F46E5', '#7C3AED', '#EC4899']}
                colors={['#FFF', '#FFF', '#FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1"
            >
                <SafeAreaView className="flex-1">
                    <Animated.View
                        className="flex-1 justify-center items-center px-6"
                        style={{
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }}
                    >
                        {/* SVG Illustration with floating animation */}
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        translateY: bounceAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [10, 0]
                                        })
                                    }
                                ]
                            }}
                        >
                            {/*<TrialSvg width={280} height={320} />*/}
                        </Animated.View>

                        {/* Alert Container */}
                        <Animated.View
                            className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 mx-4 shadow-2xl"
                            style={{
                                transform: [
                                    {
                                        scale: bounceAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1]
                                        })
                                    }
                                ],
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 0,
                                    height: 10,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 20,
                                elevation: 15,
                            }}
                        >
                            {/* Alert Icon */}
                            <View className="items-center mb-4">
                                <View className="bg-amber-100 rounded-full p-3 mb-2">
                                    <Ionicons name="mail-outline" size={32} color="#F59E0B" />
                                </View>
                                <View className="bg-red-100 rounded-full p-1 absolute -top-1 -right-1">
                                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                </View>
                            </View>

                            {/* Alert Title */}
                            <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
                                Email Verification Required
                            </Text>

                            {/* Alert Message */}
                            <Text className="text-gray-600 text-center text-base leading-6 mb-6">
                                Please verify your email address before you can set up your authorization PIN for secure access.
                            </Text>


                            {/* Verify Button */}
                            <Animated.View
                                style={{
                                    transform: [{ scale: pulseAnim }]
                                }}
                            >
                                <TouchableOpacity
                                    onPress={handleContinue}
                                    activeOpacity={0.8}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl py-4 px-6 shadow-lg"
                                    style={{
                                        shadowColor: '#3B82F6',
                                        shadowOffset: {
                                            width: 0,
                                            height: 4,
                                        },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                        elevation: 8,
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#3B82F6', '#8B5CF6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="rounded-2xl py-1 px-2"
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name="mail-open-outline" size={20} color="white" />
                                            <Text className="text-white font-semibold text-lg ml-2">
                                                Verify Email Now
                                            </Text>
                                            <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Skip Link */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="mt-4 py-2"
                                activeOpacity={0.7}
                            >
                                <Text className="text-gray-500 text-center font-medium">
                                    I'll do this later
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Bottom Decorative Elements */}
                        <View className="absolute bottom-10 left-0 right-0 items-center">
                            <View className="flex-row space-x-2">
                                <View className="w-2 h-2 bg-white/30 rounded-full" />
                                <View className="w-8 h-2 bg-white/60 rounded-full" />
                                <View className="w-2 h-2 bg-white/30 rounded-full" />
                            </View>
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
}

export default VerifyFirst;