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
        // Simple JSON to string dump for now, or actual markdown conversion if Body is JSON
        // Assuming Editor content is passed as JSON string
        const content = typeof playbook.body === 'string' ? playbook.body : JSON.stringify(playbook.body, null, 2);
        navigator.clipboard.writeText(content);
    };

    return (
        <div className={cn("min-h-screen bg-[#050505] text-white selection:bg-purple-500/30", className)}>
            {/* Dark Overlay for Reading Mode */}
             <div className="fixed inset-0 bg-black/20 pointer-events-none z-0" />

            {/* Top Navigation Bar */}
            <div className="fixed top-0 w-full z-50 px-6 h-16 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-white/5">
                <Link href={backLink} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {backLabel}
                </Link>
                <div className="flex items-center gap-3">
                    {headerActions}
                </div>
            </div>

            {/* Hero / Banner */}
            <div className="relative pt-32 pb-12 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                     {/* Title Area */}
                    <div className="lg:col-span-3 space-y-4">
                        {playbook.coverImage && (
                             <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-white/10 relative mb-6 group">
                                <img src={playbook.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                             </div>
                        )}
                        
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                            {playbook.title}
                        </h1>
                        {playbook.description && (
                            <p className="text-lg text-zinc-400 max-w-3xl leading-relaxed">
                                {playbook.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
                
                {/* Left Column: Content */}
                <div className="lg:col-span-3 space-y-12">
                     {/* Editor Canvas */}
                    <div className="min-h-[500px]">
                        {children}
                    </div>

                    {/* Helpful Widget */}
                    <HelpfulWidget onCopyMarkdown={handleCopyMarkdown} />
                </div>

                {/* Right Column: Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Metadata Card */}
                    <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 space-y-6">
                        <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Details</h3>
                        
                        <div className="space-y-4">
                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase border border-white/10">
                                    {playbook.createdBy?.name?.[0] || playbook.createdBy?.email?.[0] || 'T'}
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500">Written by</div>
                                    <div className="text-sm font-medium text-zinc-200">
                                        {playbook.createdBy?.name || playbook.createdBy?.email?.split('@')[0] || 'Team 1'}
                                    </div>
                                </div>
                            </div>

                            {/* Updated At */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                                    <Clock className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500">Last Updated</div>
                                    <div className="text-sm font-medium text-zinc-200">
                                        {formatDistanceToNow(new Date(playbook.updatedAt))} ago
                                    </div>
                                </div>
                            </div>
                            
                             {/* Created At (Optional) */}
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                                    <Calendar className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500">Published on</div>
                                    <div className="text-sm font-medium text-zinc-200">
                                        {new Date(playbook.createdAt || Date.now()).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Topics (Placeholder logic for now) */}
                        <div className="pt-6 border-t border-white/5 space-y-3">
                            <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2">Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {['Guide', 'Documentation', 'Process'].map(tag => (
                                    <span key={tag} className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] text-zinc-400 border border-white/5">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Reach Out / Custom Sidebar Actions */}
                    <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 space-y-4">
                        <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Have Questions?</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Need help implementing this playbook? Reach out to the author or the core team.
                        </p>
                        {sidebarActions || (
                             <a 
                                href="mailto:support@team1.india" 
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors"
                             >
                                Reach Out <ArrowUpRight className="w-4 h-4" />
                             </a>
                        )}
                    </div>

                </div>
            </div>
            
            <Footer />
        </div>
    );
}
