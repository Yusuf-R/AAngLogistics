import {Text, TouchableOpacity} from 'react-native';
// import {useProtectedScreen} from '../../../hooks/useProtectedScreen';
import SecureStorage from "../../../lib/SecureStorage";
import {useRouter} from "expo-router";
import {Toast} from "toastify-react-native";

export default function DriverDashboard() {
    const router = useRouter();
    return (
        <>
            <Text className="text-center mt-10">
                Driver Home Section
            </Text>

            <TouchableOpacity
                className="mt-4 bg-red-500 px-4 py-2 rounded"
                onPress={async () => {
                   //  await SecureStorage.clearSessionOnly();
                    Toast.success("Secure Storage cleared.");
                    await SecureStorage.clearSessionOnly();
                   router.replace('/');
                }}
            >
                <Text className="text-white">Reset Secure Storage</Text>
            </TouchableOpacity>
        </>
    )
}