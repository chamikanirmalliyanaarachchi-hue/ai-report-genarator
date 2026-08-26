"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  Mail,
  CalendarDays,
  Link2,
  BadgeCheck,
  CreditCard,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useApp } from "@/components/AppProvider";
import ThemeToggle from "@/components/ThemeToggle";

const PROVIDER_LABELS: Record<string, string> = {
  "google.com": "Google",
  password: "Email & Password",
  "github.com": "GitHub",
  "facebook.com": "Facebook",
  "apple.com": "Apple",
};

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { backToLanding } = useApp();
  const [ready, setReady] = useState(false);

  // Wait for the auth state to resolve before deciding to redirect.
  useEffect(() => {
    setReady(true);
    if (ready && !user) router.replace("/");
  }, [user, ready, router]);

  const handleLogout = () => {
    // Clear local state first, switch to the landing view synchronously, and
    // navigate immediately. The Firebase token clear is fire-and-forget so a
    // slow/offline sign-out can never block or freeze the redirect.
    backToLanding();
    router.replace("/");
    signOut();
  };

  const joined = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const linked = (user?.linkedAccounts ?? []).map(
    (p) => PROVIDER_LABELS[p] ?? p
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-orange-600 dark:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Reporter
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">
              AI Reporter
            </span>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Go to app
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Account
          </h1>
          <p className="mt-2 text-slate-500 dark:text-zinc-400">
            Manage your profile, theme, and subscription.
          </p>
        </motion.div>

        {!user ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-slate-500 dark:text-zinc-400">
              Please sign in to view your account.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-5">
            {/* Left: avatar + identity */}
            <div className="md:col-span-2">
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? "User"}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-orange-500/40"
                  />
                ) : (
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-2xl font-semibold text-white dark:from-zinc-700 dark:to-zinc-900">
                    {(user.displayName ?? "AR").slice(0, 2).toUpperCase()}
                  </span>
                )}
                <p className="mt-4 text-lg font-semibold">
                  {user.displayName ?? "AI User"}
                </p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  {user.email}
                </p>
                {user.emailVerified && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Right: details + theme */}
            <div className="flex flex-col gap-6 md:col-span-3">
              {/* Account details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                  Account details
                </h2>
                <dl className="mt-4 space-y-4 text-sm">
                  <DetailRow
                    icon={UserIcon}
                    label="Profile name"
                    value={user.displayName ?? "—"}
                  />
                  <DetailRow
                    icon={Mail}
                    label="Email address"
                    value={user.email ?? "—"}
                  />
                  <DetailRow
                    icon={CreditCard}
                    label="Current plan"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                          Free plan
                        </span>
                        <Link
                          href="/pricing"
                          className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                        >
                          Upgrade
                        </Link>
                      </span>
                    }
                  />
                  <DetailRow
                    icon={Link2}
                    label="Linked accounts"
                    value={
                      linked.length > 0 ? (
                        <span className="flex flex-wrap gap-1.5">
                          {linked.map((name) => (
                            <span
                              key={name}
                              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {name}
                            </span>
                          ))}
                        </span>
                      ) : (
                        "—"
                      )
                    }
                  />
                  <DetailRow
                    icon={CalendarDays}
                    label="Joined"
                    value={joined}
                  />
                </dl>
              </div>

              {/* Appearance / theme */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Appearance
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Switch between light and dark mode.
                  </p>
                </div>
                <ThemeToggle />
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
        <Icon className="h-4 w-4" />
        {label}
      </dt>
      <dd className="flex-1 text-right font-medium text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
