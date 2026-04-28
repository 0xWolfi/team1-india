"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface AnimatedEventsSectionProps {
  children: React.ReactNode;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function AnimatedEventsSection({ children }: AnimatedEventsSectionProps) {
  const isDesktop = useIsDesktop();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  // Heading scale + fade (desktop only — mobile renders static)
  const headingScale = useTransform(scrollYProgress, [0, 1], [1, 0.45]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [0, 1, 1]);

  // Content fade + slide-in (desktop only)
  const contentOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.5, 1], [40, 0]);

  if (!isDesktop) {
    // Mobile: no scroll-driven animation. Plain heading + content.
    return (
      <div ref={containerRef} className="w-full relative overflow-x-clip">
        <div className="relative w-full flex justify-center mb-2 sm:mb-3">
          <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white text-center leading-none tracking-tighter whitespace-nowrap">
            Upcoming Events
          </h2>
        </div>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full relative overflow-x-clip">
      <div className="relative w-full flex justify-center mb-2 sm:mb-3">
        <motion.h2
          style={{ scale: headingScale, opacity: textOpacity }}
          className="text-[clamp(2rem,11.5vw,12rem)] font-black text-black dark:text-white text-center leading-none tracking-tighter whitespace-nowrap origin-center"
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
