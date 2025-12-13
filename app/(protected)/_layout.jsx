// app/(protected)/_layout.jsx
import React, { useEffect, useRef } from 'react';
import { usePathname, router, Slot, useSegments } from 'expo-router';
import SessionManager from '../../lib/SessionManager';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar, ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSessionStore } from "../../store/useSessionStore";

// ProtectedLayout.js - Using isAuthorizedRoute
export default function ProtectedLayout() {
    const user = useSessionStore((state) => state.user);
    const token = useSessionStore((state) => state.token);
    const role = useSessionStore((state) => state.role);
    const segments = useSegments();
    const pathname = usePathname();
    const hasCheckedInitialRoute = useRef(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const checkAuth = async () => {
            if (SessionManager.isLoggingOut) return;

            const isProtected = segments[0] === '(protected)';
            if (!isProtected) return;

            // ✅ SESSION CHECK
            if (!user || !token || !role) {
                console.log('[Protected Layout] No session');
                router.replace('/(authentication)/login');
                return;
            }

            // ✅ TOKEN VALIDATION
            const session = await SessionManager.getCurrentSession();
            if (!session.token) {
                console.log('[Protected Layout] Session expired');
                router.replace('/(authentication)/login');
                return;
            }

            // ✅ INITIAL ROUTE SETUP
            if (!hasCheckedInitialRoute.current) {
                hasCheckedInitialRoute.current = true;

                if (pathname === '/' || pathname === '/(protected)') {
                    console.log('[Protected Layout] Root path, redirecting to dashboard');
                    router.replace(`/(protected)/${session.role}/dashboard`);
                    return;
                }
            }

            // ✅ USE isAuthorizedRoute FOR CONTINUOUS CHECKING
            const authorized = SessionManager.isAuthorizedRoute(session.role, pathname);

            if (!authorized) {
                console.log(`[Protected Layout] Unauthorized path: ${pathname} for role: ${session.role}`);
                router.replace(`/(protected)/${session.role}/dashboard`);
            }
        };

        checkAuth();
    }, [user, token, role, pathname, segments]);

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#FFF'}}>
            <StatusBar barStyle="default"/>
            <Slot/>
        </SafeAreaView>
    );
}