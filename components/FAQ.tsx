"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import SectionHeading from "./SectionHeading";

const FAQS = [
  {
    q: "What file formats can I upload?",
    a: "You can upload PDFs, Word documents (.doc/.docx), Excel spreadsheets (.xls/.xlsx), CSV/TSV/text files, and images such as PNG, JPG, WEBP, and GIF. The generator reads the content and produces charts, tables, and a written analysis from it.",
  },
  {
    q: "How large can my files be?",
    a: "Files are processed directly to build your report, and you can attach several documents in a single analysis session. Paid plans add more monthly credits and features like the Memory Center and priority processing.",
  },
  {
    q: "Is my data kept private and secure?",
    a: "When you're signed in, your uploaded documents, chat history, and saved memories are stored in your own account and isolated by your user ID. We don't sell or share your document contents with other users.",
  },
  {
    q: "Can I export my generated reports?",
    a: "Yes. Every generated report can be exported as a formatted PDF or an editable Word (.docx) document, with charts, tables, and diagrams preserved.",
  },
  {
    q: "Does it handle trend and statistical analysis?",
    a: "Yes. The AI performs trend analysis, statistical summaries, comparative benchmarks, and risk assessments on your data, and can adapt the analysis to business, financial, academic, or creative contexts using different agents.",
  },
  {
    q: "Which specialist agents can I use?",
    a: "You can pick the right analyst for the job: a general Data Analyst for reports, AI Spreadsheets for financial models, AI Design for UI/UX recommendations, AI Image for visual prompts, AI Video for scripts, and Slides Agent for slide decks. The default analyst handles most data and document reports.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently asked questions"
          subtitle="Everything you need to know about the AI Report Generator."
        />

        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
                <div
                  key={item.q}
                  className={`card overflow-hidden transition-colors ${
                    isOpen
                      ? "border-orange-500/30"
                      : "hover:border-orange-500/30 dark:hover:border-orange-500/30"
                  }`}
                >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <span className="text-sm font-medium text-strong sm:text-base">
                    {item.q}
                  </span>
                  <Plus
                    className={`h-5 w-5 shrink-0 text-orange-500 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
