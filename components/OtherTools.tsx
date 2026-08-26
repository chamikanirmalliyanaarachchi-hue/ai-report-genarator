"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sheet, FileText, FileUser } from "lucide-react";
import SectionHeading from "./SectionHeading";

/**
 * Companion tools shown as secondary, forward-looking cards.
 * The AI Report Generator is the primary product; these are presented as
 * upcoming additions and clearly marked "Coming soon" so we don't imply
 * functionality that isn't shipped yet.
 */
const TOOLS = [
  {
    icon: Sheet,
    title: "AI Financial Spreadsheet Processor",
    description:
      "Clean, reconcile and forecast directly from raw Excel or CSV files with intelligent formulas.",
    tag: "Finance",
    comingSoon: true,
  },
  {
    icon: FileText,
    title: "AI Article Summarizer",
    description:
      "Paste any long-form article or research paper and get a crisp, structured executive summary.",
    tag: "Productivity",
    comingSoon: true,
  },
  {
    icon: FileUser,
    title: "Resume / CV Analyzer",
    description:
      "Get instant, recruiter-grade feedback on resumes with scoring, fixes and keyword optimization.",
    tag: "Careers",
    comingSoon: true,
  },
];

export default function OtherTools() {
  return (
    <section
      id="tools"
      className="scroll-mt-24 px-4 py-28 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="More AI Tools"
          title="Companion tools on our roadmap"
          subtitle="The AI Report Generator is our primary product. These specialized mini-tools are coming next."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TOOLS.map(({ icon: Icon, title, description, tag, comingSoon }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="card group relative flex flex-col gap-4 p-6 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {comingSoon && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Coming soon
                  </span>
                )}
              </div>
              <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {tag}
              </span>
              <h3 className="text-lg font-semibold text-strong">{title}</h3>
              <p className="flex-1 text-sm text-muted">{description}</p>
              <span
                aria-hidden="true"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400"
              >
                Preview unavailable
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          Want the full toolkit? The report generator is available today — the
          companion tools above are planned releases.
        </p>
      </div>
    </section>
  );
}
