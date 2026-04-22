"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Megaphone } from "lucide-react";
import { MemberWrapper } from "@/components/member/MemberWrapper";

interface Announcement {
    id: string;
    title: string;
    link?: string;
    audience: string;
    createdAt: string;
    expiresAt?: string | null;
}

export default function MemberAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        const res = await fetch('/api/announcements');
        const data = await res.json();

        // Filter to show MEMBER and ALL (PUBLIC) announcements only
        const memberAnnouncements = data.filter((a: Announcement) =>
            a.audience === 'MEMBER' || a.audience === 'ALL'
        );

        // Sort: MEMBER first, then ALL
        memberAnnouncements.sort((a: Announcement, b: Announcement) => {
            if (a.audience === 'MEMBER' && b.audience !== 'MEMBER') return -1;
            if (a.audience !== 'MEMBER' && b.audience === 'MEMBER') return 1;
            return 0;
        });

        setAnnouncements(memberAnnouncements);
    };

    return (
        <MemberWrapper>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                        <Megaphone className="w-5 h-5 text-zinc-700 dark:text-zinc-200"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white">Announcements</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">View member-only and public announcements from the team.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-3">
                {(!Array.isArray(announcements) || announcements.length === 0) ? (
                    <div className="flex flex-col items-center justify-center text-zinc-500 h-64 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                        <Megaphone className="w-12 h-12 mb-4 opacity-20"/>
                        <p>No active announcements.</p>
                    </div>
                ) : (
                    announcements.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 rounded-xl hover:border-black/10 dark:hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`p-2 rounded-lg ${
                                    item.audience === 'MEMBER' ? 'bg-emerald-500/10 text-emerald-400' :
                                    'bg-purple-500/10 text-purple-400'
                                }`}>
                                    <Megaphone className="w-5 h-5"/>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-black dark:text-white flex items-center gap-2">
                                        {item.title}
                                        {item.link && (
                                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                                <ExternalLink className="w-3 h-3"/>
                                            </a>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                        <span className="bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded border border-black/5 dark:border-white/5 uppercase tracking-wider font-mono">
                                            {item.audience}
                                        </span>
                                        <span>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        {item.expiresAt && (
                                            <span className="text-red-400 text-[10px] border border-red-500/20 px-1.5 rounded">
                                                Exp: {new Date(item.expiresAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </MemberWrapper>
    );
}
