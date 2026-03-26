"use client";

import React, { ReactNode, useRef } from "react";
import { motion, useInView } from "framer-motion";

export interface FeatureItem {
  title: string;
  desc: string;
  icon: ReactNode;
  colSpan?: string;
}

interface FeatureGridProps {
  items: FeatureItem[];
}

function FeatureCard({ item, index }: { item: FeatureItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={`group relative rounded-2xl p-6 md:p-8 transition-all duration-500 cursor-default
        bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]
        hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/20
        ${item.colSpan || ''}`}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:bg-white/[0.1] group-hover:border-white/[0.15] transition-all duration-300">
          {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, {
            className: "w-5 h-5 text-zinc-400 group-hover:text-white transition-colors duration-300"
          })}
        </div>

        <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-100 transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
          {item.desc}
        </p>
      </div>
    </motion.div>
  );
}

export function FeatureGrid({ items }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
      {items.map((item, idx) => (
        <FeatureCard key={idx} item={item} index={idx} />
      ))}
    </div>
  );
}
