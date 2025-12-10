// context/auth.js - COMPLETE REACT NATIVE FIREBASE VERSION WITH UI CALLBACKS
import { createContext, useContext, useState } from "react";
import { Platform } from "react-native";
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import ClientUtils from "../utils/ClientUtilities";
import SessionManager from "../lib/SessionManager";
import SecureStorage from "../lib/SecureStorage";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";

GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    offlineAccess: true,
    scopes: ['profile', 'email'],
    forceCodeForRefreshToken: true,
    accountName: '',
});

const AuthContext = createContext({
    signInWithGoogle: () => {},
    signOut: () => {},
    isLoading: false,
});

export const AuthProvider = ({ children }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const signInWithGoogle = async (onSuccess, onError) => {
        try {
            setIsLoading(true);

            // Android: Check Play Services
            if (Platform.OS === 'android') {
                await GoogleSignin.hasPlayServices();
            }

            // Get the response
            const response = await GoogleSignin.signIn();

            // CORRECT EXTRACTION: data is at response.data (not response.response.data)
            const idToken = response?.data?.idToken;
            const serverAuthCode = response?.data?.serverAuthCode;
            const googleUser = response?.data?.user;

            if (!idToken) {
                const errorMsg = 'No ID token from Google';
                toast.error(errorMsg);
                if (onError) onError(errorMsg);
                return;
            }

            // React Native Firebase sign-in
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            const userCredential = await auth().signInWithCredential(googleCredential);
            const firebaseIdToken = await userCredential.user.getIdToken();

            // Check role
            const storedRole = await SecureStorage.getRole();
            if (!storedRole) {
                router.replace('/(onboarding)/role-select?next=/(authentication)/signup');
                setIsLoading(false);
                if (onError) onError('Please select a role first');
                return;
            }

            // Send to YOUR backend
            const respData = await ClientUtils.GoogleSocialAuth({
                firebaseIdToken,
                provider: "Google",
                role: storedRole,
                email: userCredential.user.email || googleUser?.email,
                name: userCredential.user.displayName || googleUser?.name,
                picture: userCredential.user.photoURL || googleUser?.photo,
            });

            const { accessToken, refreshToken, user, expiresIn } = respData;

            // Store YOUR session
            await SessionManager.updateToken(accessToken, expiresIn);
            await SecureStorage.saveRefreshToken(refreshToken);
            await SessionManager.updateUser(user);
            await SessionManager.updateRole(user.role);
            await SessionManager.updateOnboardingStatus(true);

            // Clean up Firebase session (optional)
            await auth().signOut();

            // Call success callback for UI update
            if (onSuccess) {
                onSuccess();
            }

            // Delay navigation to show success state
            setTimeout(() => {
                router.replace(`/(protected)/${user.role}/dashboard`);
            }, 2000);

        } catch (error) {

            let errorMessage = 'Sign in failed. Please try again.';

            // Handle 403 Role Mismatch specifically
            if (error.status === 403 || error.response?.status === 403) {
                errorMessage = error.response?.data?.message ||
                    error.response?.data?.error ||
                    'This email is already registered with a different role.';

                const existingRole = error.response?.data?.existingRole;
                if (existingRole) {
                    console.log('Existing role:', existingRole);
                }
            }
            // Handle other Google errors
            else if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                errorMessage = 'Sign in was cancelled';
                toast.info(errorMessage);
            } else if (error.code === statusCodes.IN_PROGRESS) {
                errorMessage = 'Sign in already in progress';
                toast.info(errorMessage);
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                errorMessage = 'Google Play Services not available';
                toast.error(errorMessage);
            } else if (error.status === 409 || error.response?.status === 409) {
                errorMessage = 'Account already exists with different method';
                toast.error(errorMessage);
            } else if (error.message === "Network error" || error.message?.includes('Network')) {
                errorMessage = 'No internet connection 🔌';
                toast.error(errorMessage);
            } else if (error.response?.data?.error) {
                // Use backend error message
                errorMessage = error.response.data.error;
            }

            // Show toast
            toast.error(errorMessage);

            // Call error callback for UI update
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await GoogleSignin.signOut();
            await auth().signOut();
            await SessionManager.logout();
        } catch (error) {
            console.log('Sign out error:', error);
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