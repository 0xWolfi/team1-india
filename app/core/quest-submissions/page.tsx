'use client';

import { useState, useEffect } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Trophy, ChevronRight, ArrowLeft, ExternalLink, Calendar, CheckCircle, Trash2, Clock, Loader2, Link2, Crown, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const glassClass = "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]";

const QUEST_LABELS: Record<string, string> = {
    "quest-fullstack": "Full Stack Contributor",
    "quest-creator": "30 Day Creator Sprint",
    "quest-builder": "Build in Public",
};

const QUEST_TYPES = ["quest-fullstack", "quest-creator", "quest-builder"] as const;

interface Contribution {
    id: string;
    type: string;
    name: string;
    email: string;
    status: string;
    links: { label: string; url: string }[] | null;
    submittedAt: string;
}

type Tab = 'submissions' | 'leaderboard';

export default function QuestSubmissionsPage() {
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>('submissions');

    useEffect(() => {
        fetch('/api/contributions')
            .then(r => r.ok ? r.json() : [])
            .then(data => setContributions(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const questContributions = contributions.filter(c => c.type.startsWith('quest-'));

    // Group by member email
    const memberMap = new Map<string, { name: string; email: string; submissions: Contribution[] }>();
    questContributions.forEach(c => {
        if (!memberMap.has(c.email)) {
            memberMap.set(c.email, { name: c.name, email: c.email, submissions: [] });
        }
        memberMap.get(c.email)!.submissions.push(c);
    });
    memberMap.forEach(member => {
        member.submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    });

    const members = Array.from(memberMap.values());
    const selectedMemberData = selectedMember ? memberMap.get(selectedMember) : null;

    // Leaderboard: count approved submissions per quest type per member
    const buildLeaderboard = (questType: string) => {
        const approved = questContributions.filter(c => c.type === questType && c.status === 'approved');
        const countMap = new Map<string, { name: string; email: string; count: number }>();
        approved.forEach(c => {
            if (!countMap.has(c.email)) {
                countMap.set(c.email, { name: c.name, email: c.email, count: 0 });
            }
            countMap.get(c.email)!.count++;
        });
        return Array.from(countMap.values()).sort((a, b) => b.count - a.count);
    };

    const handleApprove = async (id: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/contributions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' }),
            });
            if (res.ok) {
                setContributions(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
            } else {
                alert('Failed to approve');
            }
        } catch {
            alert('Error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Reject and delete this submission?')) return;
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/contributions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' }),
            });
            if (res.ok) {
                setContributions(prev => prev.filter(c => c.id !== id));
            } else {
                alert('Failed to reject');
            }
        } catch {
            alert('Error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this submission permanently?')) return;
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/contributions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setContributions(prev => prev.filter(c => c.id !== id));
            } else {
                alert('Failed to delete');
            }
        } catch {
            alert('Error');
        } finally {
            setUpdatingId(null);
        }
    };

    const rankIcons = [
        <Crown key="1" className="w-4 h-4 text-amber-400" />,
        <Medal key="2" className="w-4 h-4 text-zinc-300" />,
        <Award key="3" className="w-4 h-4 text-orange-400" />,
    ];

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Quest Submissions"
                description="Review bounty quest submissions from Team1 India members."
                icon={<Trophy className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />}
            />

            {/* Tabs */}
            <div className="flex rounded-lg p-0.5 bg-zinc-200/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/5 w-fit mb-6">
                {(['submissions', 'leaderboard'] as Tab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setSelectedMember(null); }}
                        className={cn(
                            "px-4 py-2 rounded-md text-xs font-semibold capitalize transition-all",
                            tab === t ? "bg-black/10 dark:bg-white/10 text-black dark:text-white" : "text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                        )}
                    >
                        {t === 'submissions' ? `Submissions (${questContributions.length})` : 'Leaderboard'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20 text-center text-zinc-400 dark:text-zinc-600 animate-pulse">Loading...</div>
            ) : tab === 'leaderboard' ? (
                /* ══════ LEADERBOARD TAB ══════ */
                <div className="space-y-8">
                    {QUEST_TYPES.map(qt => {
                        const lb = buildLeaderboard(qt);
                        return (
                            <div key={qt}>
                                <h3 className="text-sm font-bold text-black dark:text-white mb-3 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-red-400" />
                                    {QUEST_LABELS[qt]}
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-normal">({lb.length} members)</span>
                                </h3>
                                {lb.length > 0 ? (
                                    <div className="space-y-2">
                                        {lb.map((entry, i) => (
                                            <div key={entry.email} className={cn("rounded-xl p-4 flex items-center gap-4", glassClass, i < 3 && "border-amber-500/10")}>
                                                <div className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border",
                                                    i === 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                                                    i === 1 ? "bg-zinc-400/10 border-zinc-400/30 text-zinc-300" :
                                                    i === 2 ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                                                    "bg-zinc-200/50 dark:bg-zinc-800/50 border-black/5 dark:border-white/5 text-zinc-500"
                                                )}>
                                                    {i < 3 ? rankIcons[i] : <span className="tabular-nums">{i + 1}</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-black dark:text-white">{entry.name}</p>
                                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-600">{entry.email}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="text-sm font-bold text-emerald-400 tabular-nums">{entry.count}</span>
                                                    <span className="text-[10px] text-zinc-500">approved</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={cn("py-8 rounded-xl text-center border-dashed", glassClass)}>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-600">No approved submissions yet</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : selectedMemberData ? (
                /* ══════ MEMBER DETAIL VIEW ══════ */
                <div>
                    <button
                        onClick={() => setSelectedMember(null)}
                        className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to all members
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm">
                            {selectedMemberData.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-black dark:text-white">{selectedMemberData.name}</h2>
                            <p className="text-xs text-zinc-500">{selectedMemberData.email} — {selectedMemberData.submissions.length} submission{selectedMemberData.submissions.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {selectedMemberData.submissions.map(sub => {
                            const isApproved = sub.status === 'approved';
                            const links: { label: string; url: string }[] = Array.isArray(sub.links) ? sub.links : [];

                            return (
                                <div key={sub.id} className={cn("rounded-xl p-5", glassClass)}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-black dark:text-white">
                                                    {QUEST_LABELS[sub.type] || sub.type}
                                                </span>
                                                {isApproved && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                                                        <CheckCircle className="w-3 h-3" /> Approved
                                                    </span>
                                                )}
                                                {sub.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border text-amber-400 bg-amber-500/10 border-amber-500/20">
                                                        <Clock className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isApproved && (
                                                <button
                                                    onClick={() => handleApprove(sub.id)}
                                                    disabled={updatingId === sub.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                                >
                                                    {updatingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                                                </button>
                                            )}
                                            {!isApproved && (
                                                <button
                                                    onClick={() => handleReject(sub.id)}
                                                    disabled={updatingId === sub.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                >
                                                    {updatingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Reject & Delete
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(sub.id)}
                                                disabled={updatingId === sub.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Links */}
                                    {links.length > 0 && (
                                        <div className="space-y-2 pt-3 border-t border-black/5 dark:border-white/5">
                                            {links.map((link, i) => {
                                                const isUrl = link.url.startsWith('http');
                                                return (
                                                    <div key={i} className="flex items-center gap-3 group">
                                                        <Link2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />
                                                        <span className="text-xs text-zinc-500 shrink-0 w-36">{link.label}</span>
                                                        {isUrl ? (
                                                            <a
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-sky-400 hover:text-sky-300 truncate flex items-center gap-1 transition-colors"
                                                            >
                                                                {link.url} <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">{link.url}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* ══════ MEMBERS LIST VIEW ══════ */
                members.length > 0 ? (
                    <div className="space-y-2">
                        {members.map(member => {
                            const pendingCount = member.submissions.filter(s => s.status === 'pending').length;
                            const approvedCount = member.submissions.filter(s => s.status === 'approved').length;
                            return (
                                <button
                                    key={member.email}
                                    onClick={() => setSelectedMember(member.email)}
                                    className={cn(
                                        "w-full text-left rounded-xl p-4 flex items-center gap-4 transition-all hover:border-black/10 dark:hover:border-white/10",
                                        glassClass
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-black dark:text-white">{member.name}</p>
                                        <p className="text-xs text-zinc-500 truncate">{member.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-zinc-400">{member.submissions.length} submission{member.submissions.length !== 1 ? 's' : ''}</span>
                                        {pendingCount > 0 && (
                                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                {pendingCount} pending
                                            </span>
                                        )}
                                        {approvedCount > 0 && (
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                {approvedCount} approved
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Trophy className="w-8 h-8 text-zinc-700 mb-3" />
                        <p className="text-zinc-400 dark:text-zinc-600 text-sm">No quest submissions yet</p>
                    </div>
                )
            )}
        </CoreWrapper>
    );
}
