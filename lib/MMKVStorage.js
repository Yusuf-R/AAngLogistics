// lib/MMKVStorage.js
import { MMKV } from 'react-native-mmkv';

export const mmkvStorage = new MMKV();

export const MMKVStorage = {
    setItem: (key, value) => {
        try {
            if (value === undefined || value === null) {
                mmkvStorage.delete(key);
            } else {
                mmkvStorage.set(key, JSON.stringify(value));
            }
            return true;
        } catch (error) {
            console.error(`[MMKV] Failed to set item ${key}:`, error);
            return false;
        }
    },

    getItem: (key) => {
        try {
            const value = mmkvStorage.getString(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`[MMKV] Failed to get item ${key}:`, error);
            return null;
        }
    },

    removeItem: (key) => {
        try {
            mmkvStorage.delete(key);
            return true;
        } catch (error) {
            console.error(`[MMKV] Failed to remove item ${key}:`, error);
            return false;
        }
    },

    // 🔥 NEW: Utility methods for debugging
    getAllKeys: () => {
        try {
            return mmkvStorage.getAllKeys();
        } catch (error) {
            console.error('[MMKV] Failed to get all keys:', error);
            return [];
        }
    },

    clearAll: () => {
        try {
            mmkvStorage.clearAll();
            return true;
        } catch (error) {
            console.error('[MMKV] Failed to clear storage:', error);
            return false;
        }
    },

    // 🔥 NEW: Check if key exists
    contains: (key) => {
        try {
            return mmkvStorage.contains(key);
        } catch (error) {
            console.error(`[MMKV] Failed to check key ${key}:`, error);
            return false;
        }
    }
};