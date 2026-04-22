"use client";

import React from 'react';
import { ExternalLink, Image } from "lucide-react";
import Link from 'next/link';

interface MediaItem {
    id: string;
    title?: string | null;
    description?: string | null;
    platform: string[];
    links: string[];
    createdAt: Date;
    createdBy?: { name?: string | null } | null;
}

interface PublicMediaKitSectionProps {
    mediaItems: MediaItem[];
}

export default function PublicMediaKitSection({ mediaItems }: PublicMediaKitSectionProps) {
    if (!mediaItems || mediaItems.length === 0) return null;

    return (
        <section className="space-y-8">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <Image className="w-5 h-5 text-pink-400"/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">Media Kit & Assets</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Official brand assets, logos, and media content.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mediaItems.map((item) => (
                    <div key={item.id} className="bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 rounded-2xl p-6 hover:border-black/10 dark:hover:border-white/10 transition-all group flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-wrap gap-2">
                                {item.platform && item.platform.length > 0 ? item.platform.map((p, i) => (
                                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full border border-black/5 dark:border-white/5">
                                        {p}
                                    </span>
                                )) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full border border-black/5 dark:border-white/5">
                                        Asset
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-black dark:text-white mb-2 group-hover:text-pink-400 transition-colors line-clamp-1">
                            {item.title || "Untitled Asset"}
                        </h3>
                        
                        {item.description && (
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-3 mb-6 flex-1">
                                {item.description}
                            </p>
                        )}

                        <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex flex-col gap-2">
                            {item.links && item.links.length > 0 ? (
                                item.links.map((link, idx) => (
                                    <Link 
                                        key={idx} 
                                        href={link} 
                                        target="_blank"
                                        className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-black/20 px-3 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-black/40 hover:text-black dark:hover:text-white transition-all group/link"
                                    >
                                        <span className="truncate max-w-[200px]">{link.replace(/^https?:\/\//, '')}</span>
                                        <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover/link:text-pink-400"/>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-xs text-zinc-400 dark:text-zinc-600 italic px-2">No links attached</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
