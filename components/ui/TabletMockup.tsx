"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TabletMockupProps {
  videoSrc: string;
  style?: React.CSSProperties;
  className?: string;
}

export function TabletMockup({ videoSrc, style, className }: TabletMockupProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.5 }); // Play when 50% in view

  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play().catch((err) => console.log("Video auto-play prevented:", err));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView]);

  return (
    <motion.div
      ref={containerRef}
      style={style}
      className={`relative mx-auto rounded-[1rem] md:rounded-[2rem] border border-black/20 dark:border-white/10 bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-300 dark:from-zinc-700 dark:via-black dark:to-zinc-900 shadow-[0_0_100px_rgba(255,57,74,0.1)] overflow-hidden p-[2px] md:p-[4px] ${className || 'w-full aspect-[21/9]'}`}
    >
      {/* Glossy Bezel Highlights */}
      <div className="absolute inset-0 rounded-[1rem] md:rounded-[2rem] border-t border-black/10 dark:border-white/20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-black/5 dark:bg-white/10 blur-[2px] rounded-full pointer-events-none" />

      {/* Inner Screen */}
      <div className="relative w-full h-full bg-black rounded-[calc(1rem-2px)] md:rounded-[calc(2rem-4px)] overflow-hidden">
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] pointer-events-none z-10" />
        
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
        />
      </div>
    </motion.div>
  );
}
