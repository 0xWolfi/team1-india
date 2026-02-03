"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionIcon } from "motion-icons-react";

export function AdminSidebar() {
    const pathname = usePathname();

    const links = [
        { label: "Team", href: "/core/admin", icon: "LayoutDashboard" },
        { label: "Community", href: "/core/members", icon: "Users" },
        { label: "Logs", href: "/core/logs", icon: "FileText" },
        { label: "Media Assets", href: "/core/media", icon: "Film" },
        { label: "Archives", href: "/core/admin/archives", icon: "Archive" },
        { label: "Settings", href: "/core/admin/settings", icon: "Settings" },
    ];

    return (
        <aside className="w-64 border-r border-white/5 bg-zinc-950/50 flex flex-col p-4 md:h-[calc(100vh-6rem)] sticky top-24 rounded-2xl md:mr-6">
            <div className="flex items-center gap-2 px-3 py-2 mb-6">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <MotionIcon name="Shield" className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="font-bold text-sm tracking-wide text-zinc-200">Admin Console</span>
            </div>

            <nav className="space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link 
                            key={link.href}
                            href={link.href}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                                ${isActive 
                                    ? "bg-white/10 text-white shadow-sm border border-white/5" 
                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                                }
                            `}
                        >
                            <MotionIcon name={link.icon} className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-3 py-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono text-zinc-500">System Secure</span>
                </div>
            </div>
        </aside>
    );
}
