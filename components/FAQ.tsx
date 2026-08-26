"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import SectionHeading from "./SectionHeading";

const FAQS = [
  {
    q: "What file formats can I upload?",
    a: "You can upload PDF documents and CSV spreadsheets. The generator extracts structured numeric tables and text, analyzing them directly to produce customized reports.",
  },
  {
    q: "How large can my uploaded files be?",
    a: "Free usage supports files up to 10MB. Pro and Team tiers allow larger uploads up to 250MB per file with support for multi-document batch analysis.",
  },
  {
    q: "Is my data kept private and secure?",
    a: "Yes. Files you upload are processed to generate your active analysis session and report. We prioritize user privacy and do not sell or expose your document contents.",
  },
  {
    q: "Can I export my generated reports?",
    a: "Yes. Every generated report can be exported as a formatted PDF or editable Word (.docx) document, along with embedded chart representations.",
  },
  {
    q: "Do you support market and trend analysis?",
    a: "Yes. In addition to standard business overview reports, AI analyst models can perform trend analysis, statistical summaries, and comparative benchmarks on your uploaded data.",
  },
  {
    q: "Is there API access available?",
    a: "API integration is available for custom workflows on higher tier plans. Contact support or check your account settings for integration options.",
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
                className="card overflow-hidden transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
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
