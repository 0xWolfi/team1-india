"use client";

import React from "react";
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
                {coverImage ? (
                    <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-zinc-800 border border-white/5">
                        <img
                            src={coverImage}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                // Safe fallback - no innerHTML to prevent XSS
                                if (target.parentElement && !target.parentElement.querySelector('.image-fallback')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-full h-full flex items-center justify-center bg-zinc-800/50 image-fallback';
                                    const icon = document.createElement('div');
                                    icon.className = 'text-zinc-600 group-hover:text-zinc-200 transition-colors';
                                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                    svg.setAttribute('class', 'w-8 h-8');
                                    svg.setAttribute('fill', 'none');
                                    svg.setAttribute('stroke', 'currentColor');
                                    svg.setAttribute('viewBox', '0 0 24 24');
                                    
                                    if (type === 'EVENT') {
                                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                                        rect.setAttribute('width', '18');
                                        rect.setAttribute('height', '18');
                                        rect.setAttribute('x', '3');
                                        rect.setAttribute('y', '4');
                                        rect.setAttribute('rx', '2');
                                        rect.setAttribute('ry', '2');
                                        svg.appendChild(rect);
                                    } else if (type === 'PROGRAM') {
                                        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                        path1.setAttribute('d', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2');
                                        svg.appendChild(path1);
                                    } else if (type === 'CONTENT') {
                                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                        path.setAttribute('d', 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z');
                                        svg.appendChild(path);
                                    } else if (type === 'PLAYBOOK') {
                                        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                        path1.setAttribute('d', 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z');
                                        svg.appendChild(path1);
                                        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                        path2.setAttribute('d', 'M22 3h-6a4 4 0 0 1-4 4v14a3 3 0 0 0 3-3h7z');
                                        svg.appendChild(path2);
                                    }
                                    icon.appendChild(svg);
                                    fallback.appendChild(icon);
                                    target.parentElement.appendChild(fallback);
                                }
                            }}
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
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 group-hover:text-white transition-colors border border-white/5">
                        <div className="text-zinc-500 group-hover:text-white transition-colors">
                            {getIcon()}
                        </div>
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
