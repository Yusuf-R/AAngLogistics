// /app/(onboarding)/role-select.jsx
import {useState} from "react";
import {View, Text, TouchableOpacity} from "react-native";
import {useRouter} from "expo-router";
import LottieView from "lottie-react-native";
import Animated, {FadeIn, FadeOut} from "react-native-reanimated";
import SecureStorage     from "../../lib/SecureStorage";

const roles = [
    {
        key: "client",
        label: "Client",
        animation: require("@/assets/animations/roles/Client.json"),
        description: "Book, manage, and track deliveries",
    },
    {
        key: "driver",
        label: "Driver",
        animation: require("@/assets/animations/roles/Driver.json"),
        description: "Earn, navigate, and deliver",
    },
];

export default function RoleSelect() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState(null);

    const handleContinue = async () => {
        if (!selectedRole) return;
        // Save to secure storage or state here
       await SecureStorage.saveRole(selectedRole);
       router.push('/(authentication)/signup');
    };

    return (
        <>
            <View className="flex-1 bg-white items-center justify-center px-4">
                <Text className="text-2xl font-['PoppinsSemiBold'] text-[#3b82f6] mb-8">
                    Select Your Role
                </Text>

                <View className="flex-row justify-between w-full gap-6 mb-8">
                    {roles.map((role) => (
                        <TouchableOpacity
                            key={role.key}
                            className={`flex-1 items-center p-4 rounded-xl border-2 ${
                                selectedRole === role.key
                                    ? "border-[#3b82f6] bg-blue-50"
                                    : "border-gray-200"
                            }`}
                            onPress={() => setSelectedRole(role.key)}
                        >
                            <LottieView
                                source={role.animation}
                                autoPlay
                                loop
                                style={{width: 120, height: 120}}
                            />
                            <Text className="text-lg font-['PoppinsSemiBold'] text-gray-800">
                                {role.label}
                            </Text>
                            <Text className="text-sm text-center text-gray-500 mt-1 font-['PoppinsRegular']">
                                {role.description}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedRole && (
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        className="w-full"
                    >
                        <TouchableOpacity
                            className="bg-[#3b82f6] py-4 rounded-lg"
                            onPress={handleContinue}
                        >
                            <Text className="text-white text-center text-lg font-['PoppinsSemiBold']">
                                Continue as {selectedRole === "client" ? "Client" : "Driver"}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </>
    );
}
