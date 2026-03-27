'use client';

import { useState, useEffect, use } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Check, X, Mail, Calendar, Link2, ExternalLink, ClipboardList } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

const typeConfig: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
    WORKSHOP: { icon: "GraduationCap", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Workshop" },
    HACKATHON: { icon: "Trophy", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Hackathon" },
};

interface Submission {
    id: string;
    applicantEmail: string;
    status: string;
    submittedAt: string;
    data: Record<string, any>;
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [campaign, setCampaign] = useState<any>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selected, setSelected] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch guide details
                const gRes = await fetch(`/api/guides/${id}`);
                if (gRes.ok) setCampaign(await gRes.json());

                // Fetch all applications, filter by this guide
                const aRes = await fetch('/api/applications');
                if (aRes.ok) {
                    const allApps = await aRes.json();
                    const filtered = allApps.filter((a: any) => a.guideId === id);
                    setSubmissions(filtered);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleStatusChange = async (submissionId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/applications/${submissionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: newStatus } : s));
                if (selected?.id === submissionId) setSelected({ ...selected, status: newStatus });
            } else {
                alert('Failed to update status');
            }
        } catch {
            alert('Error updating status');
        }
    };

    const copyLink = () => {
        if (typeof window === 'undefined') return;
        const prefix = campaign?.type === 'HACKATHON' ? 'hackathon' : 'workshop';
        const slug = campaign?.slug || id;
        navigator.clipboard.writeText(`${window.location.origin}/${prefix}/${slug}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const cfg = typeConfig[campaign?.type] || typeConfig.WORKSHOP;
    const city = (campaign?.body as any)?.city || '';
    const pendingCount = submissions.filter(s => s.status === 'pending').length;

    if (loading) {
        return (
            <CoreWrapper>
                <div className="py-20 text-center text-zinc-600 animate-pulse">Loading...</div>
            </CoreWrapper>
        );
    }

    return (
        <CoreWrapper>
            <CorePageHeader
                title={campaign?.title || 'Campaign'}
                description={`${cfg.label}${city ? ` · ${city}` : ''} — ${submissions.length} submissions`}
                icon={<DynamicIcon name={cfg.icon} className={cn("w-5 h-5", cfg.color)} />}
                backLink="/core/campaigns"
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-300"
                    >
                        {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Link2 className="w-3.5 h-3.5" /> Copy Link</>}
                    </button>
                </div>
            </CorePageHeader>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                <div className={cn("p-3 sm:p-4 rounded-2xl", glassClass)}>
                    <p className="text-xl sm:text-2xl font-bold">{submissions.length}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-500">Total</p>
                </div>
                <div className={cn("p-3 sm:p-4 rounded-2xl", glassClass)}>
                    <p className="text-xl sm:text-2xl font-bold text-amber-400">{pendingCount}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-500">Pending</p>
                </div>
                <div className={cn("p-3 sm:p-4 rounded-2xl", glassClass)}>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-400">{submissions.filter(s => s.status === 'approved').length}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-500">Approved</p>
                </div>
            </div>

            {submissions.length === 0 ? (
                <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                    <ClipboardList className="w-8 h-8 text-zinc-700 mb-3" />
                    <p className="text-zinc-600 text-sm">No submissions yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* List */}
                    <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                        {submissions.map(sub => {
                            const statusColors: Record<string, string> = {
                                pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                rejected: "bg-red-500/10 text-red-400 border-red-500/20",
                            };
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setSelected(sub)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border transition-all",
                                        selected?.id === sub.id
                                            ? "bg-white/5 border-white/20"
                                            : "bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-semibold text-white truncate">{sub.data?.name || 'Unknown'}</p>
                                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize shrink-0 ml-2", statusColors[sub.status] || statusColors.pending)}>
                                            {sub.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1 truncate">
                                        <Mail className="w-3 h-3 shrink-0" /> {sub.applicantEmail}
                                    </p>
                                    <p className="text-[10px] text-zinc-600 mt-1">
                                        {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Detail View */}
                    <div className="lg:col-span-2">
                        {selected ? (
                            <div className={cn("rounded-2xl p-6 sm:p-8 space-y-6 sticky top-24", glassClass)}>
                                {/* Header */}
                                <div className="flex justify-between items-start border-b border-white/5 pb-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{selected.data?.name || 'Unknown'}</h2>
                                        <div className="flex flex-wrap gap-2 text-xs mt-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-zinc-300 flex items-center gap-1.5">
                                                <Mail className="w-3 h-3 text-zinc-500" /> {selected.applicantEmail}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-zinc-300 flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-zinc-500" /> {new Date(selected.submittedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleStatusChange(selected.id, 'rejected')}
                                            disabled={selected.status === 'rejected'}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Reject"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(selected.id, 'approved')}
                                            disabled={selected.status === 'approved'}
                                            className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Approve"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Form Data */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Submission Details</h4>
                                    <div className="space-y-3">
                                        {Object.entries(selected.data || {}).map(([key, value]) => {
                                            if (key === 'submittedAt' || key === 'email') return null;
                                            const label = key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^\w/, c => c.toUpperCase());
                                            return (
                                                <div key={key} className="p-3 bg-black/20 rounded-xl border border-white/5">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
                                                    <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">
                                                        {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                                                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 flex items-center gap-1">
                                                                <ExternalLink className="w-3 h-3" /> {value}
                                                            </a>
                                                        ) : (
                                                            String(value)
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                                <ClipboardList className="w-8 h-8 opacity-20 mb-3" />
                                <p className="font-medium text-sm">Select a submission</p>
                                <p className="text-xs text-zinc-600 mt-1">View details and approve/reject</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </CoreWrapper>
    );
}
