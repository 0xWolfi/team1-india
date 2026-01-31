"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Preloader() {
    const [visible, setVisible] = useState(true);
    const [fading, setFading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.body.style.overflow = "hidden";

        // Start filling text (Wait for outline to draw)
        const fillTimer = setTimeout(() => {
            setLoading(false); // Triggers the fill animation
        }, 1500);

        // Start fade out
        const fadeTimer = setTimeout(() => {
            setFading(true);
        }, 4000); // 1500ms + 2500ms for fill calculation

        // Remove from DOM
        const removeTimer = setTimeout(() => {
            setVisible(false);
            document.body.style.overflow = "unset";
        }, 4700);

        return () => {
             clearTimeout(fillTimer);
             clearTimeout(fadeTimer);
             clearTimeout(removeTimer);
             document.body.style.overflow = "unset";
        }
    }, []);

    if (!visible) return null;

    return (
        <div 
            className={cn(
                "fixed inset-0 z-[1000] bg-black flex items-center justify-center transition-opacity duration-700 ease-in-out", 
                fading ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            <svg 
                viewBox="0 0 800 120" 
                className="w-full max-w-4xl h-auto px-4"
            >
                <defs>
                    <clipPath id="text-fill-clip">
                        <rect x="0" y="0" width="100%" height="100%" style={{ 
                            transform: loading ? 'scaleX(0)' : 'scaleX(1)',
                            transformOrigin: 'left',
                            transition: 'transform 2s ease-in-out'
                        }} />
                    </clipPath>
                    <linearGradient id="avalanche-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                </defs>

                {/* Outline Layer (Always Visible, drawing in) */}
                <text 
                    x="50%" 
                    y="50%" 
                    dy=".35em" 
                    textAnchor="middle"
                    className="text-4xl md:text-6xl font-black tracking-tighter uppercase"
                >
                    <tspan className="fill-transparent stroke-red-500 stroke-[2px]" style={{ strokeDasharray: 800, strokeDashoffset: loading ? 800 : 0, transition: 'stroke-dashoffset 1.5s ease-in-out' }}>Avalanche </tspan>
                    <tspan className="fill-transparent stroke-white stroke-[2px]" style={{ strokeDasharray: 400, strokeDashoffset: loading ? 400 : 0, transition: 'stroke-dashoffset 1.5s ease-in-out' }}>Team</tspan>
                    <tspan className="fill-transparent stroke-red-500 stroke-[2px]" style={{ strokeDasharray: 100, strokeDashoffset: loading ? 100 : 0, transition: 'stroke-dashoffset 1.5s ease-in-out' }}>1</tspan>
                </text>

                {/* Fill Layer (Clipped, Wipes Left to Right) */}
                <g clipPath="url(#text-fill-clip)">
                    <text 
                        x="50%" 
                        y="50%" 
                        dy=".35em" 
                        textAnchor="middle"
                        className="text-4xl md:text-6xl font-black tracking-tighter uppercase"
                    >
                        <tspan fill="#ef4444">Avalanche </tspan>
                        <tspan fill="#ffffff">Team</tspan>
                        <tspan fill="#ef4444">1</tspan>
                    </text>
                </g>
            </svg>
        </div>
    );
}
