"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sheet, FileText, FileUser } from "lucide-react";
import SectionHeading from "./SectionHeading";

// Related AI mini-tools showcased as cards with external-style links
const TOOLS = [
  {
    icon: Sheet,
    title: "AI Financial Spreadsheet Processor",
    description:
      "Clean, reconcile and forecast directly from raw Excel or CSV files with intelligent formulas.",
    tag: "Finance",
  },
  {
    icon: FileText,
    title: "AI Article Summarizer",
    description:
      "Paste any long-form article or research paper and get a crisp, structured executive summary.",
    tag: "Productivity",
  },
  {
    icon: FileUser,
    title: "Resume / CV Analyzer",
    description:
      "Get instant, recruiter-grade feedback on resumes with scoring, fixes and keyword optimization.",
    tag: "Careers",
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
          eyebrow="More Tools"
          title="A growing AI toolkit"
          subtitle="Pair the report generator with our other specialized AI mini-tools."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TOOLS.map(({ icon: Icon, title, description, tag }, i) => (
            <motion.a
              key={title}
              href="#"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="card group relative flex flex-col gap-4 p-6 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-zinc-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-white" />
              </div>
              <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {tag}
              </span>
              <h3 className="text-lg font-semibold text-strong">{title}</h3>
              <p className="text-sm text-muted">{description}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
