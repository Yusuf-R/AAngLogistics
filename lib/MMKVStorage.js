// lib/MMKVStorage.js
import { MMKV } from 'react-native-mmkv';

export const mmkvStorage = new MMKV();

// Helper methods
export const MMKVStorage = {
    setItem: (key, value) => mmkvStorage.set(key, JSON.stringify(value)),
    getItem: (key) => {
        const value = mmkvStorage.getString(key);
        return value ? JSON.parse(value) : null;
    },
    removeItem: (key) => mmkvStorage.delete(key),
};