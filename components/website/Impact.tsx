"use client";

import React, { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

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
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

const stats = [
  { value: 113, label: "Community Events", suffix: "+" },
  { value: 7, label: "Hackathons Hosted", suffix: "" },
  { value: 31, label: "Projects Building", suffix: "+" },
];

export function Impact() {
  return (
    <section id="impact" className="py-20 md:py-28 relative z-10 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">What We Have Done</h2>
          <p className="text-zinc-400 text-lg">Measurable impact across the entire ecosystem.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <div className="flex flex-col items-center text-center px-8 md:px-12">
                <div className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-3">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest">{stat.label}</p>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent shrink-0" />
              )}
              {i < stats.length - 1 && (
                <div className="md:hidden w-20 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
