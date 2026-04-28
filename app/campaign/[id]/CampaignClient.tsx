"use client";

import React from "react";
import { MapPin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ApplicationForm } from "@/components/public/ApplicationForm";
import { Team1Logo } from "@/components/Team1Logo";
import Link from "next/link";
import Image from "next/image";
import { SessionProvider } from "next-auth/react";

interface CampaignData {
    id: string;
    title: string;
    type: string;
    coverImage: string | null;
    city: string;
    description: string;
    markdown: string;
    formSchema: any;
}

function CampaignContent({ campaign }: { campaign: CampaignData }) {
    const badgeConfig: Record<string, { label: string; cls: string }> = {
        WORKSHOP: { label: "Workshop", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
        HACKATHON: { label: "Hackathon", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
        EVENT_FEEDBACK: { label: "Event Feedback", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
    };
    const badge = badgeConfig[campaign.type] || badgeConfig.WORKSHOP;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Top bar */}
            <div className="border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3">
                    <Link href="/">
                        <Team1Logo className="h-3.5 w-auto" />
                    </Link>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.cls}`}>
                        {badge.label}
                    </span>
                </div>
            </div>

            {/* Cover Image */}
            {campaign.coverImage && (
                <div className="relative w-full h-40 sm:h-64 md:h-80">
                    <Image
                        src={campaign.coverImage}
                        alt={campaign.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-black dark:via-black/40 dark:to-transparent" />
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
                    {/* Left: Info */}
                    <div className="lg:col-span-3 space-y-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 break-words">{campaign.title}</h1>
                            {campaign.city && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" /> {campaign.city}
                                </p>
                            )}
                        </div>

                        {campaign.description && (
                            <p className="text-zinc-700 dark:text-zinc-400 leading-relaxed">{campaign.description}</p>
                        )}

                        {campaign.markdown && (
                            <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-a:text-red-600 dark:prose-a:text-red-400 prose-strong:text-black dark:prose-strong:text-white prose-code:text-red-600 dark:prose-code:text-red-300 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-ul:text-zinc-700 dark:prose-ul:text-zinc-300 prose-ol:text-zinc-700 dark:prose-ol:text-zinc-300 prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-img:rounded-xl">
                                <ReactMarkdown>{campaign.markdown}</ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {/* Right: Application Form */}
                    <div className="lg:col-span-2">
                        <div className="lg:sticky lg:top-20">
                            <ApplicationForm programId={campaign.id} formSchema={campaign.formSchema} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-black/5 dark:border-white/5 py-6 text-center px-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-600">Powered by <Link href="/" className="text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Team1 India</Link></p>
            </div>
        </div>
    );
}

export function CampaignClient({ campaign }: { campaign: CampaignData }) {
    return (
        <SessionProvider>
            <CampaignContent campaign={campaign} />
        </SessionProvider>
    );
}
