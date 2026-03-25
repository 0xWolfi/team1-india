"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Send, Volume2, VolumeX } from "lucide-react";

export const HeroScroll = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Parallax on video - moves up slightly as you scroll
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  // Text fades out on scroll
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -40]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <header id="hero" ref={heroRef} role="banner" className="relative">
      {/* ── Cinematic Video Banner ── */}
      <div className="relative w-full h-[40vh] md:h-[48vh] overflow-hidden">
        {/* Video with parallax */}
        <motion.div style={{ y: videoY }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
          <video
            ref={videoRef}
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Top gradient for navbar blending */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
        {/* Thin bottom fade so video doesn't have a hard cut against black */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

        {/* Mute toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10 rounded-full text-white/50 hover:text-white transition-all duration-200"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Content Section ── */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-10 flex flex-col items-center text-center px-4 pt-6 md:pt-10 pb-20 md:pb-24"
      >
        {/* Logo + India */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-1 md:gap-2 mb-5"
        >
          <div className="relative h-12 w-36 sm:h-14 sm:w-40 md:h-16 md:w-48">
            <Image
              src="/team1-full-logo.png"
              alt="Team1"
              fill
              className="object-contain object-right"
              sizes="200px"
              priority
            />
          </div>
          <span
            className="text-white font-bold text-5xl sm:text-5xl md:text-6xl leading-[0.9] tracking-tight"
            style={{ fontFamily: "var(--font-kanit)" }}
          >
            India
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm md:text-base text-zinc-500 max-w-lg mx-auto leading-relaxed mb-7 text-balance"
        >
          The premier builder community and accelerator for the{" "}
          <strong className="text-zinc-300">Avalanche Ecosystem</strong> in India.
        </motion.p>

        {/* CTAs + Socials */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/public"
            className="px-7 py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-all duration-200 hover:bg-zinc-200 hover:scale-[1.02]"
          >
            Explore
          </Link>
          <button
            onClick={() => signIn("google", { callbackUrl: "/access-check" })}
            className="px-7 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white font-semibold text-sm transition-all duration-200 hover:bg-white/14 hover:scale-[1.02]"
          >
            Sign In
          </button>
          <div className="hidden sm:block w-px h-6 bg-white/10 mx-1" />
          <div className="flex items-center gap-0.5">
            {[
              { href: "https://twitter.com/Team1India", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
              { href: "https://instagram.com/team1india", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> },
              { href: "https://linkedin.com/company/team1india", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> },
              { href: "https://t.me/Team1India", icon: <Send className="w-3.5 h-3.5" /> },
            ].map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-600 hover:text-white transition-colors duration-200">
                {s.icon}
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </header>
  );
};
