"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, LayoutGrid, List, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Hide scrollbar but keep functionality
const scrollbarHide = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
import { Footer } from "@/components/website/Footer";

interface Playbook {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  visibility: string;
  createdBy: {
    name: string | null;
  } | null;
}

function TimeAgo({ date }: { date: Date }) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000); // seconds
    
    let text = "";
    if (diff < 60) text = "just now";
    else if (diff < 3600) text = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) text = `${Math.floor(diff / 3600)}h ago`;
    else text = `${Math.floor(diff / 86400)}d ago`;
    
    return <span>{text}</span>;
}

const glassClass = "bg-zinc-900/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

export default function PublicPlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Fetch playbooks from API to avoid caching issues
    fetch('/api/public/playbooks', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log(`[PUBLIC_PLAYBOOKS_PAGE] Fetched ${data.length} playbooks`);
        setPlaybooks(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('[PUBLIC_PLAYBOOKS_PAGE] Error fetching playbooks:', err);
        setIsLoading(false);
      });
  }, []);

  const filteredPlaybooks = playbooks.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHide }} />
      <main className="min-h-screen text-white selection:bg-zinc-800 selection:text-zinc-200">
      
      <div className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        
        {/* Back Link */}
        <Link href="/public" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
                     <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                     </span>
                     Playbooks
                </h1>
                <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed">
                    Centralized repository for your organization's strategic documentation, SOPs, and knowledge.
                </p>
            </div>
        </div>
            
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors"/>
                <input 
                    type="text" 
                    placeholder="Search by title..." 
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
        {isLoading ? (
          <div className="py-32 text-center">
            <p className="text-zinc-500">Loading playbooks...</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
            {filteredPlaybooks.map((item) => (
              <Link 
                key={item.id} 
                href={`/public/playbooks/${item.id}`} 
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
                            <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                <div className="p-4 rounded-full bg-white/5 mx-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-zinc-700"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                </div>
                            </div>
                        )}
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
                                {item.description || "No description provided."}
                            </p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between text-xs text-zinc-600 border-t border-white/5 pt-4">
                            <span>by <span className="text-zinc-400">{item.createdBy?.name || 'Team 1'}</span></span>
                            <TimeAgo date={new Date(item.createdAt)} />
                        </div>
                    </div>
              </Link>
            ))}
          </div>
        )}
        
        {!isLoading && filteredPlaybooks.length === 0 && (
            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-zinc-500">
                  {searchTerm ? 'No playbooks match your search.' : 'No playbooks found.'}
                </p>
            </div>
        )}

      </div>
      <Footer />
    </main>
    </>
  );
}
