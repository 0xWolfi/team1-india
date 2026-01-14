"use client";

import React, { useState } from "react";
// NOTE: We intentionally use <img> for cover images here because Next/Image can
// break for unconfigured remote hosts in some deployments (shows a broken placeholder).
import Link from "next/link";
import { 
    Calendar, Users, FileText, BookOpen, Beaker, Vote, 
    ArrowRight, Filter, LayoutGrid, List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberHeader } from "./MemberHeader";
import { Guide, Program, Event } from "@/types/public";
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

interface MemberDashboardProps {
    user: any;
    events: Event[];
    programs: Program[];
    content: Guide[];
    playbooks: any[];
    experiments: ExperimentMock[];
}

type Tab = "EVENTS" | "PROGRAMS" | "CONTENT";
type ViewFilter = "ALL" | "MEMBER" | "PUBLIC";

export function MemberDashboard({ 
    user, 
    events = [], 
    programs = [], 
    content = [], 
    playbooks = [], 
    experiments = [] 
}: MemberDashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>("EVENTS");
    const [viewFilter, setViewFilter] = useState<ViewFilter>("ALL");

    // Filter Logic
    const filterByView = (items: any[]) => {
        if (viewFilter === "ALL") return items;
        return items.filter(item => item.visibility === viewFilter);
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

    // Experiment Split
    const activeExperiments = experiments.filter(e => e.stage === 'accepted' || e.stage === 'active');
    const proposals = experiments.filter(e => e.stage === 'proposed' || e.stage === 'discussion');

    return (
        <div className="min-h-screen text-white">
            <MemberHeader user={user} />

            {/* Controls & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                {/* Tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
                    {(["EVENTS", "PROGRAMS", "CONTENT"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                                activeTab === tab 
                                    ? "bg-indigo-600 text-white shadow-lg" 
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-lg p-1 px-2 self-start md:self-auto">
                    <Filter className="w-3 h-3 text-zinc-500" />
                    <select 
                        value={viewFilter}
                        onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
                        className="bg-transparent text-xs font-bold uppercase text-zinc-300 focus:outline-none cursor-pointer tracking-wider"
                    >
                        <option value="ALL">All View</option>
                        <option value="MEMBER">Member Only</option>
                        <option value="PUBLIC">Public</option>
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="mb-16">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{activeTab}</h2>
                    <Link 
                        href={`/member/${activeTab.toLowerCase()}`}
                        className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        See All <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {activeItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeItems.slice(0, 6).map((item: any) => (
                            <Link 
                                key={item.id} 
                                href={`/member/${activeTab.toLowerCase()}/${item.id}`}
                                className="group block h-[280px] bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col"
                            >
                                <div className="h-40 bg-zinc-800 relative overflow-hidden">
                                    {item.coverImage ? (
                                        <img
                                            src={item.coverImage}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = "none";
                                                if (target.parentElement) {
                                                    target.parentElement.innerHTML = `
                                                        <div class="w-full h-full flex items-center justify-center bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                                            <svg class="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                                            </svg>
                                                        </div>
                                                    `;
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                            {activeTab === 'EVENTS' && <Calendar className="w-8 h-8 text-zinc-600" />}
                                            {activeTab === 'PROGRAMS' && <Users className="w-8 h-8 text-zinc-600" />}
                                            {activeTab === 'CONTENT' && <FileText className="w-8 h-8 text-zinc-600" />}
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border backdrop-blur-md",
                                            item.visibility === 'MEMBER' 
                                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/20" 
                                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/20"
                                        )}>
                                            {item.visibility}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-bold text-white leading-tight mb-2 group-hover:text-zinc-200 line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                            View Details
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            </Link>
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
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                             <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold">Playbooks</h2>
                    </div>
                    <Link 
                        href="/member/playbooks"
                        className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        View All <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {playbooks.slice(0, 4).map((playbook: any) => (
                        <Link 
                            key={playbook.id} 
                            href={`/member/playbooks/${playbook.id}`}
                            className="group p-5 rounded-2xl bg-zinc-900 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all"
                        >
                            <div className="mb-4">
                                {playbook.coverImage ? (
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3 bg-zinc-800">
                                        <img
                                            src={playbook.coverImage}
                                            alt={playbook.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = "none";
                                                if (target.parentElement) {
                                                    target.parentElement.innerHTML = `
                                                        <div class="w-full h-full flex items-center justify-center bg-zinc-800/50">
                                                            <svg class="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                                            </svg>
                                                        </div>
                                                    `;
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                        <BookOpen className="w-5 h-5 text-zinc-500" />
                                    </div>
                                )}
                                <h3 className="font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
                                    {playbook.title}
                                </h3>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                                {playbook.description || "No description provided."}
                            </p>
                        </Link>
                    ))}
                    {playbooks.length === 0 && (
                         <div className="col-span-full py-10 text-center border border-white/5 border-dashed rounded-xl">
                            <p className="text-zinc-500 text-sm">No playbooks available.</p>
                         </div>
                    )}
                </div>
            </div>

            {/* Experiments & Proposals - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
                
                {/* Experiments (Active) */}
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/5 rounded-lg text-zinc-300">
                                <Beaker className="w-5 h-5" />
                             </div>
                             <div>
                                <h2 className="text-xl font-bold">Active Experiments</h2>
                                <p className="text-xs text-zinc-500 mt-1">Ongoing initiatives and pilots</p>
                             </div>
                        </div>
                        <Link href="/member/experiments" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <ArrowRight className="w-4 h-4 text-zinc-500" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {activeExperiments.length > 0 ? activeExperiments.slice(0, 3).map((exp) => (
                            <Link 
                                key={exp.id}
                                href={`/member/experiments/${exp.id}`}
                                className="block p-4 bg-zinc-800/20 border border-white/5 rounded-xl hover:border-white/20 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors mb-1">{exp.title}</h4>
                                        <p className="text-xs text-zinc-500 line-clamp-1">{exp.description}</p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-zinc-400 border border-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all">
                                        {exp.stage}
                                    </span>
                                </div>
                            </Link>
                        )) : (
                            <div className="py-8 text-center bg-black/20 rounded-xl border border-white/5 border-dashed">
                                <p className="text-zinc-500 text-xs">No active experiments.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Proposals */}
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/5 rounded-lg text-zinc-300">
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

                    <div className="space-y-4">
                        {proposals.length > 0 ? proposals.slice(0, 3).map((prop) => (
                            <Link 
                                key={prop.id}
                                href={`/member/experiments/${prop.id}`}
                                className="block p-4 bg-zinc-800/20 border border-white/5 rounded-xl hover:border-white/20 transition-all group"
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

            </div>
        </div>
    );
}
