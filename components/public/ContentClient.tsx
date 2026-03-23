"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LayoutGrid, List, Search, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const glassClass = "bg-zinc-900/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

function TimeAgo({ date }: { date: Date | string }) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000); 
    
    let text = "";
    if (diff < 60) text = "just now";
    else if (diff < 3600) text = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) text = `${Math.floor(diff / 3600)}h ago`;
    else text = `${Math.floor(diff / 86400)}d ago`;
    
    return <span>{text}</span>;
}

export default function ContentClient({ guides }: { guides: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredGuides = guides.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors"/>
                    <input 
                        type="text" 
                        placeholder="Search content..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={cn(
                            "w-full pl-11 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all",
                            glassClass
                        )}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-all", glassClass)}>
                        <LayoutGrid className="w-4 h-4"/> 
                        <span>All Views</span>
                        <ChevronDown className="w-3 h-3 opacity-50"/>
                    </button>
                    <div className={cn("flex items-center rounded-xl p-1", glassClass)}>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'grid' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4"/>
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'list' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            <List className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
            </div>

            {/* List / Grid */}
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
              {filteredGuides.map((item: any) => (
                <Link 
                    key={item.id} 
                    href={`/public/guides/${item.id}`} 
                    className={cn(
                        "rounded-3xl overflow-hidden hover:border-white/20 transition-all group flex",
                        glassClass,
                        viewMode === 'grid' ? "flex-col h-full" : "flex-row h-48"
                    )}
                >
                        
                        {/* Image Section */}
                        <div className={cn(
                            "bg-zinc-900 relative shrink-0",
                            viewMode === 'grid' ? "w-full h-48" : "w-64 h-full"
                        )}>
                            {item.coverImage ? (
                                <Image src={item.coverImage} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                    <div className="p-4 rounded-full bg-white/5 mx-auto">
                                        <Trophy className="w-8 h-8 text-zinc-700"/>
                                    </div>
                                </div>
                            )}
                            {/* Type Badge */}
                            <div className="absolute top-4 right-4">
                                <span className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 backdrop-blur-md text-[10px] font-bold text-zinc-300 uppercase tracking-wider",
                                    "bg-black/50"
                                )}>
                                    {item.type || 'Guide'}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <h3 className="font-bold text-white text-lg line-clamp-2 flex-1">{item.title}</h3>
                                    {viewMode === 'list' && (
                                        <span className="shrink-0 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover:bg-white group-hover:text-black transition-all whitespace-nowrap">
                                            Open &rarr;
                                        </span>
                                    )}
                                </div>
                                
                                <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed">
                                    {item.description || "View bounty details."}
                                </p>
                            </div>
                            
                            <div className="mt-4 flex items-center justify-between text-xs text-zinc-600 border-t border-white/5 pt-4">
                                <span>by <span className="text-zinc-400">{item.createdBy?.name || 'Team 1'}</span></span>
                                <TimeAgo date={item.createdAt} />
                            </div>
                        </div>
                  </Link>
                ))}
            </div>

            {filteredGuides.length === 0 && (
                <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <p className="text-zinc-500">No content found.</p>
                </div>
            )}
        </div>
    );
}
