"use client";

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';

export function HelpfulWidget() {
    const [vote, setVote] = useState<'yes' | 'no' | null>(null);

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm">
            
            {/* Feedback Section */}
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">Was this guide helpful?</span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setVote('yes')}
                        className={`p-2 rounded-lg transition-all border ${vote === 'yes' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
                        aria-label="Yes, this was helpful"
                    >
                        <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setVote('no')}
                        className={`p-2 rounded-lg transition-all border ${vote === 'no' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
                        aria-label="No, this was not helpful"
                    >
                        <ThumbsDown className="w-4 h-4" />
                    </button>
                </div>
                {vote && <p className="text-xs text-zinc-500 animate-in fade-in">Thanks for your feedback!</p>}
            </div>
        </div>
    );
}
