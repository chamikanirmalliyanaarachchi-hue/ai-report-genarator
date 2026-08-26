import { Github, Twitter, Linkedin, Youtube } from "lucide-react";
import Logo from "./Logo";

// Footer column definitions keep the layout data-driven and tidy
const COLUMNS = [
  {
    title: "Product",
    links: ["Features", "How it Works", "Pricing", "Changelog", "Integrations"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Press", "Contact"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Help Center", "Community", "Status"],
  },
];

const SOCIALS = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 px-4 py-16 sm:px-6 lg:px-8 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand + tagline + socials */}
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted">
              Turn PDF or CSV files into professional business reports, economy
              analysis, charts, and actionable insights with AI.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
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
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted transition-colors hover:text-zinc-900 dark:hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} AI Report Generator. All rights
            reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted">
            <a href="#" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
