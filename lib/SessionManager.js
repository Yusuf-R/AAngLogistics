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
     * Determines the proper route after splash screen based on session status.
     */
    static async resolveRoute() {
        try {
            const netState = await NetInfo.fetch();
            const isConnected = netState.isConnected;

            if (!isConnected) return "/(fallback)/network-error";

            const token = await SecureStorage.getAccessToken();
            const expired = await SecureStorage.isAccessTokenExpired();
            const role = await SecureStorage.getRole();
            const onboarded = await SecureStorage.hasOnboarded();

            if (token && !expired && role) {
                return `/(protected)/${role}/dashboard`;
            }

            if ((!token || expired) && onboarded) {
                return "/(authentication)/login";
            }

            if (!onboarded) {
                return "/(onboarding)/intro";
            }

            return null;
        } catch (error) {
            console.error("Session check failed:", error);
            const check = await NetInfo.fetch();
            if (!check.isConnected) return "/(fallback)/network-error";
            return "/(fallback)/error";
        }
    }

    /**
     * Navigate immediately to the resolved route.
     */
    static async check() {
        const target = await this.resolveRoute();
        return router.replace(target);
    }

    /**
     * Extend the current session's expiry if valid.
     */
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
}

export default SessionManager;
