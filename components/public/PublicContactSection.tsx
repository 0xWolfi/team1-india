"use client";

import React, { useState } from "react";
import { ArrowUpRight, FolderOpen, Mail } from "lucide-react";
import Link from "next/link";
// @ts-ignore
import MemberChecker from "@/components/public/MemberChecker";
import { ContactModal } from "./ContactModal";
import { MediaKitModal } from "./MediaKitModal";

interface MediaItem {
    id: string;
    title: string | null;
    links: string[];
    description: string | null;
}

export default function PublicContactSection({ mediaItems = [] }: { mediaItems?: MediaItem[] }) {
    const [showContact, setShowContact] = useState(false);
    const [showMedia, setShowMedia] = useState(false);

    return (
        <>
            <section 
                id="contact" 
                className="min-h-[100dvh] snap-center flex flex-col justify-center items-center py-8 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] scroll-mt-24 md:min-h-0 md:block md:items-stretch md:py-20"
                style={{ scrollSnapStop: 'always' }}
            >
                <div className="container mx-auto px-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        
                        {/* Verify Membership (Desktop Only) */}
                        <div id="verify-desktop" className="hidden md:block bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-3xl p-8 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors scroll-mt-32">
                            <h3 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">Verify Member</h3>
                            <MemberChecker />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                            {/* Contact Trigger */}
                            <button
                                onClick={() => setShowContact(true)}
                                className="bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-3xl p-6 md:p-8 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 hover:border-black/10 dark:hover:border-white/10 transition-all text-left flex flex-col justify-between group min-h-[180px] md:min-h-[250px]"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4 md:mb-6 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                                        <Mail className="w-6 h-6"/>
                                    </div>
                                    <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Contact Us</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 md:line-clamp-none">Reach out for partnerships, events, and press inquiries.</p>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white mt-4 md:mt-8 text-sm font-medium">
                                    View Options <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                                </div>
                            </button>

                            {/* Media Kit Trigger */}
                            <button
                                onClick={() => setShowMedia(true)}
                                className="bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-3xl p-6 md:p-8 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 hover:border-black/10 dark:hover:border-white/10 transition-all text-left flex flex-col justify-between group min-h-[180px] md:min-h-[250px]"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4 md:mb-6 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                                        <FolderOpen className="w-6 h-6"/>
                                    </div>
                                    <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Media Kit</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 md:line-clamp-none">Download official logos, brand guidelines, and assets.</p>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white mt-4 md:mt-8 text-sm font-medium">
                                    Open Kit <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                                </div>
                            </button>
                        </div>

                    </div>
                </div>

                {/* Modals */}
                <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
                <MediaKitModal isOpen={showMedia} onClose={() => setShowMedia(false)} mediaItems={mediaItems} />
            </section>

            {/* Verify Membership (Mobile Standalone) */}
            <section 
                id="verify-mobile" 
                className="md:hidden min-h-[100dvh] snap-center flex flex-col justify-center items-center py-20 px-6 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
                style={{ scrollSnapStop: 'always' }}
            >
                <div className="bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-3xl p-8 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors w-full text-center">
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">Verify Member</h3>
                    <MemberChecker />
                </div>
            </section>
        </>
    );
}
