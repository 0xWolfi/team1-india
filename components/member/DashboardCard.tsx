"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Users, FileText, BookOpen, ArrowRight } from "lucide-react";
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

// SAND-GLASS UTILITY CLASS (Matching MemberDashboard)
const glassClass = "bg-zinc-900/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

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
    
    // Check if coverImage is valid (not null, undefined, or empty string)
    const hasValidImage = coverImage && coverImage.trim() !== '' && !imageError;

    // Icon Selection based on Type
    const getIcon = () => {
        switch (type) {
            case 'EVENT': return <Calendar className="w-5 h-5" />;
            case 'PROGRAM': return <Users className="w-5 h-5" />;
            case 'CONTENT': return <FileText className="w-5 h-5" />;
            case 'PLAYBOOK': return <BookOpen className="w-5 h-5" />;
            default: return <BookOpen className="w-5 h-5" />;
        }
    };

    return (
        <Link 
            href={href}
            className={cn(
                "group min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center p-5 rounded-2xl transition-all block relative h-full flex flex-col hover:border-white/20 hover:bg-zinc-900/80",
                glassClass,
                className
            )}
        >
            {/* Image Container */}
            <div className="mb-4 relative shrink-0">
                {hasValidImage ? (
                    <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-zinc-800 border border-white/5">
                        <img
                            key={coverImage} // Force re-render when coverImage changes
                            src={coverImage!}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                            onError={(e) => {
                                console.error('Image failed to load:', coverImage);
                                setImageError(true);
                            }}
                            onLoad={() => {
                                setImageError(false);
                            }}
                            crossOrigin="anonymous"
                        />
                         {/* Visibility Badge (Inset top-right) */}
                        {visibility && (
                            <div className="absolute top-2 right-2 z-10">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase border backdrop-blur-md shadow-lg",
                                    visibility === 'MEMBER' 
                                        ? "bg-white/10 text-white border-white/20" 
                                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/20"
                                )}>
                                    {visibility}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Fallback Icon Box */
                    <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-zinc-800/50 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                        <div className="text-zinc-600 group-hover:text-zinc-200 transition-colors">
                            {getIcon()}
                        </div>
                        {/* Visibility Badge (Inset top-right) */}
                        {visibility && (
                            <div className="absolute top-2 right-2 z-10">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase border backdrop-blur-md shadow-lg",
                                    visibility === 'MEMBER' 
                                        ? "bg-white/10 text-white border-white/20" 
                                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/20"
                                )}>
                                    {visibility}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content Content */}
            <div className="flex flex-col flex-1">
                <h3 className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-zinc-200 transition-colors line-clamp-2">
                    {title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-4">
                    {description || "No description provided."}
                </p>
                
                {/* Optional: 'View' Link hidden but semantic, relying on card click */}
                {/* <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-600 group-hover:text-indigo-400 transition-colors">
                    View Details <ArrowRight className="w-3 h-3" />
                </div> */}
            </div>
        </Link>
    );
}
