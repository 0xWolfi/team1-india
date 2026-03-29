"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Send, ArrowRight } from "lucide-react";

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
  return (
    <header
      id="hero"
      className="relative min-h-svh flex flex-col items-center justify-center overflow-hidden"
      role="banner"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-black" />
      <HeroBackground />
      <GridOverlay />

      {/* Rotating Mandala Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
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

      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
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
          <div className="relative h-10 w-[16rem] sm:h-16 sm:w-[28rem] md:h-20 md:w-[36rem] lg:h-24 lg:w-[44rem]">
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
            className="group flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-black font-semibold text-sm transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02]"
          >
            Explore
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <button
            onClick={() => signIn("google", { callbackUrl: "/access-check" })}
            className="px-7 py-3 rounded-xl bg-white/8 border border-white/12 text-white font-semibold text-sm transition-all duration-300 hover:bg-white/14 hover:border-white/20 hover:scale-[1.02]"
          >
            Sign In
          </button>
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
      </div>

      {/* Bottom scroll fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

      {/* Animated scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-zinc-700 flex justify-center pt-1.5"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="w-1 h-1.5 rounded-full bg-red-500"
          />
        </motion.div>
      </motion.div>
    </header>
  );
};
