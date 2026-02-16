"use client";

import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Comment, MediaItem } from './types';

interface MediaModalActivityProps {
    comments: Comment[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auditLogs: any[];
    isFetchingDetails: boolean;
    initialData?: MediaItem | null;
    onAddComment: (content: string) => Promise<void>;
}

export function MediaModalActivity({ 
    comments, 
    auditLogs, 
    isFetchingDetails, 
    initialData,
    onAddComment
}: MediaModalActivityProps) {
    const [newComment, setNewComment] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSending(true);
        try {
            await onAddComment(newComment);
            setNewComment('');
        } finally {
            setIsSending(false);
        }
    };

    const formatName = (email?: string) => {
        if (!email) return 'Unknown';
        const username = email.split('@')[0];
        const firstName = username.split(/[._]/)[0];
        return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    };

    return (
        <div className="flex flex-col h-full bg-[#050505]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isFetchingDetails && (
                    <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-zinc-500"/></div>
                )}
                
                {!isFetchingDetails && comments.length === 0 && auditLogs.length === 0 && (
                        <div className="text-center text-zinc-600 py-10 text-sm">No activity yet.</div>
                )}

                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">
                            {formatName(comment.author?.email)[0]}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-zinc-300">{formatName(comment.author?.email)}</span>
                                <span className="text-[10px] text-zinc-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-lg rounded-tl-none px-3 py-2 text-sm text-zinc-200">
                                {comment.content}
                            </div>
                        </div>
                    </div>
                ))}

                {auditLogs.length > 0 && (
                    <div className="relative pl-4 pt-4 border-l border-zinc-800 ml-3 space-y-6">
                        <span className="absolute -left-3 -top-2 text-[10px] font-mono text-zinc-600 bg-[#09090b] px-1">LOGS</span>
                        {auditLogs.map(log => (
                            <div key={log.id} className="relative">
                                <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-zinc-800 border-2 border-[#09090b]" />
                                <div className="text-xs text-zinc-500">
                                    <span className="font-medium text-zinc-400">{formatName(log.actor?.email)}</span>
                                    {' '}{log.action.toLowerCase().replace('_', ' ')}{' '}
                                    <span className="text-zinc-600">{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-zinc-900/30">
                <div className="flex gap-2">
                    <input 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
                    />
                    <button 
                        type="submit"
                        disabled={!newComment.trim() || isSending}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
