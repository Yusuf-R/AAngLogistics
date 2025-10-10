import NetInfo from "@react-native-community/netinfo";
import {router} from "expo-router";
import SecureStorage from "./SecureStorage";
import {useSessionStore} from "../store/useSessionStore";
import {refreshAccessToken} from "./TokenManager";
import {MMKVStorage} from "./MMKVStorage";

class SessionManager {
    static isLoggingOut = false;
    /**
     * Load Zustand state from SecureStorage
     */
    static async loadSession() {
        await useSessionStore.getState().loadSession();
    }

    /**
     * Resolve the correct route based on current session state
     */
    static async resolveRoute() {
        try {
            const netState = await NetInfo.fetch();
            if (!netState.isConnected) return "/(fallback)/network-error";

            await this.loadSession();
            const {token, role, onboarded} = await this.getCurrentSession();
            const isExpired = await SecureStorage.isAccessTokenExpired();

            if (token && !isExpired && role) {
                return `/(protected)/${role}/dashboard`;
            }

            if ((!token || isExpired) && onboarded) {
                return "/(authentication)/login";
            }

            if (!onboarded) {
                return "/(onboarding)/intro";
            }

            return null;
        } catch (error) {
            console.error("[SessionManager] resolveRoute error:", error);
            const check = await NetInfo.fetch();
            return check?.isConnected ? "/(fallback)/error" : "/(fallback)/network-error";
        }
    }

    static async check() {
        const target = await this.resolveRoute();
        return router.replace(target);
    }

    static async extendSession(days = 180) {
        const token = await SecureStorage.getAccessToken();
        const expired = await SecureStorage.isAccessTokenExpired();

        if (token && !expired) {
            const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            await SecureStorage.saveExpiry(newExpiry.toISOString());
            console.log(`[Session] Session extended to ${newExpiry.toISOString()}`);
            return true;
        }

        console.warn("[Session] Could not extend session: token missing or expired.");
        return false;
    }

    /**
     * Pull current session from Zustand, fallback to SecureStorage if needed.
     * Refresh token if expired and recover clean state.
     */
    static async getCurrentSession() {
        if (this.isLoggingOut) {
            return {
                user: null,
                token: null,
                role: null,
                onboarded: null,
            };
        }
        let {user, token, role, onboarded} = useSessionStore.getState();
        const isExpired = await SecureStorage.isAccessTokenExpired();

        // If any key session field is missing or token expired, reload and/or refresh
        if (!user || !token || !role || isExpired) {
            await this.loadSession();

            if (isExpired) {
                console.log("[SessionManager] 🔁 Access token expired. Refreshing...");
                const result = await refreshAccessToken(this);
                if (!result?.success || !result.accessToken) {
                    console.warn("[SessionManager] Token refresh failed inside getCurrentSession");
                    await this.expireSessionOnly();  // ✅ Preserves role & onboarded
                    return {
                        user: null,
                        token: null,
                        role: await SecureStorage.getRole(),
                        onboarded: await SecureStorage.hasOnboarded(),
                    };
                }
            }

            // Return latest Zustand state
            return useSessionStore.getState();
        }

        return {user, token, role, onboarded};
    }

    static async updateUser(user) {
        if (!user || typeof user !== "object") throw new Error("Invalid user");
        await SecureStorage.saveUserData(user);
        useSessionStore.getState().setUser(user);
        console.log("[SessionManager] ✅ User updated");
    }

    // Add this method to your SessionManager class
    static async updateAllOrderData(orderData) {
        await SecureStorage.saveAllOrderData(orderData);
        useSessionStore.getState().setAllOrderData(orderData);
        console.log("[SessionManager] ✅ Order data updated");
    }

    static async updateOrderStatistics(statistics) {
        if (!statistics || typeof statistics !== "object") throw new Error("Invalid statistics");
        await SecureStorage.saveOrderStatistics(statistics);
        useSessionStore.getState().setOrderStatistics(statistics);
        console.log("[SessionManager] ✅ Order statistics updated");
    }

    static async updateToken(token, expiresInMs = null) {
        if (!token) throw new Error("Token is required");
        await SecureStorage.saveAccessToken(token);
        useSessionStore.getState().setToken(token);

        if (expiresInMs) {
            const expiry = new Date(Date.now() + expiresInMs).toISOString();
            await SecureStorage.saveExpiry(expiry);
            console.log(`[SessionManager] ⏳ Token expiry set to ${expiry}`);
        }
    }

    static async updateRefreshToken(refToken) {
        if (!refToken) throw new Error("RefreshToken is required");
        await SecureStorage.saveRefreshToken(refToken);
        useSessionStore.getState().setRefToken(refToken);
    }

    static async updateRole(role) {
        if (!role) throw new Error("Role is required");
        await SecureStorage.saveRole(role);
        useSessionStore.getState().setRole(role);
        console.log(`[SessionManager] 🧠 Role updated to "${role}"`);
    }

