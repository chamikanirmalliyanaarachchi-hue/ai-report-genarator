"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Zap,
  UploadCloud,
  Cpu,
  FileCheck,
  Play,
  CheckCircle2,
  Loader2,
  FileText,
  Download,
  RotateCcw,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { useModal } from "./ModalProvider";
import { useAuth } from "./AuthProvider";
import FileUploadBox from "./FileUploadBox";
import { savePendingUpload } from "@/lib/pendingUpload";

const STATS = [
  { icon: Zap, label: "5s avg. generation" },
  { icon: ShieldCheck, label: "Designed with privacy in mind" },
  { icon: TrendingUp, label: "+38% faster decisions" },
];

const STEPS = [
  { id: 1, label: "Upload Data", icon: UploadCloud, desc: "CSV or PDF file" },
  { id: 2, label: "AI Analysis", icon: Cpu, desc: "Detects patterns & metrics" },
  { id: 3, label: "Generate Report", icon: Sparkles, desc: "Synthesizes narrative" },
  { id: 4, label: "Download & Share", icon: FileCheck, desc: "PDF or Word export" },
];

type DemoState = "idle" | "analyzing" | "patterns" | "insights" | "ready";

function LiveReportDemo() {
  const [state, setState] = useState<DemoState>("idle");
  const [progressText, setProgressText] = useState("");

  const runDemo = () => {
    if (state !== "idle" && state !== "ready") return;
    setState("analyzing");
    setProgressText("Analyzing uploaded data...");

    setTimeout(() => {
      setState("patterns");
      setProgressText("Finding key metrics & patterns...");
    }, 1100);

    setTimeout(() => {
      setState("insights");
      setProgressText("Generating AI insights & narrative...");
    }, 2200);

    setTimeout(() => {
      setState("ready");
      setProgressText("Report ready for export!");
    }, 3300);
  };

  const resetDemo = () => {
    setState("idle");
    setProgressText("");
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-strong">
            Interactive AI Generation Demo
          </span>
        </div>

        {state === "idle" && (
          <button
            type="button"
            onClick={runDemo}
            className="flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <Play className="h-3 w-3 fill-current" /> Run Live Simulation
          </button>
        )}

        {state === "ready" && (
          <button
            type="button"
            onClick={resetDemo}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-strong transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <RotateCcw className="h-3 w-3" /> Reset Demo
          </button>
        )}
      </div>

      <div className="mt-4">
        {state !== "idle" && state !== "ready" && (
          <div className="flex items-center gap-3 py-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            <span className="font-medium text-strong">{progressText}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-3 text-center text-xs text-muted"
            >
              Click <span className="font-semibold text-orange-500">Run Live Simulation</span> to preview the automated insight generation workflow.
            </motion.p>
          )}

          {state === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3 pt-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Executive Summary &amp; Analytics Synthesized</span>
              </div>

              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3.5 text-xs text-strong space-y-1.5">
                <p className="font-semibold text-orange-600 dark:text-orange-400">
                  Key Findings:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted">
                  <li>Revenue expanded <strong>+12.5% MoM</strong> driven by key accounts.</li>
                  <li>Net retention held at <strong>97.7%</strong> with stable low churn.</li>
                  <li>Recommended action: Reallocate expansion budget to top channels.</li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <span className="flex items-center gap-1.5 text-muted">
                  <FileText className="h-3.5 w-3.5 text-orange-500" />
                  report-q3-summary.pdf (1.2 MB)
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 font-semibold text-white">
                  <Download className="h-3 w-3" /> Export Ready
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Hero() {
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { openDashboard } = useApp();
  const { open } = useModal();
  const { user } = useAuth();

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

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight text-strong sm:text-5xl lg:text-7xl"
        >
          AI <span className="text-orange-500">Report</span> Generator
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg"
        >
          Transform raw data into professional insights instantly.
        </motion.p>

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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerate();
            }}
            type="text"
            placeholder="Ask AI to generate a report on… (e.g. Q3 revenue analysis)"
            className="w-full bg-transparent py-2.5 text-sm text-strong placeholder:text-zinc-400 focus:outline-none dark:text-white dark:placeholder:text-zinc-500"
          />
          <motion.button
            type="button"
            onClick={handleGenerate}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="group flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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

        {/* Workflow steps */}
        <div className="mx-auto mt-10 max-w-3xl px-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                  className="relative flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-white/60 p-3.5 text-center shadow-sm backdrop-blur-sm transition-all hover:border-orange-500/40 hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-orange-500/40 dark:hover:bg-zinc-900"
                >
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500 dark:bg-orange-500/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-strong">{s.label}</span>
                  <span className="mt-0.5 text-[11px] text-muted">{s.desc}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Preview card & Interactive demo */}
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

            <FileUploadBox value={file} onChange={setFile} />

            <div className="mt-4 flex items-center gap-2 text-xs text-muted">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              AI-generated insights ready to export
            </div>

            <LiveReportDemo />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
