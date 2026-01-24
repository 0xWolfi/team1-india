"use client";

import React, { useState } from "react";
import { Mail, Download, ArrowUpRight, Palette, FolderOpen } from "lucide-react";
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
        <section id="contact" className="py-20 scroll-mt-24">
            <div className="container mx-auto px-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Verify Membership (Top) */}
                    <div id="verify" className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 hover:bg-zinc-900/50 transition-colors scroll-mt-32">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">Verify Membership</h3>
                        <MemberChecker />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        {/* Contact Trigger */}
                        <button 
                            onClick={() => setShowContact(true)}
                            className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 hover:bg-zinc-900/50 hover:border-white/10 transition-all text-left flex flex-col justify-between group min-h-[250px]"
                        >
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Contact Us</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">Reach out for partnerships, events, and press inquiries.</p>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400 group-hover:text-white mt-8 text-sm font-medium">
                                View Options <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                        </button>

                        {/* Media Kit Trigger */}
                        <button 
                            onClick={() => setShowMedia(true)}
                            className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 hover:bg-zinc-900/50 hover:border-white/10 transition-all text-left flex flex-col justify-between group min-h-[250px]"
                        >
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Media Kit</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">Download official logos, brand guidelines, and assets.</p>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400 group-hover:text-white mt-8 text-sm font-medium">
                                Open Kit <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                        </button>
                    </div>

                </div>
            </div>

            {/* Modals */}
            <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
            <MediaKitModal isOpen={showMedia} onClose={() => setShowMedia(false)} mediaItems={mediaItems} />
        </section>
    );
}
