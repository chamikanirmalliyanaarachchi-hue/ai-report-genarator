"use client";

import { motion } from "framer-motion";

/**
 * Shared section header used by HowItWorks, Testimonials, Tools and FAQ.
 * Renders a small eyebrow label, a title and an optional subtitle.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-strong sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-muted">{subtitle}</p>
      )}
    </motion.div>
  );
}
