"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MotionIcon } from "motion-icons-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";
import { PublicLoginModal } from "@/components/public/auth/PublicLoginModal";

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

interface LeaderboardEntry {
    id: string;
    name: string | null;
    email: string;
    totalXp: number;
    completedBounties: number;
    rank: number;
}

export default function PublicLeaderboardPage() {
    const { data: session, status } = useSession();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const isPublicUser = status === "authenticated" && (session?.user as any)?.role === "PUBLIC";

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/public/leaderboard");
                if (res.ok) setLeaderboard(await res.json());
            } catch {}
            setLoading(false);
        })();
    }, []);

    // Not logged in — show login prompt
    if (status === "unauthenticated") {
        return (
            <main className="min-h-screen text-white flex flex-col">
                <FloatingNav />
                <div className="flex-1 flex items-center justify-center px-4 md:px-8">
                    <div className={cn("max-w-md w-full rounded-2xl p-8 flex flex-col items-center text-center", glassClass)}>
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
                            <MotionIcon name="Lock" className="w-8 h-8 text-amber-400 pointer-events-none" />
                        </div>
                        <h1 className="text-xl font-bold mb-2">Login Required</h1>
                        <p className="text-sm text-zinc-500 mb-6">You need to be logged in to view the leaderboard.</p>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="px-6 py-3 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-all flex items-center gap-2"
                        >
                            <MotionIcon name="LogIn" className="w-4 h-4 pointer-events-none" /> Login to Continue
                        </button>
                    </div>
                </div>
                <PublicLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
                <Footer />
            </main>
        );
    }

    if (status === "loading") {
        return (
            <main className="min-h-screen text-white">
                <FloatingNav />
                <div className="pt-32 px-4 text-center">
                    <div className="animate-pulse text-zinc-600">Loading...</div>
                </div>
            </main>
        );
    }

    const totalXp = leaderboard.reduce((sum, e) => sum + e.totalXp, 0);
    const totalBounties = leaderboard.reduce((sum, e) => sum + e.completedBounties, 0);

    return (
        <main className="min-h-screen text-white">
            <FloatingNav />

            <div className="pt-20 md:pt-24 px-4 md:px-8 max-w-4xl mx-auto pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div>
                        <Link href="/public" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mb-4 group">
                            <MotionIcon name="ArrowLeft" className="w-3 h-3 group-hover:-translate-x-1 transition-transform pointer-events-none" />
                            Back to Home
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leaderboard</h1>
                        <p className="text-sm text-zinc-500 mt-1">Top public contributors ranked by XP</p>
                    </div>
                    <Link
                        href="/public/bounty"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 transition-all shrink-0"
                    >
                        <MotionIcon name="Zap" className="w-3.5 h-3.5 pointer-events-none" />
                        View Bounties
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold">{leaderboard.length}</p>
                        <p className="text-xs text-zinc-500">Contributors</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold text-amber-400">{totalXp.toLocaleString()}</p>
                        <p className="text-xs text-zinc-500">Total XP</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold text-emerald-400">{totalBounties}</p>
                        <p className="text-xs text-zinc-500">Bounties Completed</p>
                    </div>
                </div>

                {/* Leaderboard List */}
                {loading ? (
                    <div className="py-20 text-center text-zinc-600 animate-pulse">Loading leaderboard...</div>
                ) : leaderboard.length > 0 ? (
                    <div className="space-y-2">
                        {leaderboard.map((entry) => {
                            const isCurrentUser = isPublicUser && entry.id === (session?.user as any)?.id;
                            const isTop3 = entry.rank <= 3;
                            const rankColors: Record<number, string> = {
                                1: "bg-amber-500/10 border-amber-500/30 text-amber-400",
                                2: "bg-zinc-400/10 border-zinc-400/30 text-zinc-300",
                                3: "bg-orange-500/10 border-orange-500/30 text-orange-400",
                            };
                            return (
                                <div
                                    key={entry.id}
                                    className={cn(
                                        "rounded-xl p-4 flex items-center gap-4 transition-all duration-200",
                                        glassClass,
                                        isCurrentUser && "ring-1 ring-amber-500/30 bg-amber-500/[0.04]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border",
                                        isTop3 ? rankColors[entry.rank] : "bg-zinc-800/50 border-white/5 text-zinc-500"
                                    )}>
                                        {isTop3 ? (
                                            <MotionIcon name={entry.rank === 1 ? "Trophy" : "Award"} className="w-4 h-4 pointer-events-none" />
                                        ) : (
                                            <span>{entry.rank}</span>
                                        )}
                                    </div>
                                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-zinc-400">
                                            {(entry.name || entry.email)[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-white truncate">{entry.name || "Anonymous"}</p>
                                            {isCurrentUser && (
                                                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">You</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-600">{entry.completedBounties} bounties completed</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <MotionIcon name="Zap" className="w-3.5 h-3.5 text-amber-400 pointer-events-none" />
                                        <span className="text-sm font-bold text-amber-400 tabular-nums">{entry.totalXp} XP</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("w-full py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <MotionIcon name="Trophy" className="w-8 h-8 text-zinc-700 mb-3 pointer-events-none" />
                        <p className="text-zinc-600 font-medium text-sm">No bounty completions yet. Be the first!</p>
                        <Link href="/public/bounty" className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-100 transition-all">
                            Browse Bounties
                        </Link>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
