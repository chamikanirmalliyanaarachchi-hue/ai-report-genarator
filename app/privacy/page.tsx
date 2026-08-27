import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — AI Report Generator",
  description:
    "How AI Report Generator collects, stores, and protects your data and documents.",
};

const SECTIONS = [
  {
    h: "1. Information we collect",
    p: "We collect account information you provide (such as your name and email), the files and text you upload for analysis, the reports you generate, and basic usage information such as feature interactions. We do not require payment details to use free features.",
  },
  {
    h: "2. How we use your information",
    p: "We use your content solely to operate the Service — to analyze uploads, generate reports, and maintain your projects and saved contexts. Account information is used to authenticate you, provide support, and communicate about your plan.",
  },
  {
    h: "3. Data storage and isolation",
    p: "Your documents, sessions, and saved memories are stored per-account and isolated by your user ID. We never share your files with other users, and your content is not used to train models for other customers.",
  },
  {
    h: "4. Sharing of information",
    p: "We do not sell your personal data. We may share limited information with vetted service providers (such as hosting and email delivery) strictly to operate the Service, under confidentiality obligations. We may disclose information when required by law.",
  },
  {
    h: "5. Security",
    p: "We protect accounts with authentication and apply access controls so that only you can reach your own data. While no online service can be guaranteed perfectly secure, we follow reasonable industry practices to safeguard your information.",
  },
  {
    h: "6. Data retention and deletion",
    p: "Your content remains available while your account is active. You can delete individual projects or your entire account at any time; we will remove associated data according to our retention procedures after closure.",
  },
  {
    h: "7. Your rights",
    p: "Depending on your location, you may have rights to access, correct, export, or delete your personal data. To exercise these rights, contact us using the details below and we will respond within a reasonable timeframe.",
  },
  {
    h: "8. Cookies and local storage",
    p: "We use essential cookies and local storage to keep you signed in and remember your preferences. You can control cookies through your browser settings.",
  },
  {
    h: "9. Changes to this policy",
    p: "We may update this Privacy Policy as the Service evolves. Material changes will be reflected here and, where appropriate, communicated through the Service or by email.",
  },
  {
    h: "10. Contact",
    p: "Questions about your data can be sent to support@aireportgenerator.app.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-orange-600 dark:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Report Generator
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">
              AI Report Generator
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
          Last updated: January 1, 2026.
        </p>

        <div className="mt-10 flex flex-col gap-8">
          {SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="text-lg font-bold">{s.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
                {s.p}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-slate-400 dark:text-zinc-500">
          Read our{" "}
          <Link
            href="/terms"
            className="text-orange-600 hover:underline dark:text-orange-400"
          >
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
