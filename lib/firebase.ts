// Firebase client initialization for AI Report Generator.
// Initialized with the project's official web configuration.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBam54ksiU8OE4Z2qfhH-Q4jBubiCkLh3U",
  authDomain: "ai-repoter-2b69a.firebaseapp.com",
  projectId: "ai-repoter-2b69a",
  storageBucket: "ai-repoter-2b69a.firebasestorage.app",
  messagingSenderId: "537509072438",
  appId: "1:537509072438:web:ee8f405985393bb5d29297",
  measurementId: "G-JPCV87QNEG",
};

// Guard against "app already initialized" during Next.js dev fast-refresh.
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

// Firestore — used for Projects, Documents, and Chat History persistence.
export const db: Firestore = getFirestore(app);

// Reusable Google provider; prompt for account selection every time.
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
