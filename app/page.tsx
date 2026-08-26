"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/components/AppProvider";
import Navbar from "@/components/Navbar";
import Background from "@/components/Background";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import OtherTools from "@/components/OtherTools";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const { showDashboard } = useApp();

  return (
    <AnimatePresence mode="wait">
      {showDashboard ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Dashboard />
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <main id="top" className="relative min-h-screen overflow-x-hidden">
            {/* Clean, minimal ambient background behind all content */}
            <Background />
            <Navbar />
            <Hero />
            <HowItWorks />
            <Testimonials />
            <OtherTools />
            <FAQ />
            <Footer />
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
