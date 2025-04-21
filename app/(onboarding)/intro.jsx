// /app/(onboarding)/intro.jsx
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import Swiper from "react-native-swiper";
import LottieView from "lottie-react-native";

const slides = [
    {
        title: "Welcome to AAng Logistics",
        description: "Experience seamless, intelligent delivery operations from request to drop-off.",
        animation: require("@/assets/animations/intro/Hello.json"),
    },
    {
        title: "Real-time Tracking",
        description: "Track your parcels and delivery agents in real time with map precision.",
        animation: require("@/assets/animations/intro/Tracking.json"),
    },
    {
        title: "Speed Meets Trust",
        description: "Your deliveries move with urgency and arrive with assurance — fast, trackable, and protected every step of the way.",
        animation: require("@/assets/animations/intro/Speed.json"),
    },
    {
        title: "Fast & Flexible Payments",
        description: "Multiple secure payment methods for your convenience.",
        animation: require("@/assets/animations/intro/Payment.json"),
    },
    {
        title: "Security & Safety",
        description: "Your packages are protected with advanced safety protocols.",
        animation: require("@/assets/animations/intro/Secured.json"),
    },
    {
        title: "For Clients",
        description: "Book rides, manage deliveries, and get insights effortlessly.",
        animation: require("@/assets/animations/intro/Clients.json"),
    },
    {
        title: "For Drivers",
        description: "Receive requests, optimize routes, and earn on your schedule.",
        animation: require("@/assets/animations/intro/Driver.json"),
    },
];

export default function OnboardingIntro() {
    const router = useRouter();
    const swiperRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const screenWidth = Dimensions.get("window").width;

    const lastInteractionRef = useRef(Date.now());

    const handleContinue = () => {
        router.push("/(onboarding)/role-select");
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const idleTime = now - lastInteractionRef.current;

            if (idleTime > 3000) { // 3 seconds idle
                setActiveIndex((prev) => {
                    const next = (prev + 1) % slides.length;
                    swiperRef.current?.scrollBy(next === 0 ? -prev : 1, true);
                    return next;
                });
            }
        }, 2000); // auto attempt every 2s

        return () => clearInterval(interval);
    }, []);

    return (
        <View className="flex-1 bg-white">
            <Swiper
                ref={swiperRef}
                loop={false}
                showsButtons={false}
                activeDotColor="#3b82f6"
                onIndexChanged={(index) => {
                    setActiveIndex(index);
                    lastInteractionRef.current = Date.now();
                }}
            >
                {slides.map((slide, index) => (
                    <View
                        key={index}
                        className="flex-1 justify-center items-center px-6"
                        style={{ width: screenWidth }}
                    >
                        <LottieView
                            source={slide.animation}
                            autoPlay
                            loop
                            style={{ width: 250, height: 250, marginBottom: 24 }}
                        />
                        <Text className="text-2xl font-['PoppinsSemiBold'] text-[#3b82f6] mb-3 text-center">
                            {slide.title}
                        </Text>
                        <Text className="text-base font-['PoppinsRegular'] text-gray-700 text-center">
                            {slide.description}
                        </Text>
                    </View>
                ))}
            </Swiper>

            <View className="absolute w-full px-6" style={{ bottom: 64 }}>
                <TouchableOpacity
                    className="bg-[#3b82f6] py-4 rounded-lg"
                    onPress={handleContinue}
                >
                    <Text className="text-white text-center text-lg font-['PoppinsSemiBold']">
                        {activeIndex === slides.length - 1 ? "Get Started" : "Skip"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
