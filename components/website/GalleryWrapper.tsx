"use client";

import dynamic from "next/dynamic";

const GlobeGallery = dynamic(
  () => import("./GlobeGallery").then((mod) => mod.GlobeGallery),
  {
    ssr: false,
    loading: () => (
      <section className="py-10 md:py-16 bg-[var(--background)]">
        <div className="text-center px-5 md:px-8">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-black dark:text-white tracking-tight leading-[1.1]">
            Glimpses Of Our Journey
          </h2>
        </div>
      </section>
    ),
  }
);

export function GalleryWrapper() {
  return <GlobeGallery />;
}
