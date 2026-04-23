"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { ArrowRight, ArrowUpRight, BookOpen, Calendar, MapPin, Users } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";

import PublicHero from "@/components/public/PublicHero";
import { Announcements } from "@/components/website/Announcements";
import { FloatingNav } from "@/components/public/FloatingNav";
import PublicContactSection from "@/components/public/PublicContactSection";
import { Program, Event, Guide } from "@/types/public";
import { Footer } from "@/components/website/Footer";
import type { LumaEventData } from "@/lib/luma";

import { useSession } from "next-auth/react";
import { PublicLoginModal } from "@/components/public/auth/PublicLoginModal";
import { PublicConsentModal } from "@/components/public/auth/PublicConsentModal";

const glassClass = "bg-zinc-100/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]";

const statusConfig = {
    LIVE: { label: "Live", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    UPCOMING: { label: "Upcoming", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    PAST: { label: "Past", color: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
};

// ── Section Header Component ──
function SectionHeader({ icon, title, subtitle, action }: {
    icon: string; title: string; subtitle: string; action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl border shrink-0 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                    <DynamicIcon name={icon} className="w-6 h-6 text-black dark:text-white"/>
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white tracking-tight">{title}</h2>
                    <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
                </div>
            </div>
            {action}
        </div>
    );
}

// ── Luma Event Card ──
function PublicLumaEventCard({ entry, status }: { entry: LumaEventData; status: "LIVE" | "UPCOMING" | "PAST" }) {
    const [imageError, setImageError] = useState(false);
    const config = statusConfig[status];
    const eventDate = new Date(entry.event.start_at);
    const imageUrl = entry.event.cover_url || "";

    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const formatTime = (date: Date) =>
        date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

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
                "w-[85vw] min-w-[240px] sm:w-[320px] flex-shrink-0",
                glassClass,
                "hover:border-black/[0.12] dark:hover:border-white/[0.12] hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/20",
                status === "PAST" && "opacity-70 hover:opacity-100"
            )}
        >
            <div className="relative mb-3 rounded-xl overflow-hidden bg-zinc-200/50 dark:bg-zinc-800/50">
                {imageUrl && !imageError ? (
                    <div className="aspect-square relative">
                        <NextImage src={imageUrl} alt={entry.event.name} fill sizes="320px"
                            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
                            onError={() => setImageError(true)} />
                    </div>
                ) : (
                    <div className="aspect-square flex items-center justify-center">
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
                            <Calendar className="w-6 h-6 text-black dark:text-white"/>
                        </div>
                    </div>
                )}
                <div className="absolute top-2 left-2">
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md border flex items-center gap-1", config.bg, config.color, config.border)}>
                        {status === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                        {config.label}
                    </span>
                </div>
            </div>
            <h3 className="font-semibold text-black dark:text-white text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-100 transition-colors">{entry.event.name}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{formatDate(eventDate)}</span>
                <span className="text-zinc-400 dark:text-zinc-700">&middot;</span>
                <span>{formatTime(eventDate)}</span>
            </div>
            {entry.event.geo_address_json?.city && (
                <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3"/>
                    {entry.event.geo_address_json.city}
                </p>
            )}
            {status !== "PAST" && <p className="text-[11px] font-medium mt-2 text-black/70 dark:text-white/70">{getTimeLabel()}</p>}
        </a>
    );
}

export interface PublicPageData {
    playbooks: any[];
    programs: Program[];
    guides: Guide[];
    events: Event[];
    upcomingEvents: LumaEventData[];
    mediaItems: any[];
    bountyCount: number;
    questCount: number;
    projectCount: number;
    challengeCount: number;
    activeQuests: any[];
    featuredProjects: any[];
    activeChallenges: any[];
    categorizedEvents: {
        live: LumaEventData[];
        upcoming: LumaEventData[];
        past: LumaEventData[];
    };
}

export default function PublicPageClient({ data }: { data: PublicPageData }) {
    const { data: session, status } = useSession();
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            const timer = setTimeout(() => setShowLoginModal(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const { playbooks, programs, upcomingEvents, mediaItems, bountyCount, questCount, projectCount, challengeCount, activeQuests, featuredProjects, activeChallenges, categorizedEvents } = data;

    return (
        <main className="h-[100dvh] w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory md:h-auto md:w-auto md:overflow-visible md:snap-none text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-800 dark:selection:text-zinc-200 supports-[height:100svh]:h-[100svh]">
            <FloatingNav />
            <PublicLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            {session?.user?.role === 'PUBLIC' && session?.user?.consent === false && (
                <PublicConsentModal />
            )}

            <div className="pt-20 md:pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-4">

                {/* ── Hero ── */}
                <PublicHero
                    isAuthenticated={status === 'authenticated'}
                    userRole={(session?.user as any)?.role}
                    onLoginClick={() => setShowLoginModal(true)}
                    stats={{
                        totalEvents: upcomingEvents.length,
                        activeBounties: bountyCount,
                        totalPlaybooks: playbooks.length,
                        activeQuests: questCount,
                        totalProjects: projectCount,
                        activeChallenges: challengeCount,
                    }}
                />

                {/* ── Announcements ── */}
                <Announcements />

                {/* ── Activity Feed ── */}
                <section
                    id="activity-feed"
                    className="min-h-[100dvh] snap-center flex flex-col justify-center py-8 pb-[calc(8rem+env(safe-area-inset-bottom))] relative scroll-mt-24 md:min-h-0 md:block md:py-10"
                    style={{ scrollSnapStop: 'always' }}
                >
                    <SectionHeader
                        icon="Calendar"
                        title="Activity Feed"
                        subtitle="Live, upcoming, and past events from our community"
                        action={
                            <Link href="https://lu.ma/Team1India" target="_blank"
                                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all">
                                <span className="hidden sm:inline">See All on</span> Luma <ArrowUpRight className="w-3.5 h-3.5"/>
                            </Link>
                        }
                    />
                    {(categorizedEvents.live.length > 0 || categorizedEvents.upcoming.length > 0) ? (
                        <div className="space-y-6">
                            {categorizedEvents.live.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live Now</span>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                                        {categorizedEvents.live.map((entry) => <PublicLumaEventCard key={entry.api_id} entry={entry} status="LIVE" />)}
                                    </div>
                                </div>
                            )}
                            {categorizedEvents.upcoming.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Upcoming</span>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                                        {categorizedEvents.upcoming.map((entry) => <PublicLumaEventCard key={entry.api_id} entry={entry} status="UPCOMING" />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={cn("w-full py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                            <Calendar className="w-8 h-8 text-zinc-400 dark:text-zinc-700 mb-3"/>
                            <p className="text-zinc-500 dark:text-zinc-600 font-medium text-sm">No events found</p>
                        </div>
                    )}
                </section>

                {/* ── Challenges ── */}
                {activeChallenges.length > 0 && (
                    <section id="challenges" className="py-8 scroll-mt-24 md:py-10">
                        <SectionHeader icon="Trophy" title="Challenges" subtitle="Compete, build, and win prizes" action={
                            <Link href="/public/challenges" className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all">
                                View All <ArrowRight className="w-3.5 h-3.5"/>
                            </Link>
                        } />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {activeChallenges.map((c: any) => (
                                <div key={c.id} className={cn("rounded-2xl p-5 transition-all duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.12]", glassClass)}>
                                    {c.coverImage && <div className="h-32 rounded-xl overflow-hidden mb-3 bg-zinc-200/50 dark:bg-zinc-800/50"><img src={c.coverImage} alt="" className="w-full h-full object-cover" /></div>}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${c.status === "registration_open" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"}`}>{c.status === "registration_open" ? "Open" : "In Progress"}</span>
                                        {c.prizePool && <span className="text-[10px] font-medium text-yellow-500">{c.prizePool}</span>}
                                    </div>
                                    <h3 className="font-semibold text-black dark:text-white text-sm mb-1">{c.title}</h3>
                                    {c.description && <p className="text-xs text-zinc-500 line-clamp-2">{c.description}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Quests ── */}
                {activeQuests.length > 0 && (
                    <section id="quests" className="py-8 scroll-mt-24 md:py-10">
                        <SectionHeader icon="Target" title="Active Quests" subtitle="Complete quests to earn XP and points" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeQuests.map((q: any) => (
                                <div key={q.id} className={cn("rounded-2xl p-5 transition-all duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.12]", glassClass)}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">{q.type}</span>
                                        {q.category && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">{q.category}</span>}
                                    </div>
                                    <h3 className="font-semibold text-black dark:text-white text-sm mb-1">{q.title}</h3>
                                    {q.description && <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{q.description}</p>}
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-purple-500 font-medium">+{q.xpReward} XP</span>
                                        <span className="text-yellow-500 font-medium">+{q.pointsReward} pts</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Featured Projects ── */}
                {featuredProjects.length > 0 && (
                    <section id="projects" className="py-8 scroll-mt-24 md:py-10">
                        <SectionHeader icon="Layers" title="Community Projects" subtitle="Built by the Team1 India community" action={
                            <Link href="/public/projects" className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all">
                                View All <ArrowRight className="w-3.5 h-3.5"/>
                            </Link>
                        } />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {featuredProjects.map((p: any) => (
                                <Link key={p.id} href={`/public/projects/${p.slug}`} className={cn("group rounded-2xl p-5 transition-all duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.12]", glassClass)}>
                                    {p.coverImage && <div className="h-32 rounded-xl overflow-hidden mb-3 bg-zinc-200/50 dark:bg-zinc-800/50"><img src={p.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" /></div>}
                                    <h3 className="font-semibold text-black dark:text-white text-sm mb-1 group-hover:text-zinc-700 dark:group-hover:text-zinc-100 transition-colors">{p.title}</h3>
                                    {p.description && <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{p.description}</p>}
                                    {p.techStack?.length > 0 && <div className="flex flex-wrap gap-1">{p.techStack.slice(0, 3).map((t: string) => <span key={t} className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[10px] text-zinc-500">{t}</span>)}</div>}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Programs ── */}
                <section
                    id="programs"
                    className="min-h-[100dvh] snap-center flex flex-col justify-center py-8 pb-[calc(8rem+env(safe-area-inset-bottom))] relative scroll-mt-24 md:min-h-0 md:block md:py-10"
                    style={{ scrollSnapStop: 'always' }}
                >
                    <SectionHeader
                        icon="Rocket"
                        title="Programs"
                        subtitle="Initiatives to accelerate your growth"
                        action={
                            <Link href="/public/programs"
                                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all">
                                View All <ArrowRight className="w-3.5 h-3.5"/>
                            </Link>
                        }
                    />
                    {programs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {programs.slice(0, 6).map((item: any) => (
                                <Link key={item.id} href={`/public/programs/${item.id}`}
                                    className={cn("group rounded-2xl p-5 transition-all duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.12]", glassClass)}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shrink-0">
                                            <Users className="w-5 h-5 text-black dark:text-white"/>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-black dark:text-white text-sm leading-snug mb-1 line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-100 transition-colors">{item.title}</h3>
                                            {item.description && <p className="text-xs text-zinc-500 dark:text-zinc-600 line-clamp-2">{item.description}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 transition-colors">View Program</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-700 group-hover:text-black dark:group-hover:text-white transition-colors"/>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={cn("w-full py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                            <Users className="w-8 h-8 text-zinc-400 dark:text-zinc-700 mb-3"/>
                            <p className="text-zinc-500 dark:text-zinc-600 font-medium text-sm">No programs yet</p>
                        </div>
                    )}
                </section>

                {/* ── Playbooks ── */}
                <section
                    id="playbooks"
                    className="min-h-[100dvh] snap-center flex flex-col justify-center py-8 pb-[calc(8rem+env(safe-area-inset-bottom))] relative scroll-mt-24 md:min-h-0 md:block md:py-10"
                    style={{ scrollSnapStop: 'always' }}
                >
                    <SectionHeader
                        icon="BookOpen"
                        title="Playbooks"
                        subtitle="Essential rules, guidelines, and strategies to build and scale"
                        action={
                            <Link href="/public/playbooks"
                                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all">
                                View All <ArrowRight className="w-3.5 h-3.5"/>
                            </Link>
                        }
                    />
                    {playbooks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {playbooks.slice(0, 6).map((item: any) => (
                                <Link key={item.id} href={`/public/playbooks/${item.id}`}
                                    className={cn("group rounded-2xl p-5 transition-all duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.12]", glassClass)}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shrink-0">
                                            <BookOpen className="w-5 h-5 text-black dark:text-white"/>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-black dark:text-white text-sm leading-snug mb-1 line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-100 transition-colors">{item.title}</h3>
                                            {item.description && <p className="text-xs text-zinc-500 dark:text-zinc-600 line-clamp-2">{item.description}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 transition-colors">Read Playbook</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-700 group-hover:text-black dark:group-hover:text-white transition-colors"/>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={cn("w-full py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                            <BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-700 mb-3"/>
                            <p className="text-zinc-500 dark:text-zinc-600 font-medium text-sm">No playbooks yet</p>
                        </div>
                    )}
                </section>

                {/* ── Contact ── */}
                <PublicContactSection mediaItems={mediaItems} />
            </div>

            <Footer />
        </main>
    );
}
