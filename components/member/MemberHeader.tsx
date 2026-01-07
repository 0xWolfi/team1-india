"use client";

import React from "react";
import { User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface MemberHeaderProps {
    user?: {
        name?: string | null;
        image?: string | null;
        email?: string | null;
    } | null;
}

export function MemberHeader({ user }: MemberHeaderProps) {
    return (
        <header className="mb-8 border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                    <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Member Portal</span>
                    </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                    Overview
                </h1>
                <p className="text-zinc-500 font-medium text-sm mt-2 max-w-lg leading-relaxed">
                    Welcome back, <span className="text-white">{user?.name || 'Member'}</span>.
                </p>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                    {user?.image ? (
                        <img src={user.image} alt="Profile" className="w-10 h-10 rounded-full ring-2 ring-white/10" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center ring-2 ring-white/10">
                                <User className="w-5 h-5 text-zinc-400" />
                        </div>
                    )}
                    <button 
                        onClick={() => signOut({ callbackUrl: '/public' })}
                        className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center text-red-400 hover:text-red-300"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
