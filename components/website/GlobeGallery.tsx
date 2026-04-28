"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";

const allImages = Array.from({ length: 31 }, (_, i) => `/gallery/gallery-${i + 1}.jpg`);

// Distribute 31 images across 4 rows (8/8/8/7)
const rows = [
  { images: allImages.slice(0, 8), direction: "left" as const, speed: 55 },
  { images: allImages.slice(8, 16), direction: "right" as const, speed: 70 },
  { images: allImages.slice(16, 24), direction: "left" as const, speed: 60 },
  { images: allImages.slice(24, 31), direction: "right" as const, speed: 75 },
];

interface MarqueeRowProps {
  images: string[];
  direction: "left" | "right";
  speed: number;
  onImageClick: (index: number) => void;
  baseIndex: number;
}

function MarqueeRow({ images, direction, speed, onImageClick, baseIndex }: MarqueeRowProps) {
  // Duplicate the row for a seamless loop
  const items = useMemo(() => [...images, ...images], [images]);

  return (
    <div className="relative py-2 md:py-3">
      <div
        className={
          direction === "left" ? "gallery-marquee-left flex gap-3 sm:gap-4 md:gap-6" : "gallery-marquee-right flex gap-3 sm:gap-4 md:gap-6"
        }
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map((src, i) => {
          const originalIndex = baseIndex + (i % images.length);
          return (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => onImageClick(originalIndex)}
              className="group relative shrink-0 w-[180px] h-[120px] sm:w-[220px] sm:h-[150px] md:w-[320px] md:h-[215px] rounded-2xl overflow-hidden cursor-pointer transition-transform duration-500 ease-out hover:scale-[1.08] hover:!z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Open gallery image"
            >
              <Image
                src={src}
                alt="Team1 India community moment"
                fill
                sizes="(max-width: 640px) 180px, (max-width: 768px) 220px, 320px"
                className="object-cover transition-all duration-700 ease-out group-hover:brightness-110 group-hover:saturate-125"
                draggable={false}
              />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500" />
              {/* Inner ring for depth */}
              <div className="absolute inset-0 ring-1 ring-inset ring-black/15 dark:ring-white/15 rounded-2xl pointer-events-none" />
              {/* Hover glow */}
              <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5)" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GlobeGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Parallax scroll effect on the wall
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const wallY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const wallRotate = useTransform(scrollYProgress, [0, 1], [12, 4]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? prev : (prev + 1) % allImages.length));
  }, []);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? prev : (prev - 1 + allImages.length) % allImages.length));
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handler);
    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIndex, closeLightbox, nextImage, prevImage]);

  return (
    <section
      className="relative py-10 md:py-16 bg-[var(--background)] overflow-hidden [clip-path:inset(0)] isolate"
      ref={ref}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
      </div>

      {/* Heading */}
      <div className="relative text-center mb-8 md:mb-12 px-5 md:px-8 z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-black dark:text-white tracking-tight leading-[1.1]"
        >
          Moments
        </motion.h2>
      </div>

      {/* 3D tilted marquee wall */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative overflow-hidden [clip-path:inset(0)]"
        style={{ perspective: "2000px" }}
      >
        {/* Edge fade gradients */}
        <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-[var(--background)] via-[var(--background)]/80 to-transparent z-20 pointer-events-none" />
        {/* Top/bottom soft fades */}
        <div className="absolute inset-x-0 top-0 h-16 md:h-24 bg-gradient-to-b from-[var(--background)] to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 md:h-24 bg-gradient-to-t from-[var(--background)] to-transparent z-20 pointer-events-none" />

        <motion.div
          className="flex flex-col gap-3 md:gap-5"
          style={{
            transform: "rotateX(15deg) rotateY(-8deg) rotateZ(-2deg)",
            transformStyle: "preserve-3d",
            y: wallY,
            rotate: wallRotate,
          }}
        >
          {rows.map((row, i) => {
            const baseIdx = rows.slice(0, i).reduce((sum, r) => sum + r.images.length, 0);
            return (
              <MarqueeRow
                key={i}
                images={row.images}
                direction={row.direction}
                speed={row.speed}
                onImageClick={openLightbox}
                baseIndex={baseIdx}
              />
            );
          })}
        </motion.div>
      </motion.div>

      {/* Lightbox modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              className="absolute top-4 right-4 md:top-6 md:right-6 text-white/80 hover:text-white w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 z-10"
              aria-label="Close lightbox"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Prev */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-11 h-11 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 z-10"
              aria-label="Previous image"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-11 h-11 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 z-10"
              aria-label="Next image"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-6xl aspect-[16/10] md:aspect-[3/2]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={allImages[lightboxIndex]}
                alt="Gallery image"
                fill
                className="object-contain rounded-xl"
                sizes="100vw"
                priority
              />
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm font-medium">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
