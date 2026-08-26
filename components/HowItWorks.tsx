"use client";

import { motion } from "framer-motion";
import {
  UploadCloud,
  BarChart3,
  FileDown,
  FileText,
  Table2,
  LineChart,
  FileType2,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import TiltCard from "./TiltCard";

// Each step definition keeps the data and UI together for easy maintenance
const STEPS = [
  {
    step: "01",
    icon: UploadCloud,
    title: "Upload Your Data File",
    description:
      "Drag & drop your PDF or CSV file. We automatically parse, clean and structure your raw data in seconds.",
    preview: (
      <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-100 text-muted dark:border-zinc-700 dark:bg-zinc-900/60">
        <UploadCloud className="h-7 w-7 text-orange-500" />
        <span className="text-xs">Drop PDF or CSV here</span>
        <div className="flex gap-2">
          <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <FileText className="mr-1 inline h-3 w-3" /> PDF
          </span>
          <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Table2 className="mr-1 inline h-3 w-3" /> CSV
          </span>
        </div>
      </div>
    ),
  },
  {
    step: "02",
    icon: BarChart3,
    title: "AI Analysis & Insights",
    description:
      "Our AI model analyzes trends, detects anomalies and generates beautiful charts and narrative insights automatically.",
    preview: (
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex h-16 items-end gap-1.5">
          {[30, 55, 40, 70, 50, 90].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-orange-600 to-orange-400"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <LineChart className="h-4 w-4 text-orange-500" />
          Trend detected: +18% MoM growth
        </div>
      </div>
    ),
  },
  {
    step: "03",
    icon: FileDown,
    title: "Download Professional Report",
    description:
      "Export a polished, board-ready report in your preferred format — perfect for sharing with stakeholders.",
    preview: (
      <div className="flex h-28 items-center justify-center gap-3">
        <span className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-strong dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
          <FileType2 className="h-6 w-6 text-red-400" />
          <span className="text-[10px]">PDF</span>
        </span>
        <span className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-strong dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
          <FileText className="h-6 w-6 text-blue-400" />
          <span className="text-[10px]">Word</span>
        </span>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 px-4 py-28 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="How It Works"
          title="From raw data to polished report in 3 steps"
          subtitle="A frictionless workflow designed for analysts, founders and finance teams."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(({ step, icon: Icon, title, description, preview }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="h-full"
            >
              <TiltCard className="h-full" intensity={9}>
                <div className="card group relative h-full p-6 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10">
                  {/* Step number badge */}
                  <span className="absolute right-5 top-5 text-4xl font-black text-zinc-200 transition-colors group-hover:text-zinc-300 dark:text-white/5 dark:group-hover:text-white/10">
                {step}
                  </span>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30">
                <Icon className="h-6 w-6 text-white" />
              </div>
                  <h3 className="mt-5 text-lg font-semibold text-strong">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{description}</p>
                  <div className="mt-5">{preview}</div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
