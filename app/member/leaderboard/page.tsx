"use client";

import { useState, useEffect } from "react";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { Trophy, Zap, Medal, TrendingUp, Crown, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface LeaderboardEntry {
    id: string;
    name: string | null;
    email: string;
    totalXp: number;
    completedBounties: number;
    rank: number;
}

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

const rankConfig: Record<number, { bg: string; border: string; text: string; glow: string }> = {
    1: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-amber-500/10" },
    2: { bg: "bg-zinc-400/10", border: "border-zinc-400/30", text: "text-zinc-300", glow: "shadow-zinc-400/10" },
    3: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", glow: "shadow-orange-500/10" },
};

function PodiumCard({ entry, rank, isCurrentUser }: { entry: LeaderboardEntry; rank: 1 | 2 | 3; isCurrentUser: boolean }) {
    const config = rankConfig[rank];
    const isFirst = rank === 1;

    return (
        <div className={cn(
            "rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300",
            glassClass,
            config.border,
            isCurrentUser && "ring-1 ring-amber-500/30",
            isFirst ? "shadow-lg" : "mt-6",
            `hover:${config.glow} hover:shadow-lg`
        )}>
            {/* Subtle gradient background */}
            <div className={cn(
                "absolute inset-0 opacity-30",
                rank === 1 && "bg-gradient-to-b from-amber-500/10 to-transparent",
                rank === 2 && "bg-gradient-to-b from-zinc-400/10 to-transparent",
                rank === 3 && "bg-gradient-to-b from-orange-500/10 to-transparent",
            )} />

            <div className="relative z-10 flex flex-col items-center">
                {/* Rank badge */}
                <div className={cn(
                    "rounded-full flex items-center justify-center mb-3 border-2",
                    config.bg, config.border,
                    isFirst ? "w-14 h-14" : "w-12 h-12"
                )}>
                    {rank === 1 ? (
                        <Crown className={cn("text-amber-400", isFirst ? "w-7 h-7" : "w-5 h-5")} />
                    ) : rank === 2 ? (
                        <Medal className="w-5 h-5 text-zinc-300" />
                    ) : (
                        <Award className="w-5 h-5 text-orange-400" />
                    )}
                </div>

                {/* Avatar */}
                <div className={cn(
                    "rounded-full bg-zinc-800 border flex items-center justify-center mb-2",
                    config.border,
                    isFirst ? "w-12 h-12 sm:w-16 sm:h-16 text-lg sm:text-xl" : "w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base"
                )}>
                    <span className={cn("font-bold", config.text)}>
                        {(entry.name || entry.email)[0].toUpperCase()}
                    </span>
                </div>

                {/* Name */}
                <p className={cn(
                    "font-bold text-white truncate w-full",
                    isFirst ? "text-xs sm:text-base" : "text-[11px] sm:text-sm"
                )}>
                    {entry.name || "Anonymous"}
                </p>
                {isCurrentUser && (
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mt-1">
                        You
                    </span>
                )}

                {/* XP */}
                <div className="flex items-center gap-1.5 mt-3">
                    <Zap className={cn("text-amber-400", isFirst ? "w-4 h-4" : "w-3.5 h-3.5")} />
                    <span className={cn("font-bold text-amber-400 tabular-nums", isFirst ? "text-base sm:text-xl" : "text-sm sm:text-base")}>
                        {entry.totalXp}
                    </span>
                    <span className="text-xs text-zinc-600">XP</span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-1">{entry.completedBounties} bounties</p>
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    const { data: session } = useSession();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/leaderboard")
            .then(r => r.ok ? r.json() : [])
            .then(setLeaderboard)
            .catch(() => setLeaderboard([]))
            .finally(() => setLoading(false));
    }, []);

    // @ts-ignore
    const currentUserId = session?.user?.id;

    // Find current user's rank
    const currentUserEntry = leaderboard.find(e => e.id === currentUserId);

    return (
        <MemberWrapper>
            <div className="text-white max-w-[900px] mx-auto">
                {/* ── Header ── */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl border border-amber-500/20">
                                <Trophy className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leaderboard</h1>
                                <p className="text-sm text-zinc-500 mt-0.5">Members ranked by XP earned from bounties</p>
                            </div>
                        </div>

                        {/* Current user's rank pill */}
                        {currentUserEntry && (
                            <div className={cn("px-4 py-2.5 rounded-xl flex items-center gap-3", glassClass, "border-amber-500/10")}>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs text-zinc-500 font-medium">Your Rank</span>
                                </div>
                                <span className="text-lg font-bold text-amber-400 tabular-nums">#{currentUserEntry.rank}</span>
                                <div className="w-px h-6 bg-white/5" />
                                <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span className="text-sm font-bold text-amber-400 tabular-nums">{currentUserEntry.totalXp}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {/* Podium skeleton */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[0, 1, 2].map(i => (
                                <div key={i} className={cn("rounded-2xl p-5 flex flex-col items-center animate-pulse", glassClass, i !== 1 && "mt-6")}>
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 mb-3" />
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 mb-2" />
                                    <div className="h-4 w-20 bg-zinc-800 rounded mb-1" />
                                    <div className="h-5 w-16 bg-zinc-800 rounded mt-2" />
                                </div>
                            ))}
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={cn("rounded-xl p-4 flex items-center gap-4 animate-pulse", glassClass)}>
                                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                                <div className="w-9 h-9 rounded-full bg-zinc-800" />
                                <div className="flex-1">
                                    <div className="h-4 w-32 bg-zinc-800 rounded mb-1" />
                                    <div className="h-3 w-20 bg-zinc-800/50 rounded" />
                                </div>
                                <div className="h-5 w-16 bg-zinc-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className={cn("py-20 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Trophy className="w-10 h-10 text-zinc-700 mb-4" />
                        <p className="text-zinc-500 font-medium text-sm mb-1">No bounty completions yet</p>
                        <p className="text-zinc-600 text-xs">Be the first to complete a bounty and claim the top spot</p>
                    </div>
                ) : (
                    <>
                        {/* ── Top 3 Podium ── */}
                        {leaderboard.length >= 3 && (
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                                {/* 2nd Place */}
                                <PodiumCard entry={leaderboard[1]} rank={2} isCurrentUser={leaderboard[1].id === currentUserId} />
                                {/* 1st Place */}
                                <PodiumCard entry={leaderboard[0]} rank={1} isCurrentUser={leaderboard[0].id === currentUserId} />
                                {/* 3rd Place */}
                                <PodiumCard entry={leaderboard[2]} rank={3} isCurrentUser={leaderboard[2].id === currentUserId} />
                            </div>
                        )}

                        {/* ── Full Rankings ── */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-4 py-2">
                                <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">All Rankings</span>
                                <span className="text-[11px] text-zinc-700">{leaderboard.length} members</span>
                            </div>

                            {leaderboard.map((entry) => {
                                const isCurrentUser = entry.id === currentUserId;
                                const topRank = rankConfig[entry.rank];
                                return (
                                    <div
                                        key={entry.id}
                                        className={cn(
                                            "rounded-xl p-4 flex items-center gap-4 transition-all duration-200 group",
                                            glassClass,
                                            isCurrentUser && "ring-1 ring-amber-500/20 bg-amber-500/[0.03]",
                                            "hover:border-white/10"
                                        )}
                                    >
                                        {/* Rank */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border transition-colors",
                                            topRank
                                                ? `${topRank.bg} ${topRank.border} ${topRank.text}`
                                                : "bg-zinc-800/50 border-white/5 text-zinc-500"
                                        )}>
                                            {entry.rank <= 3 ? (
                                                entry.rank === 1 ? <Crown className="w-4 h-4" /> :
                                                entry.rank === 2 ? <Medal className="w-4 h-4" /> :
                                                <Award className="w-4 h-4" />
                                            ) : (
                                                <span className="tabular-nums">{entry.rank}</span>
                                            )}
                                        </div>

                                        {/* Avatar */}
                                        <div className={cn(
                                            "w-9 h-9 rounded-full border flex items-center justify-center shrink-0",
                                            topRank ? `${topRank.bg} ${topRank.border}` : "bg-zinc-800 border-white/10"
                                        )}>
                                            <span className={cn("text-sm font-bold", topRank?.text || "text-zinc-400")}>
                                                {(entry.name || entry.email)[0].toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {entry.name || "Anonymous"}
                                                </p>
                                                {isCurrentUser && (
                                                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-600">
                                                {entry.completedBounties} {entry.completedBounties === 1 ? "bounty" : "bounties"} completed
                                            </p>
                                        </div>

                                        {/* XP */}
                                        <div className="flex items-center gap-1.5 shrink-0 bg-zinc-800/30 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                                            <span className="text-sm font-bold text-amber-400 tabular-nums">{entry.totalXp}</span>
                                            <span className="text-[10px] text-zinc-600">XP</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </MemberWrapper>
    );
}
