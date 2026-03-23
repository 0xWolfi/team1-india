"use client";

import { ExternalLink, Megaphone, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

interface Announcement {
    id: string;
    title: string;
    link?: string;
    audience: string;
    createdAt: string;
    expiresAt?: string | null;
}

export default function AnnouncementsPage() {
    const canManage = usePermission('content', 'WRITE');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [audience, setAudience] = useState("ALL");
    const [expiresAt, setExpiresAt] = useState("");
    const [isNoLimit, setIsNoLimit] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    // Conflict / Limit Handling
    const [conflictItems, setConflictItems] = useState<Announcement[] | null>(null);
    const [conflictError, setConflictError] = useState("");

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        const res = await fetch('/api/announcements');
        const data = await res.json();
        setAnnouncements(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await postAnnouncement();
    };

    const postAnnouncement = async () => {
        setIsLoading(true);
        setConflictItems(null);
        try {
            const res = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title, 
                    link, 
                    audience,
                    expiresAt: isNoLimit ? null : expiresAt 
                })
            });

            if (res.status === 409) {
                const data = await res.json();
                setConflictError(data.details);
                setConflictItems(data.existingItems);
                return;
            }

            if (res.ok) {
                setIsCreating(false);
                setTitle("");
                setLink("");
                setAudience("ALL");
                setExpiresAt("");
                setIsNoLimit(true);
                fetchAnnouncements();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (id: string, skipConfirm = false) => {
        if (!skipConfirm && !confirm('Are you sure?')) return;
        await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
        fetchAnnouncements();
    };

    const handleReplace = async (id: string) => {
        // 1. Delete selected item
        await handleDelete(id, true);
        // 2. Retry creating the new one
        await postAnnouncement();
    };

    return (
        <CoreWrapper>
            {/* Limit Reached Modal */}
            {conflictItems && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                                <Megaphone className="w-6 h-6"/>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Limit Reached</h2>
                                <p className="text-zinc-400 text-sm">{conflictError}</p>
                                <p className="text-zinc-500 text-xs mt-1">Please select an old announcement to replace with your new one.</p>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
                            {conflictItems.map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => handleReplace(item.id)}
                                    disabled={isLoading}
                                    className="w-full text-left p-3 rounded-xl bg-black/20 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all group flex items-center justify-between"
                                >
                                    <div>
                                        <div className="font-bold text-sm text-zinc-300 group-hover:text-red-400">{item.title}</div>
                                        <div className="text-[10px] text-zinc-600 mt-1">{new Date(item.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-500 group-hover:text-red-400 uppercase tracking-wider">Replace</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={() => setConflictItems(null)}
                                className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CorePageHeader
                title="Announcements"
                description="Broadcast updates to Public, Members, or Everyone."
                icon={<Megaphone className="w-5 h-5 text-red-500"/>}
            >
                {!isCreating && canManage && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-bold shadow-lg shadow-red-500/20"
                    >
                        <Plus className="w-4 h-4"/> New Announcement
                    </button>
                )}
            </CorePageHeader>

            {isCreating && (
                <div className="mb-8 p-6 bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl animate-in slide-in-from-top-4 fade-in">
                    <h2 className="text-lg font-bold mb-4">Create Announcement</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title / Message</label>
                            <input 
                                type="text" 
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-indigo-500/50 outline-none"
                                placeholder="e.g. Community Call starting in 10 mins!"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Link (Optional)</label>
                                <input 
                                    type="url" 
                                    value={link}
                                    onChange={e => setLink(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-indigo-500/50 outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Target Audience</label>
                                <select 
                                    value={audience}
                                    onChange={e => setAudience(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-indigo-500/50 outline-none text-white"
                                >
                                    <option value="ALL">Everyone (Public & Members)</option>
                                    <option value="PUBLIC">Public Only</option>
                                    <option value="MEMBER">Members Only</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Auto-Delete (Timer)</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="date" 
                                        value={expiresAt}
                                        onChange={e => setExpiresAt(e.target.value)}
                                        disabled={isNoLimit}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-indigo-500/50 outline-none text-white disabled:opacity-50"
                                    />
                                    <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer text-sm text-zinc-400 select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={isNoLimit}
                                            onChange={e => {
                                                setIsNoLimit(e.target.checked);
                                                if(e.target.checked) setExpiresAt("");
                                            }}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
                                        />
                                        No Limit
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                                <button 
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 disabled:opacity-50"
                            >
                                {isLoading ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-3">
                    {(!Array.isArray(announcements) || announcements.length === 0) ? (
                    <div className="flex flex-col items-center justify-center text-zinc-500 h-64 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <Megaphone className="w-12 h-12 mb-4 opacity-20"/>
                        <p>No active announcements.</p>
                    </div>
                    ) : (
                    announcements.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-xl group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${
                                    item.audience === 'PUBLIC' ? 'bg-blue-500/10 text-blue-400' :
                                    item.audience === 'MEMBER' ? 'bg-emerald-500/10 text-emerald-400' :
                                    'bg-purple-500/10 text-purple-400'
                                }`}>
                                    <Megaphone className="w-5 h-5"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        {item.title}
                                        {item.link && (
                                            <a href={item.link} target="_blank" className="text-zinc-500 hover:text-white">
                                                <ExternalLink className="w-3 h-3"/>
                                            </a>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider font-mono">
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
                            {canManage && (
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            )}
                        </div>
                    ))
                    )}
            </div>
        </CoreWrapper>
    );
}
