import {Text, TouchableOpacity} from 'react-native';
import {useProtectedScreen} from '../../../hooks/useProtectedScreen';
import SecureStorage from "../../../lib/SecureStorage";
import {useRouter} from "expo-router";
import {Toast} from "toastify-react-native";

export default function ClientDashboard() {
    const router = useRouter();
    return (
        <>
            <Text className="text-center mt-10">Client Dashboard</Text>

            <TouchableOpacity
                className="mt-4 bg-red-500 px-4 py-2 rounded"
                onPress={async () => {
                    Toast.success("Secure Storage cleared.");
                    // await SecureStorage.clearAll();
                    Toast.error('Unable to create account ⚠️');
                    // reload the page
                    await new Promise(resolve => setTimeout(resolve, 2500)); // short delay to let user see success
                    Toast.success('Redirecting to Dashboard 🔁');
                    // router.replace('/');

                }}
            >
                <Text className="text-white">Reset Secure Storage</Text>
            </TouchableOpacity>
        </>
    )
}
