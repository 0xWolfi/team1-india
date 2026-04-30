"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, LayoutDashboard, LayoutGrid, LogIn, User, Zap } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";
import ApplicationModal from './ApplicationModal';

const glassClass = "bg-zinc-100/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]";

interface PublicHeroProps {
    onLoginClick?: () => void;
    userRole?: string;
    isAuthenticated?: boolean;
    stats?: {
        totalEvents: number;
        activeBounties: number;
        totalPlaybooks: number;
        activeQuests: number;
        totalProjects: number;
    };
}

export default function PublicHero({ onLoginClick, userRole, isAuthenticated, stats }: PublicHeroProps) {
    const [showApplication, setShowApplication] = useState(false);
    const router = useRouter();

    const statCards = [
        { label: "Events Hosted", value: stats?.totalEvents || 0, icon: "Calendar", href: "#activity-feed" },
        { label: "Bounties", value: stats?.activeBounties || 0, icon: "Zap", href: "/public/bounty" },
        { label: "Quests", value: stats?.activeQuests || 0, icon: "Target", href: "#quests" },
        { label: "Projects", value: stats?.totalProjects || 0, icon: "Layers", href: "/public/projects" },
        { label: "Playbooks", value: stats?.totalPlaybooks || 0, icon: "BookOpen", href: "#playbooks" },
    ];

    const handleStatClick = (href: string) => {
        if (href.startsWith('#')) {
            const el = document.getElementById(href.substring(1));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            router.push(href);
        }
    };

    return (
        <section className="w-full space-y-5">
            {/* Welcome Bar */}
            <div className={cn("rounded-2xl p-5 md:p-6", glassClass)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                            <Globe className="w-5 h-5 text-black dark:text-white"/>
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-black dark:text-white tracking-tight">
                                {isAuthenticated ? `Welcome back` : `Welcome to Team1`}
                            </h1>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Community hub &middot; Resources, bounties, and events
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {!isAuthenticated ? (
                            <>
                                <button
                                    onClick={onLoginClick}
                                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
                                >
                                    <LogIn className="w-4 h-4"/> Login
                                </button>
                                <Link
                                    href="#playbooks"
                                    className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-medium rounded-xl text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <LayoutGrid className="w-4 h-4"/> Browse
                                </Link>
                            </>
                        ) : userRole === 'PUBLIC' ? (
                            <>
                                <button
                                    onClick={() => setShowApplication(true)}
                                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
                                >
                                    <Zap className="w-4 h-4 fill-white dark:fill-black"/> Apply for Membership
                                </button>
                                <Link
                                    href="/public/profile"
                                    className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-medium rounded-xl text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <User className="w-4 h-4"/> Profile
                                </Link>
                            </>
                        ) : (
                            <Link
                                href={userRole === 'CORE' ? '/core' : '/member'}
                                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
                            >
                                <LayoutDashboard className="w-4 h-4"/> Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {statCards.map((stat) => (
                    <button
                        key={stat.label}
                        type="button"
                        onClick={() => handleStatClick(stat.href)}
                        className={cn("rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:border-black/10 dark:hover:border-white/10 text-left cursor-pointer", glassClass)}
                    >
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="p-1.5 rounded-lg border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                                <DynamicIcon name={stat.icon} className="w-3.5 h-3.5 text-black dark:text-white"/>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        {stat.value !== null ? (
                            <p className="text-2xl font-bold tabular-nums text-black dark:text-white">
                                {stat.value.toLocaleString()}
                            </p>
                        ) : (
                            <p className="text-sm font-semibold mt-1 text-black dark:text-white">
                                View Rankings
                            </p>
                        )}
                    </button>
                ))}
            </div>

            <ApplicationModal isOpen={showApplication} onClose={() => setShowApplication(false)} />
        </section>
    );
}
