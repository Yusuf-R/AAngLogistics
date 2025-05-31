import { useEffect, useState } from 'react';
import { usePathname, router, Slot } from 'expo-router';
import SessionManager from '../../lib/SessionManager';
import SecureStorage from '../../lib/SecureStorage';
import { refreshAccessToken } from '../../lib/TokenManager';

export default function ProtectedLayout() {
    const pathname = usePathname();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const verify = async () => {
            const { token, role } = await SessionManager.getCurrentSession();

            if (!token || !role) {
                return router.replace('/(authentication)/login');
            }

            const authorized = SessionManager.isAuthorizedRoute(role, pathname);

            if (authorized) {
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
