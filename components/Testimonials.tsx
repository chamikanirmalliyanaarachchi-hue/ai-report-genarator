"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  DollarSign,
  ShoppingCart,
  FlaskConical,
  Megaphone,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import SectionHeading from "./SectionHeading";

/**
 * Example use cases — shown instead of customer testimonials so the page stays
 * honest. These illustrate the kinds of work the tool is built for; they are not
 * claims about specific customers.
 */
const USE_CASES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: LineChart,
    title: "Business Analytics",
    description:
      "Turn operational spreadsheets into clear performance narratives for leadership reviews.",
  },
  {
    icon: ShoppingCart,
    title: "Sales Reports",
    description:
      "Summarize pipelines, win rates and quotas into stakeholder-ready decks in minutes.",
  },
  {
    icon: DollarSign,
    title: "Financial Analysis",
    description:
      "Parse statements and forecasts to surface trends, risks and margins automatically.",
  },
  {
    icon: FlaskConical,
    title: "Research Data",
    description:
      "Convert experiment results and survey data into structured, citable summaries.",
  },
  {
    icon: Megaphone,
    title: "Marketing Reports",
    description:
      "Consolidate campaign metrics into insights on what to scale and what to cut.",
  },
  {
    icon: GraduationCap,
    title: "Academic Projects",
    description:
      "Build literature reviews and data write-ups that are clear, formatted and on-time.",
  },
];

export default function Testimonials() {
  return (
    <section
      id="use-cases"
      className="scroll-mt-24 px-4 py-28 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Example Use Cases"
          title="Built for teams that need faster reporting"
          subtitle="A practical AI assistant for turning raw data into clear, shareable reports across domains."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map(({ icon: Icon, title, description }, i) => (
            <motion.figure
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.12 }}
              className="card flex flex-col gap-4 p-6 transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30">
                <Icon className="h-6 w-6 text-white" />
              </span>
              <h3 className="text-lg font-semibold text-strong">{title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-muted">
                {description}
              </p>
            </motion.figure>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          Illustrative examples of how the tool can be used — not endorsements.
        </p>
      </div>
    </section>
  );
}
