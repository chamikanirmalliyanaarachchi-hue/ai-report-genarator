"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import SectionHeading from "./SectionHeading";

// Avatar initials + color so we avoid external image dependencies
const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "Head of Finance, Northwind",
    initials: "SM",
    color: "from-orange-500 to-orange-600",
    quote:
      "We used to spend two full days building the monthly board deck. With AI Report Generator it's done in minutes, and the charts look better than anything we produced manually.",
    rating: 5,
  },
  {
    name: "David Okafor",
    role: "Startup Founder",
    initials: "DO",
    color: "from-orange-500 to-amber-500",
    quote:
      "I uploaded a messy CSV of our Q2 metrics and got a clean, investor-ready report before my coffee got cold. Genuinely saved me 10+ hours.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Market Analyst",
    initials: "PS",
    color: "from-amber-500 to-orange-500",
    quote:
      "The economy analysis feature is uncanny. It spotted a seasonal trend our team missed and the export to Word made sharing effortless.",
    rating: 5,
  },
  {
    name: "Liam Chen",
    role: "Operations Lead",
    initials: "LC",
    color: "from-orange-500 to-orange-600",
    quote:
      "Our ops reports used to be a nightmare of copy-paste. Now it's drag, drop, done. The insights are actually actionable, not just pretty graphs.",
    rating: 4,
  },
  {
    name: "Ana Ribeiro",
    role: "Consultant",
    initials: "AR",
    color: "from-orange-500 to-amber-500",
    quote:
      "I bill clients for speed and quality. This tool delivers both. My deliverables look like they came from a premium analytics agency.",
    rating: 5,
  },
  {
    name: "Marcus Webb",
    role: "CFO, BrightLog",
    initials: "MW",
    color: "from-amber-500 to-orange-500",
    quote:
      "Security was my main concern with client data, but the encryption and no-retention policy gave our compliance team peace of mind.",
    rating: 5,
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-orange-500 text-orange-500"
              : "fill-zinc-200 text-zinc-200 dark:fill-white/10 dark:text-white/10"
          }`}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-24 px-4 py-28 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by data-driven teams"
          subtitle="See how professionals are saving hours every week with AI-generated reports."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.12 }}
              className="card flex flex-col gap-4 p-6 transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10"
            >
              <Stars rating={t.rating} />
              <blockquote className="flex-1 text-sm leading-relaxed text-muted">
                “{t.quote}”
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${t.color} text-sm font-semibold text-white`}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-strong">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
