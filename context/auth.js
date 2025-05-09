import {createContext, useContext, useEffect, useState} from "react";
import {Platform} from "react-native";
import SecureStorage from "../lib/SecureStorage";
import {makeRedirectUri, useAuthRequest, exchangeCodeAsync} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {router} from "expo-router";
import ClientUtils from "../utils/ClientUtilities";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({
    signInWithGoogle: () => {},
    signOut: () => {},
    fetchWithAuth: (url, options) => Promise.resolve(new Response()),
    isLoading: false,
    error: null,
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
    const [authPending, setAuthPending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [request, response, promptAsync] = useAuthRequest(config, discovery);

    const signInWithGoogle = async () => {
        if (!request) {
            console.warn("Auth request not initialized.");
            return;
        }
        await promptAsync();
        setAuthPending(true);
    };

    useEffect(() => {
        const finalizeGoogleSignIn = async () => {
            if (!authPending || response?.type !== "success") return;

            try {
                setIsLoading(true);
                const { code } = response.params;

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

                const res = await ClientUtils.GoogleSocialSignUp({
                    tokenResponse,
                    provider: "Google",
                    role: storedRole,
                });
                console.log('I have gotten the data from token api ');

                const { accessToken, refreshToken, user, expiresIn } = res;

                const expiry = new Date(Date.now() + 1000 * expiresIn);

                await SecureStorage.saveAccessToken(accessToken);
                await SecureStorage.saveRefreshToken(refreshToken);
                await SecureStorage.saveExpiry(expiry.toISOString());
                await SecureStorage.saveRole(user.role);
                await SecureStorage.saveUserData(user);
                await SecureStorage.saveOnboardingStatus(true);

                console.log('I have ensured secure storage of needed data');
                // lets get all the session snapshots data
                const allData = await  SecureStorage.getSessionSnapshot();
                console.log('All data', allData);
                console.log('Done');

            } catch (err) {
                console.error("Google Sign-In Finalization Failed", err);
                // handle the error more gracefully in production so that the app does not break
                setError(err);
            } finally {
                setIsLoading(false);
                setAuthPending(false);
            }
        };

        finalizeGoogleSignIn();
    }, [authPending, response]);

    const fetchWithAuth = async (url, options = {}) => {
        const token = await SecureStorage.getAccessToken();
        return fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
            },
        });
    };

    const signOut = () => {
        console.log("Still cooking logout...");
    };

    return (
        <AuthContext.Provider value={{
            idToken: null,
            signInWithGoogle,
            signOut,
            fetchWithAuth,
            isLoading,
            error,
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