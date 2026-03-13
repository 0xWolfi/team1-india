"use client";

import React, { useState, useEffect } from "react";
import { MotionIcon } from "motion-icons-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface Bounty {
    id: string;
    title: string;
    description: string | null;
    type: string;
    xpReward: number;
    frequency: string;
    status: string;
    deadline: string | null;
    _count?: { submissions: number };
}

interface Submission {
    id: string;
    proofUrl: string;
    proofNote: string | null;
    status: string;
    reviewNote: string | null;
    xpAwarded: number | null;
    submittedAt: string;
    bounty: { id: string; title: string; type: string; xpReward: number };
}

type Tab = "active" | "submissions";

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

const typeConfig: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
    tweet: { icon: "Send", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", label: "Tweet" },
    thread: { icon: "FileText", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "Thread" },
    blog: { icon: "BookOpen", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Blog" },
    video: { icon: "Film", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Video" },
    developer: { icon: "Code", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Developer" },
};

const frequencyLabel: Record<string, string> = {
    daily: "Daily",
    "twice-weekly": "2x / week",
    weekly: "Weekly",
    biweekly: "Biweekly",
};

const statusBadge: Record<string, { text: string; cls: string }> = {
    pending: { text: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    approved: { text: "Approved", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    rejected: { text: "Rejected", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function BountyBoard() {
    const { data: session } = useSession();
    const [tab, setTab] = useState<Tab>("active");
    const [bounties, setBounties] = useState<Bounty[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalXp, setTotalXp] = useState(0);

    // Submit modal state
    const [submitModal, setSubmitModal] = useState<Bounty | null>(null);
    const [proofUrl, setProofUrl] = useState("");
    const [proofNote, setProofNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bRes, sRes] = await Promise.all([
                fetch("/api/bounty"),
                fetch("/api/bounty/submissions"),
            ]);
            if (bRes.ok) setBounties(await bRes.json());
            if (sRes.ok) {
                const subs = await sRes.json();
                setSubmissions(subs);
                const xp = subs.reduce((sum: number, s: Submission) => sum + (s.status === 'approved' ? (s.xpAwarded || 0) : 0), 0);
                setTotalXp(xp);
            }
        } catch (e) {
            console.error("Failed to fetch bounty data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submitModal || !proofUrl) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/bounty/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bountyId: submitModal.id, proofUrl, proofNote: proofNote || undefined }),
            });
            if (res.ok) {
                setSubmitModal(null);
                setProofUrl("");
                setProofNote("");
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to submit");
            }
        } catch {
            alert("Failed to submit. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="text-white max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Bounty Board</h1>
                    <p className="text-sm text-zinc-500 mt-1">Complete bounties to earn XP</p>
                </div>
                <div className={cn("px-5 py-3 rounded-2xl flex items-center gap-3", glassClass)}>
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <MotionIcon name="Zap" className="w-4 h-4 text-amber-400 pointer-events-none" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white tabular-nums">{totalXp}</p>
                        <p className="text-[11px] text-zinc-500 font-medium">Total XP</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
                <div className="flex rounded-lg p-0.5 bg-zinc-800/80 border border-white/5">
                    {(["active", "submissions"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={cn(
                                "px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all capitalize",
                                tab === t ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {t === "active" ? "Active Bounties" : "My Submissions"}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-zinc-600 animate-pulse">Loading bounties...</div>
            ) : tab === "active" ? (
                /* ── Active Bounties Grid ── */
                bounties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bounties.map((bounty) => {
                            const cfg = typeConfig[bounty.type] || typeConfig.tweet;
                            const hasPending = submissions.some(s => s.bounty.id === bounty.id && s.status === 'pending');
                            return (
                                <div key={bounty.id} className={cn("rounded-2xl p-5 transition-all duration-300 hover:border-white/[0.1]", glassClass)}>
                                    {/* Type Badge + Frequency */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border", cfg.bg, cfg.color, cfg.border)}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-[11px] text-zinc-600 font-medium">{frequencyLabel[bounty.frequency] || bounty.frequency}</span>
                                    </div>

                                    {/* Icon + Title */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={cn("p-2.5 rounded-xl border shrink-0", cfg.bg, cfg.border)}>
                                            <MotionIcon name={cfg.icon} className={cn("w-5 h-5 pointer-events-none", cfg.color)} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-white text-sm leading-snug mb-1">{bounty.title}</h3>
                                            {bounty.description && (
                                                <p className="text-xs text-zinc-600 line-clamp-2">{bounty.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* XP + Submit */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
                                        <div className="flex items-center gap-1.5">
                                            <MotionIcon name="Zap" className="w-3.5 h-3.5 text-amber-400 pointer-events-none" />
                                            <span className="text-sm font-bold text-amber-400">{bounty.xpReward} XP</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setSubmitModal(bounty); setProofUrl(""); setProofNote(""); }}
                                            disabled={hasPending}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                                                hasPending
                                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                                    : "bg-white text-black hover:bg-zinc-100"
                                            )}
                                        >
                                            {hasPending ? "Pending..." : "Submit"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <MotionIcon name="Zap" className="w-8 h-8 text-zinc-700 mb-3 pointer-events-none" />
                        <p className="text-zinc-600 font-medium text-sm">No active bounties right now</p>
                    </div>
                )
            ) : (
                /* ── My Submissions ── */
                submissions.length > 0 ? (
                    <div className="space-y-3">
                        {submissions.map((sub) => {
                            const cfg = typeConfig[sub.bounty.type] || typeConfig.tweet;
                            const badge = statusBadge[sub.status] || statusBadge.pending;
                            return (
                                <div key={sub.id} className={cn("rounded-xl p-4 flex items-center gap-4", glassClass)}>
                                    <div className={cn("p-2 rounded-lg border shrink-0", cfg.bg, cfg.border)}>
                                        <MotionIcon name={cfg.icon} className={cn("w-4 h-4 pointer-events-none", cfg.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{sub.bounty.title}</p>
                                        <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 truncate block">{sub.proofUrl}</a>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {sub.status === 'approved' && sub.xpAwarded && (
                                            <span className="text-xs font-bold text-amber-400">+{sub.xpAwarded} XP</span>
                                        )}
                                        <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border", badge.cls)}>
                                            {badge.text}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <MotionIcon name="Send" className="w-8 h-8 text-zinc-700 mb-3 pointer-events-none" />
                        <p className="text-zinc-600 font-medium text-sm">No submissions yet. Complete a bounty!</p>
                    </div>
                )
            )}

            {/* Submit Modal */}
            {submitModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSubmitModal(null)}>
                    <div className={cn("w-full max-w-lg rounded-2xl p-6 animate-in zoom-in-95 duration-200", "bg-zinc-900/90 backdrop-blur-2xl border border-white/10")} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Submit Proof</h3>
                            <button type="button" onClick={() => setSubmitModal(null)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400">
                                <MotionIcon name="X" className="w-4 h-4 pointer-events-none" />
                            </button>
                        </div>

                        <div className={cn("p-3 rounded-xl mb-5 flex items-center gap-3", glassClass)}>
                            <div className={cn("p-2 rounded-lg border", typeConfig[submitModal.type]?.bg, typeConfig[submitModal.type]?.border)}>
                                <MotionIcon name={typeConfig[submitModal.type]?.icon || "Zap"} className={cn("w-4 h-4 pointer-events-none", typeConfig[submitModal.type]?.color)} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{submitModal.title}</p>
                                <p className="text-xs text-amber-400 font-semibold">{submitModal.xpReward} XP</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Proof URL *</label>
                                <input
                                    type="url"
                                    value={proofUrl}
                                    onChange={e => setProofUrl(e.target.value)}
                                    required
                                    placeholder="https://twitter.com/... or blog link"
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Note (optional)</label>
                                <textarea
                                    value={proofNote}
                                    onChange={e => setProofNote(e.target.value)}
                                    placeholder="Any context about your submission..."
                                    rows={2}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setSubmitModal(null)} className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:bg-white/5">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={submitting || !proofUrl}
                                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Submitting..." : "Submit Proof"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
