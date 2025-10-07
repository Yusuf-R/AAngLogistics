// AxiosInstance.js
import axios from "axios";
import SecureStorage from "../lib/SecureStorage";
import SessionManager  from "../lib/SessionManager"; // ✅ now our central sync engine

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

// ✅ Attach token to every request
axiosPrivate.interceptors.request.use(async (config) => {
    if (SessionManager.isLoggingOut) {
        return Promise.reject(new Error('Session ending'));
    }

    const { token } = await SessionManager.getCurrentSession(); // auto-refresh if expired
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// 🔁 Retry once on 401 Unauthorized
axiosPrivate.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (SessionManager.isLoggingOut) {
            return Promise.reject(new Error('Session ending'));
        }

        const shouldRetry = (
            error.response?.status === 401 &&
            !originalRequest._retry
        );

        if (shouldRetry) {
            originalRequest._retry = true;

            try {
                const { token } = await SessionManager.getCurrentSession();

                if (!token) {
                    throw new Error("Token refresh failed");
                }

                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosPrivate(originalRequest);
            } catch (err) {
                console.error("[Axios Retry] ❌", err.message);
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);