"use client";

import React, { useRef, useEffect, useState } from "react";
import { useInView, motion } from "framer-motion";

function AnimatedCounter({ target, suffix = "", inView }: { target: number; suffix?: string; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }, [inView, target]);

  return (
    <span className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

const stats = [
  { value: 113, label: "Events", suffix: "+" },
  { value: 15, label: "Campus Connect", suffix: "+" },
  { value: 7, label: "Hackathons", suffix: "" },
  { value: 31, label: "Projects Building", suffix: "+" },
];

export function Impact() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isSectionInView = useInView(sectionRef, { once: true, margin: "-150px" });

  return (
    <section id="impact" className="py-20 md:py-28 relative z-10 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-black/[0.03] dark:bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-black dark:text-white tracking-tight">What We Have Done</h2>
        </div>

        <motion.div 
          ref={sectionRef}
          initial={{ scale: 0.85, opacity: 0, y: 40 }}
          animate={isSectionInView ? { scale: 1, opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-8 md:gap-0 max-w-5xl mx-auto"
        >
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <div className="flex flex-col items-center text-center px-2 sm:px-4 md:px-8">
                <div className="text-4xl sm:text-5xl md:text-7xl font-bold text-black dark:text-white tracking-tight mb-3">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={isSectionInView} />
                </div>
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest">{stat.label}</p>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-black/10 dark:via-white/10 to-transparent shrink-0" />
              )}
              {i < stats.length - 1 && (
                <div className="md:hidden w-20 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
