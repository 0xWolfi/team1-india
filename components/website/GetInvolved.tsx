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
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent p-px">
            <div className="w-full h-full rounded-3xl bg-zinc-950/80 backdrop-blur-xl" />
          </div>

          <div className="relative z-10 p-8 md:p-16 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Ready to Make an Impact?
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join a community of builders, innovators, and change-makers. Whether you are a student, professional, or partner, there is a place for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/public"
                className="group px-8 py-4 bg-white text-black text-base font-bold rounded-xl hover:bg-zinc-200 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Guidebook
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="mailto:hello@team1india.com"
                className="group px-8 py-4 bg-white/5 border border-white/10 text-white text-base font-bold rounded-xl hover:bg-white/10 hover:border-white/20 transition-all w-full sm:w-auto"
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
