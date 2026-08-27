"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  Search,
  LifeBuoy,
  ChevronDown,
  Send,
  CheckCircle2,
} from "lucide-react";

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
  {
    q: "How do I create a new report?",
    a: "Click 'New Project' in the sidebar, then describe what you want analyzed or upload a file. AI Report Generator produces a structured, professional report you can export to PDF or DOCX.",
  },
  {
    q: "Which file types can I analyze?",
    a: "You can upload PDF, CSV, TXT, images (PNG/JPG), and common document formats. The AI reads the content and produces insights, charts, and summaries.",
  },
  {
    q: "How do I save context the AI should remember?",
    a: "Open the Memory Center from the profile menu. Add titles and instructions (e.g. a preferred writing tone) and the AI will apply them to future reports.",
  },
  {
    q: "Can I export my reports?",
    a: "Yes. Each report card has a download button supporting both PDF and DOCX, formatted with headings, tables, and diagrams.",
  },
  {
    q: "What are the agent personas?",
    a: "AI Report Generator includes several specialist agents — a general Data Analyst (the default), AI Spreadsheets for financial models, AI Design for UI/UX recommendations, AI Image for visual prompts, AI Video for scripts, and Slides Agent for decks. Pick one before generating to shape the style of analysis.",
  },
  {
    q: "How do I upgrade my plan?",
    a: "Open the profile menu and click 'Upgrade', or visit the Pricing page. Paid plans add credits, all agents, and the Memory Center.",
  },
  {
    q: "Is my data private?",
    a: "Your documents, sessions, and memories are stored per-account and isolated by your user ID. We never share your files with other users.",
  },
  {
    q: "I forgot my password — what do I do?",
    a: "On the sign-in screen use the 'Forgot password' flow to receive a reset email. If you signed in with Google, use Google's account recovery.",
  },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    const subject = encodeURIComponent(`AI Report Generator support — ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:support@aireportgenerator.app?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-orange-600 dark:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Report Generator
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">
              AI Report Generator
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

      <section className="mx-auto max-w-3xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Help Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Find answers, search the docs, or reach our support team.
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the knowledge base…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        {/* FAQs */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
          Frequently asked questions
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-6 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
              No results for “{query}”. Try a different keyword or contact
              support below.
            </p>
          )}
          {filtered.map((f, i) => (
            <div
              key={f.q}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
              >
                {f.q}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-zinc-800 dark:text-zinc-300">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Contact support */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
            Contact support
          </h2>
               {sent ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              Thanks! Your email app should now be open with your message.
              If it didn&apos;t open, email us at support@aireportgenerator.app.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Your name"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  type="email"
                  placeholder="Email address"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                rows={4}
                placeholder="How can we help?"
                className="resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    !form.name.trim() ||
                    !form.email.trim() ||
                    !form.message.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  Send message
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
