"use client";

import { MemberWrapper } from "@/components/member/MemberWrapper";
import { Trophy } from "lucide-react";

// NOTE: Original leaderboard code is preserved in components/member/LeaderboardPage (BountyBoard, PodiumCard etc.)
// When ready to launch, just restore the original imports and return.

export default function LeaderboardPage() {
    return (
        <MemberWrapper>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                    <Trophy className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black dark:text-white mb-3">Leaderboard</h1>
                <p className="text-zinc-500 text-sm max-w-md">Coming Soon — Rankings and XP tracking will be available soon. Stay tuned!</p>
            </div>
        </MemberWrapper>
    );
}
