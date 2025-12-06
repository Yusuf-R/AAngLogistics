import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";

// const firebaseConfig = {
//     apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
//     authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
//     storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
// };

const firebaseConfig = {
    apiKey: "AIzaSyBmCQn6BBd3f4mWgdZFrb7MKX7byRL9gIQ",
    authDomain: "aanglogistics-a9188.firebaseapp.com",
    projectId: "aanglogistics-a9188",
    storageBucket: "aanglogistics-a9188.firebasestorage.app",
    messagingSenderId: "397811705561",
    appId: "1:397811705561:web:ce04365c348b8b5fb340c8"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);