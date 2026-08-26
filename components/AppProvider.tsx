"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthProvider";

type AppContextValue = {
  showDashboard: boolean;
  openDashboard: () => void;
  backToLanding: () => void;
};

const AppContext = createContext<AppContextValue>({
  showDashboard: false,
  openDashboard: () => {},
  backToLanding: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [showDashboard, setShowDashboard] = useState(false);
  const { user } = useAuth();

  // When a verified session exists (including one restored after a page
  // refresh), automatically land the user on the AI Workspace Dashboard.
  // Unverified email users are blocked from auto-opening it, and — crucially —
  // logging out (user becomes null) flips back to the public landing page.
  useEffect(() => {
    setShowDashboard(!!user && user.emailVerified);
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        showDashboard,
        openDashboard: () => setShowDashboard(true),
        backToLanding: () => setShowDashboard(false),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
