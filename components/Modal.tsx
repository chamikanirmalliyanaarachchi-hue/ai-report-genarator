"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";
import { useAuth } from "./AuthProvider";
import { useApp } from "./AppProvider";

type View = "login" | "signup";

export default function Modal({
  isOpen,
  onClose,
  mode,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: View;
}) {
  const [view, setView] = useState<View>(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const { signInWithGoogle, signUp, signIn, resetPassword } = useAuth();
  const { openDashboard } = useApp();

  const isLogin = view === "login";

  // Keep the modal's internal view in sync with how it was opened
  useEffect(() => {
    if (isOpen) {
      setView(mode);
      setError(null);
      setNotice(null);
    }
  }, [isOpen, mode]);

  // Reset transient form state whenever the modal fully closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setLoading(false);
      setLoadingLabel("");
      setNotice(null);
    }
  }, [isOpen]);

  // ESC to close + lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Successful auth → close modal and drop into the dashboard
  const finishAuth = () => {
    onClose();
    openDashboard();
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    setLoadingLabel("Authenticating with Google…");
    try {
      await signInWithGoogle();
      finishAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    setLoading(true);
    setLoadingLabel(
      isLogin ? "Signing you in…" : "Creating your account…"
    );
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      finishAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email above and we'll send a reset link.");
      return;
    }
    setLoading(true);
    setLoadingLabel("Sending reset link…");
    try {
      await resetPassword(email);
      setNotice(
        `Password reset email sent to ${email.trim()}. Check your inbox to continue.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop layer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal-backdrop"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Card layer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal-card"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            {/* Modal card */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={isLogin ? "Sign in" : "Create account"}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-white"
            >
              {/* Header: brand + close */}
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  aria-label="Close"
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Animated view swap */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="mt-5 text-xl font-bold tracking-tight">
                    {isLogin ? "Sign in to AI Report Generator" : "Get started with AI Report Generator"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {isLogin
                      ? "Welcome back — let's generate your next report."
                      : "Create your account to generate professional AI reports."}
                  </p>

                  {/* Sign in with Google */}
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-slate-200 dark:hover:bg-zinc-800"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg viewBox="0 0 48 48" className="h-5 w-5">
                        <path
                          fill="#FFC107"
                          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
                        />
                        <path
                          fill="#FF3D00"
                          d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                        />
                        <path
                          fill="#4CAF50"
                          d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.3 26.8 36 24 36c-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9.6 39.6 16.2 44 24 44z"
                        />
                        <path
                          fill="#1976D2"
                          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.3 5.2C41.4 36.3 44 30.9 44 24c0-1.3-.1-2.3-.4-3.5z"
                        />
                      </svg>
                    )}
                    {loading ? loadingLabel : "Sign in with Google"}
                  </button>

                  {/* Divider */}
                  <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" />
                    OR
                    <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" />
                  </div>

                  {/* Success notice banner */}
                  {notice && (
                    <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {notice}
                    </div>
                  )}

                  {/* Error / notice banner */}
                  {error && (
                    <div
                      className={
                        error.toLowerCase().includes("verify")
                          ? "mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
                          : "mb-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400"
                      }
                    >
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full rounded-xl border border-slate-300 bg-white/60 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder:text-slate-500"
                    />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full rounded-xl border border-slate-300 bg-white/60 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder:text-slate-500"
                    />

                    {/* Login-only: forgot password */}
                    {isLogin && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleForgot}
                          disabled={loading}
                          className="text-xs font-medium text-slate-500 transition-colors hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400"
                        >
                          Forget password?
                        </button>
                      </div>
                    )}

                    {/* Sign-up-only: terms checkbox */}
                    {!isLogin && (
                      <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <input
                          type="checkbox"
                          required
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800"
                        />
                        <span>
                          I agree to the{" "}
                          <Link
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-orange-500 underline-offset-2 hover:underline"
                          >
                            Terms and Conditions
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-orange-500 underline-offset-2 hover:underline"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>
                    )}

                    {/* Primary action */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:shadow-lg hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading
                        ? loadingLabel
                        : isLogin
                          ? "Sign In"
                          : "Create Account"}
                    </motion.button>
                  </form>

                  {/* Footer toggle link */}
                  <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                    {isLogin ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setView("signup")}
                          className="font-medium text-orange-500 transition-colors hover:underline"
                        >
                          Sign up here
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setView("login")}
                          className="font-medium text-orange-500 transition-colors hover:underline"
                        >
                          Login here
                        </button>
                      </>
                    )}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
