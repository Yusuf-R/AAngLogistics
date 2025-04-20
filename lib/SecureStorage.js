/**
 * SecureStorage Utility for AAng Logistics
 * ----------------------------------------
 * This class provides static methods to securely store, retrieve, and manage
 * sensitive user session data such as tokens, roles, expiration time, and onboarding status.
 *
 * Uses `expo-secure-store`, which stores values in encrypted native keychain/keystore.
 * This is the recommended and safest approach for sensitive data in Expo-managed apps.
 */

import * as SecureStore from "expo-secure-store";

// Centralized key names for consistency
const keys = {
    token: "userToken",         // JWT or auth token
    role: "userRole",           // 'client' or 'driver'
    expiry: "tokenExpiry",      // Expiration timestamp (ISO string)
    onboarded: "hasOnboarded",  // Onboarding completion flag ("true" or "false")
};

class SecureStorage {

    /**
     * Saves the user's auth token securely.
     * @param {string} token - JWT or session token to store
     */
    static async saveToken(token) {
        await SecureStore.setItemAsync(keys.token, token);
    }

    /**
     * Retrieves the stored auth token.
     * @returns {Promise<string|null>} token or null if not found
     */
    static async getToken() {
        return await SecureStore.getItemAsync(keys.token);
    }

    /**
     * Saves the user's role ('client' or 'driver').
     * @param {string} role - The role to store
     */
    static async saveRole(role) {
        await SecureStore.setItemAsync(keys.role, role);
    }

    /**
     * Retrieves the user's stored role.
     * @returns {Promise<string|null>} role or null if not set
     */
    static async getRole() {
        return await SecureStore.getItemAsync(keys.role);
    }

    /**
     * Saves the expiration time of the user's token.
     * @param {string} dateString - ISO date string (e.g. new Date().toISOString())
     */
    static async saveExpiry(dateString) {
        await SecureStore.setItemAsync(keys.expiry, dateString);
    }

    /**
     * Checks if the stored token has expired based on current system time.
     * @returns {Promise<boolean>} true if expired or missing, false if still valid
     */
    static async isTokenExpired() {
        const date = await SecureStore.getItemAsync(keys.expiry);
        return date ? new Date(date) < new Date() : true;
    }

    /**
     * Marks onboarding completion status.
     * @param {boolean} status - true if onboarding has been completed
     */
    static async saveOnboardingStatus(status) {
        await SecureStore.setItemAsync(keys.onboarded, status ? "true" : "false");
    }

    /**
     * Checks if the user has previously completed onboarding.
     * @returns {Promise<boolean>} true if completed, false if not
     */
    static async hasOnboarded() {
        const value = await SecureStore.getItemAsync(keys.onboarded);
        return value === "true";
    }

    /**
     * Validates the structure or status of the stored token.
     * In a real-world app, you might decode the JWT or ping an endpoint.
     * @returns {Promise<boolean>} true if valid, false otherwise
     */
    static async validateToken() {
        const token = await SecureStorage.getToken();

        if (!token) return false;

        // TODO: Add real JWT validation or remote ping
        // For now, just return true if token exists and not expired
        const expired = await SecureStorage.isTokenExpired();
        return !expired;
    }

    /**
     * Saves a refresh token separately if your auth flow supports it.
     * Not yet used, but ready for future OAuth / JWT refresh handling.
     * @param {string} refreshToken - The long-term refresh token
     */
    static async saveRefreshToken(refreshToken) {
        await SecureStore.setItemAsync("userRefreshToken", refreshToken);
    }


    /**
     * Clears all stored values (used during logout or reset).
     */
    static async clearAll() {
        await Promise.all([
            SecureStore.deleteItemAsync(keys.token),
            SecureStore.deleteItemAsync(keys.role),
            SecureStore.deleteItemAsync(keys.expiry),
            SecureStore.deleteItemAsync(keys.onboarded),
        ]);
    }

    /**
     * Clears all session data and redirects user to login screen.
     * @param {object} router - The router object from `useRouter()`
     */
    static async logout(router) {
        await SecureStorage.clearAll();
        router.replace("/(authentication)/login");
    }
}

export default SecureStorage;
