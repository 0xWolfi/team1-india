"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    isEmpty = false,
    children
}: SectionCarouselProps & { direction?: 'left' | 'right', enableScroll?: boolean, isEmpty?: boolean }) {
    // Duplicate children for infinite loop effect
    const items = React.Children.toArray(children);
    // Ensure we have enough items for a smooth loop (at least 2 sets, potentially more if very few items)
    const scrollingContent = enableScroll && !isEmpty ? [...items, ...items, ...items, ...items] : [];

    return (
        <section
            id={id}
            className="py-8 relative scroll-mt-24 overflow-hidden md:py-8"
        >
            <div className="container mx-auto px-6 relative z-10 w-full">
                <div className="flex flex-col items-center text-center md:flex-row md:items-end md:text-left justify-between mb-8 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
                            {description}
                        </p>
                    </div>
                    
                    {/* Desktop See All Button */}
                    <Link 
                        href={seeAllLink}
                        className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 px-4 py-2 rounded-lg transition-all"
                    >
                        {seeAllText}
                        <ArrowRight className="w-4 h-4"/>
                    </Link>
                </div>
            </div>

            {/* Mobile View: Horizontal Scroll (Max 5 items) */}
            <div className="md:hidden container mx-auto px-6 mb-8">
                {isEmpty ? (
                     <div className="w-full">
                        {children}
                    </div>
                ) : (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-6 px-6 scrollbar-hide">
                        {items.slice(0, 5).map((child, index) => (
                            <div key={index} className="shrink-0 snap-center w-[80vw] min-w-[240px] sm:w-[280px]">
                                {child}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Mobile See All Button (Bottom) */}
                <Link 
                    href={seeAllLink}
                    className="flex w-full justify-center items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 px-4 py-3 rounded-xl transition-all mt-4"
                >
                    {seeAllText}
                    <ArrowRight className="w-4 h-4"/>
                </Link>
            </div>

            {/* Desktop View: Marquee or Grid */}
            <div className="hidden md:block">
                {isEmpty ? (
                    <div className="container mx-auto px-6">
                        {children}
                    </div>
                ) : enableScroll ? (
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
                    /* Static Container or Grid Fallback */
                    <div className="container mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {children}
                    </div>
                )}
            </div>
            
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
                /* Hide scrollbar for Chrome, Safari and Opera */
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                .scrollbar-hide {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
        </section>
    );
}
