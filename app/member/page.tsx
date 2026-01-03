"use client";

import { signOut, useSession } from "next-auth/react";
import React from "react";
import { 
    User, Users, BookOpen, Beaker, Film, LogOut
} from "lucide-react";
import Link from "next/link";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { useRouter } from "next/navigation";

export default function MemberPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const resources = [
        { 
            title: "My Profile", 
            link: "/member/profile", 
            icon: <User />, 
            description: "Update your bio, social links, and contact info.",
        },
        { 
            title: "Community", 
            link: "/public", // Or /member/directory if distinct
            icon: <Users />, 
            description: "Connect with other members and partners.",
        },
        { 
            title: "Resources", 
            link: "/public", // Point to public resources for now, or filtered view
            icon: <BookOpen />, 
            description: "Access guides, playbooks, and learning materials.",
        },
        { 
            title: "Experiments", 
            link: "/core/experiments", // Members have access? Yes per requirements
            icon: <Beaker />, 
            description: "View and propose new community experiments.",
        },
        { 
            title: "Media Kit", 
            link: "/core/mediakit", 
            icon: <Film />, 
            description: "Download official brand assets and resources.",
        },
    ];

    return (
        <CoreWrapper>
            {/* Header */}
            <header className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Member Portal</span>
                     </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                        Overview
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm mt-2 max-w-lg leading-relaxed">
                        Welcome back, <span className="text-white">{session?.user?.name || 'Member'}</span>.
                    </p>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                        {session?.user?.image ? (
                            <img src={session.user.image} alt="Profile" className="w-10 h-10 rounded-full ring-2 ring-white/10" />
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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource, idx) => (
                    <Link 
                        key={idx} 
                        href={resource.link}
                        className="group block p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                {React.cloneElement(resource.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6 text-zinc-300 group-hover:text-white" })}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-0">{resource.title}</h3>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {resource.description}
                        </p>
                    </Link>
                ))}
            </div>
        </CoreWrapper>
    );
}
