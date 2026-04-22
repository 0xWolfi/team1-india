import React from 'react';
import Image from "next/image";
import Link from 'next/link';
import { ArrowRight, FileText } from "lucide-react";
interface ResourceCardProps {
    title: string;
    href: string;
    coverImage?: string;
    description?: string;
    author?: string;
    date?: string;
    className?: string;
    buttonText?: string;
    visibility?: 'CORE' | 'MEMBER' | 'PUBLIC';
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
    title, 
    href, 
    coverImage, 
    description,
    author,
    date,
    className = "",
    buttonText = "Read",
    visibility
}) => {
    return (
        <Link href={href} className={`group block rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all overflow-hidden flex flex-col h-full ${className}`}>
            {/* Image Section */}
            <div className="h-48 w-full bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden">
                {coverImage ? (
                    <Image
                        src={coverImage}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors">
                        <FileText className="w-12 h-12 text-red-500/50 group-hover:text-red-500 transition-colors"/>
                    </div>
                )}

                {visibility && (
                    <div className="absolute top-2 right-2 flex gap-2">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] uppercase tracking-wider font-bold ${
                            visibility === 'PUBLIC' ? 'bg-black/60 border-blue-500/20 text-blue-400' :
                            visibility === 'CORE' ? 'bg-black/60 border-purple-500/20 text-purple-400' :
                            'bg-black/60 border-white/10 text-zinc-400'
                        }`}>
                            <span>{visibility}</span>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-black dark:text-white line-clamp-2 leading-tight group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                        {title}
                    </h3>
                    <div className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-all flex items-center gap-1">
                        {buttonText} <ArrowRight className="w-3 h-3"/>
                    </div>
                </div>

                {description && (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
                        {description}
                    </p>
                )}
                
                {(author || date) && (
                    <div className="mt-auto pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500 font-medium">
                        {author && <span>by <span className="text-zinc-500 dark:text-zinc-400 capitalize">{author.replace(/^By\s+/i, '')}</span></span>}
                        {date && <span>{date}</span>}
                    </div>
                )}
            </div>
        </Link>
    );
};
