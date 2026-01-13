"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Twitter, Send } from "lucide-react";
import { MemberWrapper } from "@/components/member/MemberWrapper";

interface CommunityMember {
    id: string;
    name: string;
    email: string;
    xHandle?: string;
    telegram?: string;
    tags?: string;
    status?: string;
}

export default function MemberDirectoryPage() {
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/community-members');
            if (res.ok) {
                const data = await res.json();
                // Filter to show only active members
                const activeMembers = data.filter((m: CommunityMember) =>
                    m.status === 'active'
                );
                setMembers(activeMembers);
            }
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MemberWrapper>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Users className="w-5 h-5 text-zinc-200" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Members Directory</h1>
                        <p className="text-sm text-zinc-400">Connect with fellow community members.</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-10 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                </div>
                <input
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all hover:bg-zinc-900/80"
                    placeholder="Search members by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                    ))}
                </div>
            )}

            {!isLoading && filtered.length === 0 && (
                <div className="py-32 text-center border-2 border-white/5 rounded-[2rem] border-dashed bg-white/5 backdrop-blur-sm flex flex-col items-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                        <Search className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-zinc-200 text-xl font-bold mb-2">No members found</h3>
                    <p className="text-zinc-500 max-w-xs mx-auto">
                        {searchTerm ? `We couldn't find anyone matching "${searchTerm}".` : "No members in the directory yet."}
                    </p>
                </div>
            )}

            {!isLoading && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(member => (
                        <div
                            key={member.id}
                            className="group p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
                        >
                            {/* Avatar/Initials */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate">
                                        {member.name}
                                    </h3>
                                    {member.tags && (
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono bg-white/5 px-2 py-0.5 rounded">
                                            {member.tags}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-2">
                                <a
                                    href={`mailto:${member.email}`}
                                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group/item"
                                >
                                    <Mail className="w-4 h-4 text-zinc-600 group-hover/item:text-blue-400 transition-colors" />
                                    <span className="truncate">{member.email}</span>
                                </a>

                                {member.xHandle && (
                                    <a
                                        href={`https://x.com/${member.xHandle.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group/item"
                                    >
                                        <Twitter className="w-4 h-4 text-zinc-600 group-hover/item:text-blue-400 transition-colors" />
                                        <span>{member.xHandle}</span>
                                    </a>
                                )}

                                {member.telegram && (
                                    <a
                                        href={`https://t.me/${member.telegram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group/item"
                                    >
                                        <Send className="w-4 h-4 text-zinc-600 group-hover/item:text-blue-400 transition-colors" />
                                        <span>{member.telegram}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </MemberWrapper>
    );
}
