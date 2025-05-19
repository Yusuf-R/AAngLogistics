import {Text, TouchableOpacity} from 'react-native';
import {useProtectedScreen} from '../../../hooks/useProtectedScreen';
import SecureStorage from "../../../lib/SecureStorage";
import {useRouter} from "expo-router";

export default function ClientDashboard() {
    const router = useRouter();
    return (
        <>
            <Text className="text-center mt-10">Client Dashboard</Text>

            <TouchableOpacity
                className="mt-4 bg-red-500 px-4 py-2 rounded"
                onPress={async () => {
                    await SecureStorage.clearAll();
                    console.log("🧹 SecureStorage cleared.");
                    // TODO: Add a toast notification

                    // reload the page
                    router.replace('/');

                }}
            >
                <Text className="text-white">Reset Secure Storage</Text>
            </TouchableOpacity>
        </>
    )
}
