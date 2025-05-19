import axios from "axios";
import SecureStorage from "./SecureStorage";
import { router } from "expo-router";

export async function refreshAccessToken() {
    const baseURL = process.env.EXPO_PUBLIC_AANG_SERVER;

    try {
        const oldAccessToken = await SecureStorage.getAccessToken();
        const refreshToken = await SecureStorage.getRefreshToken();

        if (!refreshToken || !oldAccessToken){
            console.log('error emanating from here');
            throw new Error("Missing tokens");
        }

        const { data } = await axios.post(
            `${baseURL}/auth/refresh`,
            { refreshToken },
            {
                headers: {
                    Authorization: `Bearer ${oldAccessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const { accessToken, refreshToken: newRefresh, expiresIn } = data;
        const expiry = new Date(Date.now() + 1000 * expiresIn).toISOString();

        await SecureStorage.saveAccessToken(accessToken);
        await SecureStorage.saveRefreshToken(newRefresh);
        await SecureStorage.saveExpiry(expiry);

        return accessToken;
    } catch (err) {
        console.error("[Token Refresh Failed]", err.message);
        await SecureStorage.clearAll();
        router.replace("/(authentication)/login");
        return null;
    }
}