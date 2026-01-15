"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Hash, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { HelpfulWidget } from "./HelpfulWidget";
import { Footer } from "@/components/website/Footer";
import { cn } from "@/lib/utils";

interface PlaybookShellProps {
    playbook: {
        id: string;
        title: string;
        description?: string;
        coverImage?: string;
        createdAt?: string | Date;
        updatedAt: string | Date;
        createdBy?: { email: string; name?: string };
        body?: any;
    };
    backLink: string;
    backLabel?: string;
    children: React.ReactNode;
    sidebarActions?: React.ReactNode; 
    headerActions?: React.ReactNode; // For edit buttons etc.
    className?: string;
}

export function PlaybookShell({ 
    playbook, 
    backLink, 
    backLabel = "Back to Dashboard", 
    children, 
    sidebarActions, 
    headerActions,
    className
}: PlaybookShellProps) {

    const handleCopyMarkdown = () => {
        const content = typeof playbook.body === 'string' ? playbook.body : JSON.stringify(playbook.body, null, 2);
        navigator.clipboard.writeText(content);
    };

    return (
        <div className={cn("min-h-screen text-white selection:bg-purple-500/30 font-sans", className)}>
            
            {/* Top Navigation Bar (Transparent, for Action Buttons only) */}
            <div className="fixed top-0 w-full z-50 px-6 h-16 flex items-center justify-between pointer-events-none">
                 <div /> {/* Spacer */}
                 <div className="flex items-center gap-3 pointer-events-auto bg-black/50 backdrop-blur-md rounded-full px-4 py-2 mt-4 border border-white/10">
                    {headerActions}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
                {/* Reference-Style Banner, adapted to Website Theme */}
                <div className="relative w-full rounded-3xl overflow-hidden min-h-[300px] flex flex-col justify-center p-8 md:p-12 mb-12 group border border-white/10 bg-zinc-900/50">
                    
                    {/* Background: Image or Subtle Gradient */}
                    <div className="absolute inset-0 z-0">
                        {playbook.coverImage ? (
                            <>
                                <img src={playbook.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/70" /> {/* Darker overlay for readability */}
                            </>
                        ) : (
                             // Theme-Aligned Gradient (Subtle Zinc/Black with slight top highlight)
                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black" />
                        )}
                         {/* Noise Texture for 'Sand' feel */}
                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    </div>

                    {/* Banner Content */}
                    <div className="relative z-10 space-y-6 max-w-4xl">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                            {playbook.title}
                        </h1>
                        {playbook.description && (
                            <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed font-medium">
                                {playbook.description}
                            </p>
                        )}
                        
                        {/* Back Button inside Banner */}
                        <div className="pt-4">
                            <Link 
                                href={backLink} 
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/5 backdrop-blur-md"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {backLabel}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-24 relative z-10">
                    
                    {/* Left Column: Content */}
                    <div className="lg:col-span-3 space-y-12">
                         {/* Editor Canvas */}
                        <div className="min-h-[500px]">
                            {children}
                        </div>

                        {/* Helpful Widget */}
                        <div className="pt-12 border-t border-zinc-800">
                             <HelpfulWidget onCopyMarkdown={handleCopyMarkdown} />
                        </div>
                    </div>

                    {/* Right Column: Sidebar (Minimalist) */}
                    <div className="lg:col-span-1 space-y-10">
                        
                        {/* Author Info */}
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-zinc-500">Written by</h3>
                            <div className="flex items-center gap-2">
                                <div className="text-base font-bold text-white">
                                    {playbook.createdBy?.name || playbook.createdBy?.email?.split('@')[0] || 'Team 1'}
                                </div>
                            </div>
                        </div>

                        {/* Date Info */}
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-zinc-500">On</h3>
                            <div className="text-base font-bold text-white">
                                 {new Date(playbook.createdAt || playbook.updatedAt).toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                 })}
                            </div>
                        </div>

                         {/* Topics */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-zinc-500">Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {['Avalanche L1', 'Safe', 'Builder Console'].map(tag => (
                                    <span key={tag} className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-medium">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                         <div className="h-px bg-zinc-800 w-full" />

                        {/* Sidebar Actions / Reach Out */}
                        <div className="space-y-4">
                            {sidebarActions || (
                                 <div className="space-y-2">
                                     <h3 className="text-sm font-medium text-zinc-500">Need Help?</h3>
                                     <a 
                                        href="mailto:support@team1.india" 
                                        className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5"
                                     >
                                        Reach out to the team <ArrowUpRight className="w-3.5 h-3.5" />
                                     </a>
                                 </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}
