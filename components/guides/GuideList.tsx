import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

interface Guide {
    id: string;
    title: string;
    body: {
        description: string;
    };
    type: string;
    audience?: string[];
}

interface GuideListProps {
    guides: Guide[];
    basePath: string; // e.g. '/core/events/guides'
    isLoading?: boolean;
}

export const GuideList: React.FC<GuideListProps> = ({ guides, basePath, isLoading }) => {
    if (isLoading) {
        return <div className="text-zinc-500 text-sm animate-pulse">Loading guides...</div>;
    }

    if (guides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <BookOpen className="w-8 h-8 text-zinc-600 mb-4" />
                <h3 className="text-zinc-400 font-medium text-sm">No guides available</h3>
                <p className="text-zinc-600 text-xs mt-1">Check back later for standard operating procedures.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map(guide => (
                <div key={guide.id} className="group relative bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900/80 transition-all hover:-translate-y-1 hover:border-white/10 flex flex-col h-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                    
                    <div className="relative z-10 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white group-hover:bg-white/10 transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            {/* Audience Tags */}
                            <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                                {(guide.audience || []).slice(0, 2).map((tag: string) => (
                                    <span key={tag} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        {tag}
                                    </span>
                                ))}
                                {(guide.audience || []).length > 2 && (
                                    <span className="px-2 py-0.5 bg-zinc-800 border border-white/10 text-zinc-400 rounded-full text-[10px] font-bold">
                                        +{(guide.audience || []).length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">{guide.title}</h3>
                        <p className="text-sm text-zinc-500 line-clamp-3 mb-6">
                            {guide.body?.description || "No description provided."}
                        </p>
                    </div>

                    <div className="relative z-10 pt-4 border-t border-white/5 mt-auto">
                        <Link 
                            href={`${basePath}/${guide.id}`}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors"
                        >
                            View Guide <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
};
