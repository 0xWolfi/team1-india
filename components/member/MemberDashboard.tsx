"use client";

import React, { useState } from "react";
import { ContributionModal } from "./ContributionModal";
import Link from "next/link";
import { MotionIcon } from "motion-icons-react";
import { cn } from "@/lib/utils";
import { Guide, Program, Event } from "@/types/public";
import { DashboardCard } from "./DashboardCard";

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

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

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
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);

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

    const filteredPlaybooks = playbooks.filter(p =>
        !playbookSearch ||
        p.title?.toLowerCase().includes(playbookSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(playbookSearch.toLowerCase())
    );

    const proposals = experiments.filter(e => e.stage === 'proposed' || e.stage === 'discussion');

    // Stats data
    const stats = [
        { label: "Events", value: events.length, icon: "Calendar", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
        { label: "Programs", value: programs.length, icon: "Users", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
        { label: "Playbooks", value: playbooks.length, icon: "BookOpen", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
        { label: "Proposals", value: proposals.length, icon: "Vote", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    ];

    // Time-based greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="text-white max-w-[1200px] mx-auto">

            {/* ── Welcome Section ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">Online</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                        {greeting}, {user?.name?.split(' ')[0] || 'Member'}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Here&apos;s what&apos;s happening in your community</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsContributionModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all shadow-lg shadow-white/5 flex-shrink-0"
                >
                    <MotionIcon name="Plus" className="w-4 h-4 pointer-events-none" />
                    Submit Contribution
                </button>
            </div>

            <ContributionModal
                isOpen={isContributionModalOpen}
                onClose={() => setIsContributionModalOpen(false)}
                user={user}
            />

            {/* ── Profile Incomplete Notification ── */}
            {!isProfileComplete && (
                <Link
                    href="/member/profile"
                    className="mb-6 block p-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 hover:bg-amber-500/[0.12] transition-all group"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <MotionIcon name="User" className="w-4 h-4 text-amber-400 pointer-events-none" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Complete Your Profile</h3>
                                <p className="text-xs text-zinc-500">Fill in your name, X handle, telegram, and wallet address.</p>
                            </div>
                        </div>
                        <MotionIcon name="ArrowRight" className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform pointer-events-none flex-shrink-0" />
                    </div>
                </Link>
            )}

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className={cn(
                            "p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/[0.1]",
                            glassClass
                        )}
                    >
                        <div className={cn("inline-flex p-2 rounded-lg mb-3 border", stat.bg, stat.border)}>
                            <MotionIcon name={stat.icon} className={cn("w-4 h-4 pointer-events-none", stat.color)} />
                        </div>
                        <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Explore Section ── */}
            <section className="mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-semibold text-white">Explore</h2>
                        <div className="flex rounded-lg p-0.5 bg-zinc-800/80 border border-white/5">
                            {(["EVENTS", "PROGRAMS", "CONTENT"] as Tab[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all",
                                        activeTab === tab
                                            ? "bg-white/10 text-white shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search */}
                        <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2", glassClass)}>
                            <MotionIcon name="Search" className="w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none w-28 sm:w-36"
                            />
                        </div>
                        {/* Filter */}
                        <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2", glassClass)}>
                            <select
                                value={viewFilter}
                                onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
                                className="bg-transparent text-xs font-semibold text-zinc-400 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL" className="bg-zinc-900">All</option>
                                <option value="MEMBER" className="bg-zinc-900">Member</option>
                                <option value="PUBLIC" className="bg-zinc-900">Public</option>
                            </select>
                        </div>
                        {/* View All */}
                        <Link
                            href={`/member/${activeTab.toLowerCase()}`}
                            className="text-xs font-semibold text-zinc-500 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                            View all
                            <MotionIcon name="ArrowRight" className="w-3 h-3 pointer-events-none" />
                        </Link>
                    </div>
                </div>

                {/* Cards Grid */}
                {activeItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className={cn("w-full py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <MotionIcon
                            name={activeTab === 'EVENTS' ? 'Calendar' : activeTab === 'PROGRAMS' ? 'Users' : 'FileText'}
                            className="w-8 h-8 text-zinc-700 mb-3 pointer-events-none"
                        />
                        <p className="text-zinc-600 font-medium text-sm">No {activeTab.toLowerCase()} found</p>
                    </div>
                )}
            </section>

            {/* ── Playbooks Section ── */}
            <section className="mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <h2 className="text-lg font-semibold text-white">Playbooks</h2>
                    <div className="flex items-center gap-2">
                        <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2", glassClass)}>
                            <MotionIcon name="Search" className="w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search playbooks..."
                                value={playbookSearch}
                                onChange={(e) => setPlaybookSearch(e.target.value)}
                                className="bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none w-28 sm:w-40"
                            />
                        </div>
                        <Link
                            href="/member/playbooks"
                            className="text-xs font-semibold text-zinc-500 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                            View all
                            <MotionIcon name="ArrowRight" className="w-3 h-3 pointer-events-none" />
                        </Link>
                    </div>
                </div>

                {filteredPlaybooks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPlaybooks.slice(0, 3).map((playbook: any) => (
                            <DashboardCard
                                key={playbook.id}
                                id={playbook.id}
                                title={playbook.title || "Untitled Playbook"}
                                description={playbook.description}
                                coverImage={playbook.coverImage}
                                href={`/member/playbooks/${playbook.id}`}
                                type="PLAYBOOK"
                            />
                        ))}
                    </div>
                ) : (
                    <div className={cn("w-full py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <MotionIcon name="BookOpen" className="w-8 h-8 text-zinc-700 mb-3 pointer-events-none" />
                        <p className="text-zinc-600 font-medium text-sm">
                            {playbookSearch ? `No playbooks matching "${playbookSearch}"` : "No playbooks available"}
                        </p>
                    </div>
                )}
            </section>

            {/* ── Bottom: Proposals + Directory ── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
                {/* Proposals Card */}
                <Link
                    href="/member/experiments"
                    className={cn("rounded-2xl p-6 group transition-all duration-300 hover:border-white/[0.1]", glassClass)}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <MotionIcon name="Vote" className="w-4 h-4 text-emerald-400 pointer-events-none" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">New Proposals</h3>
                                <p className="text-[11px] text-zinc-600">Vote on upcoming ideas</p>
                            </div>
                        </div>
                        <MotionIcon name="ArrowRight" className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all pointer-events-none" />
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        {proposals.length > 0 ? (
                            <div className="space-y-2.5">
                                {proposals.slice(0, 3).map((prop) => (
                                    <div key={prop.id} className="flex items-center gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 flex-shrink-0" />
                                        <span className="text-xs text-zinc-400 truncate">{prop.title}</span>
                                        <span className="ml-auto text-[10px] text-zinc-600 flex-shrink-0 tabular-nums">{prop.upvotes} votes</span>
                                    </div>
                                ))}
                                {proposals.length > 3 && (
                                    <p className="text-[10px] text-zinc-600 pl-4">+{proposals.length - 3} more</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-600 text-center py-2">No active proposals right now</p>
                        )}
                    </div>
                </Link>

                {/* Directory Card */}
                <Link
                    href="/member/directory"
                    className={cn("rounded-2xl p-6 group transition-all duration-300 hover:border-white/[0.1]", glassClass)}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                                <MotionIcon name="Users" className="w-4 h-4 text-violet-400 pointer-events-none" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Member Directory</h3>
                                <p className="text-[11px] text-zinc-600">Connect with the community</p>
                            </div>
                        </div>
                        <MotionIcon name="ArrowRight" className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all pointer-events-none" />
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Connect with other builders, mentors, and contributors. Find peers and collaborate on new ideas.
                        </p>
                    </div>
                </Link>
            </section>
        </div>
    );
}
