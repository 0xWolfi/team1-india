'use client';

import { useState } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideBuilder } from '@/components/guides/GuideBuilder';
import { Megaphone, X, MapPin, Link2, Copy, Check } from "lucide-react";
import Link from 'next/link';

export default function NewCampaignPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [campaignType, setCampaignType] = useState<'WORKSHOP' | 'HACKATHON'>('WORKSHOP');
    const [city, setCity] = useState('');
    const [createdLink, setCreatedLink] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSave = async (data: any) => {
        setIsSaving(true);
        try {
            const payload = {
                ...data,
                type: campaignType,
                visibility: 'PUBLIC',
                body: {
                    ...data.body,
                    city: city,
                },
            };

            const res = await fetch('/api/guides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const guide = await res.json();
                const prefix = campaignType === 'HACKATHON' ? 'hackathon' : 'workshop';
                setCreatedLink(`${window.location.origin}/${prefix}/${guide.slug || guide.id}`);
            } else {
                alert('Failed to create campaign');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating campaign');
        } finally {
            setIsSaving(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(createdLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Success state — show the generated link
    if (createdLink) {
        return (
            <CoreWrapper>
                <div className="max-w-xl mx-auto pt-20 text-center space-y-6">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit mx-auto">
                        <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">Campaign Created!</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Share this link with participants. They can open it, sign in, and fill the form.</p>

                    <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl">
                        <Link2 className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-300 truncate font-mono flex-1 text-left">{createdLink}</span>
                        <button
                            onClick={copyLink}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-black dark:text-white shrink-0"
                        >
                            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 justify-center pt-4">
                        <Link href="/core/campaigns" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                            View All Campaigns
                        </Link>
                        <button
                            onClick={() => { setCreatedLink(''); setCity(''); }}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-100 transition-colors"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </CoreWrapper>
        );
    }

    return (
        <CoreWrapper>
            <CorePageHeader
                title="New Campaign"
                description="Create a workshop or hackathon form with a shareable link."
                icon={<Megaphone className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />}
            >
                <Link href="/core/campaigns">
                    <button className="flex items-center gap-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white px-3 py-2 rounded-lg transition-colors border border-black/5 dark:border-white/5">
                        <X className="w-4 h-4" /> Close
                    </button>
                </Link>
            </CorePageHeader>

            {/* Campaign-specific fields */}
            <div className="max-w-4xl mx-auto space-y-6 mb-8">
                {/* Type selector */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Campaign Type</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCampaignType('WORKSHOP')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition-all ${
                                campaignType === 'WORKSHOP'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-black/10 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <span className="text-lg">🎓</span> Workshop
                        </button>
                        <button
                            onClick={() => setCampaignType('HACKATHON')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition-all ${
                                campaignType === 'HACKATHON'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-black/10 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <span className="text-lg">🏆</span> Hackathon
                        </button>
                    </div>
                </div>

                {/* City / Campus */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> City / Campus</span>
                    </label>
                    <input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="e.g., IIT Delhi, Bangalore, Mumbai"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black/20 dark:focus:border-white/20 transition-all shadow-inner shadow-white/20 dark:shadow-black/20"
                    />
                </div>

                <div className="h-px bg-black/5 dark:bg-white/5" />
            </div>

            {/* Reuse the existing GuideBuilder for title, description, content, form fields */}
            <GuideBuilder
                type={campaignType}
                onSave={handleSave}
                isSaving={isSaving}
            />
        </CoreWrapper>
    );
}
