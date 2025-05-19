// AxiosInstance.js
import axios from "axios";
import SecureStorage from "../lib/SecureStorage";
import { refreshAccessToken } from "../lib/TokenManager"; // ✅ new logic

export const axiosPublic = axios.create({
    baseURL: process.env.EXPO_PUBLIC_AANG_SERVER,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export const axiosPrivate = axios.create({
    baseURL: process.env.EXPO_PUBLIC_AANG_SERVER,
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ Attach token to outgoing requests
axiosPrivate.interceptors.request.use(async (config) => {
    const token = await SecureStorage.getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// 🔁 Refresh token logic on failure
axiosPrivate.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isExpired = (
            error.response?.status === 401 &&
            error.response?.data?.error?.includes("expired") &&
            !originalRequest._retry
        );

        if (isExpired) {
            originalRequest._retry = true;

            try {
                const newAccessToken = await refreshAccessToken(); // ✅ central token handler

                if (!newAccessToken) throw new Error("Failed to refresh");

                // Attach new token to retry
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosPrivate(originalRequest);
            } catch (err) {
                console.error("[Axios Refresh] ❌", err.message);
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);
