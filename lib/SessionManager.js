// /lib/SessionManager.js
import NetInfo from "@react-native-community/netinfo";
import { router } from "expo-router";
import SecureStorage from "./SecureStorage";

/**
 * SessionManager
 * ------------------------------
 * Centralized logic for checking and managing user session flow,
 * including network check, onboarding status, role validation, and routing.
 */
class SessionManager {
    /**
     * Determines and executes the appropriate navigation flow after splash.
     * Returns the route string instead of navigating directly.
     * This allows layout to hold rendering until the route is known.
     */
    static async resolveRoute() {
        try {
            const netState = await NetInfo.fetch();
            const isConnected = netState.isConnected;

            if (!isConnected) return "/(fallback)/network-error";

            const token = await SecureStorage.getToken();
            const expired = await SecureStorage.isTokenExpired();
            const role = await SecureStorage.getRole();
            const onboarded = await SecureStorage.hasOnboarded();

            if (token && !expired && role) {
                return `/${role}/dashboard`;
            }

            if ((!token || expired) && onboarded) {
                return "/(authentication)/login";
            }

            if (!onboarded) {
                return "/(onboarding)/intro";
            }

            return null; // return nothing if it's okay to stay on index
        } catch (error) {
            console.error("Session check failed:", error);
            const check = await NetInfo.fetch();
            if (!check.isConnected) return "/(fallback)/network-error";
            return "/(fallback)/error";
        }
    }

    /**
     * Navigates to the resolved route from `resolveRoute()`
     */
    static async check() {
        const target = await this.resolveRoute();
        return router.replace(target);
    }

    /**
     * Extends the session by resetting the token expiry date,
     * only if the token currently exists and is still valid.
     * Safe to call from anywhere (dashboard, screen focus, etc).
     */
    static async extendSession(days = 180) {
        const token = await SecureStorage.getToken();
        const expired = await SecureStorage.isTokenExpired();

        if (token && !expired) {
            const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            await SecureStorage.saveExpiry(newExpiry.toISOString());
            console.log(`[Session] Session extended to ${newExpiry.toISOString()}`);
            return true;
        }

        console.warn("[Session] Could not extend session: token missing or expired.");
        return false;
    }
}

export default SessionManager;
