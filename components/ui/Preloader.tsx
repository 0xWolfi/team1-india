"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Preloader() {
    const [visible, setVisible] = useState(true);
    const [fading, setFading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.body.style.overflow = "hidden";

        // Start filling text
        const fillTimer = setTimeout(() => {
            setLoading(false); // Triggers the fill animation to complete
        }, 100);

        // Start fade out
        const fadeTimer = setTimeout(() => {
            setFading(true);
        }, 2500); // Wait for fill to complete + pause

        // Remove from DOM
        const removeTimer = setTimeout(() => {
            setVisible(false);
            document.body.style.overflow = "unset";
        }, 3200);

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
            <div className="flex items-center gap-4">
                {/* Logo with Fill Animation */}
                <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0">
                     {/* Background (Dim) */}
                     <img 
                        src="/t1-red-logo.png" 
                        alt="Team1" 
                        className="w-full h-full object-contain opacity-20 grayscale"
                     />
                     
                     {/* Foreground (Fill) */}
                     <div 
                        className="absolute top-0 left-0 h-full transition-all duration-[2000ms] ease-out overflow-hidden"
                        style={{ width: loading ? '0%' : '100%' }}
                     >
                         <img 
                            src="/t1-red-logo.png" 
                            alt="Team1" 
                            className="w-[3rem] h-[3rem] md:w-[4rem] md:h-[4rem] max-w-none object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                         />
                     </div>
                </div>
                
                {/* Text with Fill Animation */}
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase relative overflow-hidden">
                    <span className="text-zinc-800">Team1</span>
                    {/* Shimmer */}
                    <span 
                        className="absolute inset-0 text-white animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent bg-clip-text text-transparent"
                        style={{ backgroundSize: '200% auto' }}
                    >
                        Team1
                    </span>
                    {/* Fill effect */}
                    <span 
                        className="absolute inset-0 text-white transition-all duration-[2000ms] ease-out overflow-hidden whitespace-nowrap"
                        style={{ width: loading ? '0%' : '100%' }}
                    >
                        Team1
                    </span>
                </h1>
            </div>
        </div>
    );
}
