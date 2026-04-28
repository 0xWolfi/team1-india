"use client";

import { useState, useEffect, useMemo } from "react";
import { Send, Zap, ExternalLink, Clock, CheckCircle, XCircle, ChevronDown, Search, ArrowRight, Flame, Target } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
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
    maxPerCycle: number | null;
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
type TypeFilter = "all" | "tweet" | "thread" | "blog" | "video" | "developer";

const glassClass = "bg-zinc-100/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]";

const typeConfig: Record<string, { icon: string; color: string; bg: string; border: string; label: string; gradient: string }> = {
    tweet:     { icon: "Twitter",  color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20",     label: "Tweet",     gradient: "from-sky-500/20 to-sky-500/0" },
    thread:    { icon: "FileText", color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  label: "Thread",    gradient: "from-violet-500/20 to-violet-500/0" },
    blog:      { icon: "BookOpen", color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   label: "Blog",      gradient: "from-amber-500/20 to-amber-500/0" },
    video:     { icon: "Film",     color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    label: "Video",     gradient: "from-rose-500/20 to-rose-500/0" },
    developer: { icon: "Code",     color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Developer", gradient: "from-emerald-500/20 to-emerald-500/0" },
};

const frequencyLabel: Record<string, { label: string; color: string }> = {
    daily:         { label: "Daily",     color: "text-red-400" },
    "twice-weekly":{ label: "2x / week", color: "text-orange-400" },
    weekly:        { label: "Weekly",    color: "text-sky-400" },
    biweekly:      { label: "Biweekly",  color: "text-violet-400" },
};

const statusBadge: Record<string, { text: string; cls: string; icon: typeof CheckCircle }> = {
    pending:  { text: "Pending Review", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",    icon: Clock },
    approved: { text: "Approved",       cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
    rejected: { text: "Rejected",       cls: "bg-red-500/10 text-red-400 border-red-500/20",           icon: XCircle },
};

function getTimeLeft(deadline: string | null): string | null {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
}

export function BountyBoard() {
    useSession();
    const [tab, setTab] = useState<Tab>("active");
    const [bounties, setBounties] = useState<Bounty[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalXp, setTotalXp] = useState(0);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Expanded bounty detail
    const [expandedBounty, setExpandedBounty] = useState<string | null>(null);

    // Submit form state
    const [submitBountyId, setSubmitBountyId] = useState<string | null>(null);
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
                const xp = subs.reduce((sum: number, s: Submission) => sum + (s.status === "approved" ? (s.xpAwarded || 0) : 0), 0);
                setTotalXp(xp);
            }
        } catch (e) {
            console.error("Failed to fetch bounty data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredBounties = useMemo(() => {
        let filtered = bounties;
        if (typeFilter !== "all") filtered = filtered.filter(b => b.type === typeFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(b => b.title.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
        }
        return filtered;
    }, [bounties, typeFilter, searchQuery]);

    const stats = useMemo(() => ({
        totalXp,
        activeBounties: bounties.length,
        pendingSubmissions: submissions.filter(s => s.status === "pending").length,
        approvedSubmissions: submissions.filter(s => s.status === "approved").length,
    }), [totalXp, bounties, submissions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submitBountyId || !proofUrl) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/bounty/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bountyId: submitBountyId, proofUrl, proofNote: proofNote || undefined }),
            });
            if (res.ok) {
                setSubmitBountyId(null);
                setExpandedBounty(null);
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

    const approvedCount = stats.approvedSubmissions;
    const pendingCount = stats.pendingSubmissions;

    return (
        <div className="text-black dark:text-white max-w-[1200px] mx-auto">
            {/* ── Hero Header ── */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl border border-amber-500/20">
                                <Target className="w-5 h-5 text-amber-400" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Bounty Board</h1>
                        </div>
                        <p className="text-sm text-zinc-500 pl-[52px]">Complete bounties, earn XP, climb the leaderboard</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    <div className={cn("rounded-xl p-4", glassClass)}>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Your XP</span>
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-400 tabular-nums">{stats.totalXp}</p>
                    </div>
                    <div className={cn("rounded-xl p-4", glassClass)}>
                        <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-4 h-4 text-red-400" />
                            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Active</span>
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white tabular-nums">{stats.activeBounties}</p>
                    </div>
                    <div className={cn("rounded-xl p-4", glassClass)}>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Completed</span>
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-400 tabular-nums">{approvedCount}</p>
                    </div>
                    <div className={cn("rounded-xl p-4", glassClass)}>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Pending</span>
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-600 dark:text-zinc-300 tabular-nums">{pendingCount}</p>
                    </div>
                </div>
            </div>

            {/* ── Tab Bar + Filters ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex rounded-xl p-1 bg-zinc-200/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/5">
                    {(["active", "submissions"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={cn(
                                "px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all",
                                tab === t ? "bg-black/10 dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                            )}
                        >
                            {t === "active" ? "Active Bounties" : "My Submissions"}
                            {t === "submissions" && submissions.length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-black/5 dark:bg-white/5">{submissions.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {tab === "active" && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search bounties..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-200/50 dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-black/20 dark:focus:border-white/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Type filter pills */}
            {tab === "active" && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setTypeFilter("all")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap",
                            typeFilter === "all" ? "bg-black/10 dark:bg-white/10 text-black dark:text-white border-black/20 dark:border-white/20" : "bg-transparent text-zinc-500 border-black/5 dark:border-white/5 hover:text-zinc-600 dark:hover:text-zinc-300"
                        )}
                    >
                        All Types
                    </button>
                    {Object.entries(typeConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setTypeFilter(key as TypeFilter)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap flex items-center gap-1.5",
                                typeFilter === key
                                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                                    : "bg-transparent text-zinc-500 border-black/5 dark:border-white/5 hover:text-zinc-600 dark:hover:text-zinc-300"
                            )}
                        >
                            <DynamicIcon name={cfg.icon} className="w-3 h-3" />
                            {cfg.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Content ── */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={cn("rounded-2xl p-5 animate-pulse", glassClass)}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            </div>
                            <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                            <div className="h-4 w-full bg-zinc-200/50 dark:bg-zinc-800/50 rounded mb-1" />
                            <div className="h-4 w-2/3 bg-zinc-200/50 dark:bg-zinc-800/50 rounded" />
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                                <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : tab === "active" ? (
                filteredBounties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBounties.map((bounty) => {
                            const cfg = typeConfig[bounty.type] || typeConfig.tweet;
                            const hasSubmission = submissions.some(s => s.bounty.id === bounty.id);
                            const mySubmission = submissions.find(s => s.bounty.id === bounty.id);
                            const isExpanded = expandedBounty === bounty.id;
                            const isSubmitOpen = submitBountyId === bounty.id;
                            const timeLeft = getTimeLeft(bounty.deadline);
                            const freq = frequencyLabel[bounty.frequency] || { label: bounty.frequency, color: "text-zinc-400" };

                            return (
                                <div
                                    key={bounty.id}
                                    className={cn(
                                        "rounded-2xl transition-all duration-300 overflow-hidden",
                                        glassClass,
                                        isExpanded ? "ring-1 ring-black/10 dark:ring-white/10" : "hover:border-black/[0.1] dark:hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/10",
                                        isExpanded && "col-span-1 sm:col-span-2 lg:col-span-2"
                                    )}
                                >
                                    {/* Gradient top accent */}
                                    <div className={cn("h-0.5 bg-gradient-to-r", cfg.gradient)} />

                                    <div className="p-5">
                                        {/* Type Badge + Frequency + Deadline */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border", cfg.bg, cfg.color, cfg.border)}>
                                                    {cfg.label}
                                                </span>
                                                <span className={cn("text-[11px] font-medium", freq.color)}>
                                                    {freq.label}
                                                </span>
                                            </div>
                                            {timeLeft && (
                                                <span className={cn(
                                                    "text-[10px] font-semibold flex items-center gap-1",
                                                    timeLeft === "Expired" ? "text-red-400" : "text-zinc-500"
                                                )}>
                                                    <Clock className="w-3 h-3" />
                                                    {timeLeft}
                                                </span>
                                            )}
                                        </div>

                                        {/* Icon + Title */}
                                        <button
                                            type="button"
                                            onClick={() => setExpandedBounty(isExpanded ? null : bounty.id)}
                                            className="w-full text-left flex items-start gap-3 mb-3 group"
                                        >
                                            <div className={cn("p-2.5 rounded-xl border shrink-0 transition-colors", cfg.bg, cfg.border, "group-hover:bg-opacity-100")}>
                                                <DynamicIcon name={cfg.icon} className={cn("w-5 h-5", cfg.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-black dark:text-white text-sm leading-snug mb-1 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 transition-colors">
                                                    {bounty.title}
                                                </h3>
                                                <p className={cn("text-xs text-zinc-500", isExpanded ? "" : "line-clamp-2")}>
                                                    {bounty.description || "No description provided"}
                                                </p>
                                            </div>
                                            <ChevronDown className={cn(
                                                "w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 transition-transform mt-1",
                                                isExpanded && "rotate-180"
                                            )} />
                                        </button>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                {/* Info grid */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    <div className="bg-zinc-200/30 dark:bg-zinc-800/30 rounded-lg p-3">
                                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-1">Reward</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                            <span className="text-sm font-bold text-amber-400">{bounty.xpReward} XP</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-zinc-200/30 dark:bg-zinc-800/30 rounded-lg p-3">
                                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-1">Frequency</p>
                                                        <p className="text-sm font-medium text-black dark:text-white">{freq.label}</p>
                                                    </div>
                                                    {bounty.deadline && (
                                                        <div className="bg-zinc-200/30 dark:bg-zinc-800/30 rounded-lg p-3">
                                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-1">Deadline</p>
                                                            <p className="text-sm font-medium text-black dark:text-white">
                                                                {new Date(bounty.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Submission status */}
                                                {hasSubmission && mySubmission && (
                                                    <div className={cn("rounded-xl p-4 border", statusBadge[mySubmission.status]?.cls)}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {(() => {
                                                                const StatusIcon = statusBadge[mySubmission.status]?.icon || Clock;
                                                                return <StatusIcon className="w-4 h-4" />;
                                                            })()}
                                                            <span className="text-sm font-semibold">{statusBadge[mySubmission.status]?.text}</span>
                                                            {mySubmission.xpAwarded && (
                                                                <span className="ml-auto text-xs font-bold text-amber-400">+{mySubmission.xpAwarded} XP</span>
                                                            )}
                                                        </div>
                                                        <a href={mySubmission.proofUrl} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-1 truncate">
                                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                                            {mySubmission.proofUrl}
                                                        </a>
                                                        {mySubmission.reviewNote && (
                                                            <p className="text-xs text-zinc-500 mt-2 italic">&quot;{mySubmission.reviewNote}&quot;</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Submit form inline */}
                                                {!hasSubmission && (
                                                    isSubmitOpen ? (
                                                        <form onSubmit={handleSubmit} className="space-y-3 bg-zinc-200/20 dark:bg-zinc-800/20 rounded-xl p-4 border border-black/5 dark:border-white/5">
                                                            <div>
                                                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Proof URL *</label>
                                                                <input
                                                                    type="url"
                                                                    value={proofUrl}
                                                                    onChange={e => setProofUrl(e.target.value)}
                                                                    required
                                                                    placeholder="https://twitter.com/... or blog link"
                                                                    className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-black dark:text-white text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20 placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Note (optional)</label>
                                                                <textarea
                                                                    value={proofNote}
                                                                    onChange={e => setProofNote(e.target.value)}
                                                                    placeholder="Any context about your submission..."
                                                                    rows={2}
                                                                    className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-black dark:text-white text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                                                />
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <button type="button" onClick={() => { setSubmitBountyId(null); setProofUrl(""); setProofNote(""); }}
                                                                    className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="submit"
                                                                    disabled={submitting || !proofUrl}
                                                                    className="px-5 py-2 rounded-lg text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                                                                >
                                                                    <Send className="w-3 h-3" />
                                                                    {submitting ? "Submitting..." : "Submit Proof"}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => { setSubmitBountyId(bounty.id); setProofUrl(""); setProofNote(""); }}
                                                            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Send className="w-3.5 h-3.5" />
                                                            Submit Proof
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Footer — XP + Action */}
                                        {!isExpanded && (
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                                                <div className="flex items-center gap-1.5">
                                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                    <span className="text-sm font-bold text-amber-400">{bounty.xpReward} XP</span>
                                                </div>
                                                {hasSubmission ? (
                                                    <span className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1",
                                                        statusBadge[mySubmission?.status || "pending"]?.cls
                                                    )}>
                                                        {(() => {
                                                            const StatusIcon = statusBadge[mySubmission?.status || "pending"]?.icon || Clock;
                                                            return <StatusIcon className="w-3 h-3" />;
                                                        })()}
                                                        {statusBadge[mySubmission?.status || "pending"]?.text}
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedBounty(bounty.id);
                                                            setSubmitBountyId(bounty.id);
                                                            setProofUrl("");
                                                            setProofNote("");
                                                        }}
                                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center gap-1.5"
                                                    >
                                                        Submit <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-20 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Target className="w-10 h-10 text-zinc-400 dark:text-zinc-700 mb-4" />
                        <p className="text-zinc-500 font-medium text-sm mb-1">
                            {searchQuery || typeFilter !== "all" ? "No bounties match your filters" : "No active bounties right now"}
                        </p>
                        <p className="text-zinc-400 dark:text-zinc-600 text-xs">Check back later for new opportunities</p>
                    </div>
                )
            ) : (
                /* ── My Submissions Tab ── */
                submissions.length > 0 ? (
                    <div className="space-y-3">
                        {submissions.map((sub) => {
                            const cfg = typeConfig[sub.bounty.type] || typeConfig.tweet;
                            const badge = statusBadge[sub.status] || statusBadge.pending;
                            const BadgeIcon = badge.icon;
                            return (
                                <div key={sub.id} className={cn("rounded-xl p-4 transition-all hover:border-black/[0.1] dark:hover:border-white/[0.1]", glassClass)}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2.5 rounded-xl border shrink-0", cfg.bg, cfg.border)}>
                                            <DynamicIcon name={cfg.icon} className={cn("w-4 h-4", cfg.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-black dark:text-white truncate">{sub.bounty.title}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 truncate flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                    {sub.proofUrl}
                                                </a>
                                                <span className="text-zinc-700 text-[10px]">
                                                    {new Date(sub.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {sub.status === "approved" && sub.xpAwarded && (
                                                <div className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3 text-amber-400" />
                                                    <span className="text-xs font-bold text-amber-400">+{sub.xpAwarded}</span>
                                                </div>
                                            )}
                                            <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1", badge.cls)}>
                                                <BadgeIcon className="w-3 h-3" />
                                                {badge.text}
                                            </span>
                                        </div>
                                    </div>
                                    {sub.reviewNote && (
                                        <div className="mt-3 ml-[52px] pl-4 border-l border-black/5 dark:border-white/5">
                                            <p className="text-xs text-zinc-500 italic">&quot;{sub.reviewNote}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-20 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Send className="w-10 h-10 text-zinc-400 dark:text-zinc-700 mb-4" />
                        <p className="text-zinc-500 font-medium text-sm mb-1">No submissions yet</p>
                        <p className="text-zinc-400 dark:text-zinc-600 text-xs">Complete a bounty to start earning XP</p>
                    </div>
                )
            )}
        </div>
    );
}
