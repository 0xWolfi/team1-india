"use client";

import React, { useState, useMemo } from 'react';
import { ArrowRight, Search } from "lucide-react";
// kept for pagination button
import { formatDistanceToNow } from 'date-fns';
import { ResourceCard } from './ResourceCard';

interface Resource {
    id: string;
    title: string;
    description?: string;
    coverImage?: string;
    type?: string; // For guides
    author?: string;
    createdAt: string;
    href: string;
}

interface PublicResourcesViewerProps {
    playbooks: Resource[];
    guides: Resource[];
}

type Tab = 'Playbooks' | 'Event Guide' | 'Program Guide' | 'Content Guide';

export default function PublicResourcesViewer({ playbooks, guides }: PublicResourcesViewerProps) {
    const [activeTab, setActiveTab] = useState<Tab>('Playbooks');
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleCount, setVisibleCount] = useState(3);

    const filteredResources = useMemo(() => {
        let docs = [];
        if (activeTab === 'Playbooks') {
            docs = playbooks;
        } else {
            // Map tab name to guide type (e.g. "Event Guide" -> "event")
            const typeKeyword = activeTab.split(' ')[0].toLowerCase();
            docs = guides.filter(g => g.type?.toLowerCase() === typeKeyword);
        }

        if (searchTerm.trim()) {
            docs = docs.filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return docs;
    }, [activeTab, playbooks, guides, searchTerm]);

    const visibleResources = filteredResources.slice(0, visibleCount);
    const hasMore = visibleResources.length < filteredResources.length;

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setVisibleCount(3); // Reset pagination on tab switch
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 6);
    };

    return (
        <div className="space-y-12">
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors"/>
                </div>
                <input 
                    type="text"
                    placeholder="Search resources..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-full pl-12 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all hover:bg-zinc-900/80 hover:border-white/20 shadow-lg shadow-black/20"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-4">
                {(['Playbooks', 'Event Guide', 'Program Guide', 'Content Guide'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`px-6 py-3 rounded-full text-sm font-bold transition-all border ${
                            activeTab === tab 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30 hover:text-white'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Resources Grid */}
            {visibleResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleResources.map((resource) => (
                        <ResourceCard 
                            key={resource.id}
                            title={resource.title}
                            href={resource.href}
                            coverImage={resource.coverImage}
                            description={resource.description}
                            author={resource.author}
                            date={`${formatDistanceToNow(new Date(resource.createdAt))} ago`}
                            buttonText="Read"
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-zinc-500 italic border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                        <Search className="w-6 h-6 text-zinc-600"/>
                    </div>
                    <div>
                        <p>No resources found for "{activeTab}"</p>
                        {searchTerm && <p className="text-xs text-zinc-600 mt-1">matching "{searchTerm}"</p>}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {hasMore && (
                <div className="flex justify-center pt-0 -mt-6">
                    <button 
                        onClick={handleLoadMore}
                        className="px-6 py-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full font-bold transition-all flex items-center gap-2 text-xs"
                    >
                        See More <ArrowRight className="w-4 h-4"/>
                    </button>
                </div>
            )}
        </div>
    );
}