    static async updateOnboardingStatus(status) {
        const boolStatus = Boolean(status);
        await SecureStorage.saveOnboardingStatus(boolStatus);
        useSessionStore.getState().setOnboarded(boolStatus);
        console.log(`[SessionManager] 🚀 Onboarding status: ${boolStatus}`);
    }

    static async logout() {
        if (this.isLoggingOut) {
            console.log("[SessionManager] ⚠️ Logout already in progress");
            return;
        }

        if (typeof router === 'undefined') {
            console.error("[SessionManager] ❌ Router not available");
            return;
        }

        try {
            this.isLoggingOut = true;
            console.log("[SessionManager] 🚪 Initiating logout...");

            // Step 1: Clear Zustand state FIRST (prevents renders during cleanup)
            useSessionStore.getState().clearSession();
            useSessionStore.getState().clearOrderData();

            // Step 2: Clear storage (tokens, MMKV data)
            await Promise.all([
                SecureStorage.clearSessionOnly(),
                MMKVStorage.removeItem('userData'),
                MMKVStorage.removeItem('allOrderData'),
                MMKVStorage.removeItem('orderStatistics'),
            ]);

            console.log("[SessionManager] ✅ Session cleared");

            // Step 3: Small delay for state propagation
            await new Promise(resolve => setTimeout(resolve, 300));

            router.replace("/(authentication)/login");

            console.log("[SessionManager] ✅ Logout complete");

        } catch (error) {
            console.log("[SessionManager] ❌ Logout error:", error);

            // Force navigation even on error
            try {
                router.replace("/(authentication)/login");
            } catch (navError) {
                console.log("[SessionManager] Navigation failed:", navError);
            }
        } finally {
            // Reset flag after a delay to ensure navigation completes
            setTimeout(() => {
                this.isLoggingOut = false;
            }, 1000);
        }
    }

    /**
     * Determine if a role is allowed to access a given pathname
     */
    // static isAuthorizedRoute(role, pathname) {
    //     if (!role || !pathname) return false;
    //     if (role === "admin") return true;
    //     const allowedPrefix = `/${role}`;
    //     return pathname.startsWith(allowedPrefix);
    // }

    // static isAuthorizedRoute(role, pathname) {
    //     if (!role || !pathname) return true; // Be permissive if data missing
    //
    //     if (role === "admin") return true; // Admin access everything
    //
    //     const normalizedPath = pathname.toLowerCase();
    //     const normalizedRole = role.toLowerCase();
    //
    //     // ✅ Simple check: does the path contain the user's role?
    //     // e.g., /client/dashboard, /(protected)/client/profile, etc.
    //     return normalizedPath.includes(`/${normalizedRole}/`) ||
    //         normalizedPath.includes(`/${normalizedRole}`) ||
    //         normalizedPath === '/' ||
    //         normalizedPath.includes('(protected)');
    // }

    // SessionManager.js - IMPROVED VERSION
    static isAuthorizedRoute(role, pathname) {
        if (!role) {
            console.warn('[SessionManager] No role provided');
            return false;
        }

        if (!pathname) {
            console.warn('[SessionManager] No pathname provided');
            return false; // ✅ Changed from true to false - be strict
        }

        // Root path is always allowed (will be redirected anyway)
        if (pathname === '/' || pathname === '/(protected)') {
            return true;
        }

        // Admin has access to everything
        if (role === "admin") {
            return true;
        }

        const normalizedPath = pathname.toLowerCase();
        const normalizedRole = role.toLowerCase();

        // ✅ Check if path contains the user's role
        // Examples that should pass:
        // - /client/dashboard
        // - /(protected)/client/profile
        // - /client/orders/123
        const hasRoleInPath = normalizedPath.includes(`/${normalizedRole}/`) ||
            normalizedPath.endsWith(`/${normalizedRole}`);

        if (hasRoleInPath) {
            return true;
        }

        // ✅ Block access to other roles' routes
        const otherRoles = ['client', 'driver', 'admin'].filter(r => r !== normalizedRole);
        const accessingOtherRole = otherRoles.some(otherRole =>
            normalizedPath.includes(`/${otherRole}/`)
        );

        if (accessingOtherRole) {
            console.warn(`[SessionManager] ❌ ${role} trying to access other role's route: ${pathname}`);
            return false;
        }

        // ✅ Allow general protected routes (like /(protected)/settings if it exists for all)
        if (normalizedPath.includes('(protected)')) {
            return true;
        }

        // Default deny for safety
        console.warn(`[SessionManager] ❌ Unrecognized route pattern: ${pathname}`);
        return false;
    }

    static async expireSessionOnly() {
        await SecureStorage.clearAccessTokensOnly();
        useSessionStore.getState().setToken(null);  // don't touch role or onboarded
        console.warn("[SessionManager] ⚠️ Session expired, but identity preserved");
    }
}

export default SessionManager;
