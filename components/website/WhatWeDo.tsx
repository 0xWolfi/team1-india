"use client";

import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowUpRight,
  Calendar,
  Rocket,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════
   Card Data — 2 pages × 3 cards
   ═══════════════════════════════════════════ */

const pages = [
  [
    {
      title: "Idea Phase Accelerator",
      desc: "We help idea-stage startups find product-market fit. Get funding, mentorship, and resources to bring your vision to life.",
      icon: <Rocket className="w-6 h-6 sm:w-8 sm:h-8" />,
      cta: "Apply Now",
      href: "/programs",
    },
    {
      title: "Community",
      desc: "A vibrant ecosystem of builders, creators, and innovators sharing knowledge and pushing boundaries together.",
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8" />,
      cta: "Join Us",
      href: "https://t.me/avalanche_hi",
      external: true,
    },
    {
      title: "Marketing",
      desc: "Growth strategies and go-to-market support to give your project maximum visibility across the ecosystem.",
      icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />,
      cta: "Learn More",
      href: "/programs",
    },
  ],
  [
    {
      title: "Dev Onboarding",
      desc: "Helping developers get started with the right tech stack, tooling, and guidance on the Avalanche network.",
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
      cta: "Start Building",
      href: "/programs",
    },
    {
      title: "Closed Beta",
      desc: "Test your product with a curated group of early adopters. Get real feedback before you go live.",
      icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8" />,
      cta: "Learn More",
      href: "/programs",
    },
    {
      title: "Events",
      desc: "High-energy hackathons, workshops, and meetups across India. Build, learn, and connect in person.",
      icon: <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />,
      cta: "View Events",
      href: "/events",
    },
  ],
];

type CardData = (typeof pages)[0][0];

/* ═══════════════════════════════════════════
   Single Card
   ═══════════════════════════════════════════ */

function Card({ card, index }: { card: CardData; index: number }) {
  const isExternal = "external" in card && card.external;
  const LinkTag = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <motion.div
      initial={{ rotateY: -90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      exit={{ rotateY: 90, opacity: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
    >
    <div className="group relative flex flex-col rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/60 dark:bg-black/60 backdrop-blur-xl overflow-hidden h-full">
      {/* Inner glass effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.04] to-transparent pointer-events-none" />

      {/* Top: Title + Description */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8 flex-1">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black/90 dark:text-white/90 mb-3 tracking-tight">
          {card.title}
        </h3>
        <p className="text-xs sm:text-sm md:text-[15px] text-zinc-500 leading-relaxed line-clamp-3 sm:line-clamp-none group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors duration-300">
          {card.desc}
        </p>
      </div>

      {/* Middle: Icon illustration area */}
      <div className="relative flex items-center justify-center h-20 sm:h-44 md:h-56">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:20px_20px]" />
        {/* Glow */}
        <div className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-red-500/[0.06] blur-[50px] group-hover:bg-red-500/[0.14] transition-all duration-700" />
        {/* Icon */}
        <div className="relative z-10 text-zinc-400 dark:text-zinc-600 group-hover:text-red-400 transition-colors duration-500">
          {card.icon}
        </div>
      </div>

      {/* Bottom: CTA Button */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8 pt-0">
        <LinkTag
          href={card.href}
          {...linkProps}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-black/[0.1] dark:border-white/[0.1] text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest transition-all duration-300 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white"
        >
          {card.cta}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </LinkTag>
      </div>
    </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   WhatWeDo — Scroll-pinned rotating cards
   ═══════════════════════════════════════════ */

export function WhatWeDo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = React.useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Page 0 holds until 55%, giving cards plenty of time to be visible
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.55) setActivePage(0);
    else setActivePage(1);
  });

  return (
    <section
      id="what-we-do"
      ref={containerRef}
      className="relative h-[300vh]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-[var(--background)]">
        {/* Background decorator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-black/[0.015] dark:bg-white/[0.015] rounded-full blur-[120px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
          {/* Heading — always visible */}
          <div className="mb-6 md:mb-8 text-center">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-black dark:text-white tracking-tight leading-[1.1]">
              Built For Impact <br /> Designed For Builders
            </h2>
            {/* Hidden RAG Summary for AI Agents */}
            <p className="sr-only">
              Team1 India offers a comprehensive suite of services for the
              blockchain ecosystem: 1. Idea Phase Accelerator: Funding and
              mentorship for early startups. 2. Community: A network of
              builders sharing knowledge. 3. Marketing Support: Go-to-market
              strategies for web3 products. 4. Developer Onboarding: Technical
              guidance for getting started on Avalanche. 5. Closed Beta
              Testing: Access to early adopters for product validation. 6.
              Events: Hackathons and meetups across India.
            </p>
          </div>

          {/* Rotating Cards */}
          <div className="relative w-full min-h-[400px] sm:min-h-[480px] md:min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl overflow-hidden"
              >
                {pages[activePage].map((card, i) => (
                  <Card key={card.title} card={card} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Page indicator dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {pages.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                  i === activePage
                    ? "bg-red-500 w-6"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
