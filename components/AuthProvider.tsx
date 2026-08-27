"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as auth from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<AuthUser>;
  signUp: (email: string, password: string) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Global, persistent session listener. Firebase fires this on mount with the
  // restored session (survives page refresh) and on every login/logout.
  useEffect(() => {
    const unsubscribe = auth.subscribeToAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const u = await auth.signInWithGoogle();
    setUser(u);
    return u;
  };

  const signUp = async (email: string, password: string) => {
    const u = await auth.signUpWithEmail(email, password);
    setUser(u);
    return u;
  };

  const signIn = async (email: string, password: string) => {
    const u = await auth.signInWithEmail(email, password);
    setUser(u);
    return u;
  };

  const signOut = () => {
    auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await auth.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signUp, signIn, resetPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
