"use client";

import React, { useState } from "react";
// NOTE: We intentionally use <img> for cover images here because Next/Image can
// break for unconfigured remote hosts in some deployments (shows a broken placeholder).
import Link from "next/link";
import {
    Calendar, Users, FileText, BookOpen, Vote,
    ArrowRight, Filter, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberHeader } from "./MemberHeader";
import { Guide, Program, Event } from "@/types/public";
import { Footer } from "@/components/website/Footer";
import { DashboardCard } from "./DashboardCard";
// We can define Experiment type here based on Prisma client if not imported, 
// using 'any' for now to speed up if types aren't strictly generated or exported for client.
// Better to define an interface matching the data passed.

interface ExperimentMock {
    id: string;
    title: string | null;
    description: string | null;
    stage: string | null;
    upvotes: number;
    createdAt: Date;
}

interface CommunityMember {
    id: string;
    name: string | null;
    email: string;
    xHandle?: string | null;
    telegram?: string | null;
    tags?: string | null;
}

interface MemberDashboardProps {
    user: any;
    events: Event[];
    programs: Program[];
    content: Guide[];
    playbooks: any[];
    experiments: ExperimentMock[];
    members: CommunityMember[];
    isProfileComplete?: boolean;
}

type Tab = "EVENTS" | "PROGRAMS" | "CONTENT";
type ViewFilter = "ALL" | "MEMBER" | "PUBLIC";

// SAND-GLASS UTILITY CLASS
const glassClass = "bg-zinc-900/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

