'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { FormBuilder, FormField } from '@/components/form-builder/FormBuilder';
import { ClipboardList, X, Link2, Copy, Check, Mail, Send, Loader2, Plus, Trash2, Save } from "lucide-react";
import Link from 'next/link';
import { cn } from "@/lib/utils";

export default function NewEventFeedbackPage() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId') || '';
    const eventName = searchParams.get('eventName') || '';
    const city = searchParams.get('city') || '';

    const [isSaving, setIsSaving] = useState(false);
    const [createdLink, setCreatedLink] = useState('');
    const [createdGuideId, setCreatedGuideId] = useState('');
    const [copied, setCopied] = useState(false);
    const [formTitle, setFormTitle] = useState(eventName ? `Feedback: ${eventName}` : '');
    const [formFields, setFormFields] = useState<FormField[]>([
        { id: 'default-name', key: 'name', label: 'Name', type: 'text', required: true, isDefault: true, editable: false },
        { id: 'default-email', key: 'email', label: 'Email', type: 'email', required: true, isDefault: true, editable: false },
    ]);

    // Hosts — admin adds manually or picks from members
    const [hosts, setHosts] = useState<{ name: string; email: string }[]>([{ name: '', email: '' }]);
    const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([]);
    const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);

    // Fetch community members once for autocomplete
    useEffect(() => {
        fetch('/api/community-members?limit=500')
            .then(r => r.ok ? r.json() : { data: [] })
            .then(res => {
                const list = res.data || res.members || (Array.isArray(res) ? res : []);
                setMembers(Array.isArray(list) ? list.filter((m: any) => m.name && m.email) : []);
            })
            .catch(() => {});
    }, []);

    const addHost = () => setHosts(prev => [...prev, { name: '', email: '' }]);
    const removeHost = (idx: number) => { setHosts(prev => prev.filter((_, i) => i !== idx)); setActiveSearchIdx(null); };
    const updateHost = (idx: number, field: 'name' | 'email', value: string) => {
        setHosts(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
        if (field === 'name') setActiveSearchIdx(idx);
    };
    const selectMember = (idx: number, member: { name: string; email: string }) => {
        setHosts(prev => prev.map((h, i) => i === idx ? { name: member.name, email: member.email } : h));
        setActiveSearchIdx(null);
    };

    // Filter members matching the typed name
    const getFilteredMembers = (query: string) => {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return members.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)).slice(0, 6);
    };

    // Valid hosts = those with at least an email
    const validHosts = hosts.filter(h => h.email.trim());

    // Email state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedHostEmails, setSelectedHostEmails] = useState<string[]>([]);
    const [emailSubject, setEmailSubject] = useState(`Event Feedback - ${eventName}`);
    const [emailBody, setEmailBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Set default email body when link is created
    useEffect(() => {
        if (createdLink) {
            // Pre-select all valid hosts
            setSelectedHostEmails(validHosts.map(h => h.email));
            setEmailBody(
`Hi there,

Thank you for hosting the "${eventName}" event with Team1 India!

We'd love to hear about your experience. Please fill out this short feedback form:

${createdLink}

Just sign in with your Google account and submit the form. It only takes a few minutes.

Thank you for your contribution to the Avalanche ecosystem in India!`
            );
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createdLink]);

    const handleSave = async () => {
        if (!formTitle.trim()) {
            alert('Please enter a form title');
            return;
        }
        setIsSaving(true);
        try {
            const firstHost = validHosts[0];
            const payload = {
                type: 'EVENT_FEEDBACK',
                title: formTitle,
                visibility: 'PUBLIC',
                body: {
                    description: '',
                    markdown: '',
                    lumaEventId: eventId,
                    hostName: firstHost?.name || '',
                    hostEmail: firstHost?.email || '',
                    hosts: validHosts,
                    city,
                },
                formSchema: formFields,
            };

            const res = await fetch('/api/guides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const guide = await res.json();
                setCreatedGuideId(guide.id);
                setCreatedLink(`${window.location.origin}/event-feedback/${guide.slug || guide.id}`);
            } else {
                alert('Failed to create feedback form');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating feedback form');
        } finally {
            setIsSaving(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(createdLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

    // ── Success state ──
    if (createdLink) {
        return (
            <CoreWrapper>
                <div className="max-w-xl mx-auto pt-20 text-center space-y-6">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit mx-auto">
                        <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Feedback Form Created!</h2>
                    <p className="text-sm text-zinc-400">Share this link with the event host. They can sign in and fill the feedback form.</p>

                    <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-white/10 rounded-xl">
                        <Link2 className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-sm text-zinc-300 truncate font-mono flex-1 text-left">{createdLink}</span>
                        <button
                            onClick={copyLink}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 border border-white/10 hover:bg-white/20 transition-colors text-white shrink-0"
                        >
                            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-4">
                        {validHosts.length > 0 && (
                            <button
                                onClick={() => setShowEmailModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                            >
                                <Mail className="w-4 h-4" /> Send Email to Host
                            </button>
                        )}
                        <Link href={`/core/event-feedback/${createdGuideId}`} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors">
                            View Submissions
                        </Link>
                        <Link href="/core/event-feedback" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-100 transition-colors">
                            Back to Event Feedback
                        </Link>
                    </div>
                </div>

                {/* Email Modal */}
                {showEmailModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/10 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-sky-400" /> Send Feedback Link
                                </h2>
                                <button onClick={() => setShowEmailModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
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
                                            {validHosts.map((host, i) => (
                                                <label
                                                    key={i}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                                        selectedHostEmails.includes(host.email)
                                                            ? "bg-sky-500/10 border-sky-500/20"
                                                            : "bg-zinc-800/50 border-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedHostEmails.includes(host.email)}
                                                        onChange={() => toggleHostEmail(host.email)}
                                                        className="accent-sky-500 w-4 h-4"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white font-medium">{host.name || 'Unknown'}</p>
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
                                            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Message</label>
                                        <textarea
                                            value={emailBody}
                                            onChange={e => setEmailBody(e.target.value)}
                                            rows={10}
                                            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20 resize-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            onClick={() => setShowEmailModal(false)}
                                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-800 border border-white/10 text-zinc-300 hover:bg-zinc-700 transition-colors"
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

    // ── Creation form ──
    return (
        <CoreWrapper>
            <CorePageHeader
                title={`Feedback: ${eventName || 'New Form'}`}
                description={`Create a feedback form${city ? ` · ${city}` : ''}`}
                icon={<ClipboardList className="w-5 h-5 text-zinc-200" />}
                backLink="/core/event-feedback"
                backText="Back to Event Feedback"
            >
                <Link href="/core/event-feedback">
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-colors border border-white/5">
                        <X className="w-4 h-4" /> Close
                    </button>
                </Link>
            </CorePageHeader>

            {/* Event Info + Hosts */}
            <div className="max-w-4xl mx-auto space-y-6 mb-8">
                {eventName && (
                    <div className="p-4 bg-zinc-900/40 border border-white/[0.06] rounded-xl">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Event Details</p>
                        <p className="text-sm text-white font-semibold">{eventName}</p>
                        {city && <p className="text-xs text-zinc-400 mt-1">City: {city}</p>}
                    </div>
                )}

                {/* Host inputs */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Event Hosts</label>
                    <p className="text-xs text-zinc-600 mb-3">Add the hosts who organized this event. They will receive the feedback form link via email.</p>
                    <div className="space-y-3">
                        {hosts.map((host, idx) => {
                            const filtered = activeSearchIdx === idx ? getFilteredMembers(host.name) : [];
                            return (
                                <div key={idx} className="flex items-start gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            value={host.name}
                                            onChange={e => updateHost(idx, 'name', e.target.value)}
                                            onFocus={() => setActiveSearchIdx(idx)}
                                            onBlur={() => setTimeout(() => setActiveSearchIdx(null), 200)}
                                            placeholder="Host name (type to search members)"
                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                        />
                                        {filtered.length > 0 && (
                                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                                                {filtered.map(m => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onMouseDown={() => selectMember(idx, m)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-3"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                                                            {m.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm text-white font-medium truncate">{m.name}</p>
                                                            <p className="text-xs text-zinc-500 truncate">{m.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        value={host.email}
                                        onChange={e => updateHost(idx, 'email', e.target.value)}
                                        placeholder="host@email.com"
                                        type="email"
                                        className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                    {hosts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeHost(idx)}
                                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors shrink-0 mt-0.5"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={addHost}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Another Host
                    </button>
                </div>

                <div className="h-px bg-white/5" />
            </div>

            {/* Form Title + Form Builder */}
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Form Title</label>
                    <input
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        placeholder="e.g., Event Feedback - Team1 Connect Pune"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Form Fields</label>
                    <p className="text-xs text-zinc-600 mb-3">Name and Email are included by default. Add custom questions for the feedback form.</p>
                    <FormBuilder fields={formFields} onChange={setFormFields} />
                </div>

                <div className="flex justify-end pt-4 pb-8">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Save className="w-4 h-4" /> Create Feedback Form</>}
                    </button>
                </div>
            </div>
        </CoreWrapper>
    );
}
