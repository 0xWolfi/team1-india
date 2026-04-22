"use client";

import { Trophy } from "lucide-react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";

// NOTE: Original leaderboard code preserved — restore when ready to launch.

export default function PublicLeaderboardPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <FloatingNav />
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                    <Trophy className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-3">Leaderboard</h1>
                <p className="text-zinc-500 text-sm max-w-md">Coming Soon — Rankings and XP tracking will be available soon. Stay tuned!</p>
            </div>
            <Footer />
        </div>
    );
}
