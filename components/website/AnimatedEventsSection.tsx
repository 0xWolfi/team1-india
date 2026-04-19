"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface AnimatedEventsSectionProps {
  children: React.ReactNode;
}

export function AnimatedEventsSection({ children }: AnimatedEventsSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  // Scale from a massive size (e.g. 5x) down to 1x as it scrolls into the center of the viewport
  const scale = useTransform(scrollYProgress, [0, 1], [5, 1]);
  // Fade in the text itself
  const textOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [0, 1, 1]);

  // The rest of the content (grid, filters) fades in AFTER scrollYProgress hits 0.5
  const contentOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.5, 1], [40, 0]);

  return (
    <div ref={containerRef} className="w-full relative overflow-x-clip">
      <div className="relative w-full flex justify-start mb-2 sm:mb-3">
        <motion.h2
          style={{
            scale: useTransform(scrollYProgress, [0, 1], [1, 0.45]),
            opacity: textOpacity
          }}
          className="text-[clamp(2rem,11.5vw,12rem)] font-black text-black dark:text-white text-left leading-none tracking-tighter whitespace-nowrap origin-left uppercase"
        >
          Upcoming Events
        </motion.h2>
      </div>

      <motion.div style={{ opacity: contentOpacity, y: contentY }}>
        {children}
      </motion.div>
    </div>
  );
}
