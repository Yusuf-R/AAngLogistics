import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function SignIn() {
    const router = useRouter();

    return (
        <View className="flex-1 justify-center items-center bg-gray-50 px-4">
            <Text className="text-2xl font-['PoppinsSemiBold'] text-blue-500 mb-6">
                Choose Your Role
            </Text>
        </View>
    );
}