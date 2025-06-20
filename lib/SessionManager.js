import NetInfo from "@react-native-community/netinfo";
import {router} from "expo-router";
import SecureStorage from "./SecureStorage";
import {useSessionStore} from "../store/useSessionStore";
import {refreshAccessToken} from "./TokenManager";

class SessionManager {
    /**
     * Load Zustand state from SecureStorage
     */
    static async loadSession() {
        await useSessionStore.getState().loadSession();
    }

    /**
     * Resolve the correct route based on current session state
     */
    static async resolveRoute() {
        try {
            const netState = await NetInfo.fetch();
            if (!netState.isConnected) return "/(fallback)/network-error";

            await this.loadSession();
            const {token, role, onboarded} = await this.getCurrentSession();
            const isExpired = await SecureStorage.isAccessTokenExpired();

            if (token && !isExpired && role) {
                return `/(protected)/${role}/dashboard`;
            }

            if ((!token || isExpired) && onboarded) {
                return "/(authentication)/login";
            }

            if (!onboarded) {
                return "/(onboarding)/intro";
            }

            return null;
        } catch (error) {
            console.error("[SessionManager] resolveRoute error:", error);
            const check = await NetInfo.fetch();
            return check?.isConnected ? "/(fallback)/error" : "/(fallback)/network-error";
        }
    }

    static async check() {
        const target = await this.resolveRoute();
        return router.replace(target);
    }

    static async extendSession(days = 180) {
        const token = await SecureStorage.getAccessToken();
        const expired = await SecureStorage.isAccessTokenExpired();

        if (token && !expired) {
            const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            await SecureStorage.saveExpiry(newExpiry.toISOString());
            console.log(`[Session] Session extended to ${newExpiry.toISOString()}`);
            return true;
        }

        console.warn("[Session] Could not extend session: token missing or expired.");
        return false;
    }

    /**
     * Pull current session from Zustand, fallback to SecureStorage if needed.
     * Refresh token if expired and recover clean state.
     */
    static async getCurrentSession() {
        let {user, token, role, onboarded} = useSessionStore.getState();
        const isExpired = await SecureStorage.isAccessTokenExpired();

        // If any key session field is missing or token expired, reload and/or refresh
        if (!user || !token || !role || isExpired) {
            await this.loadSession();

            if (isExpired) {
                console.log("[SessionManager] 🔁 Access token expired. Refreshing...");
                const result = await refreshAccessToken(this);
                if (!result?.success || !result.accessToken) {
                    console.warn("[SessionManager] Token refresh failed inside getCurrentSession");
                    await this.expireSessionOnly();  // ✅ Preserves role & onboarded
                    return {
                        user: null,
                        token: null,
                        role: await SecureStorage.getRole(),
                        onboarded: await SecureStorage.hasOnboarded(),
                    };
                }
            }

            // Return latest Zustand state
            return useSessionStore.getState();
        }

        return {user, token, role, onboarded};
    }

    static async updateUser(user) {
        if (!user || typeof user !== "object") throw new Error("Invalid user");
        await SecureStorage.saveUserData(user);
        useSessionStore.getState().setUser(user);
        console.log("[SessionManager] ✅ User updated");
    }

    static async updateToken(token, expiresInMs = null) {
        if (!token) throw new Error("Token is required");
        await SecureStorage.saveAccessToken(token);
        useSessionStore.getState().setToken(token);

        if (expiresInMs) {
            const expiry = new Date(Date.now() + expiresInMs).toISOString();
            await SecureStorage.saveExpiry(expiry);
            console.log(`[SessionManager] ⏳ Token expiry set to ${expiry}`);
        }
    }

    static async updateRefreshToken(refToken) {
        if (!refToken) throw new Error("RefreshToken is required");
        await SecureStorage.saveRefreshToken(refToken);
        useSessionStore.getState().setRefToken(refToken);
    }

    static async updateRole(role) {
        if (!role) throw new Error("Role is required");
        await SecureStorage.saveRole(role);
        useSessionStore.getState().setRole(role);
        console.log(`[SessionManager] 🧠 Role updated to "${role}"`);
    }

    static async updateOnboardingStatus(status) {
        const boolStatus = Boolean(status);
        await SecureStorage.saveOnboardingStatus(boolStatus);
        useSessionStore.getState().setOnboarded(boolStatus);
        console.log(`[SessionManager] 🚀 Onboarding status: ${boolStatus}`);
    }

    static async logout() {
        await SecureStorage.clearSessionOnly();
        useSessionStore.getState().clearSession();
        router.replace("/(authentication)/login");
    }

    /**
     * Determine if a role is allowed to access a given pathname
     */
    static isAuthorizedRoute(role, pathname) {
        if (!role || !pathname) return false;
        if (role === "admin") return true;
        const allowedPrefix = `/${role}`;
        return pathname.startsWith(allowedPrefix);
    }

    static async expireSessionOnly() {
        await SecureStorage.clearAccessTokensOnly();
        useSessionStore.getState().setToken(null);  // don't touch role or onboarded
        console.warn("[SessionManager] ⚠️ Session expired, but identity preserved");
    }
}

export default SessionManager;
