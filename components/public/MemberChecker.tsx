"use client";

import React, { useState } from 'react';
import { MotionIcon } from "motion-icons-react";

export default function MemberChecker() {
    const [email, setEmail] = useState("");
    const [xHandle, setXHandle] = useState("");
    const [telegram, setTelegram] = useState("");
    const [discord, setDiscord] = useState("");
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'FOUND' | 'NOT_FOUND'>('IDLE');
    const [result, setResult] = useState<{ name?: string; role?: string } | null>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email && !xHandle && !telegram && !discord) return;

        setStatus('LOADING');
        setResult(null);

        try {
            const res = await fetch('/api/public/check-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, xHandle, telegram, discord })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.isMember) {
                    setStatus('FOUND');
                    setResult(data);
                } else {
                    setStatus('NOT_FOUND');
                }
            } else {
                setStatus('IDLE'); // Reset or show error
            }
        } catch (error) {
            setStatus('IDLE');
        }
    };

    return (
        <div className="w-full">
            <div>
                <form onSubmit={handleCheck} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Row 1 */}
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (e.target.value) {
                                        setXHandle("");
                                        setTelegram("");
                                        setDiscord("");
                                    }
                                }}
                                placeholder="name@example.com"
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 ml-1">X Handle</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">@</span>
                                <input
                                    type="text"
                                    value={xHandle}
                                    onChange={(e) => {
                                        setXHandle(e.target.value.replace('@', ''));
                                        if (e.target.value) {
                                            setEmail("");
                                            setTelegram("");
                                            setDiscord("");
                                        }
                                    }}
                                    placeholder="username"
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-500"
                                />
                            </div>
                        </div>
                        
                        {/* Row 2 */}
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 ml-1">Telegram Handle</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">@</span>
                                <input
                                    type="text"
                                    value={telegram}
                                    onChange={(e) => {
                                        setTelegram(e.target.value.replace('@', ''));
                                        if (e.target.value) {
                                            setEmail("");
                                            setXHandle("");
                                            setDiscord("");
                                        }
                                    }}
                                    placeholder="username"
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-500"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 ml-1">Discord ID</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">@</span>
                                <input
                                    type="text"
                                    value={discord}
                                    onChange={(e) => {
                                        setDiscord(e.target.value.replace('@', ''));
                                        if (e.target.value) {
                                            setEmail("");
                                            setXHandle("");
                                            setTelegram("");
                                        }
                                    }}
                                    placeholder="username"
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-500"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'LOADING' || (!email && !xHandle && !telegram && !discord)}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-400 hover:text-white font-medium text-sm py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'LOADING' ? (
                            <>
                                <MotionIcon name="Loader2" className="w-4 h-4 animate-spin" animation="spin" /> Verifying...
                            </>
                        ) : (
                            <>
                                <MotionIcon name="Search" className="w-4 h-4" /> Check Status
                            </>
                        )}
                    </button>
                </form>

                {/* Results Area */}
                <div className="pt-2 min-h-[40px] flex items-center justify-center">
                    {status === 'FOUND' && result && (
                        <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20 w-full justify-center">
                            <MotionIcon name="CheckCircle2" className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm">
                                Yes, <strong className="text-white">{result.name}</strong> is a <span className="capitalize">{result.role}</span>.
                            </span>
                        </div>
                    )}

                    {status === 'NOT_FOUND' && (
                        <div className="flex items-center gap-3 text-zinc-400 bg-zinc-800/50 px-4 py-3 rounded-xl border border-white/5 w-full justify-center">
                            <MotionIcon name="XCircle" className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm">No member found with these details.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
