// /app/_layout.jsx
import {Stack} from "expo-router";
import "@/app/global.css";
import {GluestackUIProvider} from "@/components/ui/gluestack-ui-provider";
import {QueryClientProvider, QueryClient} from "@tanstack/react-query";
import {AuthProvider} from "../context/auth";
import ToastManager, {Toast} from 'toastify-react-native'
import {useEffect, useRef, useState} from "react";
import {useFonts} from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import LottieView from "lottie-react-native";
import {LinearGradient} from "expo-linear-gradient";
import {Text, View} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
} from "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

function CustomSplashScreen({onFinish}) {
    const animationRef = useRef(null);
    const borderOffset = useSharedValue(0);

    useEffect(() => {
        if (animationRef.current) {
            animationRef.current.play();
        }
        borderOffset.value = withRepeat(
            withTiming(100, {duration: 1000, easing: Easing.linear}),
            -1,
            false
        );
    }, [borderOffset]);

    const logoOpacity = useSharedValue(0);
    const logoTranslate = useSharedValue(20);
    const sloganOpacity = useSharedValue(0);
    const sloganTranslate = useSharedValue(20);

    useEffect(() => {
        logoOpacity.value = withTiming(1, {duration: 800, easing: Easing.out(Easing.exp)});
        logoTranslate.value = withTiming(0, {duration: 800, easing: Easing.out(Easing.exp)});

        setTimeout(() => {
            sloganOpacity.value = withTiming(1, {duration: 800, easing: Easing.out(Easing.exp)});
            sloganTranslate.value = withTiming(0, {duration: 800, easing: Easing.out(Easing.exp)});
        }, 300);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{translateY: logoTranslate.value}, {scale: withTiming(1, {duration: 800})}],
    }));

    const sloganStyle = useAnimatedStyle(() => ({
        opacity: sloganOpacity.value,
        transform: [{translateY: sloganTranslate.value}],
    }));
    return (
        <View style={{flex: 1}}>
            <LinearGradient colors={["#3b82f6", "#60a5fa"]} style={{flex: 1}}>
                <View style={{flex: 1, justifyContent: "center", alignItems: "center", position: "relative"}}>
                    <LottieView
                        ref={animationRef}
                        source={require("@/assets/animations/A.json")}
                        autoPlay={false}
                        loop={false}
                        style={{width: 800, height: 800}}
                        onAnimationFinish={onFinish}
                    />

                    <Animated.View
                        style={[
                            logoStyle,
                            {
                                position: "absolute",
                                bottom: 300,
                                alignItems: "center",
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 4,
                            },
                        ]}
                    >
                        <Text className="text-2xl font-['PoppinsRegular'] text-white">AAng Logistics</Text>
                    </Animated.View>

                    <Animated.Text
                        style={[
                            sloganStyle,
                            {
                                position: "absolute",
                                bottom: 270,
                                textAlign: "center",
                                color: "white",
                                fontSize: 16,
                                fontFamily: "PoppinsItalic",
                            },
                        ]}
                    >
                        Delivering Excellence Worldwide
                    </Animated.Text>
                </View>
            </LinearGradient>
        </View>
    );
}

export default function RootLayout() {
    const [fontsLoaded, fontsError] = useFonts({
        PoppinsBlack: require("@/assets/fonts/Poppins-Black.ttf"),
        PoppinsBlackItalic: require("@/assets/fonts/Poppins-BlackItalic.ttf"),
        PoppinsBold: require("@/assets/fonts/Poppins-Bold.ttf"),
        PoppinsBoldItalic: require("@/assets/fonts/Poppins-BoldItalic.ttf"),
        PoppinsExtraBold: require("@/assets/fonts/Poppins-ExtraBold.ttf"),
        PoppinsExtraBoldItalic: require("@/assets/fonts/Poppins-ExtraBoldItalic.ttf"),
        PoppinsExtraLight: require("@/assets/fonts/Poppins-ExtraLight.ttf"),
        PoppinsExtraLightItalic: require("@/assets/fonts/Poppins-ExtraLightItalic.ttf"),
        PoppinsItalic: require("@/assets/fonts/Poppins-Italic.ttf"),
        PoppinsLight: require("@/assets/fonts/Poppins-Light.ttf"),
        PoppinsLightItalic: require("@/assets/fonts/Poppins-LightItalic.ttf"),
        PoppinsMedium: require("@/assets/fonts/Poppins-Medium.ttf"),
        PoppinsMediumItalic: require("@/assets/fonts/Poppins-MediumItalic.ttf"),
        PoppinsRegular: require("@/assets/fonts/Poppins-Regular.ttf"),
        PoppinsSemiBold: require("@/assets/fonts/Poppins-SemiBold.ttf"),
        PoppinsSemiBoldItalic: require("@/assets/fonts/Poppins-SemiBoldItalic.ttf"),
        PoppinsThin: require("@/assets/fonts/Poppins-Thin.ttf"),
        PoppinsThinItalic: require("@/assets/fonts/Poppins-ThinItalic.ttf"),
    });

    const [splashFinished, setSplashFinished] = useState(false);
    const queryClient = new QueryClient();


    useEffect(() => {
        if (fontsLoaded || fontsError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontsError]);

    const handleSplashFinish = () => {
        setSplashFinished(true);
    };

    const ready = splashFinished && fontsLoaded;

    return (
        <>
            <AuthProvider>
                <QueryClientProvider client={queryClient}>
                    <GluestackUIProvider mode="light">
                        <ToastManager
                            position="top"
                            duration={2000}
                            animationDuration={300}
                            animationType="slide"
                            showCloseIcon={false}
                            width="75%"
                            minHeight='55'
                        />
                        {ready ? (
                            <>
                                <Stack
                                    screenOptions={{
                                        headerShown: false,
                                        animation: "fade",
                                    }}
                                />

                            </>
                        ) : (
                            <CustomSplashScreen onFinish={handleSplashFinish}/>
                        )}
                    </GluestackUIProvider>
                </QueryClientProvider>
            </AuthProvider>
        </>
    );
}
