"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const images = [
  "/gallery/gallery-1.jpg",
  "/gallery/gallery-2.jpg",
  "/gallery/gallery-3.jpg",
  "/gallery/gallery-4.jpg",
  "/gallery/gallery-5.jpg",
  "/gallery/gallery-6.jpg",
  "/gallery/gallery-7.jpg",
  "/gallery/gallery-8.jpg",
  "/gallery/gallery-9.jpg",
  "/gallery/gallery-10.jpg",
  "/gallery/gallery-11.jpg",
  "/gallery/gallery-12.jpg",
  "/gallery/gallery-13.jpg",
  "/gallery/gallery-14.jpg",
  "/gallery/gallery-15.jpg",
  "/gallery/gallery-16.jpg",
];

// Split images into columns for masonry layout
function splitIntoColumns(items: string[], cols: number): string[][] {
  const columns: string[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => columns[i % cols].push(item));
  return columns;
}

function ParallaxColumn({
  images,
  speed,
  containerRef,
}: {
  images: string[];
  speed: number;
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed]);

  return (
    <motion.div style={{ y }} className="flex flex-col gap-3 md:gap-4">
      {images.map((src, i) => (
        <GalleryImage key={src} src={src} index={i} />
      ))}
    </motion.div>
  );
}

function GalleryImage({ src, index }: { src: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="overflow-hidden rounded-xl md:rounded-2xl group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </motion.div>
  );
}

export function Gallery() {
  const containerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(headingRef, { once: true, margin: "-80px" });

  // 4 columns on desktop, 3 on tablet, 2 on mobile
  const cols4 = splitIntoColumns(images, 4);
  const cols3 = splitIntoColumns(images, 3);
  const cols2 = splitIntoColumns(images, 2);

  // Different parallax speeds per column for depth effect
  const speeds4 = [-80, 60, -40, 80];
  const speeds3 = [-60, 50, -70];
  const speeds2 = [-40, 50];

  return (
    <section
      ref={containerRef}
      className="py-16 md:py-24 bg-[var(--background)] overflow-hidden"
    >
      {/* Heading */}
      <div ref={headingRef} className="text-center mb-10 md:mb-14 px-5 md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl lg:text-7xl font-bold text-black dark:text-white tracking-tight mb-4"
        >
          Moments That Matter
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-zinc-500 dark:text-zinc-500 text-sm md:text-lg max-w-2xl mx-auto"
        >
          Snapshots from our hackathons, meetups, and community events across
          India.
        </motion.p>
      </div>

      {/* Masonry Grid — responsive columns with parallax */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* 4-column: lg+ */}
        <div className="hidden lg:grid grid-cols-4 gap-3 md:gap-4">
          {cols4.map((col, i) => (
            <ParallaxColumn
              key={i}
              images={col}
              speed={speeds4[i]}
              containerRef={containerRef}
            />
          ))}
        </div>

        {/* 3-column: md to lg */}
        <div className="hidden md:grid lg:hidden grid-cols-3 gap-3 md:gap-4">
          {cols3.map((col, i) => (
            <ParallaxColumn
              key={i}
              images={col}
              speed={speeds3[i]}
              containerRef={containerRef}
            />
          ))}
        </div>

        {/* 2-column: mobile */}
        <div className="grid md:hidden grid-cols-2 gap-3">
          {cols2.map((col, i) => (
            <ParallaxColumn
              key={i}
              images={col}
              speed={speeds2[i]}
              containerRef={containerRef}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
