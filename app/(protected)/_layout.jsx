import React, {useEffect, useState} from 'react';
import {usePathname, router, Slot} from 'expo-router';
import SessionManager from '../../lib/SessionManager';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {SafeAreaView, StatusBar} from "react-native";

export default function ProtectedLayout() {
    const pathname = usePathname();
    const [allowed, setAllowed] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const verify = async () => {
            const {token, role} = await SessionManager.getCurrentSession();

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

    return (
        <>
            <SafeAreaView style={{flex: 1, backgroundColor: '#FFF', paddingTop: insets.top}}>
                <StatusBar barStyle="dark-content"/>
                <Slot/>
            </SafeAreaView>
        </>
    );
}
