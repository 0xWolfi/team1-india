"use client";

import React, { useState, useMemo } from "react";
import { ContributionModal } from "./ContributionModal";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, MapPin, Plus, Search, User, Users, Vote } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";
import { Guide, Program, Event } from "@/types/public";
import { DashboardCard } from "./DashboardCard";
import NextImage from "next/image";
import type { LumaEventData } from "@/lib/luma";

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

interface CommunityPulse {
    totalMembers: number;
    eventsHosted: number;
    citiesReached: number;
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
    communityPulse?: CommunityPulse;
    lumaEvents?: LumaEventData[];
}

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

export function MemberDashboard({
    user,
    events = [],
    programs = [],
    content = [],
    playbooks = [],
    experiments = [],
    members: _members = [],
    isProfileComplete = true,
    communityPulse,
    lumaEvents = [],
}: MemberDashboardProps) {
    const [playbookSearch, setPlaybookSearch] = useState("");
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);

    // Categorize Luma events into Live, Upcoming, Past
    const categorizedEvents = useMemo(() => {
        const now = new Date();
        const live: LumaEventData[] = [];
        const upcoming: LumaEventData[] = [];
        const past: LumaEventData[] = [];

        lumaEvents.forEach((entry) => {
            const startAt = new Date(entry.event.start_at);
            const endAt = entry.event.end_at ? new Date(entry.event.end_at) : null;

            if (startAt <= now && endAt && endAt > now) {
                live.push(entry);
            } else if (startAt > now) {
                upcoming.push(entry);
            } else {
                past.push(entry);
            }
        });

        // Sort upcoming by soonest first
        upcoming.sort((a, b) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime());
        // Sort past by most recent first
        past.sort((a, b) => new Date(b.event.start_at).getTime() - new Date(a.event.start_at).getTime());

        return { live, upcoming, past };
    }, [lumaEvents]);

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
                    <Plus className="w-4 h-4"/>
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
                                <User className="w-4 h-4 text-amber-400"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Complete Your Profile</h3>
                                <p className="text-xs text-zinc-500">Fill in your name, X handle, telegram, and wallet address.</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0"/>
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
                            <DynamicIcon name={stat.icon} className={cn("w-4 h-4 ", stat.color)}/>
                        </div>
                        <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Community Pulse ── */}
            {communityPulse && (
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Community Pulse</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { label: "Total Members", value: communityPulse.totalMembers, icon: "Users", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                            { label: "Events Hosted", value: communityPulse.eventsHosted, icon: "Calendar", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
                            { label: "Cities Reached", value: communityPulse.citiesReached, icon: "MapPin", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                        ].map((metric) => (
                            <div
                                key={metric.label}
                                className={cn(
                                    "p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/[0.1]",
                                    glassClass
                                )}
                            >
                                <div className={cn("inline-flex p-2 rounded-lg mb-3 border", metric.bg, metric.border)}>
                                    <DynamicIcon name={metric.icon} className={cn("w-4 h-4 ", metric.color)}/>
                                </div>
                                <p className="text-2xl font-bold text-white tracking-tight">{metric.value}</p>
                                <p className="text-xs text-zinc-500 mt-0.5 font-medium">{metric.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Activity Feed — Luma Events ── */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
                    <Link
                        href="/member/events"
                        className="text-xs font-semibold text-zinc-500 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                        View all
                        <ArrowRight className="w-3 h-3"/>
                    </Link>
                </div>

                {lumaEvents.length > 0 ? (
                    <div className="space-y-6">
                        {/* Live Events */}
                        {categorizedEvents.live.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live Now</span>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                                    {categorizedEvents.live.map((entry) => (
                                        <LumaEventCard key={entry.api_id} entry={entry} status="LIVE" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Events */}
                        {categorizedEvents.upcoming.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-sky-400" />
                                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Upcoming</span>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                                    {categorizedEvents.upcoming.map((entry) => (
                                        <LumaEventCard key={entry.api_id} entry={entry} status="UPCOMING" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past Events */}
                        {categorizedEvents.past.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Past</span>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                                    {categorizedEvents.past.map((entry) => (
                                        <LumaEventCard key={entry.api_id} entry={entry} status="PAST" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={cn("w-full py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Calendar className="w-8 h-8 text-zinc-700 mb-3"/>
                        <p className="text-zinc-600 font-medium text-sm">No events found</p>
                    </div>
                )}
            </section>

            {/* ── Playbooks Section ── */}
            <section className="mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <h2 className="text-lg font-semibold text-white">Playbooks</h2>
                    <div className="flex items-center gap-2">
                        <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2", glassClass)}>
                            <Search className="w-3.5 h-3.5 text-zinc-600"/>
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
                            <ArrowRight className="w-3 h-3"/>
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
                        <BookOpen className="w-8 h-8 text-zinc-700 mb-3"/>
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
                                <Vote className="w-4 h-4 text-emerald-400"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">New Proposals</h3>
                                <p className="text-[11px] text-zinc-600">Vote on upcoming ideas</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all"/>
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
                                <Users className="w-4 h-4 text-violet-400"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Member Directory</h3>
                                <p className="text-[11px] text-zinc-600">Connect with the community</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all"/>
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

// ── Luma Event Card ──
const statusConfig = {
    LIVE: { label: "Live", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    UPCOMING: { label: "Upcoming", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
    PAST: { label: "Past", color: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
};

function LumaEventCard({ entry, status }: { entry: LumaEventData; status: "LIVE" | "UPCOMING" | "PAST" }) {
    const [imageError, setImageError] = useState(false);
    const config = statusConfig[status];
    const eventDate = new Date(entry.event.start_at);

    const imageUrl = entry.event.cover_url || "";

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getTimeLabel = () => {
        const now = new Date();
        const diffMs = eventDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (status === "LIVE") return "Happening now";
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays > 1) return `in ${diffDays} days`;
        return formatDate(eventDate);
    };

    return (
        <a
            href={entry.event.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "group block rounded-2xl p-4 transition-all duration-300 snap-start",
                "w-[280px] sm:w-[320px] flex-shrink-0",
                "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]",
                "hover:border-white/[0.12] hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-black/20",
                status === "PAST" && "opacity-70 hover:opacity-100"
            )}
        >
            {/* Cover Image */}
            <div className="relative mb-3 rounded-xl overflow-hidden bg-zinc-800/50">
                {imageUrl && !imageError ? (
                    <div className="aspect-square relative">
                        <NextImage
                            src={imageUrl}
                            alt={entry.event.name}
                            fill
                            sizes="320px"
                            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
                            onError={() => setImageError(true)}
                        />
                    </div>
                ) : (
                    <div className="aspect-square flex items-center justify-center">
                        <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20">
                            <Calendar className="w-6 h-6 text-sky-400"/>
                        </div>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md border flex items-center gap-1",
                        config.bg, config.color, config.border
                    )}>
                        {status === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                        {config.label}
                    </span>
                </div>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-white text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-zinc-100 transition-colors">
                {entry.event.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{formatDate(eventDate)}</span>
                <span className="text-zinc-700">·</span>
                <span>{formatTime(eventDate)}</span>
            </div>
            {entry.event.geo_address_json?.city && (
                <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3"/>
                    {entry.event.geo_address_json.city}
                </p>
            )}
            {status !== "PAST" && (
                <p className="text-[11px] font-medium mt-2 text-sky-400">{getTimeLabel()}</p>
            )}
        </a>
    );
}
