"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

const typeConfig: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
    tweet: { icon: "Send", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", label: "Tweet" },
    thread: { icon: "FileText", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "Thread" },
    blog: { icon: "BookOpen", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Blog" },
    video: { icon: "Film", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Video" },
    developer: { icon: "Code", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Developer" },
};

const statusBadge: Record<string, { text: string; cls: string }> = {
    pending: { text: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    approved: { text: "Approved", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    rejected: { text: "Rejected", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

type Tab = "bounties" | "pending" | "history";

export default function CoreBountyPage() {
    const [tab, setTab] = useState<Tab>("pending");
    const [bounties, setBounties] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);


    const fetchData = async () => {
        setLoading(true);
        try {
            const [bRes, sRes] = await Promise.all([fetch("/api/bounty"), fetch("/api/bounty/submissions")]);
            if (bRes.ok) setBounties(await bRes.json());
            if (sRes.ok) setSubmissions(await sRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const pendingSubs = submissions.filter(s => s.status === 'pending');
    const reviewedSubs = submissions.filter(s => s.status !== 'pending');

    const handleReview = async (id: string, status: "approved" | "rejected") => {
        try {
            const res = await fetch(`/api/bounty/submissions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) fetchData();
            else alert("Failed to review");
        } catch { alert("Error"); }
    };

    const handleToggleBounty = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/bounty/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) fetchData();
        } catch { alert("Error"); }
    };

    return (
        <div className="min-h-screen text-white pb-20">
            <main className="container mx-auto px-6 md:px-12 md:pt-24 pt-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div>
                        <Link href="/core" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mb-4 group">
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform"/>
                            Back to Core
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bounty Management</h1>
                        <p className="text-sm text-zinc-500 mt-1">Create bounties, review submissions</p>
                    </div>
                    <Link
                        href="/core/bounty/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all shrink-0"
                    >
                        <Plus className="w-4 h-4"/>
                        New Bounty
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold">{bounties.filter(b => b.status === 'active').length}</p>
                        <p className="text-xs text-zinc-500">Active Bounties</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold text-amber-400">{pendingSubs.length}</p>
                        <p className="text-xs text-zinc-500">Pending Review</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold text-emerald-400">{submissions.filter(s => s.status === 'approved').reduce((sum: number, s: any) => sum + (s.xpAwarded || 0), 0)}</p>
                        <p className="text-xs text-zinc-500">Total XP Awarded</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex rounded-lg p-0.5 bg-zinc-800/80 border border-white/5 w-fit mb-6">
                    {(["pending", "bounties", "history"] as Tab[]).map(t => (
                        <button key={t} type="button" onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-md text-xs font-semibold capitalize transition-all", tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}>
                            {t === "pending" ? `Pending (${pendingSubs.length})` : t === "bounties" ? "Bounties" : "History"}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-20 text-center text-zinc-600 animate-pulse">Loading...</div>
                ) : tab === "pending" ? (
                    pendingSubs.length > 0 ? (
                        <div className="space-y-3">
                            {pendingSubs.map(sub => {
                                const cfg = typeConfig[sub.bounty?.type] || typeConfig.tweet;
                                return (
                                    <div key={sub.id} className={cn("rounded-xl p-4 flex items-center gap-4", glassClass)}>
                                        <div className={cn("p-2 rounded-lg border shrink-0", cfg.bg, cfg.border)}>
                                            <DynamicIcon name={cfg.icon} className={cn("w-4 h-4 ", cfg.color)}/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white">{sub.bounty?.title}</p>
                                            <p className="text-xs text-zinc-500">{sub.submittedBy?.name || sub.publicUser?.fullName || sub.submittedByEmail}</p>
                                            <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate block">{sub.proofUrl}</a>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button type="button" onClick={() => handleReview(sub.id, "approved")} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Approve">
                                                <Check className="w-4 h-4"/>
                                            </button>
                                            <button type="button" onClick={() => handleReview(sub.id, "rejected")} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors" title="Reject">
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                            <p className="text-zinc-600 text-sm">No pending submissions</p>
                        </div>
                    )
                ) : tab === "bounties" ? (
                    <div className="space-y-3">
                        {bounties.map(b => {
                            const cfg = typeConfig[b.type] || typeConfig.tweet;
                            return (
                                <div key={b.id} className={cn("rounded-xl p-4 flex items-center gap-4", glassClass)}>
                                    <div className={cn("p-2 rounded-lg border shrink-0", cfg.bg, cfg.border)}>
                                        <DynamicIcon name={cfg.icon} className={cn("w-4 h-4 ", cfg.color)}/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">{b.title}</p>
                                        <p className="text-xs text-zinc-500">{cfg.label} &middot; {b.frequency} &middot; {b.xpReward} XP</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-semibold border", b.audience === 'public' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20")}>
                                            {b.audience === 'public' ? 'Public' : 'Member'}
                                        </span>
                                        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-semibold border", b.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700")}>
                                            {b.status}
                                        </span>
                                        <button type="button" onClick={() => handleToggleBounty(b.id, b.status === 'active' ? 'paused' : 'active')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            {b.status === 'active' ? 'Pause' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    reviewedSubs.length > 0 ? (
                        <div className="space-y-3">
                            {reviewedSubs.map(sub => {
                                const cfg = typeConfig[sub.bounty?.type] || typeConfig.tweet;
                                const badge = statusBadge[sub.status] || statusBadge.pending;
                                return (
                                    <div key={sub.id} className={cn("rounded-xl p-4 flex items-center gap-4", glassClass)}>
                                        <div className={cn("p-2 rounded-lg border shrink-0", cfg.bg, cfg.border)}>
                                            <DynamicIcon name={cfg.icon} className={cn("w-4 h-4 ", cfg.color)}/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white">{sub.bounty?.title}</p>
                                            <p className="text-xs text-zinc-500">{sub.submittedBy?.name || sub.publicUser?.fullName || sub.submittedByEmail}</p>
                                        </div>
                                        <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border shrink-0", badge.cls)}>{badge.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                            <p className="text-zinc-600 text-sm">No reviewed submissions yet</p>
                        </div>
                    )
                )}

            </main>
        </div>
    );
}
