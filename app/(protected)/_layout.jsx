import { useEffect, useState } from 'react';
import { usePathname, router, Slot } from 'expo-router';
import SecureStorage from '../../lib/SecureStorage';
import { refreshAccessToken } from '../../lib/TokenManager';

export default function ProtectedLayout() {
    const pathname = usePathname();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const verify = async () => {
            const token = await SecureStorage.getAccessToken();
            const role = await SecureStorage.getRole();
            const expired = await SecureStorage.isAccessTokenExpired();
            const onboarded = await SecureStorage.hasOnboarded();

            const isClient = pathname.includes('/client');
            const isDriver = pathname.includes('/driver');

            // 👇 Try to refresh if token expired
            if (token && expired) {
                const refreshed = await refreshAccessToken();
                if (!refreshed) {
                    return router.replace('/(authentication)/login');
                }
            }

            const newToken = await SecureStorage.getAccessToken();
            const newExpired = await SecureStorage.isAccessTokenExpired();

            if (!newToken || newExpired) {
                return router.replace('/(authentication)/login');
            }

            if ((role === 'client' && isClient) || (role === 'driver' && isDriver)) {
                setAllowed(true);
            } else {
                return router.replace('/(authentication)/login');
            }
        };

        verify();
    }, [pathname]);

    if (!allowed) return null;

    return <Slot />;
}
