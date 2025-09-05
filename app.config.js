// app.config.js
export default ({config}) => ({
    ...config,
    name: "AAng Logistics",
    slug: "AAngLogistics",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "aang-logistics",
    userInterfaceStyle: "automatic",
    ios: {
        ...config.ios,
        supportsTablet: true,
        bundleIdentifier: "com.AAngLogistics",
        icon: {
            dark: "./assets/icons/ios/Dark.png",
            light: "./assets/icons/ios/Light.png",
            tinted: "./assets/icons/ios/Tinted.png"
        },
        config: {
            usesNonExemptEncryption: false,
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        },
        infoPlist: {
            ...config.ios?.infoPlist,
            CFBundleURLTypes: [
                {
                    CFBundleURLSchemes: ["aang-logistics"],
                    CFBundleURLName: "AAng Logistics Deep Links"
                }
            ]
        }
    },
    android: {
        ...config.android,
        permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
        package: "com.AAngLogistics",
        adaptiveIcon: {
            foregroundImage: "./assets/icons/android/adaptive-icon.png",
            backgroundColor: "#000000"
        },
        splash: {
            image: "./assets/splash/splash.png",
            resizeMode: "contain",
            backgroundColor: "#000000"
        },
        softwareKeyboardLayoutMode: "pan",
        config: {
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
            }
        },
        intentFilters: [
            {
                action: "VIEW",
                data: [
                    {
                        scheme: "aang-logistics",
                        host: "payment-success"
                    },
                    {
                        scheme: "aang-logistics",
                        host: "payment-failed"
                    }
                ],
                category: ["BROWSABLE", "DEFAULT"]
            }
        ]
    },
    web: {
        bundler: "metro",
        output: "server",
        favicon: "./assets/images/favicon.png"
    },
    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                image: "./assets/splash/splash.png",
                imageWidth: 200,
                resizeMode: "contain",
                backgroundColor: "#000000"
            }
        ],
        "expo-font",
        [
            "expo-secure-store",
            {
                configureAndroidBackup: true,
                faceIDPermission:
                    "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
            }
        ],
        [
            "expo-video",
            {
                "supportsBackgroundPlayback": true,
                "supportsPictureInPicture": true
            }
        ],
        [
            "expo-image-picker",
            {
                photosPermission:
                    "The app accesses your photos to let you share them with your friends."
            }
        ],
        [
            "expo-build-properties",
            {
                android: {
                    newArchEnabled: true,
                    extraProguardRules: "-keep class com.facebook.jni.** { *; }"
                },
                ios: {
                    newArchEnabled: true
                }
            }
        ]
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        router: {
            origin: false
        },
        eas: {
            projectId: "fc46b4cb-5fc5-4c6c-929b-392d484af562"
        }
    }
});
