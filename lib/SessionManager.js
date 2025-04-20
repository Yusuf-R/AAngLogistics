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
     * Redirects the user based on token status, onboarding, or connectivity.
     */
    static async check() {
        try {
            // 1. Check Internet connection
            const netState = await NetInfo.fetch();
            const isConnected = netState.isConnected;

            if (!isConnected) {
                return router.replace("/(fallback)/network-error");
            }

            // 2. Retrieve session data
            const token = await SecureStorage.getToken();
            const expired = await SecureStorage.isTokenExpired();
            const role = await SecureStorage.getRole();
            const onboarded = await SecureStorage.hasOnboarded();

            // 3. Routing logic
            if (token && !expired && role) {
                return router.replace(`/${role}/dashboard`);
            }

            if ((!token || expired) && onboarded) {
                return router.replace("/(authentication)/login");
            }

            return router.replace("/index");
            // return router.replace("/(onboarding)/intro");
        } catch (error) {
            console.error("Session check failed:", error);

            const check = await NetInfo.fetch();
            if (!check.isConnected) {
                return router.replace("/(fallback)/network-error");
            }

            return router.replace("/(fallback)/error");
        }
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
