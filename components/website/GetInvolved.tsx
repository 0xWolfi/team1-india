"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function GetInvolved() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="involved" className="py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 flex justify-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-5xl w-full relative rounded-3xl overflow-hidden"
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-black/10 dark:from-white/10 via-black/5 dark:via-white/5 to-transparent p-px">
            <div className="w-full h-full rounded-3xl bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl" />
          </div>

          <div className="relative z-10 p-8 md:p-16 text-center">
            <h2 className="text-5xl md:text-7xl font-bold text-black dark:text-white mb-6 tracking-tight">
              Ready to Make an Impact?
            </h2>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join a community of builders, innovators, and change-makers. Whether you are a student, professional, or partner, there is a place for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/public"
                className="group px-8 py-4 bg-black dark:bg-white text-white dark:text-black text-base font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Guidebook
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="mailto:hello@team1india.com"
                className="group px-8 py-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base font-bold rounded-xl hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all w-full sm:w-auto"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
