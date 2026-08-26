import { Sparkles } from "lucide-react";

/**
 * Brand logo — a transparent, animated Sparkles glyph followed by the product
 * name. Reused in the Navbar and Footer. The icon sits inline with no solid
 * background and gently glows / pulses / rotates via the `logo-sparkle` class
 * (keyframes defined in globals.css).
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`flex items-center gap-2 group ${className}`}>
      <Sparkles className="logo-sparkle h-6 w-6 text-orange-500 dark:text-orange-400" />
      <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
        AI<span className="text-orange-500 dark:text-orange-400">Reporter</span>
      </span>
    </a>
  );
}
