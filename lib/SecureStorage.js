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
import {MMKVStorage} from "./MMKVStorage";

// Centralized key names for consistency
const keys = {
    access: "accessToken",         // JWT or session token
    role: "userRole",              // 'client' or 'driver'
    expiry: "tokenExpiry",         // Expiration timestamp (ISO string)
    onboarded: "hasOnboarded",     // Onboarding completion flag ("true" or "false")
    refresh: "refreshToken",       // Optional refresh token for extended sessions
    userData: "userData",          // User profile/info
    allOrderData: "allOrderData",  // All order data for the user
    orderStatistics: "orderStatistics",
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
        await MMKVStorage.setItem(keys.userData, userData);
    }

    static async getUserData() {
        // Check MMKV first
        const mmkvData = MMKVStorage.getItem(keys.userData);
        if (mmkvData) return mmkvData;

        // Fallback 1: Migrate from AsyncStorage if exists
        const asyncData = await AsyncStorage.getItem(keys.userData);
        if (asyncData) {
            await MMKVStorage.setItem(keys.userData, JSON.parse(asyncData));
            await AsyncStorage.removeItem(keys.userData);
            return JSON.parse(asyncData);
        }

        // Fallback 2: Migrate from SecureStore (legacy)
        const secureData = await SecureStore.getItemAsync(keys.userData);
        if (secureData) {
            await MMKVStorage.setItem(keys.userData, JSON.parse(secureData));
            await SecureStore.deleteItemAsync(keys.userData); // Cleanup
            return JSON.parse(secureData);
        }

        return null;
    }

    // allOrderData
    static async saveAllOrderData(orderData) {
        if (!orderData) {
            await AsyncStorage.removeItem(keys.allOrderData);
            return;
        }
        await MMKVStorage.setItem(keys.allOrderData, orderData);
    }

    static async getAllOrderData() {
        // Check MMKV first
        const mmkvData = MMKVStorage.getItem(keys.allOrderData);
        if (mmkvData) return mmkvData;

        // Fallback: Migrate from AsyncStorage if exists
        const asyncData = await AsyncStorage.getItem(keys.allOrderData);
        if (asyncData) {
            await MMKVStorage.setItem(keys.allOrderData, JSON.parse(asyncData));
            await AsyncStorage.removeItem(keys.allOrderData); // Cleanup
            return JSON.parse(asyncData);
        }

        return null;
    }

    static async saveOrderStatistics(stats) {
        if (stats == null || typeof stats !== "object") {
            throw new Error("Invalid orderStatistics");
        }
        await MMKVStorage.setItem(keys.orderStatistics, stats);
    }

    static async getOrderStatistics() {
        const mmkvData = MMKVStorage.getItem(keys.orderStatistics);
        if (mmkvData) return mmkvData;

        // Optional migration from AsyncStorage (in case you ever stored it there)
        const asyncData = await AsyncStorage.getItem(keys.orderStatistics);
        if (asyncData) {
            const parsed = JSON.parse(asyncData);
            await MMKVStorage.setItem(keys.orderStatistics, parsed);
            await AsyncStorage.removeItem(keys.orderStatistics);
            return parsed;
        }

        return null;
    }

    static async clearAllOrderData() {
        await AsyncStorage.removeItem(keys.allOrderData);
    }

    // Check if user is authenticated
    static async isAuthenticated() {
        const token = await this.getAccessToken();
        const expired = await this.isAccessTokenExpired();
        return !!token && !expired;
    }

    // Snapshot of current session for debugging
    static async getSessionSnapshot() {
        const [access, refresh, expiry, role, onboarded, userDataObj, allOrderData] = await Promise.all([
            this.getAccessToken(),
            this.getRefreshToken(),
            SecureStore.getItemAsync(keys.expiry),
            this.getRole(),
            this.hasOnboarded(),
            this.getUserData(),
            SecureStorage.getAllOrderData(), // Add this line
        ]);

        return {
            access,
            refresh,
            expiry,
            role,
            onboarded,
            userData: userDataObj,
            allOrderData, // Add this line
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
            // AsyncStorage.removeItem(keys.userData), // ✅ also clear AsyncStorage
        ]);
    }

    static async clearAccessTokensOnly() {
        await SecureStore.deleteItemAsync(keys.access);
        await SecureStore.deleteItemAsync(keys.expiry);
        // If you want, uncomment to also clear refresh:
        // await SecureStore.deleteItemAsync(keys.refresh);
    }

    static async clearOrderStatistics() {
        await AsyncStorage.removeItem(keys.orderStatistics);
        // If you want to be thorough, also clear from MMKV:
        MMKVStorage.removeItem(keys.orderStatistics);
    }
}

export default SecureStorage;
