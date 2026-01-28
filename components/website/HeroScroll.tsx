"use client";
import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion, useMotionValueEvent, MotionValue } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export const HeroScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  /* New Ref for Video */
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Volume animation: Fade in [0.2 -> 0.4], Stay [0.4 -> 0.8], Fade out [0.8 -> 1.0]
  const volume = useTransform(scrollYProgress, [0.2, 0.4, 0.8, 1.0], [0, 1, 1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.3 && !isVideoPlaying) {
      setIsVideoPlaying(true);
    } else if (latest <= 0.3 && isVideoPlaying) {
      setIsVideoPlaying(false);
    }
  });

  useMotionValueEvent(volume, "change", (latest) => {
    if (videoRef.current) {
        videoRef.current.volume = latest;
    }
  });

  /* Effect to start loading video metadata when component mounts (lightweight) */
  React.useEffect(() => {
    if (videoRef.current) {
      // Load metadata only - this is fast and doesn't download full video
      videoRef.current.load();
    }
  }, []);

  /* Effect to manage video playback based on active state */
  React.useEffect(() => {
    if (videoRef.current) {
        if (isVideoPlaying) {
            videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        } else {
            videoRef.current.pause();
        }
    }
  }, [isVideoPlaying]);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      // Use standard md breakpoint (768px) to match the hidden md:block class
      // Also checking aspect-ratio as requested "height > width" implies portrait, 
      // but "mobile view" usually just means small screens. 
      // Standard approach: matching the CSS breakpoint ensures consistency.
      const checkDesktop = () => {
        setIsDesktop(window.innerWidth >= 768);
      };
      
      checkDesktop();
      window.addEventListener("resize", checkDesktop);
      return () => window.removeEventListener("resize", checkDesktop);
    }
  }, []);

  return (
    <header
      id="hero"
      className="min-h-[100svh] md:h-[200vh] relative"
      ref={containerRef}
      role="banner"
      aria-label="Team1 India Hero Section"
    >
      <div className="sticky top-0 min-h-[100svh] md:h-screen flex items-center justify-center py-6 md:py-20 overflow-hidden">
        <section
          className="w-full relative z-10 flex flex-col items-center justify-center md:justify-start h-full"
          style={{
            perspective: "1000px",
          }}
        >
          <Header scale={textScale} translate={textTranslate} isDesktop={isDesktop} />
          <div className="hidden md:block w-full">
            {isDesktop && (
              <Card rotate={rotate} translate={translate} scale={scale} isVideoPlaying={isVideoPlaying} videoRef={videoRef} />
            )}
          </div>
          <HeroActions translate={translate} isDesktop={isDesktop} />
        </section>
      </div>
    </header>
  );
};

export const Header = ({ scale, translate, isDesktop }: { scale: MotionValue<number>; translate: MotionValue<number>; isDesktop: boolean }) => {
  return (
    <motion.div 
      style={isDesktop ? { scale, translateY: translate } : {}}
      className="max-w-5xl mx-auto text-center px-4 md:px-8 mt-0 md:mt-4 mb-6 md:mb-4 origin-center"
      role="presentation"
    >
      <hgroup>
        <h1 className="text-4xl sm:text-5xl md:text-8xl font-bold text-white tracking-tighter mb-4 md:mb-2 text-balance">
          Team1 India
        </h1>
        <p className="text-base sm:text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed md:leading-tight px-2 text-balance">
          The premier builder community and accelerator for the <strong>Avalanche Ecosystem</strong> in India.
        </p>
      </hgroup>
    </motion.div>
  );
};



// Card scale/translate logic remains, but we add max-h to prevent it from eating all vertical space
// Card scale/translate logic remains, but we add max-h to prevent it from eating all vertical space
export const Card = ({
  rotate,
  scale,
  translate,
  isVideoPlaying,
  videoRef
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  isVideoPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleProgress = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
           const progress = (bufferedEnd / duration) * 100;
           setLoadingProgress(Math.min(100, Math.round(progress)));
        }
      }
    }
  };

  const handleCanPlay = () => {
    setIsLoaded(true);
  };

  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
      }}
      className="max-w-5xl mx-auto aspect-video w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-white/5 backdrop-blur-xl border-white/20 rounded-[30px] shadow-2xl max-h-[50vh] object-contain relative"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-transparent relative">
          
          {/* Loader Overlay */}
          {!isLoaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-700 pointer-events-none">
               <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-white/80 font-mono text-sm tracking-wider">
                    LOADING {loadingProgress}%
                  </span>
               </div>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-transparent">
              <Image 
                 src="/hero-cover.jpg" 
                 alt="Video Thumbnail" 
                 fill
                 priority
                 sizes="(max-width: 768px) 100vw, 80vw"
                 className="absolute inset-0 object-cover object-bottom"
               />
               <video 
                  ref={videoRef}
                  loop
                  playsInline
                  preload="metadata"
                  poster="/hero-cover.jpg"
                  onProgress={handleProgress}
                  onCanPlayThrough={handleCanPlay}
                  onCanPlay={handleCanPlay}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideoPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
               >
                  {/* Multiple formats for better browser support and faster loading */}
                  <source src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "/hero-video.webm"} type="video/webm" />
                  <source src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL_MP4 || "/hero-video.mp4"} type="video/mp4" />
                  {/* Fallback for browsers that don't support video */}
                  Your browser does not support the video tag.
               </video>
          </div>
      </div>
    </motion.div>
  );
};

import { Instagram, Linkedin, Send } from "lucide-react";
import { signIn } from "next-auth/react";

export const HeroActions = ({ translate, isDesktop }: { translate: MotionValue<number>; isDesktop: boolean }) => {
  return (
    <motion.div 
      style={isDesktop ? { translateY: translate } : {}}
      className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4 md:-mt-6 w-full pb-24 md:pb-12 relative z-50 pointer-events-auto"
    >
       {/* Ensure z-50 and pointer-events-auto to stay on top */}
        <div className="flex items-center gap-4">
            <Link href="/public" className="group px-6 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md transition-all text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white hover:text-black">
                <span className="block transition-transform duration-200 group-hover:scale-110">Guidebook</span>
            </Link>
            <button 
                onClick={() => signIn('google', { callbackUrl: '/access-check' })}
                className="group px-6 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md transition-all text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white hover:text-black"
            >
                <span className="block transition-transform duration-200 group-hover:scale-110">Members</span>
            </button>
        </div>

        <div className="w-px h-8 bg-white/10 hidden md:block"></div>

        <div className="flex items-center gap-4">
            <a href="#" className="p-2 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
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
