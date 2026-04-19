"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Globe,
  HeartHandshake,
  Rocket,
  Trophy,
  Users,
  ArrowUpRight,
} from "lucide-react";

/* ═══════════════════════════════════════════
   Program Data
   ═══════════════════════════════════════════ */

const programs = [
  {
    title: "Student Lead",
    desc: "Lead the tech revolution at your campus. Organize events, build communities, and empower peers.",
    icon: Users,
    image: "/campus-card.jpg",
  },
  {
    title: "Open Fellowship",
    desc: "3-month remote fellowship for top builders to work on high-impact open source projects.",
    icon: Code2,
    image: "/projects-card.jpg",
  },
  {
    title: "Startup Incubator",
    desc: "For idea-stage founders. We provide credits, mentorship, and a network to launch.",
    icon: Rocket,
    image: "/hackathons-card.jpg",
  },
  {
    title: "Hackathon League",
    desc: "Compete in our national hackathon circuit. Win prizes and get recognized.",
    icon: Trophy,
    image: "/hackathon-card.jpg",
  },
  {
    title: "Mentorship",
    desc: "1:1 guidance from industry veterans to help you navigate your career path.",
    icon: HeartHandshake,
    image: "/events-card.jpg",
  },
  {
    title: "City Chapters",
    desc: "Join local chapters in your city. Meetups, workshops, and networking events.",
    icon: Globe,
    image: "/hero-cover.jpg",
  },
];

/* ═══════════════════════════════════════════
   ProgramRow — full-width row with cursor image
   ═══════════════════════════════════════════ */

function ProgramRow({
  step,
  index,
  onHover,
  onLeave,
  onMouseMove,
}: {
  step: (typeof programs)[0];
  index: number;
  onHover: (index: number, e: React.MouseEvent) => void;
  onLeave: () => void;
  onMouseMove: (e: React.MouseEvent) => void;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={(e) => onHover(index, e)}
      onMouseLeave={onLeave}
      onMouseMove={onMouseMove}
      className="group relative cursor-default"
    >
      {/* Divider line on top (except first) */}
      {index > 0 && (
        <div className="absolute top-0 left-0 right-0 h-px bg-black/8 dark:bg-white/8" />
      )}

      <div className="relative py-6 md:py-8 px-2 md:px-4 flex items-center gap-4 md:gap-6 transition-all duration-300 group-hover:px-6 md:group-hover:px-8">
        {/* Icon */}
        <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-center shrink-0 transition-all duration-500 group-hover:bg-red-500/10 group-hover:border-red-500/20 group-hover:text-red-500 text-zinc-400 dark:text-zinc-600">
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-black dark:text-white tracking-tight transition-colors duration-300 group-hover:text-red-500">
            {step.title}
          </h3>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-500 leading-relaxed mt-1 max-w-2xl transition-colors duration-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-400">
            {step.desc}
          </p>
        </div>

        {/* Arrow */}
        <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border border-black/8 dark:border-white/8 flex items-center justify-center text-zinc-400 dark:text-zinc-600 transition-all duration-300 group-hover:border-red-500/30 group-hover:text-red-500 group-hover:bg-red-500/5 group-hover:scale-110">
          <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* Bottom divider for last item */}
      {index === programs.length - 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-black/8 dark:bg-white/8" />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Cursor Image — follows mouse on hover
   ═══════════════════════════════════════════ */

function CursorImage({
  activeIndex,
  position,
  visible,
  containerRef,
}: {
  activeIndex: number;
  position: { x: number; y: number };
  visible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Position image just left of the arrow button
  const getTargetX = () => {
    if (!containerRef.current) return position.x;
    const rect = containerRef.current.getBoundingClientRect();
    // arrow is ~56px from right edge, image sits just left of it
    return rect.right - 56 - 220;
  };

  return (
    <AnimatePresence>
      {visible && activeIndex >= 0 && (
        <motion.div
          className="fixed pointer-events-none z-50 hidden lg:block"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: getTargetX(),
            y: position.y - 90,
          }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
            x: { duration: 0.3, ease: "easeOut" },
            y: { duration: 0.15, ease: "easeOut" },
          }}
          style={{ top: 0, left: 0 }}
        >
          <div className="w-52 xl:w-60 aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/40">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIndex}
                src={programs[activeIndex].image}
                alt=""
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   Programs — Main Export
   ═══════════════════════════════════════════ */

export function Programs() {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!hasMouseMoved) setHasMouseMoved(true);
  }, [hasMouseMoved]);

  const handleHover = useCallback((index: number, e: React.MouseEvent) => {
    // Capture position immediately on enter so image doesn't flash at (0,0)
    setMousePos({ x: e.clientX, y: e.clientY });
    setHasMouseMoved(true);
    setHoveredIndex(index);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredIndex(-1);
  }, []);

  return (
    <section className="py-10 md:py-16 bg-[var(--background)]" ref={containerRef}>
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        {/* Heading */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold text-black dark:text-white tracking-tight uppercase leading-[1.1]">
            PROGRAMS DESIGNED FOR
            <br />
            EVERY STAGE OF YOUR JOURNEY
          </h2>
          <p className="sr-only">
            Our accelerator offers specific tracks for different stages:
            Student Leads, Open Fellowship, Startup Incubator, Hackathon
            League, Mentorship, and City Chapters across major Indian cities.
          </p>
        </div>

        {/* Program list */}
        <div className="relative">
          {programs.map((step, i) => (
            <ProgramRow
              key={step.title}
              step={step}
              index={i}
              onHover={handleHover}
              onLeave={handleLeave}
              onMouseMove={handleMouseMove}
            />
          ))}
        </div>
      </div>

      {/* Floating cursor image (desktop only) */}
      <CursorImage
        activeIndex={hoveredIndex}
        position={mousePos}
        visible={hoveredIndex >= 0 && hasMouseMoved}
        containerRef={containerRef}
      />
    </section>
  );
}
