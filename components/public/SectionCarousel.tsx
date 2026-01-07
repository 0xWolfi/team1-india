"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface SectionCarouselProps {
    id: string;
    title: string;
    description: string;
    seeAllLink: string;
    seeAllText?: string;
    children: React.ReactNode;
}

export default function SectionCarousel({
    id,
    title,
    description,
    seeAllLink,
    seeAllText = "See All",
    direction = "left",
    enableScroll = true,
    children
}: SectionCarouselProps & { direction?: 'left' | 'right', enableScroll?: boolean }) {
    // Duplicate children for infinite loop effect
    const items = React.Children.toArray(children);
    // Ensure we have enough items for a smooth loop (at least 2 sets, potentially more if very few items)
    const scrollingContent = enableScroll ? [...items, ...items, ...items, ...items] : [];

    return (
        <section id={id} className="py-8 relative scroll-mt-24 overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            {description}
                        </p>
                    </div>
                    
                    <Link 
                        href={seeAllLink}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition-all"
                    >
                        {seeAllText}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {enableScroll ? (
                /* Marquee Container */
                <div className="relative w-full overflow-hidden mask-gradient">
                    <div 
                        className="flex gap-6 animate-marquee w-max py-4 hover:pause"
                        style={{ animationDirection: direction === 'right' ? 'reverse' : 'normal' }}
                    >
                        {scrollingContent.map((child, index) => (
                            <div key={index} className="shrink-0">
                                {child}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Static Container */
                <div className="container mx-auto px-6">
                    {children}
                </div>
            )}
            
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); } 
                }
                .animate-marquee {
                    animation: marquee 120s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                .mask-gradient {
                    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
                }
                /* Mobile optimization */
                @media (max-width: 768px) {
                    .animate-marquee {
                        animation-duration: 90s;
                    }
                }
            `}</style>
        </section>
    );
}
