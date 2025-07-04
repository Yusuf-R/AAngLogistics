/**
 * SecureStorage Utility for AAng Logistics
 * ----------------------------------------
 * This class provides static methods to securely store, retrieve, and manage
 * sensitive user session data such as tokens, roles, expiration time, and onboarding status.
 *
 * Uses `expo-secure-store` for secrets and `AsyncStorage` for larger profile data.
 */

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        return await SecureStore.getItemAsync(keys.access);
    }

    // Role
    static async saveRole(role) {
        await SecureStore.setItemAsync(keys.role, role);
    }

    static async getRole() {
        return await SecureStore.getItemAsync(keys.role);
    }

    static async clearRole() {
        await SecureStore.deleteItemAsync(keys.role);
    }

    // Expiry
    static async saveExpiry(dateString) {
        await SecureStore.setItemAsync(keys.expiry, dateString);
    }

    static async isAccessTokenExpired() {
        const date = await SecureStore.getItemAsync(keys.expiry);
        if (!date) {
            console.warn("[SecureStorage] No expiry set — assuming expired.");
            return true;
        }
        return new Date(date) < new Date();
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

    // ✅ NEW: User Data (store in AsyncStorage, with fallback migration)
    static async saveUserData(userData) {
        if (typeof userData !== "object" || userData === null) {
            throw new Error("Invalid user data");
        }
        await AsyncStorage.setItem(keys.userData, JSON.stringify(userData));
    }

    static async getUserData() {
        // Try AsyncStorage first
        const asyncData = await AsyncStorage.getItem(keys.userData);
        if (asyncData) {
            return JSON.parse(asyncData);
        }

        // Fallback: migrate from old SecureStore if exists
        const secureData = await SecureStore.getItemAsync(keys.userData);
        if (secureData) {
            // Save into AsyncStorage for future reads
            await AsyncStorage.setItem(keys.userData, secureData);
            // Delete from SecureStore
            await SecureStore.deleteItemAsync(keys.userData);
            return JSON.parse(secureData);
        }

        // No data
        return null;
    }

    // Check if user is authenticated
    static async isAuthenticated() {
        const token = await this.getAccessToken();
        const expired = await this.isAccessTokenExpired();
        return !!token && !expired;
    }

    // Snapshot of current session for debugging
    static async getSessionSnapshot() {
        const [access, refresh, expiry, role, onboarded, userDataObj] = await Promise.all([
            this.getAccessToken(),
            this.getRefreshToken(),
            SecureStore.getItemAsync(keys.expiry),
            this.getRole(),
            this.hasOnboarded(),
            this.getUserData(),  // ✅ uses upgraded method
        ]);

        return {
            access,
            refresh,
            expiry,
            role,
            onboarded,
            userData: userDataObj,
        };
    }

    // Clear everything
    static async clearAll() {
        await Promise.all([
            ...Object.values(keys).map((key) => SecureStore.deleteItemAsync(key)),
            AsyncStorage.removeItem(keys.userData), // ✅ also clear AsyncStorage
        ]);
    }

    static async clearSessionOnly() {
        const sessionKeys = [keys.access, keys.refresh, keys.expiry];
        await Promise.all([
            ...sessionKeys.map((key) => SecureStore.deleteItemAsync(key)),
            AsyncStorage.removeItem(keys.userData), // ✅ also clear AsyncStorage
        ]);
    }

    static async clearAccessTokensOnly() {
        await SecureStore.deleteItemAsync(keys.access);
        await SecureStore.deleteItemAsync(keys.expiry);
        // If you want, uncomment to also clear refresh:
        // await SecureStore.deleteItemAsync(keys.refresh);
    }
}

export default SecureStorage;
