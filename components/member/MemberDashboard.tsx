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
import { Guide, Program, Event } from "@/types/public";
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
                    className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4 hover:bg-amber-500/20 transition-colors group backdrop-blur-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Complete Your Profile</h3>
                            <p className="text-sm text-zinc-400">Please fill in your name, X handle, telegram, and wallet address to complete your profile.</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
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
                                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20" 
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
                        className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors px-3 py-2 rounded-lg shrink-0", glassClass)}
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
                            className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors px-3 py-2 rounded-lg shrink-0", glassClass)}
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
                         <div className="col-span-full w-full h-40 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center border-dashed">
                            <p className="text-zinc-500 font-medium text-sm">
                                {playbookSearch ? `No playbooks matching "${playbookSearch}".` : "No playbooks available."}
                            </p>
                         </div>
                    )}
                </div>
            </div>

            {/* New Proposals & Member Details - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">

                {/* New Proposals */}
                <Link href="/member/experiments" className={cn("rounded-3xl p-6 md:p-8 relative overflow-hidden group flex flex-col", glassClass)}>
                     
                     <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/5 rounded-lg text-zinc-300 border border-white/5">
                                <Vote className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                             </div>
                             <div>
                                <h2 className="text-xl font-bold group-hover:text-white transition-colors">New Proposals</h2>
                                <p className="text-xs text-zinc-500 mt-1">Vote on upcoming ideas</p>
                             </div>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                             <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center p-5 bg-zinc-800/30 border border-white/5 rounded-xl group-hover:bg-zinc-800/50 transition-colors">
                        {proposals.length > 0 ? (
                            <>
                                <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors mb-2">
                                    {proposals.length} Active Proposal{proposals.length !== 1 && 's'}
                                </h4>
                                <div className="space-y-2">
                                    {proposals.slice(0, 2).map((prop) => (
                                         <div key={prop.id} className="flex items-center gap-2 text-xs text-zinc-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                            <span className="truncate">{prop.title}</span>
                                         </div>
                                    ))}
                                    {proposals.length > 2 && (
                                        <div className="text-[10px] text-zinc-600 pl-3.5">
                                            +{proposals.length - 2} more
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-zinc-400 leading-relaxed text-center">
                                No active proposals at the moment. Check back later or start a new discussion.
                            </p>
                        )}
                    </div>
                </Link>

                {/* Member Details */}
                <Link href="/member/directory" className={cn("rounded-3xl p-6 md:p-8 relative overflow-hidden group flex flex-col", glassClass)}>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/5 rounded-lg text-zinc-300 border border-white/5">
                                <Users className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                             </div>
                             <div>
                                <h2 className="text-xl font-bold group-hover:text-white transition-colors">Member Directory</h2>
                                <p className="text-xs text-zinc-500 mt-1">Connect with the community</p>
                             </div>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                             <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 flex items-center p-5 bg-zinc-800/30 border border-white/5 rounded-xl group-hover:bg-zinc-800/50 transition-colors">
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Connect with other builders, mentors, and contributors. Find peers and collaborate on new ideas.
                        </p>
                    </div>
                </Link>

            </div>
            
        </div>
    );
}
