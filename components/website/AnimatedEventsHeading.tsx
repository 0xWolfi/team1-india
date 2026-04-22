"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function AnimatedEventsHeading() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  // Scale from a massive size (e.g. 5x) down to 1x as it scrolls into the center of the viewport
  const scale = useTransform(scrollYProgress, [0, 1], [5, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.8, 1], [0, 1, 1]);

  return (
    <div ref={containerRef} className="relative w-full flex justify-center mb-12">
      <motion.h2
        style={{ scale, opacity }}
        className="text-4xl md:text-6xl font-bold text-black dark:text-white text-center tracking-tight whitespace-nowrap origin-center"
      >
        Upcoming Events
      </motion.h2>
    </div>
  );
}
