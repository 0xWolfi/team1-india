'use client';

import { useState, useEffect } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Trophy, ChevronRight, ArrowLeft, ExternalLink, Calendar, CheckCircle, XCircle, Clock, Loader2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

const QUEST_LABELS: Record<string, string> = {
    "quest-fullstack": "Full Stack Contributor",
    "quest-creator": "30 Day Creator Sprint",
    "quest-builder": "Build in Public",
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; cls: string }> = {
    pending: { label: "Pending", icon: Clock, cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    approved: { label: "Approved", icon: CheckCircle, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    rejected: { label: "Rejected", icon: XCircle, cls: "text-red-400 bg-red-500/10 border-red-500/20" },
};

interface Contribution {
    id: string;
    type: string;
    name: string;
    email: string;
    status: string;
    links: { label: string; url: string }[] | null;
    submittedAt: string;
    contentUrl?: string;
    eventDate?: string;
    eventLocation?: string;
}

export default function QuestSubmissionsPage() {
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/contributions')
            .then(r => r.ok ? r.json() : [])
            .then(data => setContributions(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Only show quest-type submissions
    const questContributions = contributions.filter(c => c.type.startsWith('quest-'));

    // Group by member email (unique members)
    const memberMap = new Map<string, { name: string; email: string; submissions: Contribution[] }>();
    questContributions.forEach(c => {
        if (!memberMap.has(c.email)) {
            memberMap.set(c.email, { name: c.name, email: c.email, submissions: [] });
        }
        memberMap.get(c.email)!.submissions.push(c);
    });

    // Sort each member's submissions by date (newest first)
    memberMap.forEach(member => {
        member.submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    });

    const members = Array.from(memberMap.values());
    const selectedMemberData = selectedMember ? memberMap.get(selectedMember) : null;

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/contributions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setContributions(prev => prev.map(c => c.id === id ? { ...c, status } : c));
            } else {
                alert('Failed to update status');
            }
        } catch {
            alert('Error updating status');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Quest Submissions"
                description="Review bounty quest submissions from Team1 India members."
                icon={<Trophy className="w-5 h-5 text-zinc-200" />}
            />

            {loading ? (
                <div className="py-20 text-center text-zinc-600 animate-pulse">Loading submissions...</div>
            ) : selectedMemberData ? (
                /* ── Member Detail View ── */
                <div>
                    <button
                        onClick={() => setSelectedMember(null)}
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to all members
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm">
                            {selectedMemberData.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{selectedMemberData.name}</h2>
                            <p className="text-xs text-zinc-500">{selectedMemberData.email} — {selectedMemberData.submissions.length} submission{selectedMemberData.submissions.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {selectedMemberData.submissions.map(sub => {
                            const statusCfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
                            const StatusIcon = statusCfg.icon;
                            const links: { label: string; url: string }[] = Array.isArray(sub.links) ? sub.links : [];

                            return (
                                <div key={sub.id} className={cn("rounded-xl p-5", glassClass)}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-white">
                                                    {QUEST_LABELS[sub.type] || sub.type}
                                                </span>
                                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", statusCfg.cls)}>
                                                    <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        {/* Status Actions */}
                                        <div className="flex items-center gap-2">
                                            {sub.status !== 'approved' && (
                                                <button
                                                    onClick={() => updateStatus(sub.id, 'approved')}
                                                    disabled={updatingId === sub.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                                >
                                                    {updatingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                                                </button>
                                            )}
                                            {sub.status !== 'rejected' && (
                                                <button
                                                    onClick={() => updateStatus(sub.id, 'rejected')}
                                                    disabled={updatingId === sub.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                >
                                                    {updatingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                                                </button>
                                            )}
                                            {sub.status !== 'pending' && (
                                                <button
                                                    onClick={() => updateStatus(sub.id, 'pending')}
                                                    disabled={updatingId === sub.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                                                >
                                                    <Clock className="w-3 h-3" /> Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Links */}
                                    {links.length > 0 && (
                                        <div className="space-y-2 pt-3 border-t border-white/5">
                                            {links.map((link, i) => (
                                                <div key={i} className="flex items-center gap-3 group">
                                                    <Link2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                                    <span className="text-xs text-zinc-500 shrink-0 w-36">{link.label}</span>
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-sky-400 hover:text-sky-300 truncate flex items-center gap-1 transition-colors"
                                                    >
                                                        {link.url} <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* ── Members List View ── */
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
                                        "w-full text-left rounded-xl p-4 flex items-center gap-4 transition-all hover:border-white/10",
                                        glassClass
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white">{member.name}</p>
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
                                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Trophy className="w-8 h-8 text-zinc-700 mb-3" />
                        <p className="text-zinc-600 text-sm">No quest submissions yet</p>
                    </div>
                )
            )}
        </CoreWrapper>
    );
}
