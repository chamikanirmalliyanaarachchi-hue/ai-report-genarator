"use client";

import { useTheme } from "next-themes";

/**
 * Global animated ambient background.
 *
 * A solid canvas (slate-50 in light / zinc-950 in dark) with a sparse field of
 * soft orange/amber micro-particles and a few larger orbs that gently FLOAT
 * across the screen. A heavy frosted `backdrop-blur-2xl` layer sits directly
 * on top of the moving particles, turning them into dreamy, drifting bokeh
 * lights. The same effect is used in both themes.
 */
const PARTICLES = [
  { top: "12%", left: "8%", size: 7, color: "bg-orange-400", dur: "17s", delay: "0s" },
  { top: "20%", left: "22%", size: 4, color: "bg-orange-500", dur: "21s", delay: "-4s" },
  { top: "10%", left: "38%", size: 6, color: "bg-amber-400", dur: "15s", delay: "-8s" },
  { top: "30%", left: "14%", size: 11, color: "bg-orange-400", dur: "24s", delay: "-2s" },
  { top: "16%", left: "60%", size: 8, color: "bg-orange-500", dur: "19s", delay: "-11s" },
  { top: "26%", left: "78%", size: 5, color: "bg-amber-400", dur: "22s", delay: "-6s" },
  { top: "14%", left: "88%", size: 10, color: "bg-orange-400", dur: "18s", delay: "-3s" },
  { top: "42%", left: "46%", size: 6, color: "bg-orange-500", dur: "20s", delay: "-9s" },
  { top: "48%", left: "28%", size: 9, color: "bg-amber-400", dur: "25s", delay: "-1s" },
  { top: "38%", left: "70%", size: 7, color: "bg-orange-400", dur: "16s", delay: "-7s" },
  { top: "60%", left: "84%", size: 8, color: "bg-orange-500", dur: "23s", delay: "-5s" },
  { top: "55%", left: "10%", size: 5, color: "bg-amber-400", dur: "19s", delay: "-10s" },
  { top: "70%", left: "54%", size: 7, color: "bg-orange-400", dur: "21s", delay: "-12s" },
  { top: "78%", left: "34%", size: 6, color: "bg-orange-500", dur: "17s", delay: "-4s" },
  { top: "84%", left: "74%", size: 9, color: "bg-amber-400", dur: "24s", delay: "-8s" },
];

const ORBS = [
  { top: "18%", left: "12%", size: "16rem", color: "bg-orange-500/25", dur: "30s", delay: "0s" },
  { top: "34%", left: "66%", size: "20rem", color: "bg-amber-500/20", dur: "36s", delay: "-10s" },
  { top: "60%", left: "40%", size: "14rem", color: "bg-orange-400/20", dur: "32s", delay: "-18s" },
];

export default function Background() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Solid canvas */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-zinc-950" />

      {/* Large soft bokeh orbs (slow drift) */}
      {ORBS.map((o, i) => (
        <div
          key={`orb-${i}`}
          className={`absolute rounded-full ${o.color} blur-3xl animate-float-slow`}
          style={{
            top: o.top,
            left: o.left,
            width: o.size,
            height: o.size,
            animationDuration: o.dur,
            animationDelay: o.delay,
          }}
        />
      ))}

      {/* Sparse orange/amber micro-particles (gentle float) */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${p.color} opacity-80 blur-[1px] shadow-[0_0_26px_8px_rgba(251,146,60,0.4)] animate-float`}
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Heavy frosted blur layer ON TOP of the moving particles -> drifting bokeh */}
      <div className="absolute inset-0 backdrop-blur-2xl" />

      {/* Very faint orange ambient wash for cohesion (theme-agnostic) */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_30%,rgba(251,146,60,0.07),transparent_70%)]" />
    </div>
  );
}
