"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, LogIn, Trophy, X, Zap } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";
import { PublicLoginModal } from "@/components/public/auth/PublicLoginModal";

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

interface PublicBounty {
    id: string;
    title: string;
    description: string | null;
    type: string;
    xpReward: number;
    frequency: string;
    status: string;
    audience: string;
}

export default function PublicBountyPage() {
    const { data: session, status } = useSession();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [bounties, setBounties] = useState<PublicBounty[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Submit modal
    const [submitModal, setSubmitModal] = useState<PublicBounty | null>(null);
    const [proofUrl, setProofUrl] = useState("");
    const [proofNote, setProofNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isPublicUser = status === "authenticated" && (session?.user as any)?.role === "PUBLIC";

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/public/bounty");
                if (res.ok) setBounties(await res.json());
            } catch {}
            setLoading(false);
        })();
    }, []);

    // Fetch user's submissions if logged in as PUBLIC
    useEffect(() => {
        if (!isPublicUser) return;
        fetch("/api/bounty/submissions")
            .then(r => r.ok ? r.json() : [])
            .then(setSubmissions)
            .catch(() => {});
    }, [isPublicUser]);

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
                const sRes = await fetch("/api/bounty/submissions");
                if (sRes.ok) setSubmissions(await sRes.json());
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

    // Not logged in — show login prompt
    if (status === "unauthenticated") {
        return (
            <main className="min-h-screen text-white flex flex-col">
                <FloatingNav />
                <div className="flex-1 flex items-center justify-center px-4 md:px-8">
                    <div className={cn("max-w-md w-full rounded-2xl p-8 flex flex-col items-center text-center", glassClass)}>
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                            <Lock className="w-8 h-8 text-emerald-400"/>
                        </div>
                        <h1 className="text-xl font-bold mb-2">Login Required</h1>
                        <p className="text-sm text-zinc-500 mb-6">You need to be logged in to view and participate in bounties.</p>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="px-6 py-3 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-all flex items-center gap-2"
                        >
                            <LogIn className="w-4 h-4"/> Login to Continue
                        </button>
                    </div>
                </div>
                <PublicLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
                <Footer />
            </main>
        );
    }

    // Loading state
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

    return (
        <main className="min-h-screen text-white">
            <FloatingNav />

            <div className="pt-20 md:pt-24 px-4 md:px-8 max-w-7xl mx-auto pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div>
                        <Link href="/public" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mb-4 group">
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform"/>
                            Back to Home
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bounties</h1>
                        <p className="text-sm text-zinc-500 mt-1">Complete bounties to earn XP and climb the leaderboard</p>
                    </div>
                    <Link
                        href="/public/leaderboard"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 transition-all shrink-0"
                    >
                        <Trophy className="w-3.5 h-3.5"/>
                        View Leaderboard
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold text-emerald-400">{bounties.length}</p>
                        <p className="text-xs text-zinc-500">Active Bounties</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold text-amber-400">{submissions.filter(s => s.status === 'pending').length}</p>
                        <p className="text-xs text-zinc-500">Your Pending</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl", glassClass)}>
                        <p className="text-2xl font-bold text-sky-400">{submissions.filter(s => s.status === 'approved').length}</p>
                        <p className="text-xs text-zinc-500">Approved</p>
                    </div>
                </div>

                {/* Bounty Grid */}
                {loading ? (
                    <div className="py-20 text-center text-zinc-600 animate-pulse">Loading bounties...</div>
                ) : bounties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bounties.map((bounty) => {
                            const cfg = typeConfig[bounty.type] || typeConfig.tweet;
                            const submission = submissions.find(s => s.bounty?.id === bounty.id);
                            const hasSubmission = !!submission;
                            const submissionStatus = submission?.status;
                            return (
                                <div key={bounty.id} className={cn("rounded-2xl p-5 transition-all duration-300 hover:border-white/10", glassClass)}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border", cfg.bg, cfg.color, cfg.border)}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-[11px] text-zinc-600 font-medium">{frequencyLabel[bounty.frequency] || bounty.frequency}</span>
                                    </div>
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={cn("p-2.5 rounded-xl border shrink-0", cfg.bg, cfg.border)}>
                                            <DynamicIcon name={cfg.icon} className={cn("w-5 h-5 ", cfg.color)}/>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-white text-sm leading-snug mb-1">{bounty.title}</h3>
                                            {bounty.description && <p className="text-xs text-zinc-600 line-clamp-2">{bounty.description}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5 text-amber-400"/>
                                            <span className="text-sm font-bold text-amber-400">{bounty.xpReward} XP</span>
                                        </div>
                                        {isPublicUser ? (
                                            hasSubmission ? (
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-xl text-xs font-semibold border",
                                                    submissionStatus === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                    submissionStatus === 'rejected' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                )}>
                                                    {submissionStatus === 'approved' ? 'Approved' : submissionStatus === 'rejected' ? 'Rejected' : 'Pending'}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => { setSubmitModal(bounty); setProofUrl(""); setProofNote(""); }}
                                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-100 transition-all"
                                                >
                                                    Submit
                                                </button>
                                            )
                                        ) : (
                                            <span className="text-[11px] text-zinc-600">Public users only</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("w-full py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Zap className="w-8 h-8 text-zinc-700 mb-3"/>
                        <p className="text-zinc-600 font-medium text-sm">No active bounties right now</p>
                        <p className="text-xs text-zinc-700 mt-1">Check back soon!</p>
                    </div>
                )}

                {/* Your Submissions */}
                {isPublicUser && submissions.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-lg font-bold text-white mb-4">Your Submissions</h2>
                        <div className="space-y-2">
                            {submissions.map((sub: any) => {
                                const cfg = typeConfig[sub.bounty?.type] || typeConfig.tweet;
                                const statusCls = sub.status === 'approved'
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : sub.status === 'rejected'
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                return (
                                    <div key={sub.id} className={cn("rounded-xl p-4 flex items-center gap-4", glassClass)}>
                                        <div className={cn("p-2 rounded-lg border shrink-0", cfg.bg, cfg.border)}>
                                            <DynamicIcon name={cfg.icon} className={cn("w-4 h-4 ", cfg.color)}/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white">{sub.bounty?.title}</p>
                                            <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate block">{sub.proofUrl}</a>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {sub.status === 'approved' && sub.xpAwarded && (
                                                <span className="text-xs font-bold text-amber-400">+{sub.xpAwarded} XP</span>
                                            )}
                                            <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border capitalize", statusCls)}>
                                                {sub.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <Footer />

            {/* Submit Modal */}
            {submitModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSubmitModal(null)}>
                    <div className={cn("w-full max-w-lg rounded-2xl p-6 animate-in zoom-in-95 duration-200", "bg-zinc-900/90 backdrop-blur-2xl border border-white/10")} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Submit Proof</h3>
                            <button type="button" onClick={() => setSubmitModal(null)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400">
                                <X className="w-4 h-4"/>
                            </button>
                        </div>
                        <div className={cn("p-3 rounded-xl mb-5 flex items-center gap-3", glassClass)}>
                            <div className={cn("p-2 rounded-lg border", typeConfig[submitModal.type]?.bg, typeConfig[submitModal.type]?.border)}>
                                <DynamicIcon name={typeConfig[submitModal.type]?.icon || "Zap"} className={cn("w-4 h-4 ", typeConfig[submitModal.type]?.color)}/>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{submitModal.title}</p>
                                <p className="text-xs text-amber-400 font-semibold">{submitModal.xpReward} XP</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Proof URL *</label>
                                <input type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)} required
                                    placeholder="https://twitter.com/... or blog link"
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Note (optional)</label>
                                <textarea value={proofNote} onChange={e => setProofNote(e.target.value)}
                                    placeholder="Any context about your submission..." rows={2}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 resize-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setSubmitModal(null)} className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:bg-white/5">Cancel</button>
                                <button type="submit" disabled={submitting || !proofUrl}
                                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {submitting ? "Submitting..." : "Submit Proof"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
