"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import SectionHeading from "./SectionHeading";

const FAQS = [
  {
    q: "What file formats can I upload?",
    a: "You can upload PDF documents and CSV spreadsheets. We parse both structured tables and unstructured text, then automatically structure the data for analysis.",
  },
  {
    q: "How large can my data files be?",
    a: "Free plans support files up to 10MB and 50,000 rows. Pro and Enterprise plans raise the limit to 250MB and millions of rows with batch processing.",
  },
  {
    q: "Is my data secure and private?",
    a: "We take a privacy-conscious approach: files you upload are used only to generate your report and can be removed from your workspace at any time.",
  },
  {
    q: "Can I export reports to PDF and Word?",
    a: "Absolutely. Every generated report can be exported as a polished PDF or an editable Word (.docx) document, plus PNG charts for slides.",
  },
  {
    q: "Do you support economy and market analysis?",
    a: "Yes — beyond standard business reports, the AI can perform economy analysis, trend forecasting and benchmark comparisons using your uploaded data.",
  },
  {
    q: "Is there an API available?",
    a: "Enterprise customers get access to a REST API and webhooks so reports can be generated programmatically and embedded into existing workflows.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="scroll-mt-24 px-4 py-28 sm:px-6 lg:px-8 lg:py-32"
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
                className="card overflow-hidden transition-colors hover:border-zinc-700 dark:hover:border-zinc-700"
              >
                <button
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
                      transition={{ duration: 0.3, ease: "easeInOut" }}
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
