// Real Google + Email/Password authentication via Firebase Auth.
//
// Exposes one stable API to the UI (AuthProvider, Modal, Dashboard):
//   - signInWithGoogle()        → signInWithPopup(googleProvider)
//   - signUpWithEmail()         → createUserWithEmailAndPassword
//   - signInWithEmail()         → signInWithEmailAndPassword
//   - resetPassword()           → sendPasswordResetEmail
//   - signOut()                 → firebase signOut
//   - subscribeToAuth(cb)       → onAuthStateChanged (persistent session)

 import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: "google" | "password";
  emailVerified: boolean;
  joinedAt?: string | null;
  linkedAccounts: string[];
};

function mapUser(user: User): AuthUser {
  const isGoogle = user.providerData.some((p) => p.providerId === "google.com");
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "AI User",
    photoURL: user.photoURL,
    provider: isGoogle ? "google" : "password",
    emailVerified: user.emailVerified,
    joinedAt: user.metadata.creationTime ?? null,
    linkedAccounts: user.providerData.map((p) => p.providerId),
  };
}

/** Translate Firebase error codes into clean, user-facing messages. */
function mapAuthError(err: unknown): Error {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/popup-closed-by-user":
      return new Error("Google sign-in was cancelled.");
    case "auth/popup-blocked":
      return new Error(
        "The sign-in popup was blocked by the browser. Please allow popups."
      );
    case "auth/operation-not-allowed":
      return new Error(
        "Google sign-in is not enabled. Enable it in the Firebase Console."
      );
    case "auth/email-already-in-use":
      return new Error("An account with this email already exists.");
    case "auth/invalid-email":
      return new Error("Please enter a valid email address.");
    case "auth/weak-password":
      return new Error("Password should be at least 6 characters.");
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return new Error("Incorrect email or password.");
    case "auth/network-request-failed":
      return new Error("Network error. Please check your connection.");
    default:
      return new Error(
        (err as { message?: string })?.message ?? "Authentication failed."
      );
  }
}

export async function signInWithGoogle(): Promise<AuthUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return mapUser(result.user);
  } catch (err) {
    throw mapAuthError(err);
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  const trimmed = email.trim();
  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      trimmed,
      password
    );
    // Send the official verification link immediately after sign-up.
    await sendEmailVerification(result.user);
    // Do NOT keep an unverified session — sign them out and surface a notice
    // so they can't reach the dashboard until they verify.
    await firebaseSignOut(auth);
    throw new Error(
      `Verification email sent to ${trimmed}. Please check your inbox and verify your email before logging in.`
    );
  } catch (err) {
    throw mapAuthError(err);
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    // Block access for unverified emails.
    if (!result.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error(
        "Please verify your email address before signing in. Check your inbox for the verification link."
      );
    }
    return mapUser(result.user);
  } catch (err) {
    throw mapAuthError(err);
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err) {
    throw mapAuthError(err);
  }
}

/**
 * Subscribe to auth state changes (fires immediately + on every login/logout),
 * keeping the session alive across refreshes.
 */
export function subscribeToAuth(
  callback: (user: AuthUser | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, (user) =>
    callback(user ? mapUser(user) : null)
  );
}
