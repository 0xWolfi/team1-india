"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  MotionValue,
} from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Send, ArrowRight, Calendar, School, Trophy, Rocket } from "lucide-react";
import { TabletMockup } from "@/components/ui/TabletMockup";

/* ═══════════════════════════════════════════
   Data
   ═══════════════════════════════════════════ */

const impactStats = [
  { value: 113, label: "Events", suffix: "+", icon: <Calendar className="w-7 h-7" /> },
  { value: 15, label: "Campuses", suffix: "+", icon: <School className="w-7 h-7" /> },
  { value: 7, label: "Hackathons", suffix: "", icon: <Trophy className="w-7 h-7" /> },
  { value: 31, label: "Projects Building", suffix: "+", icon: <Rocket className="w-7 h-7" /> },
];

const socials = [
  { href: "https://x.com/Team1IND", label: "X", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
  { href: "https://instagram.com/team1india", label: "Instagram", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg> },
  { href: "https://www.linkedin.com/company/avaxteam1", label: "LinkedIn", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg> },
  { href: "https://t.me/avalanche_hi", label: "Telegram", icon: <Send className="w-4 h-4" /> },
];

/* ═══════════════════════════════════════════
   AnimatedCounter
   ═══════════════════════════════════════════ */

function AnimatedCounter({
  target,
  suffix = "",
  progress,
  range,
}: {
  target: number;
  suffix?: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const [display, setDisplay] = useState("0" + suffix);
  const value = useTransform(progress, range, [0, target]);

  useMotionValueEvent(value, "change", (v) => {
    setDisplay(Math.round(v) + suffix);
  });

  return <span className="tabular-nums">{display}</span>;
}

/* ═══════════════════════════════════════════
   StatCard
   ═══════════════════════════════════════════ */

function StatCard({
  stat,
  glow,
  progress,
  counterRange,
}: {
  stat: (typeof impactStats)[0];
  glow: MotionValue<number>;
  progress: MotionValue<number>;
  counterRange: [number, number];
}) {
  const bg = useTransform(glow, [0, 1], ["rgba(24,24,27,0.4)", "rgba(69,10,10,0.8)"]);
  const border = useTransform(glow, [0, 1], ["rgba(255,255,255,0.05)", "rgba(239,68,68,0.3)"]);
  const boxSh = useTransform(glow, [0, 1], ["0 0 0px rgba(0,0,0,0)", "0 0 40px rgba(255,57,74,0.15)"]);
  const iconC = useTransform(glow, [0, 1], ["rgba(113,113,122,1)", "rgba(252,165,165,1)"]);
  const numC = useTransform(glow, [0, 1], ["rgba(255,255,255,1)", "rgba(248,113,113,1)"]);
  const txtC = useTransform(glow, [0, 1], ["rgba(161,161,170,1)", "rgba(254,202,202,0.9)"]);

  return (
    <motion.div
      style={{ backgroundColor: bg, borderColor: border, boxShadow: boxSh }}
      className="relative flex flex-col justify-between p-6 md:p-8 lg:p-10 min-h-[280px] lg:min-h-[360px] xl:min-h-[400px] rounded-3xl overflow-hidden border"
    >
      <div className="absolute inset-y-0 right-0 left-1/4 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:16px_24px] [mask-image:linear-gradient(to_right,transparent_0%,black_100%)]" />

      <div className="relative z-10">
        <motion.div style={{ color: iconC }}>
          {stat.icon}
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col mt-auto text-left gap-1">
        <motion.div
          style={{ color: numC }}
          className="text-6xl sm:text-7xl lg:text-[6rem] xl:text-[7rem] font-bold tracking-tighter leading-none mb-2"
        >
          <AnimatedCounter target={stat.value} suffix={stat.suffix} progress={progress} range={counterRange} />
        </motion.div>
        <motion.p
          style={{ color: txtC }}
          className="text-sm lg:text-base font-medium leading-snug max-w-[160px] sm:self-auto self-end text-right sm:text-left"
        >
          {stat.label}
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   HeroBackground — canvas
   ═══════════════════════════════════════════ */

function HeroBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const resize = () => {
      const d = window.devicePixelRatio || 1;
      c.width = c.offsetWidth * d;
      c.height = c.offsetHeight * d;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(d, d);
    };
    resize();
    window.addEventListener("resize", resize);

    const orbs = [
      { x: 0.3, y: 0.2, r: 350, col: "rgba(255,57,74,0.08)", s: 0.3, p: 0 },
      { x: 0.7, y: 0.6, r: 300, col: "rgba(255,57,74,0.06)", s: 0.4, p: 2 },
      { x: 0.5, y: 0.8, r: 400, col: "rgba(200,20,40,0.05)", s: 0.2, p: 4 },
      { x: 0.15, y: 0.7, r: 250, col: "rgba(255,100,110,0.04)", s: 0.5, p: 1 },
      { x: 0.85, y: 0.3, r: 280, col: "rgba(255,57,74,0.05)", s: 0.3, p: 3 },
    ];

    const pts: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    for (let i = 0; i < 45; i++) {
      pts.push({
        x: Math.random() * c.offsetWidth, y: Math.random() * c.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.3 + 0.1,
      });
    }

    let t = 0;
    const loop = () => {
      const w = c.offsetWidth, h = c.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const o of orbs) {
        const ox = w * (o.x + Math.sin(t * o.s * 0.001 + o.p) * 0.05);
        const oy = h * (o.y + Math.cos(t * o.s * 0.0008 + o.p) * 0.05);
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        g.addColorStop(0, o.col); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,57,74,${p.a})`; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(255,57,74,${0.06 * (1 - d / 120)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      t++; raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

/* ═══════════════════════════════════════════
   GridOverlay
   ═══════════════════════════════════════════ */

function GridOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.5) 80px)" }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.5) 80px)" }} />
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(255,57,74,0.15), transparent)" }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   HeroScroll
   ═══════════════════════════════════════════ */

export const HeroScroll = () => {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [interactive, setInteractive] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => setInteractive(v > 0.82));

  /* Phase 1: Hero (0.00 → 0.14) */
  const heroOpacity = useTransform(scrollYProgress, [0.06, 0.14], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0.06, 0.14], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0.06, 0.14], [0, -40]);

  /* Phase 2: Tablet (0.14 → 0.56) */
  const tabletOpacity = useTransform(scrollYProgress, [0.14, 0.20, 0.50, 0.56], [0, 1, 1, 0]);
  const tabletY = useTransform(scrollYProgress, [0.14, 0.24, 0.48, 0.56], [600, 0, 0, -600]);
  const tabletScale = useTransform(scrollYProgress, [0.14, 0.24, 0.48, 0.56], [0.85, 1, 1, 0.9]);
  const tabletRotate = useTransform(scrollYProgress, [0.14, 0.24], [12, 0]);

  /* Phase 3: Stats (0.54 → 0.98) */
  const headingOpacity = useTransform(scrollYProgress, [0.54, 0.60], [0, 1]);
  const headingScale = useTransform(scrollYProgress, [0.54, 0.60], [0.8, 1]);
  const headingY = useTransform(scrollYProgress, [0.54, 0.60], [30, 0]);
  const statsOpacity = useTransform(scrollYProgress, [0.58, 0.66], [0, 1]);
  const statsScale = useTransform(scrollYProgress, [0.58, 0.66], [0.9, 1]);
  const statsY = useTransform(scrollYProgress, [0.58, 0.66], [40, 0]);

  const counterRange: [number, number] = [0.58, 0.72];

  /* Card glows */
  const glow0 = useTransform(scrollYProgress, [0.72, 0.76, 0.80], [0, 1, 0]);
  const glow1 = useTransform(scrollYProgress, [0.76, 0.80, 0.84], [0, 1, 0]);
  const glow2 = useTransform(scrollYProgress, [0.80, 0.84, 0.88], [0, 1, 0]);
  const glow3 = useTransform(scrollYProgress, [0.84, 0.88, 0.92], [0, 1, 0]);
  const glows = [glow0, glow1, glow2, glow3];

  return (
    <header id="hero" ref={containerRef} className="relative h-[800vh]" role="banner">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/* Background layers */}
        <div className="absolute inset-0 bg-black" />
        <HeroBackground />
        <GridOverlay />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />

        {/* ═══ Phase 1: Hero ═══ */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Mandala */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              transition={{
                opacity: { duration: 2, delay: 0.3 },
                scale: { duration: 2, delay: 0.3 },
                rotate: { duration: 120, repeat: Infinity, ease: "linear" },
              }}
              className="w-[90vw] h-[90vw] sm:w-[80vw] sm:h-[80vw] md:w-[70vw] md:h-[70vw] lg:w-[60vw] lg:h-[60vw] max-w-[900px] max-h-[900px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mandala.svg" alt="" className="w-full h-full opacity-[0.12]" />
            </motion.div>
            <div className="absolute w-[40%] h-[40%] bg-red-500/[0.04] rounded-full blur-[120px]" />
          </div>

          {/* Hero text */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto w-full pointer-events-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-10">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Avalanche Ecosystem
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
              <div className="relative h-8 w-[14rem] sm:h-12 sm:w-[20rem] md:h-14 md:w-[28rem] lg:h-[4.5rem] lg:w-[34rem]">
                <Image src="/team1-horizontal.svg" alt="Team1 India" fill className="object-contain" sizes="700px" priority />
              </div>
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-lg md:text-xl lg:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12 text-balance">
              The premier builder community and accelerator for the{" "}
              <strong className="text-zinc-200">Avalanche Ecosystem</strong> in India.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-col sm:flex-row items-center gap-4 mb-10">
              <Link href="/public" className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-black font-semibold text-base transition-all duration-300 hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-[1.02]">
                Explore
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a href="https://t.me/avalanche_hi" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 rounded-xl bg-white/8 border border-white/12 text-white font-semibold text-base transition-all duration-300 hover:bg-red-500 hover:border-red-500 hover:scale-[1.02]">
                Join Us
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="flex items-center gap-1">
              {socials.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="p-2.5 text-zinc-600 hover:text-red-400 transition-colors duration-200" aria-label={s.label}>{s.icon}</a>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* ═══ Phase 2: Tablet ═══ */}
        <motion.div
          style={{ opacity: tabletOpacity, y: tabletY, scale: tabletScale }}
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-4 md:px-8"
        >
          <div className="w-full max-w-[1400px] pointer-events-auto" style={{ perspective: "1200px" }}>
            <motion.div style={{ rotateX: tabletRotate }} className="origin-bottom">
              <TabletMockup videoSrc="/hero-video.mp4" className="w-full aspect-[21/9]" />
            </motion.div>
          </div>
        </motion.div>

        {/* ═══ Phase 3: Stats ═══ */}
        <motion.div
          style={{ opacity: statsOpacity }}
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center px-6 bg-black ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          <div className="w-full max-w-7xl mx-auto">
            <motion.div style={{ opacity: headingOpacity, scale: headingScale, y: headingY }} className="mb-12 lg:mb-16 text-center">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                What We Have Done
              </h2>
            </motion.div>
            <motion.div
              style={{ scale: statsScale, y: statsY }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 xl:gap-6 w-full"
            >
              {impactStats.map((stat, i) => (
                <StatCard key={stat.label} stat={stat} glow={glows[i]} progress={scrollYProgress} counterRange={counterRange} />
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
      </div>
    </header>
  );
};
