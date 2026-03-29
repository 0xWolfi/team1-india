'use client';

import { useState, useEffect } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Calendar, MapPin, Mail, User, Plus, Link2, Copy, Check, ClipboardList, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from 'next/link';

const glassClass = "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]";

type Tab = 'events' | 'forms';

export default function EventFeedbackPage() {
    const [tab, setTab] = useState<Tab>('events');
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [feedbackGuides, setFeedbackGuides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/event-feedback');
                if (res.ok) {
                    const data = await res.json();
                    setRecentEvents(data.recentEvents || []);
                    setFeedbackGuides(data.feedbackGuides || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const copyLink = (guide: any) => {
        const slug = guide.slug || guide.id;
        navigator.clipboard.writeText(`${window.location.origin}/event-feedback/${slug}`);
        setCopiedId(guide.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Check if a feedback form already exists for a given luma event
    const getExistingForm = (eventId: string) => {
        return feedbackGuides.find((g: any) => (g.body as any)?.lumaEventId === eventId);
    };

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Event Feedback"
                description="Collect post-event feedback from hosts via custom forms."
                icon={<ClipboardList className="w-5 h-5 text-zinc-200" />}
            />

            {/* Tabs */}
            <div className="flex rounded-lg p-0.5 bg-zinc-800/80 border border-white/5 w-fit mb-6">
                {(['events', 'forms'] as Tab[]).map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={cn(
                            "px-4 py-2 rounded-md text-xs font-semibold capitalize transition-all",
                            tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {t === 'events' ? `Recent Events (${recentEvents.length})` : `Feedback Forms (${feedbackGuides.length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20 text-center text-zinc-600 animate-pulse">Loading...</div>
            ) : tab === 'events' ? (
                /* ── Recent Events Tab ── */
                recentEvents.length > 0 ? (
                    <div className="space-y-3">
                        {recentEvents.map((event: any) => {
                            const existingForm = getExistingForm(event.id);
                            return (
                                <div key={event.id} className={cn("rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4", glassClass)}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white mb-1">{event.name}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(event.startAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            {event.city && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {event.city}
                                                </span>
                                            )}
                                            {event.hostName && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {event.hostName}
                                                </span>
                                            )}
                                            {event.hostEmail && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {event.hostEmail}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {existingForm ? (
                                            <Link
                                                href={`/core/event-feedback/${existingForm.id}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                                            >
                                                <Check className="w-3.5 h-3.5" /> View Form
                                            </Link>
                                        ) : (
                                            <Link
                                                href={`/core/event-feedback/new?eventId=${event.id}&eventName=${encodeURIComponent(event.name)}&hostName=${encodeURIComponent(event.hostName || '')}&hostEmail=${encodeURIComponent(event.hostEmail || '')}&city=${encodeURIComponent(event.city || '')}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-100 transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Create Feedback Form
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Calendar className="w-8 h-8 text-zinc-700 mb-3" />
                        <p className="text-zinc-600 text-sm">No events in the past 10 days</p>
                    </div>
                )
            ) : (
                /* ── Feedback Forms Tab ── */
                feedbackGuides.length > 0 ? (
                    <div className="space-y-3">
                        {feedbackGuides.map((guide: any) => {
                            const body = guide.body as any;
                            return (
                                <div key={guide.id} className={cn("rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4", glassClass)}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white mb-1">{guide.title}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                                            {body?.hostName && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {body.hostName}
                                                </span>
                                            )}
                                            {body?.hostEmail && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {body.hostEmail}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <ClipboardList className="w-3 h-3" /> {guide._count?.applications || 0} submissions
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => copyLink(guide)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-300"
                                        >
                                            {copiedId === guide.id ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Link2 className="w-3.5 h-3.5" /> Copy Link</>}
                                        </button>
                                        <Link
                                            href={`/core/event-feedback/${guide.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-300"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> View
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <ClipboardList className="w-8 h-8 text-zinc-700 mb-3" />
                        <p className="text-zinc-600 text-sm">No feedback forms created yet</p>
                    </div>
                )
            )}
        </CoreWrapper>
    );
}
