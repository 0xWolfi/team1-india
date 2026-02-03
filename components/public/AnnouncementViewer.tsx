"use client";

import React, { useEffect, useState } from "react";
import { MotionIcon } from "motion-icons-react";

interface Announcement {
    id: string;
    title: string;
    link?: string;
    audience: string;
    createdAt: string;
}

export function AnnouncementViewer({ audience }: { audience: 'PUBLIC' | 'MEMBER' }) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                // Audience param logic handled by API (PUBLIC fetches PUBLIC+ALL, MEMBER fetches MEMBER+ALL)
                const res = await fetch(`/api/announcements?audience=${audience}`);
                if (res.ok) {
                    const data = await res.json();
                    setAnnouncements(data);
                }
            } catch (e) {
                console.error("Failed to load announcements", e);
            }
        };
        fetchAnnouncements();
    }, [audience]);

    if (!isVisible || announcements.length === 0) return null;

    return (
        <div className="w-full mb-8">
            <div className="flex items-center gap-2 mb-4">
                 <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <MotionIcon name="Megaphone" className="w-4 h-4 text-indigo-500" /> 
                    {audience === 'MEMBER' ? 'Member Updates' : 'Announcements'}
                 </h2>
                 <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="grid gap-3">
                {announcements.slice(0, 3).map((item) => ( // Show max 3 latest
                    <div key={item.id} className="relative group overflow-hidden bg-zinc-900/80 border border-white/10 rounded-xl p-4 hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="text-base font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    {item.link && (
                                        <a href={item.link} target="_blank" className="flex items-center gap-1 hover:text-white underline decoration-zinc-700 underline-offset-4">
                                            Read more <MotionIcon name="ExternalLink" className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
                                item.audience === 'ALL' ? 'bg-indigo-500' : 'bg-emerald-500'
                            }`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
