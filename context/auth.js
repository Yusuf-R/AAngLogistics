import {createContext, useContext, useEffect, useState} from "react";
import {Platform} from "react-native";
import SecureStorage from "../lib/SecureStorage";
import {makeRedirectUri, useAuthRequest, exchangeCodeAsync} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {useRouter} from "expo-router";
import ClientUtils from "../utils/ClientUtilities";
import {Toast} from "toastify-react-native";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    signInWithGoogle: () => {},
    signOut: () => {},
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
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    const [request, response, promptAsync] = useAuthRequest(config, discovery);

    const signInWithGoogle = async () => {
        try {
            if (!request) {
                console.log("No request");
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
                setIsLoading(true);
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

                const res = await ClientUtils.GoogleSocialSignUp({
                    tokenResponse,
                    provider: "Google",
                    role: storedRole,
                });

                const {accessToken, refreshToken, user, expiresIn} = res;

                const expiry = new Date(Date.now() + 1000 * expiresIn);

                await SecureStorage.saveAccessToken(accessToken);
                await SecureStorage.saveRefreshToken(refreshToken);
                await SecureStorage.saveExpiry(expiry.toISOString());
                await SecureStorage.saveRole(user.role);
                await SecureStorage.saveUserData(user);
                await SecureStorage.saveOnboardingStatus(true);

                // Update context state before navigation
                setUser(user);
                setIsAuthenticated(true);
                setAuthPending(false);


                Toast.success('Successful : Redirecting to Dashboard!')
                setAuthPending(false);
                router.replace(`/`);

            } catch (err) {
                setError(err);
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
        await SecureStorage.clearAll();
        setUser(null);
        setIsAuthenticated(false);
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