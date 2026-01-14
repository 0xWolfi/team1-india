"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Star, Zap, LayoutGrid } from 'lucide-react';
import ApplicationModal from './ApplicationModal';

interface HeroItem {
    id: string;
    title: string;
    type: 'Guide' | 'Playbook' | 'Event' | string;
    description?: string;
    coverImage?: string;
    href: string;
    createdAt?: string;
}

export default function PublicHero({ heroItem }: { heroItem?: HeroItem }) {
    const [showApplication, setShowApplication] = useState(false);

    return (
        <section className="w-full space-y-8">


            {/* Dashboard Header Content */}
            <div className="flex flex-col items-center justify-center space-y-8 py-20 md:py-32">
                
                {/* Brand Identity & Context */}
                <div className="flex flex-col items-center text-center max-w-4xl space-y-8 px-4">
                    <div>
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-medium mb-8">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Public Knowledge Base
                        </div>
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8">
                            Public <span className="text-zinc-500">Directory</span>
                        </h1>
                        <p className="text-zinc-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                            Access our curated collection of guides, playbooks, and community resources. Built for transparency and collaboration.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                            <button onClick={() => setShowApplication(true)} className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2 text-lg">
                                <Zap className="w-5 h-5 fill-black" /> Apply for Membership
                            </button>
                            <Link href="#playbooks" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 text-lg">
                                <LayoutGrid className="w-5 h-5" /> Browse Resources
                            </Link>
                        </div>
                    </div>

                </div>

                {/* Application Modal */}
                <ApplicationModal isOpen={showApplication} onClose={() => setShowApplication(false)} />
            </div>
        </section>
    );
}
