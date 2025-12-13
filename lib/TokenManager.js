import axios from "axios";
import SecureStorage from "./SecureStorage";

export async function refreshAccessToken(sessionManager = null) {
    const baseURL = process.env.EXPO_PUBLIC_AANG_SERVER;

    try {
        const oldAccessToken = await SecureStorage.getAccessToken();
        const refreshToken = await SecureStorage.getRefreshToken()

        if (!refreshToken || !oldAccessToken) {
            console.warn("[Refresh] Missing token(s)");
            return {success: false, error: "Missing tokens"};
        }

        const {data} = await axios.post(
            `${baseURL}/auth/refresh`,
            {refreshToken},
            {
                headers: {
                    Authorization: `Bearer ${oldAccessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const {
            accessToken,
            refreshToken: newRefresh,
            expiresIn,
        } = data;


        // If sessionManager is provided, update the session
        if (sessionManager?.updateToken) {
            await sessionManager.updateToken(accessToken, expiresIn);
        }
        if (newRefresh !== undefined) { // Changed from !== null && !== undefined
            await SecureStorage.saveRefreshToken(newRefresh);
            if (sessionManager?.updateRefreshToken) {
                await sessionManager.updateRefreshToken(newRefresh);
            }
        }

        return {
            success: true,
            accessToken,
            refreshToken: newRefresh,
            expiresIn,
        };
    } catch (err) {
        console.log("[Token Refresh Failed]", err.message);
        await SecureStorage.clearSessionOnly();
        return {success: false, error: err.message};
    }
}
