"use client";

import React, { useState, useEffect } from "react";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { Trophy, Zap } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
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

const rankStyles: Record<number, { bg: string; border: string; text: string; icon: string }> = {
    1: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: "Trophy" },
    2: { bg: "bg-zinc-400/10", border: "border-zinc-400/30", text: "text-zinc-300", icon: "Award" },
    3: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: "Award" },
};

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

    return (
        <MemberWrapper>
            <div className="text-white max-w-[900px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <Trophy className="w-5 h-5 text-amber-400"/>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Leaderboard</h1>
                            <p className="text-sm text-zinc-500 mt-0.5">Members ranked by XP earned from bounties</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-zinc-600 animate-pulse">Loading leaderboard...</div>
                ) : leaderboard.length === 0 ? (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Trophy className="w-8 h-8 text-zinc-700 mb-3"/>
                        <p className="text-zinc-600 font-medium text-sm">No bounty completions yet. Be the first!</p>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {leaderboard.length >= 3 && (
                            <div className="grid grid-cols-3 gap-3 mb-8">
                                {/* 2nd Place */}
                                <div className={cn("rounded-2xl p-5 flex flex-col items-center text-center mt-6", glassClass, "border-zinc-400/20")}>
                                    <div className="w-12 h-12 rounded-full bg-zinc-400/10 border border-zinc-400/30 flex items-center justify-center mb-3">
                                        <span className="text-lg font-bold text-zinc-300">2</span>
                                    </div>
                                    <p className="font-semibold text-white text-sm truncate w-full">{leaderboard[1].name || "Anonymous"}</p>
                                    <p className="text-xs text-zinc-500 truncate w-full">{leaderboard[1].email}</p>
                                    <div className="flex items-center gap-1.5 mt-3">
                                        <Zap className="w-3.5 h-3.5 text-amber-400"/>
                                        <span className="text-sm font-bold text-amber-400">{leaderboard[1].totalXp} XP</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-600 mt-1">{leaderboard[1].completedBounties} bounties</p>
                                </div>

                                {/* 1st Place */}
                                <div className={cn("rounded-2xl p-5 flex flex-col items-center text-center border-amber-500/30", glassClass)}>
                                    <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center mb-3">
                                        <Trophy className="w-6 h-6 text-amber-400"/>
                                    </div>
                                    <p className="font-bold text-white text-sm truncate w-full">{leaderboard[0].name || "Anonymous"}</p>
                                    <p className="text-xs text-zinc-500 truncate w-full">{leaderboard[0].email}</p>
                                    <div className="flex items-center gap-1.5 mt-3">
                                        <Zap className="w-3.5 h-3.5 text-amber-400"/>
                                        <span className="text-base font-bold text-amber-400">{leaderboard[0].totalXp} XP</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-600 mt-1">{leaderboard[0].completedBounties} bounties</p>
                                </div>

                                {/* 3rd Place */}
                                <div className={cn("rounded-2xl p-5 flex flex-col items-center text-center mt-6", glassClass, "border-orange-500/20")}>
                                    <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-3">
                                        <span className="text-lg font-bold text-orange-400">3</span>
                                    </div>
                                    <p className="font-semibold text-white text-sm truncate w-full">{leaderboard[2].name || "Anonymous"}</p>
                                    <p className="text-xs text-zinc-500 truncate w-full">{leaderboard[2].email}</p>
                                    <div className="flex items-center gap-1.5 mt-3">
                                        <Zap className="w-3.5 h-3.5 text-amber-400"/>
                                        <span className="text-sm font-bold text-amber-400">{leaderboard[2].totalXp} XP</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-600 mt-1">{leaderboard[2].completedBounties} bounties</p>
                                </div>
                            </div>
                        )}

                        {/* Full List */}
                        <div className="space-y-2">
                            {leaderboard.map((entry) => {
                                const isCurrentUser = entry.id === currentUserId;
                                const topRank = rankStyles[entry.rank];
                                return (
                                    <div
                                        key={entry.id}
                                        className={cn(
                                            "rounded-xl p-4 flex items-center gap-4 transition-all duration-200",
                                            glassClass,
                                            isCurrentUser && "ring-1 ring-amber-500/30 bg-amber-500/[0.04]",
                                        )}
                                    >
                                        {/* Rank */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border",
                                            topRank
                                                ? `${topRank.bg} ${topRank.border} ${topRank.text}`
                                                : "bg-zinc-800/50 border-white/5 text-zinc-500"
                                        )}>
                                            {entry.rank <= 3 ? (
                                                <DynamicIcon name={topRank?.icon || "Hash"} className="w-4 h-4"/>
                                            ) : (
                                                <span>{entry.rank}</span>
                                            )}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                                            <span className="text-sm font-bold text-zinc-400">
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
                                                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-600">{entry.completedBounties} bounties completed</p>
                                        </div>

                                        {/* XP */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Zap className="w-3.5 h-3.5 text-amber-400"/>
                                            <span className="text-sm font-bold text-amber-400 tabular-nums">{entry.totalXp} XP</span>
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
