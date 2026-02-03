"use client";

import React from "react";
import { Team1Logo } from "@/components/Team1Logo";
import { cn } from "@/lib/utils";

export function ThemeLoader() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-6">
                
                {/* Glassy Container for Logo */}
                <div className="relative group">
                     {/* Glow effect */}
                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative w-20 h-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                        <div className="relative z-10">
                            <Team1Logo className="w-8 h-8 opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Text & Loader */}
                <div className="flex flex-col items-center gap-3">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                        Initiating
                    </span>
                    
                    {/* Progress Bar */}
                    <div className="w-16 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-500 w-1/2 animate-[shimmer_1s_infinite_linear] rounded-full" style={{
                            backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
                        }} />
                        <div className="h-full w-full bg-zinc-600/50 origin-left animate-[progress_1.5s_ease-in-out_infinite]" />
                    </div>
                </div>

            </div>
            
             <style jsx>{`
                @keyframes progress {
                    0% { transform: scaleX(0); opacity: 0; }
                    50% { transform: scaleX(0.7); opacity: 1; }
                    100% { transform: scaleX(1); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
