'use client';

import { useState, useEffect } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Calendar, MapPin, Mail, User, Plus, Link2, Copy, Check, ClipboardList, ExternalLink, Send, X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from 'next/link';

const glassClass = "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]";

type Tab = 'events' | 'forms';

export default function EventFeedbackPage() {
    const [tab, setTab] = useState<Tab>('events');
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [feedbackGuides, setFeedbackGuides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (guideId: string) => {
        if (!confirm('Are you sure you want to delete this feedback form? This cannot be undone.')) return;
        setDeletingId(guideId);
        try {
            const res = await fetch(`/api/guides/${guideId}`, { method: 'DELETE' });
            if (res.ok) {
                setFeedbackGuides(prev => prev.filter(g => g.id !== guideId));
            } else {
                alert('Failed to delete form');
            }
        } catch {
            alert('Error deleting form');
        } finally {
            setDeletingId(null);
        }
    };

    // Email modal state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [availableHosts, setAvailableHosts] = useState<{ name?: string; email?: string }[]>([]);
    const [selectedHostEmails, setSelectedHostEmails] = useState<string[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const openEmailModal = (guide: any) => {
        const body = guide.body as any;
        const slug = guide.slug || guide.id;
        const link = `${window.location.origin}/event-feedback/${slug}`;

        // Collect all hosts from guide body
        const hosts: { name?: string; email?: string }[] = Array.isArray(body?.hosts) ? body.hosts : [];
        // Fallback: if no hosts array but single hostEmail exists
        if (hosts.length === 0 && body?.hostEmail) {
            hosts.push({ name: body.hostName, email: body.hostEmail });
        }
        setAvailableHosts(hosts);
        // Pre-select all hosts with emails
        setSelectedHostEmails(hosts.filter(h => h.email).map(h => h.email!));

        setEmailSubject(`Event Feedback - ${guide.title}`);
        setEmailBody(
`Hi there,

Thank you for hosting "${guide.title}" with Team1 India!

We'd love to hear about your experience. Please fill out this short feedback form:

${link}

Just sign in with your Google account and submit the form. It only takes a few minutes.

Thank you!`
        );
        setEmailSent(false);
        setShowEmailModal(true);
    };

    const toggleHostEmail = (email: string) => {
        setSelectedHostEmails(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const handleSendEmail = async () => {
        if (selectedHostEmails.length === 0 || !emailSubject || !emailBody) {
            alert('Please select at least one host and fill in all fields');
            return;
        }
        setSendingEmail(true);
        try {
            const res = await fetch('/api/event-feedback/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: selectedHostEmails.join(', '), subject: emailSubject, body: emailBody }),
            });
            if (res.ok) {
                setEmailSent(true);
                setTimeout(() => setShowEmailModal(false), 1500);
            } else {
                alert('Failed to send email');
            }
        } catch {
            alert('Error sending email');
        } finally {
            setSendingEmail(false);
        }
    };

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
                icon={<ClipboardList className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />}
            />

            {/* Tabs */}
            <div className="flex rounded-lg p-0.5 bg-zinc-200/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/5 w-fit mb-6">
                {(['events', 'forms'] as Tab[]).map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={cn(
                            "px-4 py-2 rounded-md text-xs font-semibold capitalize transition-all",
                            tab === t ? "bg-black/10 dark:bg-white/10 text-black dark:text-white" : "text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                        )}
                    >
                        {t === 'events' ? `Recent Events (${recentEvents.length})` : `Feedback Forms (${feedbackGuides.length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20 text-center text-zinc-400 dark:text-zinc-600 animate-pulse">Loading...</div>
            ) : tab === 'events' ? (
                /* ── Recent Events Tab ── */
                recentEvents.length > 0 ? (
                    <div className="space-y-3">
                        {recentEvents.map((event: any) => {
                            const existingForm = getExistingForm(event.id);
                            const eventHosts: { name?: string; email?: string }[] = Array.isArray(event.hosts) ? event.hosts : [];
                            return (
                                <div key={event.id} className={cn("rounded-xl p-4", glassClass)}>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-black dark:text-white mb-1">{event.name}</p>
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
                                                    href={`/core/event-feedback/new?eventId=${event.id}&eventName=${encodeURIComponent(event.name)}&city=${encodeURIComponent(event.city || '')}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black dark:bg-white dark:text-black hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Create Feedback Form
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    {/* Show all hosts */}
                                    {eventHosts.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-2">
                                            {eventHosts.map((host, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-zinc-500 dark:text-zinc-400">
                                                    <User className="w-3 h-3" />
                                                    {host.name || 'Unknown'}
                                                    {host.email && <span className="text-zinc-400 dark:text-zinc-600">({host.email})</span>}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <Calendar className="w-8 h-8 text-zinc-700 mb-3" />
                        <p className="text-zinc-400 dark:text-zinc-600 text-sm">No events in the past 10 days</p>
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
                                        <p className="text-sm font-semibold text-black dark:text-white mb-1">{guide.title}</p>
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
                                        {body?.hostEmail && (
                                            <button
                                                onClick={() => openEmailModal(guide)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-colors text-sky-400"
                                            >
                                                <Mail className="w-3.5 h-3.5" /> Send Email
                                            </button>
                                        )}
                                        <button
                                            onClick={() => copyLink(guide)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-zinc-600 dark:text-zinc-300"
                                        >
                                            {copiedId === guide.id ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Link2 className="w-3.5 h-3.5" /> Copy Link</>}
                                        </button>
                                        <Link
                                            href={`/core/event-feedback/${guide.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-zinc-600 dark:text-zinc-300"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(guide.id)}
                                            disabled={deletingId === guide.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-red-400 disabled:opacity-50"
                                        >
                                            {deletingId === guide.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn("py-16 rounded-2xl flex flex-col items-center justify-center border-dashed", glassClass)}>
                        <ClipboardList className="w-8 h-8 text-zinc-700 mb-3" />
                        <p className="text-zinc-400 dark:text-zinc-600 text-sm">No feedback forms created yet</p>
                    </div>
                )
            )}
            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <Mail className="w-5 h-5 text-sky-400" /> Send Feedback Link
                            </h2>
                            <button onClick={() => setShowEmailModal(false)} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>

                        {emailSent ? (
                            <div className="py-8 text-center">
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit mx-auto mb-3">
                                    <Check className="w-6 h-6 text-emerald-400" />
                                </div>
                                <p className="text-sm text-emerald-400 font-semibold">Email sent successfully!</p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1.5">Select Hosts to Email</label>
                                    <div className="space-y-2">
                                        {availableHosts.filter(h => h.email).map((host, i) => (
                                            <label
                                                key={i}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                                    selectedHostEmails.includes(host.email!)
                                                        ? "bg-sky-500/10 border-sky-500/20"
                                                        : "bg-zinc-200/50 dark:bg-zinc-800/50 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10"
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedHostEmails.includes(host.email!)}
                                                    onChange={() => toggleHostEmail(host.email!)}
                                                    className="accent-sky-500 w-4 h-4"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-black dark:text-white font-medium">{host.name || 'Unknown'}</p>
                                                    <p className="text-xs text-zinc-500 truncate">{host.email}</p>
                                                </div>
                                            </label>
                                        ))}
                                        {availableHosts.filter(h => h.email).length === 0 && (
                                            <p className="text-xs text-zinc-600 py-2">No hosts with email addresses found.</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1">Subject</label>
                                    <input
                                        value={emailSubject}
                                        onChange={e => setEmailSubject(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-black dark:text-white text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1">Message</label>
                                    <textarea
                                        value={emailBody}
                                        onChange={e => setEmailBody(e.target.value)}
                                        rows={10}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-black dark:text-white text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20 resize-none"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={() => setShowEmailModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={sendingEmail}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 transition-colors disabled:opacity-40"
                                    >
                                        {sendingEmail ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Email</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </CoreWrapper>
    );
}
