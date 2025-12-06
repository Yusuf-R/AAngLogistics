// context/auth.js - UPDATED VERSION
import { createContext, useContext, useState, useEffect } from "react";
import { Platform, Alert } from "react-native";
import {
    GoogleSignin,
    statusCodes,
    isSuccessResponse,
    isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import ClientUtils from "../utils/ClientUtilities";
import SessionManager from "../lib/SessionManager";
import SecureStorage from "../lib/SecureStorage";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";

GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: false,
    scopes: ['profile', 'email'],
});

const AuthContext = createContext({
    signInWithGoogle: () => {},
    signOut: () => {},
    isLoading: false,
});

export const AuthProvider = ({ children }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const signInWithGoogle = async () => {
        try {
            setIsLoading(true);

            // 1. Check if Google Play Services available (Android only)
            if (Platform.OS === 'android') {
                await GoogleSignin.hasPlayServices();
            }

            // 2. Sign in with Google (NATIVE - no browser!)
            const userInfo = await GoogleSignin.signIn();
            if (!isSuccessResponse(userInfo)) {
                console.log('Google Sign-In not successful:', userInfo.type);
                return;
            }
            console.log('Google Sign-In Success:', userInfo);

            // 3. Get ID token from Google
            const { idToken } = userInfo;

            if (!idToken) {
                throw new Error('No ID token received from Google');
            }

            // 4. Create Firebase credential (same as before)
            const credential = GoogleAuthProvider.credential(idToken);

            // 5. Sign in to Firebase
            const userCredential = await signInWithCredential(auth, credential);

            // 6. Get Firebase ID token
            const firebaseIdToken = await userCredential.user.getIdToken();

            // 7. Get stored role
            const storedRole = await SecureStorage.getRole();

            if (!storedRole) {
                router.replace('/(onboarding)/role-select?next=/(authentication)/signup');
                setIsLoading(false);
                return;
            }

            // 8. Send to your backend
            const respData = await ClientUtils.GoogleSocialAuth({
                firebaseIdToken,
                provider: "Google",
                role: storedRole,
                email: userCredential.user.email,
                name: userCredential.user.displayName,
                picture: userCredential.user.photoURL,
            });

            const { accessToken, refreshToken, user, expiresIn } = respData;

            // 9. Store session data
            await SessionManager.updateToken(accessToken, expiresIn);
            await SecureStorage.saveRefreshToken(refreshToken);
            await SessionManager.updateUser(user);
            await SessionManager.updateRole(user.role);
            await SessionManager.updateOnboardingStatus(true);

            // 10. Navigate to dashboard
            router.replace(`/(protected)/${user.role}/dashboard`);

        } catch (error) {
            console.log('🔥 Google Sign-In Failed:', error);
            console.log(error.code);
            if (isErrorWithCode(error)) {
                switch (error.code) {
                    case statusCodes.IN_PROGRESS:
                        toast.error('Sign-in already in progress');
                        break;
                    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                        toast.error('Google Play Services required');
                        break;
                    case statusCodes.SIGN_IN_CANCELLED:
                        toast.info('Sign-in cancelled');
                        break;
                    case statusCodes.SIGN_IN_REQUIRED:
                        toast.info('Please sign in to continue');
                        break;
                    default:
                        toast.error('Authentication failed. Please try again.');
                }
            } else {
                toast.error('Unexpected error. Check logs.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        try {
            // Sign out from Google
            await GoogleSignin.signOut();
            // Sign out from your app
            await SessionManager.logout();
        } catch (error) {
            console.log('[AuthProvider] Sign out error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            signInWithGoogle,
            signOut,
            isLoading,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};