export function MemberDashboard({
    user,
    events = [],
    programs = [],
    content = [],
    playbooks = [],
    experiments = [],
    members: _members = [],
    isProfileComplete = true
}: MemberDashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>("EVENTS");
    const [viewFilter, setViewFilter] = useState<ViewFilter>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [playbookSearch, setPlaybookSearch] = useState("");

    // Filter Logic
    const filterByView = (items: any[]) => {
        let filtered = items;
        if (viewFilter !== "ALL") {
            filtered = items.filter(item => item.visibility === viewFilter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.title?.toLowerCase().includes(query) || 
                item.description?.toLowerCase().includes(query)
            );
        }
        return filtered;
    };

    const getActiveContent = () => {
        switch (activeTab) {
            case "EVENTS": return filterByView(events);
            case "PROGRAMS": return filterByView(programs);
            case "CONTENT": return filterByView(content);
            default: return [];
        }
    };

    const activeItems = getActiveContent();

    // Filter Playbooks
    const filteredPlaybooks = playbooks.filter(p => 
        !playbookSearch || 
        p.title?.toLowerCase().includes(playbookSearch.toLowerCase()) || 
        p.description?.toLowerCase().includes(playbookSearch.toLowerCase())
    );

    // Proposals Split
    const proposals = experiments.filter(e => e.stage === 'proposed' || e.stage === 'discussion');

    return (
        <div className="min-h-screen text-white">
            <MemberHeader user={user} />

            {/* Profile Incomplete Notification */}
            {!isProfileComplete && (
                <Link
                    href="/member/profile"
                    className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4 hover:bg-amber-500/20 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-200">Complete Your Profile</h3>
                            <p className="text-sm text-amber-400/70">Please fill in your name, X handle, telegram, and wallet address to complete your profile.</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </Link>
            )}

            {/* Controls & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                {/* Tabs - Sleek Segmented Control */}
                <div className={cn("flex p-1 rounded-lg w-full md:w-fit", glassClass)}>
                    {(["EVENTS", "PROGRAMS", "CONTENT"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all text-center",
                                activeTab === tab 
                                    ? "bg-red-500/10 text-red-500 shadow-sm ring-1 ring-red-500/20" 
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Filter & Search */}
                <div className="flex gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className={cn("flex-1 md:w-64 flex items-center gap-2 rounded-lg px-3 py-2", glassClass)}>
                        <Search className="w-4 h-4 text-zinc-500" />
                        <input 
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
                        />
                    </div>
                    {/* Filter Toggle */}
                    <div className={cn("flex items-center gap-3 rounded-lg p-1 px-2 shrink-0", glassClass)}>
                        <Filter className="w-3 h-3 text-zinc-500" />
                        <select 
                            value={viewFilter}
                            onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
                            className="bg-transparent text-xs font-bold uppercase text-zinc-300 focus:outline-none cursor-pointer tracking-wider"
                        >
                            <option value="ALL" className="bg-zinc-900">All View</option>
                            <option value="MEMBER" className="bg-zinc-900">Member Only</option>
                            <option value="PUBLIC" className="bg-zinc-900">Public</option>
                        </select>
                    </div>
                    {/* See All Button - Beside Filter */}
                    <Link 
                        href={`/member/${activeTab.toLowerCase()}`}
                        className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors px-3 py-2 rounded-lg shrink-0", glassClass)}
                    >
                        See All <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="mb-16">


                {activeItems.length > 0 ? (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:pb-0 md:mx-0 md:px-0 scrollbar-hide">
                        {activeItems.slice(0, 6).map((item: any) => (
                            <DashboardCard
                                key={item.id}
                                id={item.id}
                                title={item.title || "Untitled"}
                                description={item.description}
                                coverImage={item.coverImage}
                                href={`/member/${activeTab.toLowerCase()}/${item.id}`}
                                type={activeTab === 'EVENTS' ? 'EVENT' : activeTab === 'PROGRAMS' ? 'PROGRAM' : 'CONTENT'}
                                visibility={item.visibility}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-40 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center border-dashed">
                        <p className="text-zinc-500 font-medium text-sm">No active {activeTab.toLowerCase()} found.</p>
                    </div>
                )}
            </div>

            {/* Playbooks Section */}
            <div className="mb-16">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold">Playbooks</h2>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Playbook Search */}
                         <div className={cn("flex-1 md:w-64 flex items-center gap-2 rounded-lg px-3 py-1.5", glassClass)}>
                            <Search className="w-4 h-4 text-zinc-500" />
                            <input 
                                type="text"
                                placeholder="Search playbooks..."
                                value={playbookSearch}
                                onChange={(e) => setPlaybookSearch(e.target.value)}
                                className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
                            />
                        </div>

                        <Link 
                            href="/member/playbooks"
                            className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors px-3 py-2 rounded-lg shrink-0", glassClass)}
                        >
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
                
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:pb-0 md:mx-0 md:px-0 scrollbar-hide">
                    {filteredPlaybooks.slice(0, 4).map((playbook: any) => (
                        <DashboardCard
                            key={playbook.id}
                            id={playbook.id}
                            title={playbook.title || "Untitled Playbook"}
                            description={playbook.description}
                            coverImage={playbook.coverImage}
                            href={`/member/playbooks/${playbook.id}`}
                            type='PLAYBOOK'
                            // Optional: Pass visibility if Playbooks have it, or omit to follow design
                        />
                    ))}
                    {filteredPlaybooks.length === 0 && (
                         <div className="col-span-full py-10 text-center border border-white/5 border-dashed rounded-xl">
                            <p className="text-zinc-500 text-sm">
                                {playbookSearch ? `No playbooks matching "${playbookSearch}".` : "No playbooks available."}
                            </p>
                         </div>
                    )}
                </div>
            </div>

            {/* New Proposals & Member Details - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">

                {/* New Proposals */}
                <div className={cn("rounded-3xl p-6 md:p-8 relative overflow-hidden", glassClass)}>
                     
                     <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/5 rounded-lg text-zinc-300 border border-white/5">
                                <Vote className="w-5 h-5" />
                             </div>
                             <div>
                                <h2 className="text-xl font-bold">New Proposals</h2>
                                <p className="text-xs text-zinc-500 mt-1">Vote on upcoming ideas</p>
                             </div>
                        </div>
                        <Link href="/member/experiments" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                             <ArrowRight className="w-4 h-4 text-zinc-500" />
                        </Link>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {proposals.length > 0 ? proposals.slice(0, 3).map((prop) => (
                            <Link
                                key={prop.id}
                                href={`/member/experiments/${prop.id}`}
                                className="block p-4 bg-zinc-800/30 border border-white/5 rounded-xl hover:border-white/20 transition-all group hover:bg-zinc-800/50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors mb-1">{prop.title}</h4>
                                        <p className="text-xs text-zinc-500 line-clamp-1">{prop.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 group-hover:text-zinc-300">
                                            <Vote className="w-3 h-3" /> {prop.upvotes}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="py-8 text-center bg-black/20 rounded-xl border border-white/5 border-dashed">
                                <p className="text-zinc-500 text-xs">No active proposals.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Member Details */}
                <Link href="/member/directory" className={cn("rounded-3xl p-6 md:p-8 hover:border-white/20 transition-all group block relative overflow-hidden", glassClass)}>
                    
                    <div className="flex items-center justify-between relative z-10 h-full">
                        <div className="flex items-center gap-4">
                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Users className="w-8 h-8 text-zinc-400 group-hover:text-red-400 transition-colors" />
                             </div>
                             <div>
                                <h2 className="text-2xl font-bold group-hover:text-white transition-colors">Member Directory</h2>
                                <p className="text-sm text-zinc-500 mt-1 max-w-xs leading-relaxed">Connect with other builders, mentors, and contributors in the community.</p>
                             </div>
                        </div>
                        <div className="p-4 rounded-full border border-white/5 bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ArrowRight className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </Link>

            </div>
            
            <Footer />
        </div>
    );
}
