
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
    access: "accessToken",         // JWT or session token
    role: "userRole",              // 'client' or 'driver'
    expiry: "tokenExpiry",         // Expiration timestamp (ISO string)
    onboarded: "hasOnboarded",     // Onboarding completion flag ("true" or "false")
    refresh: "refreshToken",       // Optional refresh token for extended sessions
    userData: "userData",          // User profile/info
};

class SecureStorage {
    // Access Token
    static async saveAccessToken(token) {
        await SecureStore.setItemAsync(keys.access, token);
    }

    static async getAccessToken() {
        console.log('access was gotten for sure');
        return await SecureStore.getItemAsync(keys.access);
    }

    // Role
    static async saveRole(role) {
        await SecureStore.setItemAsync(keys.role, role);
    }

    static async getRole() {
        return await SecureStore.getItemAsync(keys.role);
    }

    // Expiry
    static async saveExpiry(dateString) {
        await SecureStore.setItemAsync(keys.expiry, dateString);
    }

    static async isAccessTokenExpired() {
        const date = await SecureStore.getItemAsync(keys.expiry);
        return date ? new Date(date) < new Date() : true;
    }

    // Onboarding
    static async saveOnboardingStatus(status) {
        await SecureStore.setItemAsync(keys.onboarded, status ? "true" : "false");
    }

    static async hasOnboarded() {
        const value = await SecureStore.getItemAsync(keys.onboarded);
        return value === "true";
    }

    // Refresh Token
    static async saveRefreshToken(refreshToken) {
        await SecureStore.setItemAsync(keys.refresh, refreshToken);
    }

    static async getRefreshToken() {
        return await SecureStore.getItemAsync(keys.refresh);
    }

    // User Data
    static async saveUserData(userData) {
        if (typeof userData !== "object" || userData === null) {
            throw new Error("Invalid user data");
        }
        await SecureStore.setItemAsync(keys.userData, JSON.stringify(userData));
    }

    static async getUserData() {
        const data = await SecureStore.getItemAsync(keys.userData);
        return data ? JSON.parse(data) : null;
    }

    // Check if user is authenticated
    static async isAuthenticated() {
        const token = await this.getAccessToken();
        const expired = await this.isAccessTokenExpired();
        return !!token && !expired;
    }

    // Snapshot of current session for debugging
    static async getSessionSnapshot() {
        const [access, refresh, expiry, role, onboarded, userDataRaw] = await Promise.all([
            this.getAccessToken(),
            this.getRefreshToken(),
            SecureStore.getItemAsync(keys.expiry),
            this.getRole(),
            this.hasOnboarded(),
            SecureStore.getItemAsync(keys.userData),
        ]);

        let userData = null;
        try {
            userData = userDataRaw ? JSON.parse(userDataRaw) : null;
        } catch (err) {
            userData = null;
        }

        return {
            access,
            refresh,
            expiry,
            role,
            onboarded,
            userData,
        };
    }


    // Clear everything
    static async clearAll() {
        await Promise.all(Object.values(keys).map((key) => SecureStore.deleteItemAsync(key)));
    }

    // Logout and redirect
    static async logout(router) {
        await this.clearAll();
        router.replace("/(authentication)/login");
    }
}

export default SecureStorage;