import Link from "next/link";
import { Github, Twitter, Linkedin, Youtube } from "lucide-react";
import Logo from "./Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it Works", href: "/#how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Memory Center", href: "/memory" },
      { label: "Integrations", badge: "Soon" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Documentation", href: "/help" },
      { label: "API Reference", badge: "Soon" },
    ],
  },
      {
        title: "Legal",
        links: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
        ],
      },
];

const SOCIALS = [
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 px-4 py-16 sm:px-6 lg:px-8 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand + tagline + socials */}
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted leading-relaxed">
              Transform PDF or CSV data into comprehensive business analysis,
              charts, and actionable narrative reports powered by AI.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-strong">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label} className="flex items-center gap-2">
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-zinc-900 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-600">
                        {link.label}
                      </span>
                    )}
                    {link.badge && (
                      <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {link.badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} AI Report Generator. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted">
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              Privacy &amp; Terms
            </Link>
            <Link
              href="/help"
              className="transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
