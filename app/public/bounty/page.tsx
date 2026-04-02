"use client";

import { Zap } from "lucide-react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";

// NOTE: Original bounty board code preserved — restore when ready to launch.

export default function PublicBountyPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <FloatingNav />
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                    <Zap className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Bounty Board</h1>
                <p className="text-zinc-500 text-sm max-w-md">Coming Soon — Exciting bounties and rewards are on the way. Stay tuned!</p>
            </div>
            <Footer />
        </div>
    );
}
