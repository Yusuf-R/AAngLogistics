// /app/(protected)/_layout.jsx
import { Tabs, usePathname, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import SecureStorage from '../../lib/SecureStorage';

export default function ProtectedLayout() {
    const pathname = usePathname();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const verifyRoleAccess = async () => {
            const role = await SecureStorage.getRole();
            const isClientRoute = pathname.includes('/client');
            const isDriverRoute = pathname.includes('/driver');

            // Optional safety: wait if role isn't available yet
            if (!role) return;

            if ((role === 'client' && isClientRoute) || (role === 'driver' && isDriverRoute)) {
                setAllowed(true);
            } else {
                router.replace('/(authentication)/login');
            }
        };
        verifyRoleAccess();
    }, [pathname]);

    if (!allowed) return null;

    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#3b82f6',
                tabBarLabelStyle: { fontFamily: 'PoppinsRegular' },
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    switch (route.name) {
                        case 'dashboard':
                            iconName = 'home-outline';
                            break;
                        case 'profile':
                            iconName = 'person-outline';
                            break;
                        case 'settings':
                            iconName = 'settings-outline';
                            break;
                        default:
                            iconName = 'ellipse-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        />
    );
}
