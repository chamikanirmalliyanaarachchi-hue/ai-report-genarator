"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  ArrowLeft,
  CreditCard,
} from "lucide-react";

type Plan = {
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  highlight?: boolean;
  cta: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "For trying out the workspace",
    monthly: 0,
    yearly: 0,
    cta: "Current plan",
    features: [
      "120 monthly credits",
      "Basic report generation",
      "File & document analysis",
      "PDF / DOCX export",
      "Community support",
    ],
  },
  {
    name: "Pro",
    tagline: "For power users & analysts",
    monthly: 19,
    yearly: 15,
    highlight: true,
    cta: "Upgrade to Pro",
    features: [
      "2,500 monthly credits",
      "All 6 analyst agents",
      "Memory Center & saved contexts",
      "Priority Gemini 3.6 Flash",
      "Unlimited projects & history",
      "Priority support",
    ],
  },
  {
    name: "Team",
    tagline: "For growing teams",
    monthly: 49,
    yearly: 39,
    cta: "Upgrade to Team",
    features: [
      "10,000 monthly credits",
      "Everything in Pro",
      "Shared workspaces",
      "Admin & billing controls",
      "SSO (coming soon)",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(true);

  const handleSelect = (_plan: string) => {
    // In production this would open Stripe Checkout / billing portal.
    router.push("/?upgrade=1");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
            <span className="text-base font-bold tracking-tight">AI Reporter</span>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Go to app
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <CreditCard className="h-3.5 w-3.5" />
            Pricing
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Choose the plan that fits your workflow
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-zinc-400">
            Start free. Upgrade anytime to unlock more credits, all analyst
            agents, and the Memory Center.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setAnnual(false)}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              !annual
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-slate-600 dark:text-zinc-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              annual
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-slate-600 dark:text-zinc-300"
            }`}
          >
            Annual
            <span className="ml-1 text-xs text-orange-500">−20%</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => {
            const price = annual ? plan.yearly : plan.monthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`relative flex flex-col rounded-2xl border p-6 text-left ${
                  plan.highlight
                    ? "border-orange-500/60 bg-gradient-to-b from-orange-500/5 to-transparent shadow-xl shadow-orange-500/10"
                    : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  {plan.tagline}
                </p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-extrabold">${price}</span>
                  <span className="mb-1 text-sm text-slate-500 dark:text-zinc-400">
                    /mo{annual && plan.monthly > 0 ? ", billed yearly" : ""}
                  </span>
                </div>

                <button
                  onClick={() => handleSelect(plan.name)}
                  disabled={plan.name === "Free"}
                  className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform ${
                    plan.highlight
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:scale-[1.02]"
                      : "border border-slate-200 text-slate-800 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {plan.cta}
                </button>

                <ul className="mt-6 flex flex-col gap-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                      <span className="text-slate-600 dark:text-zinc-300">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-slate-400 dark:text-zinc-500">
          All plans include the AI Reporter report workspace. Need a custom
          enterprise plan?{" "}
          <a className="text-orange-600 hover:underline dark:text-orange-400">
            Contact sales
          </a>
          .
        </p>
      </section>
    </main>
  );
}
