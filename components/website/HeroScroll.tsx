"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from "framer-motion";

function AnimatedCounter({ target, suffix = "", scrollYProg }: { target: number; suffix?: string; scrollYProg: any }) {
  const roundedValue = useTransform(scrollYProg, [0.76, 0.84], [0, target]);
  const displayMotionValue = useTransform(roundedValue, (latest) => {
    return Math.round(latest) + suffix;
  });
  return <motion.span className="tabular-nums">{displayMotionValue}</motion.span>;
}

import Link from "next/link";
import Image from "next/image";
import { Send, ArrowRight, Calendar, School, Trophy, Rocket } from "lucide-react";
import { TabletMockup } from "@/components/ui/TabletMockup";

const impactStats = [
  { value: 113, label: "Events", suffix: "+", icon: <Calendar className="w-6 h-6" /> },
  { value: 15, label: "Campuses", suffix: "+", icon: <School className="w-6 h-6" /> },
  { value: 7, label: "Hackathons", suffix: "", icon: <Trophy className="w-6 h-6" /> },
  { value: 31, label: "Projects Building", suffix: "+", icon: <Rocket className="w-6 h-6" /> },
];

/* ── Animated background with red/black gradient orbs ── */
function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    // Floating orbs
    const orbs = [
      { x: 0.3, y: 0.2, r: 350, color: "rgba(255, 57, 74, 0.08)", speed: 0.0003, phase: 0 },
      { x: 0.7, y: 0.6, r: 300, color: "rgba(255, 57, 74, 0.06)", speed: 0.0004, phase: 2 },
      { x: 0.5, y: 0.8, r: 400, color: "rgba(200, 20, 40, 0.05)", speed: 0.0002, phase: 4 },
      { x: 0.15, y: 0.7, r: 250, color: "rgba(255, 100, 110, 0.04)", speed: 0.0005, phase: 1 },
      { x: 0.85, y: 0.3, r: 280, color: "rgba(255, 57, 74, 0.05)", speed: 0.0003, phase: 3 },
    ];

    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * (w / window.devicePixelRatio),
        y: Math.random() * (h / window.devicePixelRatio),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }

    let t = 0;
    const draw = () => {
      const cw = w / window.devicePixelRatio;
      const ch = h / window.devicePixelRatio;

      ctx.clearRect(0, 0, cw, ch);

      // Draw orbs
      for (const orb of orbs) {
        const ox = cw * (orb.x + Math.sin(t * orb.speed * 1000 + orb.phase) * 0.05);
        const oy = ch * (orb.y + Math.cos(t * orb.speed * 800 + orb.phase) * 0.05);
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = cw;
        if (p.x > cw) p.x = 0;
        if (p.y < 0) p.y = ch;
        if (p.y > ch) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 57, 74, ${p.alpha})`;
        ctx.fill();
      }

      // Draw connecting lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 57, 74, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 1 }}
    />
  );
}

/* ── Animated grid lines ── */
function GridOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.5) 80px)",
        }}
      />
      {/* Vertical lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.5) 80px)",
        }}
      />
      {/* Red accent glow line at center */}
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(255,57,74,0.15), transparent)",
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Main Hero ── */
export const HeroScroll = () => {
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 45,
    damping: 25,
    restDelta: 0.001
  });

  const [interactive, setInteractive] = useState(false);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (latest > 0.985) setInteractive(true);
    else setInteractive(false);
  });

  // Hero Vanish Effect
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 0.95]);
  const heroY = useTransform(smoothProgress, [0, 0.15], [0, -30]);

  // Tablet Slide In & Out Effect
  const tabletY = useTransform(smoothProgress, [0.1, 0.25, 0.6, 0.75], ["100vh", "0vh", "0vh", "-100vh"]);
  const tabletScale = useTransform(smoothProgress, [0.1, 0.25, 0.6, 0.75], [0.8, 1, 1, 0.85]);
  const tabletRotateX = useTransform(smoothProgress, [0.1, 0.25], [20, 0]);
  const tabletOpacity = useTransform(smoothProgress, [0.1, 0.2, 0.65, 0.75], [0, 1, 1, 0]);

  // Heading Slide In Effect
  const headingOpacity = useTransform(smoothProgress, [0.68, 0.76], [0, 1]);
  const headingScale = useTransform(smoothProgress, [0.68, 0.76], [0.85, 1]);

  // Stats Slide In Effect
  const statsOpacity = useTransform(smoothProgress, [0.76, 0.84], [0, 1]);
  const statsScale = useTransform(smoothProgress, [0.76, 0.84], [0.85, 1]);

  // Sequential Glare MotionValues
  const card0Glow = useTransform(smoothProgress, [0.85, 0.87, 0.89], [0, 1, 0]);
  const card1Glow = useTransform(smoothProgress, [0.88, 0.90, 0.92], [0, 1, 0]);
  const card2Glow = useTransform(smoothProgress, [0.91, 0.93, 0.95], [0, 1, 0]);
  const card3Glow = useTransform(smoothProgress, [0.94, 0.96, 0.98], [0, 1, 0]);

  const cardGlows = [card0Glow, card1Glow, card2Glow, card3Glow];

  return (
    <header
      id="hero"
      ref={containerRef}
      className="relative h-[700vh]"
      role="banner"
    >
      {/* Sticky container to pin the view while scrolling */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black [perspective:1000px]">
        {/* Background layers */}
        <div className="absolute inset-0 bg-black" />
        <HeroBackground />
        <GridOverlay />

        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Hero Content (Vanishes on scroll) */}
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Rotating Mandala Background */}
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
            <img
              src="/mandala.svg"
              alt=""
              className="w-full h-full opacity-[0.12]"
            />
          </motion.div>
          {/* Glow behind mandala */}
          <div className="absolute w-[40%] h-[40%] bg-red-500/[0.04] rounded-full blur-[120px]" />
          </div>

        <motion.div
           style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
           className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto w-full pointer-events-auto"
        >
        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Avalanche Ecosystem
          </span>
        </motion.div>

        {/* Logo — Team1 image + India text */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 md:gap-3 mb-6"
        >
          <div className="relative h-5 w-[10rem] sm:h-8 sm:w-[16rem] md:h-10 md:w-[24rem] lg:h-14 lg:w-[28rem]">
            <Image
              src="/team1-horizontal.svg"
              alt="Team1 India"
              fill
              className="object-contain"
              sizes="700px"
              priority
            />
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed mb-10 text-balance"
        >
          The premier builder community and accelerator for the{" "}
          <strong className="text-zinc-200">Avalanche Ecosystem</strong> in India.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-8"
        >
          <Link
            href="/public"
            className="group flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-black font-semibold text-sm transition-all duration-300 hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-[1.02]"
          >
            Explore
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://t.me/avalanche_hi"
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 rounded-xl bg-white/8 border border-white/12 text-white font-semibold text-sm transition-all duration-300 hover:bg-red-500 hover:border-red-500 hover:scale-[1.02]"
          >
            Join Us
          </a>
        </motion.div>

        {/* Socials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center gap-1"
        >
          {[
            { href: "https://x.com/Team1IND", label: "X", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
            { href: "https://instagram.com/team1india", label: "Instagram", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> },
            { href: "https://www.linkedin.com/company/avaxteam1", label: "LinkedIn", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> },
            { href: "https://t.me/avalanche_hi", label: "Telegram", icon: <Send className="w-4 h-4" /> },
          ].map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-zinc-600 hover:text-red-400 transition-colors duration-200"
              aria-label={s.label}
            >
              {s.icon}
            </a>
          ))}
          </motion.div>
        </motion.div>
      </motion.div>

        {/* Tablet Mockup (Slides in on scroll) */}
        <motion.div 
          style={{ y: tabletY, scale: tabletScale, rotateX: tabletRotateX, opacity: tabletOpacity }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none origin-bottom px-4 md:px-8 pt-16 pb-16 md:pt-20 md:pb-24"
        >
           <div className="w-full h-full max-h-[90vh] max-w-[1800px] flex justify-center pointer-events-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-[1rem] md:rounded-[2rem]">
             <TabletMockup videoSrc="/hero-video.mp4" className="w-auto h-full max-w-full aspect-[21/9]" />
           </div>
        </motion.div>

        {/* Impact Stats Phase (What We Have Done) */}
        <motion.div
           style={{ opacity: statsOpacity, scale: statsScale }}
           // Pointer events restricted until the scroll sequence officially concludes
           className={`absolute inset-0 z-20 flex flex-col items-center justify-center px-6 bg-black ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          <div className="w-full max-w-5xl mx-auto">
            <motion.div 
               style={{ opacity: headingOpacity, scale: headingScale }}
               className="mb-16 text-center"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white tracking-tight">What We Have Done</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {impactStats.map((stat, i) => {
                const glow = cardGlows[i];
                
                // Drive visual colors by interpolating the glow MotionValue
                const bgColor = useTransform(glow, [0, 1], ["rgba(24, 24, 27, 0.4)", "rgba(69, 10, 10, 0.8)"]);
                const borderColor = useTransform(glow, [0, 1], ["rgba(255, 255, 255, 0.05)", "rgba(239, 68, 68, 0.3)"]);
                const shadow = useTransform(glow, [0, 1], ["0 0 0px rgba(0,0,0,0)", "0 0 40px rgba(255, 57, 74, 0.15)"]);
                const iconColor = useTransform(glow, [0, 1], ["rgba(113, 113, 122, 1)", "rgba(252, 165, 165, 1)"]);
                const numColor = useTransform(glow, [0, 1], ["rgba(255, 255, 255, 1)", "rgba(248, 113, 113, 1)"]);
                const textColor = useTransform(glow, [0, 1], ["rgba(161, 161, 170, 1)", "rgba(254, 202, 202, 0.9)"]);
                const gridOpacity = useTransform(glow, [0, 1], [0.1, 0.4]);
                const accentGlow = useTransform(glow, [0, 1], ["rgba(239, 68, 68, 0)", "rgba(239, 68, 68, 0.2)"]);

                return (
                  <motion.div 
                    key={stat.label}
                    style={{ backgroundColor: bgColor, borderColor: borderColor, boxShadow: shadow }}
                    className="group relative flex flex-col justify-between p-6 md:p-8 min-h-[280px] lg:min-h-[320px] rounded-3xl overflow-hidden border transition-shadow duration-300 hover:!bg-red-950/80 hover:!border-red-500/30 hover:!shadow-[0_0_40px_rgba(255,57,74,0.15)]"
                  >
                    {/* Subtle Grid Pattern Overlay Faded from Left */}
                    <motion.div 
                      style={{ opacity: gridOpacity }}
                      className="absolute inset-y-0 right-0 left-1/4 group-hover:!opacity-40 transition-opacity duration-300 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:16px_24px] [mask-image:linear-gradient(to_right,transparent_0%,black_100%)]" 
                    />
                    
                    {/* Glowing accent - Now linked to scroll pulse too */}
                    <motion.div 
                      style={{ backgroundColor: accentGlow }}
                      className="absolute top-0 right-0 w-32 h-32 group-hover:!bg-red-500/20 blur-3xl rounded-full transition-colors duration-500" 
                    />

                    <div className="relative z-10 flex items-start justify-between">
                      <motion.div style={{ color: iconColor }} className="group-hover:!text-red-300 transition-colors duration-300">
                        {stat.icon}
                      </motion.div>
                    </div>

                    <div className="relative z-10 bottom-0 flex flex-col mt-auto text-left gap-1">
                      {/* Size adjusted for 3-digit safety across viewports */}
                      <motion.div 
                        style={{ color: numColor }}
                        className="text-6xl sm:text-7xl lg:text-[5.5rem] font-bold tracking-tighter group-hover:!text-red-400 transition-colors duration-300 leading-none mb-2"
                      >
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} scrollYProg={smoothProgress} />
                      </motion.div>
                      <motion.p 
                        style={{ color: textColor }}
                        className="text-sm font-medium leading-snug max-w-[140px] group-hover:!text-red-200/90 transition-colors duration-300 sm:self-auto self-end text-right sm:text-left"
                      >
                        {stat.label}
                      </motion.p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Bottom scroll fade (Always visible over pinned content) */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
      </div>

    </header>
  );
};
