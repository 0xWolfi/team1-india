"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MotionIcon } from "motion-icons-react";

export function IncompleteProfileNotification() {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const checkProfileCompleteness = async () => {
        try {
            const res = await fetch("/api/profile", { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                // Check if required fields are missing
                const isIncomplete = !data.name || !data.xHandle || !data.telegram || !data.wallet;
                setIsVisible(isIncomplete);
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkProfileCompleteness();
    }, [pathname]); // Re-check when route changes (e.g., returning from profile page)

    // Also check periodically in case data was updated
    useEffect(() => {
        const interval = setInterval(() => {
            checkProfileCompleteness();
        }, 2000); // Check every 2 seconds

        return () => clearInterval(interval);
    }, []);

    if (isLoading || !isVisible) return null;

    return (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <MotionIcon name="AlertCircle" className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-400 mb-1">Complete Your Profile</h3>
                    <p className="text-xs text-amber-300/80 mb-3">
                        Please fill in your details (Name, X Handle, Telegram Handle, and Wallet Address) to continue.
                    </p>
                    <button
                        onClick={() => router.push("/member/profile")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-xs font-bold text-amber-300 transition-colors"
                    >
                        <MotionIcon name="User" className="w-3.5 h-3.5" />
                        Fill Details
                    </button>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="flex-shrink-0 p-1 hover:bg-amber-500/10 rounded-lg transition-colors"
                >
                    <MotionIcon name="X" className="w-4 h-4 text-amber-400/60 hover:text-amber-400" />
                </button>
            </div>
        </div>
    );
}
