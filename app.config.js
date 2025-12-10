// app.config.js
export default ({ config }) => ({
    ...config,

    name: "AAng Logistics",
    slug: "AAngLogistics",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "aang-logistics",
    userInterfaceStyle: "automatic",

    // NEW ARCH SHOULD BE AT ROOT
    newArchEnabled: true,

    ios: {
        ...config.ios,
        supportsTablet: true,
        bundleIdentifier: "com.AAngLogistics",
        googleServicesFile: "./GoogleService-Info.plist",

        icon: {
            dark: "./assets/icons/ios/Dark.png",
            light: "./assets/icons/ios/Light.png",
            tinted: "./assets/icons/ios/Tinted.png"
        },

        config: {
            usesNonExemptEncryption: false,
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        },

        // REMOVE scheme conflict — Expo will use root-level `scheme`
        infoPlist: {
            ...config.ios?.infoPlist
        }
    },

    android: {
        ...config.android,
        permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
        package: "com.AAngLogistics",
        googleServicesFile: "./google-services.json",

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

        edgeToEdgeEnabled: true,

        intentFilters: [
            {
                action: "VIEW",
                autoVerify: true,
                data: [
                    {
                        scheme: "aang-logistics"
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
        "expo-web-browser",
        "@react-native-google-signin/google-signin",
        "@react-native-firebase/app",
        "@react-native-firebase/auth",
        [
            "expo-notifications",
            {
                "defaultChannel": "default",
                "enableBackgroundRemoteNotifications": false
            }
        ],
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
                faceIDPermission: "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
            }
        ],

        [
            "expo-video",
            {
                supportsBackgroundPlayback: true,
                supportsPictureInPicture: true
            }
        ],

        [
            "expo-image-picker",
            {
                photosPermission: "The app accesses your photos to let you share them with your friends."
            }
        ],

        [
            "expo-build-properties",
            {
                android: {
                    extraProguardRules: "-keep class com.facebook.jni.** { *; }",
                    newArchEnabled: true
                },
                ios: {
                    useFrameworks: "static",
                    newArchEnabled: true
                }
            }
        ],
        [
            "expo-location",
            {
                "locationAlwaysAndWhenInUsePermission": "Allow AAngLogistics to use your location."
            }
        ],
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
