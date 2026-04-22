'use client';

import { useState, useEffect, use } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Check, X, Mail, Calendar, Link2, ExternalLink, ClipboardList, Send, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const glassClass = "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]";

interface Submission {
    id: string;
    applicantEmail: string;
    status: string;
    submittedAt: string;
    data: Record<string, any>;
}

export default function EventFeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [guide, setGuide] = useState<any>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selected, setSelected] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Email state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [availableHosts, setAvailableHosts] = useState<{ name?: string; email?: string }[]>([]);
    const [selectedHostEmails, setSelectedHostEmails] = useState<string[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const toggleHostEmail = (email: string) => {
        setSelectedHostEmails(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const gRes = await fetch(`/api/guides/${id}`);
                if (gRes.ok) {
                    const guideData = await gRes.json();
                    setGuide(guideData);
                    const body = guideData.body as any;
                    // Load all hosts
                    const hosts: { name?: string; email?: string }[] = Array.isArray(body?.hosts) ? body.hosts : [];
                    if (hosts.length === 0 && body?.hostEmail) {
                        hosts.push({ name: body.hostName, email: body.hostEmail });
                    }
                    setAvailableHosts(hosts);
                    setSelectedHostEmails(hosts.filter(h => h.email).map(h => h.email!));
                    setEmailSubject(`Event Feedback - ${guideData.title}`);
                }

                const aRes = await fetch('/api/applications');
                if (aRes.ok) {
                    const allApps = await aRes.json();
                    setSubmissions(allApps.filter((a: any) => a.guideId === id));
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
        const slug = guide?.slug || id;
        navigator.clipboard.writeText(`${window.location.origin}/event-feedback/${slug}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openEmailModal = () => {
        const slug = guide?.slug || id;
        const link = `${window.location.origin}/event-feedback/${slug}`;
        const body = guide?.body as any;
        setEmailBody(
`Hi ${body?.hostName || 'there'},

Thank you for hosting "${guide?.title || 'the event'}" with Team1 India!

We'd love to hear about your experience. Please fill out this short feedback form:

${link}

Just sign in with your Google account and submit the form.

Thank you!`
        );
        setEmailSent(false);
        setShowEmailModal(true);
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

    const body = (guide?.body as any) || {};
    const pendingCount = submissions.filter(s => s.status === 'pending').length;

    if (loading) {
        return (
            <CoreWrapper>
                <div className="py-20 text-center text-zinc-400 dark:text-zinc-600 animate-pulse">Loading...</div>
            </CoreWrapper>
        );
    }

    return (
        <CoreWrapper>
            <CorePageHeader
                title={guide?.title || 'Event Feedback'}
                description={`${body.hostName ? `Host: ${body.hostName}` : ''}${body.city ? ` · ${body.city}` : ''} — ${submissions.length} submissions`}
                icon={<ClipboardList className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />}
                backLink="/core/event-feedback"
                backText="Back to Event Feedback"
            >
                <div className="flex items-center gap-2">
                    {availableHosts.some(h => h.email) && (
                        <button
                            onClick={openEmailModal}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-colors text-sky-400"
                        >
                            <Mail className="w-3.5 h-3.5" /> Email Host
                        </button>
                    )}
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-zinc-600 dark:text-zinc-300"
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
                    <p className="text-zinc-400 dark:text-zinc-600 text-sm">No submissions yet</p>
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
                                            ? "bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/20"
                                            : "bg-zinc-100/30 dark:bg-zinc-900/30 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-semibold text-black dark:text-white truncate">{sub.data?.name || 'Unknown'}</p>
                                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize shrink-0 ml-2", statusColors[sub.status] || statusColors.pending)}>
                                            {sub.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1 truncate">
                                        <Mail className="w-3 h-3 shrink-0" /> {sub.applicantEmail}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">
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
                                <div className="flex justify-between items-start border-b border-black/5 dark:border-white/5 pb-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-1">{selected.data?.name || 'Unknown'}</h2>
                                        <div className="flex flex-wrap gap-2 text-xs mt-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                                                <Mail className="w-3 h-3 text-zinc-500" /> {selected.applicantEmail}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
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

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Submission Details</h4>
                                    <div className="space-y-3">
                                        {Object.entries(selected.data || {}).map(([key, value]) => {
                                            if (key === 'submittedAt' || key === 'email') return null;
                                            const label = key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^\w/, c => c.toUpperCase());
                                            return (
                                                <div key={key} className="p-3 bg-white/20 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap break-words">
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
                            <div className="h-80 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                                <ClipboardList className="w-8 h-8 opacity-20 mb-3" />
                                <p className="font-medium text-sm">Select a submission</p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">View details and approve/reject</p>
                            </div>
                        )}
                    </div>
                </div>
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
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedHostEmails.includes(host.email!)
                                                        ? "bg-sky-500/10 border-sky-500/20"
                                                        : "bg-zinc-200/50 dark:bg-zinc-800/50 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10"
                                                }`}
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
