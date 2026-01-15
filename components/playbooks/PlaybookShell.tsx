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
    className?: string; // Outer container class
    contentClassName?: string; // Inner container class (for padding overrides)
}

export function PlaybookShell({ 
    playbook, 
    backLink, 
    backLabel = "Back to Dashboard", 
    children, 
    sidebarActions, 
    headerActions,
    className,
    contentClassName
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
                 {headerActions && (
                    <div className="flex items-center gap-3 pointer-events-auto bg-black/50 backdrop-blur-md rounded-full px-4 py-2 mt-4 border border-white/10">
                        {headerActions}
                    </div>
                 )}
            </div>

            <div className={cn("max-w-7xl mx-auto px-6 pt-24 pb-12", contentClassName)}>
                {/* Banner & Back Button Container */}
                <div className="relative w-full rounded-3xl overflow-hidden min-h-[300px] mb-16 group border border-white/5 bg-zinc-900/50 shadow-2xl shadow-black/50 ring-1 ring-white/10">
                    
                    {/* Back Button (Absolute Top Left) */}
                    <div className="absolute top-6 left-6 z-20">
                        <Link 
                            href={backLink} 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 text-white text-sm font-medium hover:bg-black/40 transition-all border border-white/10 backdrop-blur-md group/back"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-0.5 transition-transform" />
                            {backLabel}
                        </Link>
                    </div>

                    {/* Background: Image or Subtle Gradient */}
                    <div className="absolute inset-0 z-0">
                        {playbook.coverImage ? (
                            <>
                                <img src={playbook.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/20" /> {/* Lighter overlay since text is outside */}
                            </>
                        ) : (
                             // Theme-Aligned Gradient
                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black" />
                        )}
                         {/* Noise Texture */}
                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    </div>
                </div>

                {/* Title & Description (Moved Below Banner) */}
                <div className="max-w-4xl space-y-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        {playbook.title}
                    </h1>
                    {playbook.description && (
                        <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl leading-relaxed font-medium">
                            {playbook.description}
                        </p>
                    )}
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
                        <div className="pt-12 border-t border-white/5">
                             <HelpfulWidget onCopyMarkdown={handleCopyMarkdown} />
                        </div>
                    </div>

                    {/* Right Column: Sidebar (Minimalist) */}
                    <div className="lg:col-span-1 space-y-8 h-fit sticky top-24">
                        
                        {/* Author Info */}
                        <div className="space-y-2">
                            <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-600">Written by</h3>
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-zinc-200">
                                    {playbook.createdBy?.name || playbook.createdBy?.email?.split('@')[0] || 'Team 1'}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/5 w-full" />

                        {/* Need Help Info (2nd Position) */}
                        <div className="space-y-2">
                            <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-600">Need Help?</h3>
                            <a 
                                href="mailto:support@team1.india" 
                                className="flex items-center gap-2 text-sm font-medium text-white hover:text-zinc-300 transition-colors group"
                            >
                                Reach out to the team 
                                <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </a>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/5 w-full" />

                        {/* Date Info */}
                        <div className="space-y-2">
                            <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-600">On</h3>
                            <div className="text-sm font-medium text-zinc-200">
                                 {new Date(playbook.createdAt || playbook.updatedAt).toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                 })}
                            </div>
                        </div>

                         {/* Divider */}
                         <div className="h-px bg-white/5 w-full" />

                        {/* Sidebar Actions */}
                        <div className="space-y-4">
                            {sidebarActions}
                        </div>

                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}
