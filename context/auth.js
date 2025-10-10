import {createContext, useContext, useEffect, useState} from "react";
import {Platform} from "react-native";
import SecureStorage from "../lib/SecureStorage";
import {makeRedirectUri, useAuthRequest, exchangeCodeAsync} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {useRouter} from "expo-router";
import ClientUtils from "../utils/ClientUtilities";
import SessionManager from "../lib/SessionManager";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    signInWithGoogle: () => {},
    signOut: () => {},
});

const config = {
    clientId: "google",
    scopes: ["openid", "profile", "email"],
    redirectUri: makeRedirectUri(),
};

const discovery = {
    authorizationEndpoint: process.env.EXPO_PUBLIC_AUTHORIZE_END_POINT,
    tokenEndpoint: process.env.EXPO_PUBLIC_TOKEN_END_POINT,
};

export const AuthProvider = ({children}) => {
    const router = useRouter();

    const [request, response, promptAsync] = useAuthRequest(config, discovery);

    const signInWithGoogle = async () => {
        try {
            if (!request) {
                return;
            }
            await promptAsync();
        } catch (e) {
            console.log(e);
        }
    };

    const finalizeGoogleSignIn = async () => {
        if (response?.type === "success") {
            try {
                const {code} = response.params;

                const tokenResponse = await exchangeCodeAsync(
                    {
                        clientId: "google",
                        code,
                        redirectUri: makeRedirectUri(),
                        extraParams: {
                            platform: Platform.OS,
                        },
                    },
                    discovery
                );

                const storedRole = await SecureStorage.getRole();

                const respData = await ClientUtils.GoogleSocialSignUp({
                    tokenResponse,
                    provider: "Google",
                    role: storedRole,
                });

                const {accessToken, refreshToken, user, expiresIn} = respData;

                await SessionManager.updateToken(accessToken, expiresIn);
                await SessionManager.updateRefreshToken(refreshToken); // ✅ Use SessionManager
                await SessionManager.updateUser(user);
                await SessionManager.updateRole(user.role);
                await SessionManager.updateOnboardingStatus(true);

                router.replace(`/(protected)/${user.role}/dashboard`);

            } catch (err) {
                console.error("Error finalizing Google sign-in:", err);
                router.replace("/(authentication)/login"); // ✅ Go to login, not root
            }
        } else if (response?.type === "cancel") {
            console.log("Google sign-in cancelled");

        } else if (response?.type === "error") {
            console.error("Google sign-in error:", response.error);
        }
    }

    const signOut = async () => {
        try {
            await SessionManager.logout(); // ✅ SessionManager handles navigation
        } catch (error) {
            console.error('[AuthProvider] Sign out error:', error);
        }
        // ❌ Remove duplicate navigation - SessionManager.logout() already does this
    };

    useEffect(() => {
        if (response) {
            finalizeGoogleSignIn();
        }
    }, [response]);

    return (
        <AuthContext.Provider value={{
            signInWithGoogle,
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};