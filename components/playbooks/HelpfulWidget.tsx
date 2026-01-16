"use client";

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';

export function HelpfulWidget() {
    const [vote, setVote] = useState<'yes' | 'no' | null>(null);

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-500">Was this guide helpful?</span>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setVote('yes')}
                    className={`p-1.5 rounded-md transition-all ${vote === 'yes' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                    aria-label="Yes, this was helpful"
                >
                    <ThumbsUp className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setVote('no')}
                    className={`p-1.5 rounded-md transition-all ${vote === 'no' ? 'bg-red-500/10 text-red-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                    aria-label="No, this was not helpful"
                >
                    <ThumbsDown className="w-4 h-4" />
                </button>
            </div>
            {vote && <span className="text-xs text-zinc-500 animate-in fade-in">Thanks!</span>}
        </div>
    );
}
