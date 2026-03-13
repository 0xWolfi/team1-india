"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MotionIcon } from "motion-icons-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
    id: string;
    title: string;
    description?: string | null;
    coverImage?: string | null;
    href: string;
    type: 'EVENT' | 'PROGRAM' | 'CONTENT' | 'PLAYBOOK';
    visibility?: 'MEMBER' | 'PUBLIC' | string | null;
    className?: string;
}

const typeConfig = {
    EVENT: { icon: "Calendar", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", label: "Event" },
    PROGRAM: { icon: "Users", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "Program" },
    CONTENT: { icon: "FileText", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Content" },
    PLAYBOOK: { icon: "BookOpen", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Playbook" },
};

export function DashboardCard({
    title,
    description,
    coverImage,
    href,
    type,
    visibility,
    className
}: DashboardCardProps) {
    const [imageError, setImageError] = useState(false);
    const config = typeConfig[type];

    // Add cache-buster for blob URLs to prevent SW cache issues
    const getImageUrl = (url: string | null | undefined): string | undefined => {
        if (!url) return undefined;
        if (url.includes('.public.blob.vercel-storage.com')) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}t=${Date.now()}`;
        }
        return url;
    };

    return (
        <Link
            href={href}
            className={cn(
                "group block rounded-2xl p-4 transition-all duration-300",
                "bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06]",
                "hover:border-white/[0.12] hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-black/20",
                className
            )}
        >
            {/* Image */}
            <div className="relative mb-3 rounded-xl overflow-hidden bg-zinc-800/50">
                {coverImage && !imageError ? (
                    <div className="aspect-[16/9]">
                        <img
                            src={getImageUrl(coverImage)}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
                            onError={() => setImageError(true)}
                        />
                    </div>
                ) : (
                    <div className="aspect-[16/9] flex items-center justify-center">
                        <div className={cn("p-3 rounded-xl border", config.bg, config.border)}>
                            <MotionIcon name={config.icon} className={cn("w-6 h-6 pointer-events-none", config.color)} />
                        </div>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md border",
                        config.bg, config.color, config.border
                    )}>
                        {config.label}
                    </span>
                    {visibility && (
                        <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-md",
                            visibility === 'MEMBER'
                                ? "bg-white/10 text-white/70 border-white/20"
                                : "bg-zinc-800/60 text-zinc-400 border-zinc-700/50"
                        )}>
                            {visibility}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-white text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-zinc-100 transition-colors">
                {title}
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                {description || "No description provided."}
            </p>
        </Link>
    );
}
