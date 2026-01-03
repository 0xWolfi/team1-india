"use client";
import React, { useRef, useState } from "react";
import { useScroll, useTransform, motion, useMotionValueEvent, MotionValue } from "framer-motion";
import Link from "next/link";

export const HeroScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Animations complete by 30% of the scroll
  const rotate = useTransform(scrollYProgress, [0, 0.3], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.7, 1]); // Tablet grows
  const translate = useTransform(scrollYProgress, [0, 0.3], [0, 50]); // Tablet moves DOWN
  
  // Text animations
  const textScale = useTransform(scrollYProgress, [0, 0.3], [1.2, 1]); // Text shrinks/settles
  const textTranslate = useTransform(scrollYProgress, [0, 0.3], [50, -10]); // Text starts closer (40), moves UP to (-10)

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.3 && !isVideoPlaying) {
      setIsVideoPlaying(true);
    } else if (latest <= 0.3 && isVideoPlaying) {
      setIsVideoPlaying(false);
    }
  });

  return (
    <div
      id="hero"
      className="h-[200vh] relative"
      ref={containerRef}
    >
      <div className="sticky top-0 h-screen flex items-center justify-center py-10 md:py-20 overflow-hidden">
        <div
          className="w-full relative z-10 flex flex-col items-center justify-start h-full"
          style={{
            perspective: "1000px",
          }}
        >
          <Header scale={textScale} translate={textTranslate} />
          <Card rotate={rotate} translate={translate} scale={scale} isVideoPlaying={isVideoPlaying} />
          <HeroActions translate={translate} />
        </div>
      </div>
    </div>
  );
};

export const Header = ({ scale, translate }: { scale: MotionValue<number>; translate: MotionValue<number> }) => {
  return (
    <motion.div 
      style={{ scale, translateY: translate }}
      className="max-w-5xl mx-auto text-center px-4 md:px-8 mt-4 mb-4 origin-center"
    >
      <h1 className="text-4xl md:text-8xl font-bold text-white tracking-tighter mb-2">
        Team1 India
      </h1>
      <p className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-tight">
        building communities, onboarding developers, and empowering founders to scale within the avalanche ecosystem.
      </p>
    </motion.div>
  );
};



export const Card = ({
  rotate,
  scale,
  translate,
  isVideoPlaying,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  isVideoPlaying: boolean;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
      }}
      className="max-w-5xl mx-auto aspect-video w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-white/5 backdrop-blur-xl border-white/20 rounded-[30px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-transparent relative">
        {/* YouTube Video */}
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
             <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/YkjOtM4Ljxc?autoplay=1&mute=1&loop=1&playlist=YkjOtM4Ljxc&controls=0&showinfo=0&modestbranding=1" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoPlaying ? "opacity-100" : "opacity-0"}`}
             ></iframe>
             
             {!isVideoPlaying && (
                 <span className="text-white/20 text-4xl font-bold absolute">Video Placeholder</span>
             )}
        </div>
      </div>
    </motion.div>
  );
};

import { Instagram, Linkedin, Send } from "lucide-react";
import { signIn } from "next-auth/react";

// Custom X Icon since it might not be in all versions or purely preference
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4l11.733 16h4.67l-12.28-16.75L2.4 4h1.6zm10.7 0l5.3 7.3L22 4h-2l-3.3 4.5-2-4.5h-2.3z" fill="currentColor" stroke="none"/>
    {/* Simple X shape if SVG above is too complex or broken in prev context, but standard path usually:
        M18 6L6 18M6 6l12 12
        The above path is a close approximation of the X logo.
        Let's use the standard "X" from lucide if available (it is in recent versions), but fallback to code if not.
        Actually, 'X' is available in lucide-react imports usually as 'X'. 
        Let's try importing it. If it fails build, we can revert.
    */}
     <path d="M18 6 6 18" />
     <path d="m6 6 12 12" />
  </svg>
);

import { X } from "lucide-react";

export const HeroActions = ({ translate }: { translate: MotionValue<number> }) => {
  return (
    <motion.div 
      style={{ translateY: translate }}
      className="flex flex-col md:flex-row items-center justify-center gap-6 -mt-9 w-full"
    >
        <div className="flex items-center gap-4">
            <Link href="/public" className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Guidebook
            </Link>
            <button 
                onClick={() => signIn('google', { callbackUrl: '/access-check' })}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
                Members
            </button>
        </div>

        <div className="w-px h-8 bg-white/10 hidden md:block"></div>

        <div className="flex items-center gap-4">
            <a href="#" className="p-2 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <X className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <Send className="w-5 h-5" /> {/* Telegram */}
            </a>
        </div>
    </motion.div>
  );
};
