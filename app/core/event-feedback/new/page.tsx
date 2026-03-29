'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideBuilder } from '@/components/guides/GuideBuilder';
import { ClipboardList, X, Link2, Copy, Check, Mail, Send, Loader2 } from "lucide-react";
import Link from 'next/link';

export default function NewEventFeedbackPage() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId') || '';
    const eventName = searchParams.get('eventName') || '';
    const hostName = searchParams.get('hostName') || '';
    const hostEmail = searchParams.get('hostEmail') || '';
    const city = searchParams.get('city') || '';

    const [isSaving, setIsSaving] = useState(false);
    const [createdLink, setCreatedLink] = useState('');
    const [createdGuideId, setCreatedGuideId] = useState('');
    const [copied, setCopied] = useState(false);

    // Email state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState(hostEmail);
    const [emailSubject, setEmailSubject] = useState(`Event Feedback - ${eventName}`);
    const [emailBody, setEmailBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Set default email body when link is created
    useEffect(() => {
        if (createdLink) {
            setEmailBody(
`Hi ${hostName || 'there'},

Thank you for hosting the "${eventName}" event with Team1 India!

We'd love to hear about your experience. Please fill out this short feedback form:

${createdLink}

Just sign in with your Google account and submit the form. It only takes a few minutes.

Thank you for your contribution to the Avalanche ecosystem in India!`
            );
        }
    }, [createdLink, eventName, hostName]);

    const handleSave = async (data: any) => {
        setIsSaving(true);
        try {
            const payload = {
                ...data,
                type: 'EVENT_FEEDBACK',
                visibility: 'PUBLIC',
                body: {
                    ...data.body,
                    lumaEventId: eventId,
                    hostName,
                    hostEmail,
                    city,
                },
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

    const handleSendEmail = async () => {
        if (!emailTo || !emailSubject || !emailBody) {
            alert('Please fill in all email fields');
            return;
        }
        setSendingEmail(true);
        try {
            const res = await fetch('/api/event-feedback/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: emailTo, subject: emailSubject, body: emailBody }),
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

    // Success state
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
                        {hostEmail && (
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
                                        <label className="text-xs text-zinc-500 block mb-1">To</label>
                                        <input
                                            value={emailTo}
                                            onChange={e => setEmailTo(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20"
                                        />
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

    return (
        <CoreWrapper>
            <CorePageHeader
                title={`Feedback: ${eventName || 'New Form'}`}
                description={`Create a feedback form${hostName ? ` for ${hostName}` : ''}${city ? ` · ${city}` : ''}`}
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

            {/* Event Info Banner */}
            {eventName && (
                <div className="max-w-4xl mx-auto mb-6 p-4 bg-zinc-900/40 border border-white/[0.06] rounded-xl">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Event Details</p>
                    <p className="text-sm text-white font-semibold">{eventName}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-400">
                        {hostName && <span>Host: {hostName}</span>}
                        {hostEmail && <span>Email: {hostEmail}</span>}
                        {city && <span>City: {city}</span>}
                    </div>
                </div>
            )}

            <GuideBuilder
                type="EVENT_FEEDBACK"
                onSave={handleSave}
                isSaving={isSaving}
            />
        </CoreWrapper>
    );
}
