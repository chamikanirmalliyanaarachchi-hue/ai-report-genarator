"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Animated light / dark mode toggle switch.
 * Uses next-themes under the hood; renders a sliding knob inside a pill.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — theme is only known on the client
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-9 w-16 items-center rounded-full border border-zinc-200 bg-zinc-100 px-1 transition-colors dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md transition-transform duration-300 ${
          mounted && isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {mounted && isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </span>
    </button>
  );
}
