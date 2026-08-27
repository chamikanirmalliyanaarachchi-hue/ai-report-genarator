import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export const metadata = {
  title: "Terms of Service — AI Report Generator",
  description:
    "The terms governing your use of AI Report Generator, including accounts, subscriptions, and content.",
};

const SECTIONS = [
  {
    h: "1. Acceptance of terms",
    p: "By creating an account or using AI Report Generator (the “Service”), you agree to these Terms of Service. If you do not agree, do not use the Service.",
  },
  {
    h: "2. Accounts",
    p: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information and are responsible for keeping it up to date. Accounts created through third-party providers (such as Google) are subject to those providers’ terms as well.",
  },
  {
    h: "3. Acceptable use",
    p: "You agree not to use the Service to upload unlawful content, infringe others’ rights, attempt to disrupt the Service, or misuse the AI features to generate harmful or deceptive material. We may suspend accounts that violate these terms.",
  },
  {
    h: "4. Subscriptions and billing",
    p: "Paid plans are billed in advance on a monthly or annual basis according to the pricing in effect at the time of purchase. Plan features, credit allowances, and prices may change; we will provide notice before any change applies to your next billing period. You can cancel at any time, and paid access continues until the end of the current billing period.",
  },
  {
    h: "5. Your content",
    p: "You retain ownership of the files and reports you create. By using the Service you grant us a limited license to process your content solely to provide, maintain, and improve the Service (for example, to analyze uploads and generate reports on your behalf).",
  },
  {
    h: "6. Intellectual property",
    p: "The Service, including its interface, branding, and underlying technology, is owned by AI Report Generator and protected by applicable law. These terms do not grant you rights to our trademarks or software beyond what is needed to use the Service as intended.",
  },
  {
    h: "7. Disclaimers",
    p: "The Service is provided “as is” without warranties of any kind. AI-generated reports may contain inaccuracies; you are responsible for reviewing outputs before relying on them. We are not liable for decisions made based on generated content.",
  },
  {
    h: "8. Termination",
    p: "You may close your account at any time. We may suspend or terminate access for violations of these terms. Upon termination, your right to use the Service ends, and we will handle your data as described in our Privacy Policy.",
  },
  {
    h: "9. Changes to these terms",
    p: "We may update these Terms from time to time. Material changes will be communicated through the Service or by email. Continued use after changes take effect constitutes acceptance of the updated terms.",
  },
  {
    h: "10. Contact",
    p: "Questions about these terms can be sent to support@aireportgenerator.app.",
  },
];

export default function TermsPage() {
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
              <Scale className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">
              AI Report Generator
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
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
          Looking for our privacy practices? Read the{" "}
          <Link
            href="/privacy"
            className="text-orange-600 hover:underline dark:text-orange-400"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
