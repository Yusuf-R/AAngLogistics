import axios from "axios";
import SecureStorage from "../lib/SecureStorage";

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

axiosPrivate.interceptors.request.use((config) => {
    const accessToken = document.cookie.match(/accessToken=([^;]*)/)[1];
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosPrivate.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && error.response.data.error === "jwt expired" && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            const refreshToken = await SecureStorage.getRefreshToken();
            const response = await axiosPublic.post('/auth/refresh', { refreshToken });

            const newAccessToken = response.data?.accessToken;
            await SecureStorage.saveToken(newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosPrivate(originalRequest);
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            return Promise.reject(refreshError);
        }
    }

    return Promise.reject(error);
});



