"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Preloader() {
    const [visible, setVisible] = useState(() => {
        if (typeof window !== "undefined") {
            return !sessionStorage.getItem("preloader_shown");
        }
        return true;
    });
    const [fading, setFading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!visible) return;

        sessionStorage.setItem("preloader_shown", "1");
        document.body.style.overflow = "hidden";

        const video = videoRef.current;
        if (video) {
            video.play().catch(() => {
                // Autoplay blocked — fade out after short delay
                startFadeOut();
            });
        }

        // Safety fallback: if video takes too long, fade out after 8s
        fallbackTimer.current = setTimeout(() => {
            startFadeOut();
        }, 8000);

        return () => {
            document.body.style.overflow = "unset";
            if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
        };
    }, [visible]);

    const startFadeOut = () => {
        if (fading) return;
        setFading(true);
        setTimeout(() => {
            setVisible(false);
            document.body.style.overflow = "unset";
        }, 700);
    };

    const handleVideoEnd = () => {
        if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
        startFadeOut();
    };

    if (!visible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[1000] bg-[var(--background)] transition-opacity duration-700 ease-in-out",
                fading ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            <video
                ref={videoRef}
                src="/preloader.mp4"
                muted
                playsInline
                onEnded={handleVideoEnd}
                className="absolute inset-0 w-full h-full object-cover"
            />
        </div>
    );
}
