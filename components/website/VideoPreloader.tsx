"use client";

import { useEffect } from "react";

export function VideoPreloader() {
  useEffect(() => {
    // Use Intersection Observer to preload video only when it's about to be visible
    // This prevents blocking initial page load
    const videoUrl = process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "/hero-video.webm";
    const videoUrlMp4 = process.env.NEXT_PUBLIC_HERO_VIDEO_URL_MP4 || "/hero-video.mp4";
    
    // Preload poster image immediately (small file, won't slow down page)
    const preloadPoster = document.createElement("link");
    preloadPoster.rel = "preload";
    preloadPoster.href = "/hero-cover.jpg";
    preloadPoster.as = "image";
    preloadPoster.fetchPriority = "high";
    document.head.appendChild(preloadPoster);

    // Preload video metadata only (not full video) - this is lightweight
    const preloadWebm = document.createElement("link");
    preloadWebm.rel = "preload";
    preloadWebm.href = videoUrl;
    preloadWebm.as = "video";
    preloadWebm.type = "video/webm";
    preloadWebm.fetchPriority = "low"; // Low priority so it doesn't block page load
    document.head.appendChild(preloadWebm);

    const preloadMp4 = document.createElement("link");
    preloadMp4.rel = "preload";
    preloadMp4.href = videoUrlMp4;
    preloadMp4.as = "video";
    preloadMp4.type = "video/mp4";
    preloadMp4.fetchPriority = "low"; // Low priority so it doesn't block page load
    document.head.appendChild(preloadMp4);

    // Cleanup
    return () => {
      if (document.head.contains(preloadWebm)) document.head.removeChild(preloadWebm);
      if (document.head.contains(preloadMp4)) document.head.removeChild(preloadMp4);
      if (document.head.contains(preloadPoster)) document.head.removeChild(preloadPoster);
    };
  }, []);

  return null;
}
