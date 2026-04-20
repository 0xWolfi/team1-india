"use client";

import { useEffect, useRef, useState } from "react";
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
import { useTheme } from "next-themes";

/* ═══════════════════════════════════════════
   Data
   ═══════════════════════════════════════════ */

const impactStats = [
  { value: 113, label: "Events", suffix: "+", icon: <Calendar className="w-7 h-7" />, image: "/events-card.jpg" },
  { value: 15, label: "Campuses", suffix: "+", icon: <School className="w-7 h-7" />, image: "/campus-card.jpg" },
  { value: 7, label: "Hackathons", suffix: "", icon: <Trophy className="w-7 h-7" />, image: "/hackathons-card.jpg" },
  { value: 31, label: "Projects Building", suffix: "+", icon: <Rocket className="w-7 h-7" />, image: "/projects-card.jpg" },
];

const socials = [
  { href: "https://x.com/Team1IND", label: "X", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
  { href: "https://instagram.com/team1india", label: "Instagram", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg> },
  { href: "https://www.linkedin.com/company/avaxteam1", label: "LinkedIn", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg> },
  { href: "https://t.me/avalanche_hi", label: "Telegram", icon: <Send className="w-4 h-4" /> },
];

const storyText =
  "Team1 India started in 2024 with 4 members and has grown to 25+ members today. Over the last 2 years, we have reached 25,000+ people across artists, engineers, marketers, gamers, and traders. Our goal is simple. Bring people in, help them do their best work, and build on Avalanche. We are not looking for the best people. We help you become your best. You learn, you build, and you grow. If you are serious about building, this is for you.";
const storyWords = storyText.split(" ");

/* ═══════════════════════════════════════════
   AnimatedCounter
   ═══════════════════════════════════════════ */

function AnimatedCounter({
  target, suffix = "", progress, range,
}: {
  target: number; suffix?: string; progress: MotionValue<number>; range: [number, number];
}) {
  const [display, setDisplay] = useState("0" + suffix);
  const value = useTransform(progress, range, [0, target]);
  useMotionValueEvent(value, "change", (v) => setDisplay(Math.round(v) + suffix));
  return <span className="tabular-nums">{display}</span>;
}

/* ═══════════════════════════════════════════
   TextReveal — word-by-word scroll reveal
   ═══════════════════════════════════════════ */

function TextReveal({
  progress,
  revealRange,
  exitRange,
  isDark,
}: {
  progress: MotionValue<number>;
  revealRange: [number, number];
  exitRange: [number, number];
  isDark: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const totalWords = storyWords.length;

  // Fade in before words start, fade out near end of exit
  const fadeInStart = revealRange[0] - 0.03;
  const containerOpacity = useTransform(
    progress,
    [fadeInStart, revealRange[0], exitRange[0], exitRange[0] + (exitRange[1] - exitRange[0]) * 0.98],
    [0, 1, 1, 0]
  );
  // During exit: slides UP
  const containerY = useTransform(
    progress,
    [fadeInStart, revealRange[0], exitRange[0], exitRange[1]],
    [50, 0, 0, -600]
  );

  useMotionValueEvent(progress, "change", (v) => {
    if (v < revealRange[0]) { setActiveIndex(-1); return; }
    if (v > revealRange[1]) { setActiveIndex(totalWords); return; }
    const t = (v - revealRange[0]) / (revealRange[1] - revealRange[0]);
    setActiveIndex(Math.floor(t * totalWords));
  });

  return (
    <motion.div
      style={{ opacity: containerOpacity, y: containerY }}
      className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none px-4 md:px-8"
    >
      <p className="max-w-[1400px] w-full text-center text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] xl:text-[2.75rem] font-medium leading-[1.6] sm:leading-[1.5] md:leading-[1.5] lg:leading-[1.45] tracking-tight">
        {storyWords.map((word, i) => {
          const isRevealed = i <= activeIndex;
          const isCurrent = i === activeIndex;
          const isNear = i > activeIndex && i <= activeIndex + 3;
          return (
            <span
              key={i}
              className="inline-block transition-all duration-500 ease-out"
              style={{
                marginRight: "0.28em",
                color: isRevealed
                  ? isDark ? "#ffffff" : "#000000"
                  : isNear
                  ? isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)"
                  : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                textShadow: isCurrent
                  ? "0 0 40px rgba(255,57,74,0.5), 0 0 80px rgba(255,57,74,0.15)"
                  : "none",
                transform: `translateY(${isRevealed ? 0 : 6}px) scale(${isCurrent ? 1.02 : 1})`,
                filter: isRevealed ? "none" : "blur(0.5px)",
              }}
            >
              {word}
            </span>
          );
        })}
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   StatCard
   ═══════════════════════════════════════════ */

function StatCard({
  stat, glow, progress, counterRange, isDark,
}: {
  stat: (typeof impactStats)[0]; glow: MotionValue<number>; progress: MotionValue<number>; counterRange: [number, number]; isDark: boolean;
}) {
  const bg = useTransform(glow, [0, 1], [isDark ? "rgba(24,24,27,0.4)" : "rgba(244,244,245,0.6)", "rgba(69,10,10,0.8)"]);
  const border = useTransform(glow, [0, 1], [isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)", "rgba(239,68,68,0.3)"]);
  const boxSh = useTransform(glow, [0, 1], ["0 0 0px rgba(0,0,0,0)", "0 0 40px rgba(255,57,74,0.15)"]);
  const iconC = useTransform(glow, [0, 1], ["rgba(255,255,255,1)", "rgba(252,165,165,1)"]);
  const numC = useTransform(glow, [0, 1], ["rgba(255,255,255,1)", "rgba(248,113,113,1)"]);
  const txtC = useTransform(glow, [0, 1], ["rgba(161,161,170,1)", "rgba(254,202,202,0.9)"]);

  // Image effects
  const imgGrayscale = useTransform(glow, [0, 1], ["grayscale(100%)", "grayscale(0%)"]);
  const imgOpacity = useTransform(glow, [0, 1], [0.6, 0.95]);
  const redOverlayOpacity = useTransform(glow, [0, 1], [0, 0.3]);

  return (
    <motion.div
      style={{ backgroundColor: stat.image ? undefined : bg, borderColor: border, boxShadow: boxSh }}
      className="relative flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 min-h-[200px] sm:min-h-[280px] lg:min-h-[360px] xl:min-h-[400px] rounded-3xl overflow-hidden border bg-zinc-100/60 dark:bg-zinc-950/40"
    >
      {/* Background image (if provided) */}
      {stat.image && (
        <>
          <motion.div
            className="absolute inset-0"
            style={{ filter: imgGrayscale, opacity: imgOpacity }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stat.image} alt="" className="w-full h-full object-cover" />
          </motion.div>
          {/* Red hue overlay on focus */}
          <motion.div
            className="absolute inset-0 bg-red-600/60 mix-blend-multiply"
            style={{ opacity: redOverlayOpacity }}
          />
          {/* Dark gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        </>
      )}
      {/* Grid overlay — always on top */}
      <div className={`absolute inset-y-0 right-0 left-1/4 opacity-10 bg-[size:16px_24px] [mask-image:linear-gradient(to_right,transparent_0%,black_100%)] z-[1] ${isDark ? "bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]" : "bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)]"}`} />
      <div className="relative z-10">
        <motion.div style={{ color: iconC }}>{stat.icon}</motion.div>
      </div>
      <div className="relative z-10 flex flex-col mt-auto text-left gap-1">
        <motion.div style={{ color: numC }} className="text-4xl sm:text-6xl md:text-7xl lg:text-[6rem] xl:text-[7rem] font-bold tracking-tighter leading-none mb-2">
          <AnimatedCounter target={stat.value} suffix={stat.suffix} progress={progress} range={counterRange} />
        </motion.div>
        <motion.p style={{ color: txtC }} className="text-sm lg:text-base font-medium leading-snug max-w-[160px] sm:self-auto self-end text-right sm:text-left">
          {stat.label}
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   HeroBackground
   ═══════════════════════════════════════════ */

function HeroBackground({ isDark }: { isDark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const resize = () => {
      const d = window.devicePixelRatio || 1;
      c.width = c.offsetWidth * d; c.height = c.offsetHeight * d;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(d, d);
    };
    resize(); window.addEventListener("resize", resize);
    const orbAlpha = isDark ? 1 : 0.7;
    const orbs = [
      { x: 0.3, y: 0.2, r: 350, col: `rgba(255,57,74,${0.08 * orbAlpha})`, s: 0.3, p: 0 },
      { x: 0.7, y: 0.6, r: 300, col: `rgba(255,57,74,${0.06 * orbAlpha})`, s: 0.4, p: 2 },
      { x: 0.5, y: 0.8, r: 400, col: `rgba(200,20,40,${0.05 * orbAlpha})`, s: 0.2, p: 4 },
      { x: 0.15, y: 0.7, r: 250, col: `rgba(255,100,110,${0.04 * orbAlpha})`, s: 0.5, p: 1 },
      { x: 0.85, y: 0.3, r: 280, col: `rgba(255,57,74,${0.05 * orbAlpha})`, s: 0.3, p: 3 },
    ];
    const pts: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    for (let i = 0; i < 45; i++) {
      pts.push({ x: Math.random() * c.offsetWidth, y: Math.random() * c.offsetHeight, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.3 + 0.1 });
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
          if (d < 120) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(255,57,74,${0.06 * (1 - d / 120)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        }
      }
      t++; raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, [isDark]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

/* ═══════════════════════════════════════════
   GridOverlay
   ═══════════════════════════════════════════ */

function GridOverlay({ isDark }: { isDark: boolean }) {
  const lineColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)";
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 79px, ${lineColor} 80px)` }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 79px, ${lineColor} 80px)` }} />
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
   HeroScroll — Main
   ═══════════════════════════════════════════

   Timeline (800vh) — CONNECTED transitions:
   ─────────────────────────────────────────
   0.00–0.05  Hero holds
   0.05–0.11  Hero fades + scales out
   0.10–0.28  Text words reveal one-by-one
   0.28–0.34  Text slides up ←→ Tablet rises (SIMULTANEOUS)
   0.34–0.44  Tablet holds (video plays)
   0.44–0.50  Tablet exits ←→ Stats enters (SIMULTANEOUS)
   0.50–0.58  Stats heading + cards appear
   0.58–0.86  Card glows sequentially
   0.86–1.00  Stats hold for interaction
   ═══════════════════════════════════════════ */

export const HeroScroll = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme === "dark";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [interactive, setInteractive] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => setInteractive(v > 0.86));

  /* ── Phase 1: Hero (fades into text) ── */
  const heroOpacity = useTransform(scrollYProgress, [0.05, 0.11], [1, 0]);
  const heroScale  = useTransform(scrollYProgress, [0.05, 0.11], [1, 0.88]);
  const heroY      = useTransform(scrollYProgress, [0.05, 0.11], [0, -80]);

  /* ── Phase 2: Text (words reveal, then slides up and out) ── */
  const textRevealRange: [number, number] = [0.10, 0.28];
  const textExitRange: [number, number]   = [0.28, 0.34];

  /* ── Phase 3: Tablet (follows text — same range 0.28→0.34, same 600px travel) ── */
  const tabletOpacity = useTransform(scrollYProgress, [0.27, 0.28, 0.46, 0.52], [0, 1, 1, 0]);
  const tabletY       = useTransform(scrollYProgress, [0.28, 0.36, 0.46, 0.52], [600, 0, 0, -400]);
  const tabletScale   = useTransform(scrollYProgress, [0.28, 0.36, 0.46, 0.52], [0.95, 1, 1, 0.92]);
  const tabletRotate  = useTransform(scrollYProgress, [0.28, 0.36], [3, 0]);

  /* ── Phase 4: Stats (starts RIGHT when tablet is gone at 0.52) ── */
  const statsContainerOpacity = useTransform(scrollYProgress, [0.52, 0.58], [0, 1]);
  const headingOpacity = useTransform(scrollYProgress, [0.52, 0.58], [0, 1]);
  const headingScale   = useTransform(scrollYProgress, [0.52, 0.58], [0.88, 1]);
  const headingY       = useTransform(scrollYProgress, [0.52, 0.58], [40, 0]);
  const statsOpacity   = useTransform(scrollYProgress, [0.58, 0.64], [0, 1]);
  const statsScale     = useTransform(scrollYProgress, [0.58, 0.64], [0.92, 1]);
  const statsY         = useTransform(scrollYProgress, [0.58, 0.64], [50, 0]);

  const counterRange: [number, number] = [0.58, 0.66];

  /* Card glows — strictly sequential + plateau + dim gaps between cards */
  const glow0 = useTransform(scrollYProgress, [0.66, 0.68, 0.71, 0.72], [0, 1, 1, 0]);
  const glow1 = useTransform(scrollYProgress, [0.73, 0.75, 0.78, 0.79], [0, 1, 1, 0]);
  const glow2 = useTransform(scrollYProgress, [0.80, 0.82, 0.85, 0.86], [0, 1, 1, 0]);
  const glow3 = useTransform(scrollYProgress, [0.87, 0.89, 0.92, 0.93], [0, 1, 1, 0]);
  const glows = [glow0, glow1, glow2, glow3];

  return (
    <header id="hero" ref={containerRef} className="relative h-[500vh] md:h-[800vh]" role="banner">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[var(--background)]">
        {/* Background */}
        <div className="absolute inset-0 bg-[var(--background)]" />
        <HeroBackground isDark={isDark} />
        <GridOverlay isDark={isDark} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

        {/* ═══ Phase 1: Hero ═══ */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              transition={{ opacity: { duration: 2, delay: 0.3 }, scale: { duration: 2, delay: 0.3 }, rotate: { duration: 120, repeat: Infinity, ease: "linear" } }}
              className="w-[90vw] h-[90vw] sm:w-[80vw] sm:h-[80vw] md:w-[70vw] md:h-[70vw] lg:w-[60vw] lg:h-[60vw] max-w-[900px] max-h-[900px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mandala.svg" alt="" className="w-full h-full opacity-[0.15] dark:opacity-[0.12]" />
            </motion.div>
            <div className="absolute w-[40%] h-[40%] bg-red-500/[0.04] rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto w-full pointer-events-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-10">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Avalanche Ecosystem
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
              <div className="relative h-8 w-[14rem] sm:h-12 sm:w-[20rem] md:h-14 md:w-[28rem] lg:h-[4.5rem] lg:w-[34rem]">
                <Image src="/team1-horizontal.svg" alt="Team1 India" fill className="object-contain hidden dark:block" sizes="700px" priority />
                <Image src="/team1-horizontal-light.svg" alt="Team1 India" fill className="object-contain block dark:hidden" sizes="700px" priority />
              </div>
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-lg md:text-xl lg:text-2xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12 text-balance">
              The premier builder community and accelerator for the{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">Avalanche Ecosystem</strong> in India.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-col sm:flex-row items-center gap-4 mb-10">
              <Link href="/public" className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white dark:bg-white text-black dark:text-black font-semibold text-base border border-black/10 transition-all duration-300 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-[1.02]">
                Explore
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a href="https://t.me/avalanche_hi" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 rounded-xl bg-black/8 dark:bg-white/8 border border-black/12 dark:border-white/12 text-black dark:text-white font-semibold text-base transition-all duration-300 hover:bg-red-500 hover:border-red-500 hover:text-white hover:scale-[1.02]">
                Join Us
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="flex items-center gap-1">
              {socials.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="p-2.5 text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors duration-200" aria-label={s.label}>{s.icon}</a>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* ═══ Phase 2: Text Reveal ═══ */}
        <TextReveal progress={scrollYProgress} revealRange={textRevealRange} exitRange={textExitRange} isDark={isDark} />

        {/* ═══ Phase 3: Tablet ═══ */}
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

        {/* ═══ Phase 4: Stats ═══ */}
        <motion.div
          style={{ opacity: statsContainerOpacity }}
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center px-4 sm:px-6 ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          {/* Separate bg so it doesn't exist when opacity is 0 */}
          <motion.div
            style={{ opacity: statsContainerOpacity }}
            className="absolute inset-0 bg-[var(--background)]"
          />
          <div className="relative w-full max-w-7xl mx-auto">
            <motion.div style={{ opacity: headingOpacity, scale: headingScale, y: headingY }} className="mb-6 lg:mb-8 text-center">
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-black dark:text-white tracking-tight uppercase">
                WHAT WE HAVE DONE
              </h2>
            </motion.div>
            <motion.div
              style={{ opacity: statsOpacity, scale: statsScale, y: statsY }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 xl:gap-6 w-full"
            >
              {impactStats.map((stat, i) => (
                <StatCard key={stat.label} stat={stat} glow={glows[i]} progress={scrollYProgress} counterRange={counterRange} isDark={isDark} />
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none z-40" />
      </div>

      {/* Anchor for #about nav link — positioned at ~10% where the story text reveal begins */}
      <div id="about" className="absolute top-[10%] left-0" aria-hidden="true" />
      {/* Anchor for #impact nav link — positioned at ~86% of the scroll container so it lands on the stats phase */}
      <div id="impact" className="absolute bottom-[14%] left-0" aria-hidden="true" />
    </header>
  );
};
