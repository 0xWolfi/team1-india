"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Cpu, FileText, Globe, LayoutGrid, List, Search } from "lucide-react";
import { MemberWrapper } from "@/components/member/MemberWrapper";

interface Playbook {
    id: string;
    title: string;
    updatedAt: string;
    createdBy?: { email: string };
    visibility: 'CORE' | 'MEMBER' | 'PUBLIC';
    coverImage?: string;
    description?: string;
}

export default function MemberPlaybooksPage() {
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'MEMBER' | 'PUBLIC'>('ALL');

    const fetchPlaybooks = () => {
        setIsLoading(true);
        fetch('/api/playbooks')
            .then(res => res.json())
            .then(data => {
                // Filter to only show MEMBER and PUBLIC playbooks
                const memberPlaybooks = data.filter((p: Playbook) =>
                    p.visibility === 'MEMBER' || p.visibility === 'PUBLIC'
                );

                // Sort: MEMBER first, then PUBLIC
                memberPlaybooks.sort((a: Playbook, b: Playbook) => {
                    if (a.visibility === 'MEMBER' && b.visibility !== 'MEMBER') return -1;
                    if (a.visibility !== 'MEMBER' && b.visibility === 'MEMBER') return 1;
                    return 0;
                });

                setPlaybooks(memberPlaybooks);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchPlaybooks();
    }, []);

    const filtered = playbooks.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVisibility = visibilityFilter === 'ALL' || p.visibility === visibilityFilter;
        return matchesSearch && matchesVisibility;
    });

    return (
        <MemberWrapper>
            <Link href="/member" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4"/>
                Back to Dashboard
            </Link>
            
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <BookOpen className="w-5 h-5 text-zinc-200"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Playbooks</h1>
                        <p className="text-sm text-zinc-400">Access member-only and public playbooks, guides, and strategic documentation.</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-10">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors"/>
                    </div>
                    <input
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all hover:bg-zinc-900/80"
                        placeholder="Search playbooks..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Visibility Filter */}
                <div className="relative">
                    <select
                        value={visibilityFilter}
                        onChange={(e) => setVisibilityFilter(e.target.value as 'ALL' | 'MEMBER' | 'PUBLIC')}
                        className="appearance-none bg-zinc-900/50 border border-white/5 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-zinc-300 focus:outline-none focus:border-white/20 hover:border-white/20 transition-colors cursor-pointer min-w-[140px]"
                    >
                        <option value="ALL">All Playbooks</option>
                        <option value="MEMBER">Member Only</option>
                        <option value="PUBLIC">Public Only</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
                </div>

                <div className="flex gap-1 bg-zinc-900/50 border border-white/5 p-1 rounded-xl self-start md:self-auto backdrop-blur-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4"/>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="List View"
                    >
                        <List className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div>
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                )}

                {!isLoading && filtered.length === 0 && (
                    <div className="py-32 text-center border-2 border-white/5 rounded-[2rem] border-dashed bg-white/5 backdrop-blur-sm flex flex-col items-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                            <Search className="w-8 h-8 text-zinc-600"/>
                        </div>
                        <h3 className="text-zinc-200 text-xl font-bold mb-2">No playbooks found</h3>
                        <p className="text-zinc-500 max-w-xs mx-auto">
                            {searchTerm ? `We couldn't find anything matching "${searchTerm}".` : "No playbooks are available yet."}
                        </p>
                    </div>
                )}

                <div className={`
                    ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-4 max-w-4xl'}
                `}>
                    {filtered.map(doc => (
                        <div key={doc.id} className="relative group/card perspective-1000">
                            <div className={`
                                group relative overflow-hidden transition-all duration-500 border border-white/[0.08] hover:border-white/20
                                ${viewMode === 'grid'
                                    ? 'bg-[#121212]/80 backdrop-blur-xl rounded-[2rem] h-full flex flex-col hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                                    : 'bg-[#121212]/80 backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between hover:bg-white/5'
                                }
                            `}>
                                <Link href={`/member/playbooks/${doc.id}`} className="absolute inset-0 z-20" />

                                {viewMode === 'grid' && (
                                    <div className="absolute -inset-2 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none" />
                                )}

                                <div className={`relative z-10 w-full ${viewMode === 'list' ? 'flex flex-row items-center justify-between p-6 gap-8' : 'flex flex-col h-full'}`}>
                                    {viewMode === 'grid' && (
                                        <div className="relative h-48 w-full bg-zinc-900 overflow-hidden border-b border-white/5 rounded-t-[2rem]">
                                            {doc.coverImage ? (
                                                <img
                                                    src={doc.coverImage}
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    onError={(e) => {
                                                        // Fallback if image fails to load - safe rendering without innerHTML
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        if (target.parentElement && !target.parentElement.querySelector('.image-fallback')) {
                                                            const fallback = document.createElement('div');
                                                            fallback.className = 'w-full h-full flex items-center justify-center bg-zinc-800/50 image-fallback';
                                                            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                                            svg.setAttribute('class', 'w-12 h-12 text-zinc-700');
                                                            svg.setAttribute('fill', 'none');
                                                            svg.setAttribute('stroke', 'currentColor');
                                                            svg.setAttribute('viewBox', '0 0 24 24');
                                                            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                                            path.setAttribute('stroke-linecap', 'round');
                                                            path.setAttribute('stroke-linejoin', 'round');
                                                            path.setAttribute('stroke-width', '2');
                                                            path.setAttribute('d', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z');
                                                            svg.appendChild(path);
                                                            fallback.appendChild(svg);
                                                            target.parentElement.appendChild(fallback);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
                                                    <FileText className="w-12 h-12 text-zinc-700 group-hover:text-zinc-600 transition-colors"/>
                                                </div>
                                            )}

                                            <div className="absolute top-4 right-4">
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] uppercase tracking-wider font-bold ${
                                                    doc.visibility === 'PUBLIC' ? 'bg-black/60 border-white/10 text-zinc-300' :
                                                    'bg-black/60 border-white/20 text-white'
                                                }`}>
                                                    {doc.visibility === 'PUBLIC' ? <Globe className="w-3 h-3"/> : <Cpu className="w-3 h-3"/>}
                                                    <span>{doc.visibility}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`flex-1 flex flex-col ${viewMode === 'grid' ? 'bg-zinc-900/50' : 'min-w-0'}`}>
                                        {viewMode === 'grid' ? (
                                            <>
                                                <div className="p-4 flex items-start justify-between gap-4 mb-2">
                                                    <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight group-hover:text-zinc-200 transition-colors">
                                                        {doc.title}
                                                    </h3>
                                                    <div className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-all flex items-center gap-2">
                                                        Open <ArrowRight className="w-3 h-3"/>
                                                    </div>
                                                </div>

                                                <div className="px-4 mb-3 flex-1">
                                                    <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">
                                                        {doc.description || "No description provided."}
                                                    </p>
                                                </div>

                                                <div className="px-4 pb-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-medium mt-auto">
                                                    <span className="truncate max-w-[150px]">by <span className="text-zinc-400 capitalize">{doc.createdBy?.email.split('@')[0]}</span></span>
                                                    <span className="flex items-center gap-1.5">
                                                        {formatDistanceToNow(new Date(doc.updatedAt))} ago
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-bold text-white text-xl truncate group-hover:text-white transition-all duration-300">
                                                        {doc.title}
                                                    </h3>

                                                    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ml-4 ${
                                                        doc.visibility === 'PUBLIC' ? 'bg-zinc-800/10 border-white/10 text-zinc-400' :
                                                        'bg-white/10 border-white/20 text-white'
                                                    }`}>
                                                        {doc.visibility}
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-4">
                                                        {doc.description || "No description provided."}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                                                    <span className="truncate max-w-[150px] text-zinc-400">By {doc.createdBy?.email.split('@')[0]}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        {formatDistanceToNow(new Date(doc.updatedAt))} ago
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {viewMode === 'list' && doc.coverImage && (
                                        <div className="w-32 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                            <img
                                                src={doc.coverImage}
                                                alt={doc.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </MemberWrapper>
    );
}
