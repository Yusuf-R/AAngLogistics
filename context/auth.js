import {createContext, useContext, useEffect, useState} from "react";
import {Platform} from "react-native";
import SecureStorage from "../lib/SecureStorage";
import {makeRedirectUri, useAuthRequest, exchangeCodeAsync} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {useRouter} from "expo-router";
import ClientUtils from "../utils/ClientUtilities";
import {Toast} from "toastify-react-native";
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

                const storedRole = await SecureStorage.getRole(); // set during role selection

                const respData = await ClientUtils.GoogleSocialSignUp({
                    tokenResponse,
                    provider: "Google",
                    role: storedRole,
                });

                const {accessToken, refreshToken, user, expiresIn} = respData;

                await SessionManager.updateToken(accessToken, expiresIn);
                await SecureStorage.saveRefreshToken(refreshToken); // 🔐 refresh token remains in SecureStorage only
                await SessionManager.updateUser(user);
                await SessionManager.updateRole(user.role);
                await SessionManager.updateOnboardingStatus(true);

                router.replace(`/(protected)/${user.role}/dashboard`);
                return;
                // router.replace(`/`);

            } catch (err) {
                console.error("Error finalizing Google sign-in:", err);
                Toast.error('Error : Unable to sign in. Please try again.');
                router.replace("/");
            }
        } else if (response?.type === "cancel") {
            console.log("response cancelled");
            Toast.info('Cancelled : Sign in process was cancelled.');

        } else if (response?.type === "error") {
            console.log("response error");
            Toast.error('Error : An error occurred during the sign-in process.');
        }
    }

    const signOut = async () => {
        await SessionManager.logout();
        Toast.success("✅ Logged out");
        router.replace("/(authentication)/login");
    };

    useEffect(() => {
        finalizeGoogleSignIn();
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