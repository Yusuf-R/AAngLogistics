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
        console.log('I have been called')
        try {
            const netState = await NetInfo.fetch();
            const isConnected = netState.isConnected;

            if (!isConnected) return "/(fallback)/network-error";

            const token = await SecureStorage.getAccessToken();
            const expired = await SecureStorage.isAccessTokenExpired();
            const role = await SecureStorage.getRole();
            const onboarded = await SecureStorage.hasOnboarded();

            console.log('All varibales should have been gotten')
            console.log({
                token,
                expired,
                role,
                onboarded
            })

            if (token && !expired && role) {
                console.log('Horray to dashboaard')
                return `/(protected)/${role}/dashboard`;
            }

            if ((!token || expired) && onboarded) {
                console.log('Gat to login')
                return "/(authentication)/login";
            }

            if (!onboarded) {
                console.log('Not Onboarded')
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
