"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { useModal } from "./ModalProvider";
import { useAuth } from "./AuthProvider";
import FileUploadBox from "./FileUploadBox";
import { savePendingUpload } from "@/lib/pendingUpload";

// Small floating stat chips shown beside the preview card
const STATS = [
  { icon: Zap, label: "5s avg. generation" },
  { icon: ShieldCheck, label: "Enterprise-grade security" },
  { icon: TrendingUp, label: "+38% faster decisions" },
];

export default function Hero() {
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { openDashboard } = useApp();
  const { open } = useModal();
  const { user } = useAuth();

  // Persist any uploaded file, then route: signed-in users go straight to the
  // workspace (where the file is auto-injected), while guests are sent to signup.
  const handleGenerate = async () => {
    if (file) await savePendingUpload(file);
    if (user) openDashboard();
    else open("signup");
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32"
    >
      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <Sparkles className="h-3.5 w-3.5 text-orange-500" />
          Powered by advanced AI models
        </motion.div>

        {/* Main headline — clean white with a single accent on the keyword */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight text-strong sm:text-5xl lg:text-7xl"
        >
          AI <span className="text-orange-500">Report</span> Generator
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg"
        >
          Transform raw data into professional insights instantly.
        </motion.p>

        {/* Interactive floating command bar (Raycast / Vercel-search style) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-full border border-zinc-200 bg-white/80 p-2 pl-5 shadow-sm backdrop-blur-md transition-all duration-300 focus-within:border-orange-500/50 dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-orange-500" />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            type="text"
            placeholder="Ask AI to generate a report on… (e.g. Q3 revenue analysis)"
            className="w-full bg-transparent py-2.5 text-sm text-strong placeholder:text-zinc-400 focus:outline-none dark:text-white dark:placeholder:text-zinc-500"
          />
          <motion.button
            type="button"
            onClick={handleGenerate}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="group flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/40"
          >
            Generate Report
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted"
        >
          {STATS.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-orange-500" />
              {label}
            </span>
          ))}
        </motion.div>

        {/* Live animated report preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto mt-12 max-w-3xl rounded-3xl bg-gradient-to-b from-orange-500/40 via-slate-200/80 to-slate-200/80 p-px shadow-2xl shadow-slate-400/30 dark:from-orange-500/45 dark:via-zinc-800/60 dark:to-zinc-900/60 dark:shadow-black/80"
        >
          <div className="card overflow-hidden rounded-3xl p-6 text-left">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <span className="text-xs text-muted">report-preview.pdf</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
                <p className="text-xs text-muted">Total Revenue</p>
                <p className="mt-1 text-xl font-bold text-strong">$2.4M</p>
                <p className="text-xs text-green-600 dark:text-green-400">▲ 12.5%</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
                <p className="text-xs text-muted">Active Users</p>
                <p className="mt-1 text-xl font-bold text-strong">18.2K</p>
                <p className="text-xs text-green-600 dark:text-green-400">▲ 8.1%</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
                <p className="text-xs text-muted">Churn Rate</p>
                <p className="mt-1 text-xl font-bold text-strong">2.3%</p>
                <p className="text-xs text-red-600 dark:text-red-400">▼ 0.4%</p>
              </div>
            </div>

            {/* Fake animated chart visualization */}
            <div className="mt-5 flex h-32 items-end gap-2 rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
              {[40, 65, 50, 80, 60, 95, 72].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.8 + i * 0.08, duration: 0.5 }}
                  className="flex-1 rounded-t bg-gradient-to-t from-orange-600 to-orange-400"
                />
              ))}
            </div>

            {/* Interactive drag & drop upload zone */}
            <FileUploadBox value={file} onChange={setFile} />

            <div className="mt-4 flex items-center gap-2 text-xs text-muted">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              AI-generated insights ready to export
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
