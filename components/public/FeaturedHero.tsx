"use client";

import React from 'react';
import Image from "next/image";
import Link from 'next/link';
import { ArrowRight, Clock } from "lucide-react";
interface HeroItem {
    id: string;
    title: string;
    type: 'Guide' | 'Playbook' | 'Event' | string;
    description?: string;
    coverImage?: string;
    href: string;
    createdAt?: string;
    author?: string;
    date?: string; // For events
    location?: string; // For events
    tags?: string[];
}

export default function FeaturedHero({ item }: { item: HeroItem }) {
    if (!item) return null;

    return (
        <section className="relative w-full aspect-[21/9] md:aspect-[2.5/1] overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 group">
            {/* Background Image */}
            <div className="absolute inset-0">
                {item.coverImage ? (
                    <Image
                        src={item.coverImage}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-200 dark:from-zinc-800 via-zinc-100 dark:via-zinc-900 to-white dark:to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
                <div className="max-w-3xl space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-full">
                            Featured {item.type}
                        </span>
                        {item.createdAt && (
                             <span className="text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-black/10 dark:border-white/10">
                                <Clock className="w-3 h-3"/> {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                        {item.title}
                    </h1>
                    
                    {item.description && (
                        <p className="text-zinc-600 dark:text-zinc-300 text-lg md:text-xl line-clamp-2 max-w-2xl leading-relaxed text-shadow-sm">
                            {item.description}
                        </p>
                    )}

                    <div className="pt-4">
                        <Link 
                            href={item.href}
                            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all active:scale-95"
                        >
                            Read Now <ArrowRight className="w-4 h-4"/>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
