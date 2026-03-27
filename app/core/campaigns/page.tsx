'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Plus, MapPin, Link2, Check, Trash2, ExternalLink } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

const typeConfig: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
    WORKSHOP: { icon: "GraduationCap", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Workshop" },
    HACKATHON: { icon: "Trophy", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Hackathon" },
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/guides?type=WORKSHOP');
            const workshops = res.ok ? await res.json() : [];
            const res2 = await fetch('/api/guides?type=HACKATHON');
            const hackathons = res2.ok ? await res2.json() : [];
            setCampaigns([...workshops, ...hackathons].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCampaigns(); }, []);

    const getPublicLink = (campaign: any) => {
        if (typeof window === 'undefined') return '';
        const slug = campaign.slug || campaign.id;
        const prefix = campaign.type === 'HACKATHON' ? 'hackathon' : 'workshop';
        return `${window.location.origin}/${prefix}/${slug}`;
    };

    const copyLink = (campaign: any) => {
        navigator.clipboard.writeText(getPublicLink(campaign));
        setCopiedId(campaign.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            const res = await fetch(`/api/guides/${id}`, { method: 'DELETE' });
            if (res.ok) fetchCampaigns();
            else alert('Failed to delete');
        } catch { alert('Error'); }
    };

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Campaigns"
                description="Create workshops & hackathon forms with shareable links."
                icon={<DynamicIcon name="Megaphone" className="w-5 h-5 text-zinc-200" />}
            >
                <Link href="/core/campaigns/new">
                    <button className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors text-sm">
                        <Plus className="w-4 h-4" /> New Campaign
                    </button>
                </Link>
            </CorePageHeader>

            {loading ? (
                <div className="py-20 text-center text-zinc-600 animate-pulse">Loading...</div>
            ) : campaigns.length === 0 ? (
                <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                    <DynamicIcon name="Megaphone" className="w-8 h-8 text-zinc-700 mb-3" />
                    <p className="text-zinc-600 text-sm">No campaigns yet. Create your first one.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {campaigns.map((c: any) => {
                        const cfg = typeConfig[c.type] || typeConfig.WORKSHOP;
                        const city = (c.body as any)?.city || '';
                        return (
                            <div key={c.id} className={cn("rounded-xl p-4", glassClass)}>
                                <div className="flex items-center gap-4">
                                    <Link href={`/core/campaigns/${c.id}`} className={cn("p-2.5 rounded-lg border shrink-0 hover:opacity-80 transition-opacity", cfg.bg, cfg.border)}>
                                        <DynamicIcon name={cfg.icon} className={cn("w-5 h-5", cfg.color)} />
                                    </Link>
                                    <Link href={`/core/campaigns/${c.id}`} className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-semibold text-white truncate hover:underline">{c.title}</p>
                                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0", cfg.bg, cfg.color, cfg.border)}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        {city && (
                                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {city}
                                            </p>
                                        )}
                                    </Link>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => copyLink(c)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-300"
                                            title="Copy shareable link"
                                        >
                                            {copiedId === c.id ? (
                                                <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
                                            ) : (
                                                <><Link2 className="w-3.5 h-3.5" /> Copy Link</>
                                            )}
                                        </button>
                                        <a
                                            href={getPublicLink(c)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                            title="Open public link"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Shareable Link Preview */}
                                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-zinc-950/50 border border-white/5 rounded-lg">
                                    <Link2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                    <span className="text-xs text-zinc-500 truncate font-mono">{getPublicLink(c)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Submissions count */}
            {campaigns.length > 0 && (
                <div className="mt-8">
                    <p className="text-xs text-zinc-600 text-center">
                        Submissions are reviewed in the <Link href="/core/applications" className="text-zinc-400 hover:text-white underline">Applications</Link> section.
                    </p>
                </div>
            )}
        </CoreWrapper>
    );
}
