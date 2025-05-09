import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import SecureStorage from '../lib/SecureStorage';

export const useProtectedScreen = (allowedRoles = []) => {
    const router = useRouter();

    useEffect(() => {
        const checkAccess = async () => {
            const token = await SecureStorage.getAccessToken();
            const role = await SecureStorage.getRole();
            const expired = await SecureStorage.isAccessTokenExpired();

            if (!token || expired || !allowedRoles.includes(role)) {
                router.replace('/(authentication)/login');
            }
        };

        checkAccess();
    }, []);
};
