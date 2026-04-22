'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, List as ListIcon, Loader2, RefreshCw, ArrowLeft, Search, Film } from 'lucide-react';
import MediaModal from '@/components/media/MediaModal';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

interface MediaItem {
    id: string;
    title: string;
    description: string;
    platform: string[];
    links: string[];
    status?: string;
    createdAt: string;
    createdBy?: { email: string };
}

export default function MediaPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/media?status=ALL');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
                setFilteredItems(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredItems(items);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            setFilteredItems(items.filter(item => 
                item.title.toLowerCase().includes(lowerQuery) ||
                (Array.isArray(item.platform) ? item.platform : [item.platform || '']).some(p => p.toLowerCase().includes(lowerQuery)) ||
                item.description?.toLowerCase().includes(lowerQuery)
            ));
        }
    }, [searchQuery, items]);

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: MediaItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const [draggedItem, setDraggedItem] = useState<MediaItem | null>(null);

    const handleDragStart = (e: React.DragEvent, item: MediaItem) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        // Transparent ghost image or styling can be handled here if needed
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('opacity-50');
        setDraggedItem(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.status === newStatus) return;

        // Optimistic Update
        const updatedItems = items.map(i => 
            i.id === draggedItem.id ? { ...i, status: newStatus } : i
        );
        setItems(updatedItems);
        setFilteredItems(updatedItems); // Simplified for now, ideally re-filter

        try {
            const res = await fetch(`/api/media/${draggedItem.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                const errorMsg = await res.text();
                throw new Error(errorMsg || "Failed to update status");
            }
        } catch (error) {
            console.error("Drop failed", error);
            fetchItems(); // Revert on failure
        } finally {
            setDraggedItem(null);
        }
    };

    const STATUS_COLS = [
        { id: 'draft', label: 'Drafts', color: 'bg-zinc-200 dark:bg-zinc-800' },
        { id: 'pending_approval', label: 'Pending', color: 'bg-amber-500/10 border-amber-500/20' },
        { id: 'needs_edit', label: 'Changes', color: 'bg-red-500/10 border-red-500/20' },
        { id: 'approved', label: 'Approved', color: 'bg-emerald-500/10 border-emerald-500/20' },
        { id: 'posted', label: 'Posted', color: 'bg-blue-500/10 border-blue-500/20' }
    ];



    return (
        <CoreWrapper>
            <MediaModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={fetchItems}
                initialData={editingItem}
            />
            
            <CorePageHeader 
                title="Media Pipeline" 
                description="Manage your content creation workflow, approvals, and publishing schedules."
                icon={<Film className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />} // Using Film icon
            >
                 <button 
                     onClick={handleCreate}
                     className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-lg bg-white px-4 font-medium text-black transition-all hover:bg-zinc-200 active:scale-95 text-sm"
                 >
                    <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Item
                    </span>
                 </button>
            </CorePageHeader>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                     {/* Search Filter */}
                     <div className="relative group w-full md:w-auto flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter media..."
                            className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium transition-all hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end px-2">
                        <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                            <button 
                                onClick={() => setViewMode('kanban')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                            >
                                <ListIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1" />
                        <button 
                            onClick={fetchItems}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading && items.length === 0 ? (
                    <div className="flex justify-center py-40">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                    </div>
                ) : (
                    <div className="flex gap-6 overflow-x-auto pb-8 snap-x h-[calc(100vh-340px)] scrollbar-hide">
                        {STATUS_COLS.map(col => {
                            const colItems = filteredItems.filter(i => (i.status || 'draft') === col.id);
                            const isColumnEmpty = colItems.length === 0;

                            return (
                                <div 
                                    key={col.id} 
                                    className={`flex flex-col flex-1 min-w-[200px] snap-center h-full transition-colors rounded-2xl ${draggedItem && draggedItem.status !== col.id ? 'bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 border-dashed' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                >
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-2 h-2 rounded-full ${col.color.split(' ')[0].replace('bg-', 'bg-').replace('/10', '')}`} />
                                            <h3 className="font-bold text-xs text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">{col.label}</h3>
                                        </div>
                                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100/50 dark:bg-zinc-900/50 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                                            {colItems.length}
                                        </span>
                                    </div>
                                    
                                    <div className={`flex-1 rounded-2xl bg-zinc-100/30 dark:bg-[#121212]/30 border border-black/[0.02] dark:border-white/[0.02] p-2 space-y-3 overflow-y-auto hover:bg-zinc-100/50 dark:hover:bg-[#121212]/50 transition-colors ${isColumnEmpty ? 'border-dashed border-black/5 dark:border-white/5' : ''}`}>
                                        {colItems.map(item => (
                                            <div 
                                                key={item.id} 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, item)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => handleEdit(item)}
                                                className="group relative bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-md border border-black/5 dark:border-white/5 p-4 rounded-xl hover:border-black/20 dark:hover:border-white/20 transition-all cursor-grab active:cursor-grabbing overflow-hidden hover:translate-y-[-2px] hover:shadow-xl"
                                            >
                                                {/* Hover Glow */}
                                                <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />
                                                
                                                <div className="relative z-10">
                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                        {(Array.isArray(item.platform) ? item.platform : [item.platform || 'General']).slice(0, 3).map((p, idx) => (
                                                            <span key={idx} className="text-[9px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-100/80 dark:bg-zinc-900/80 px-2 py-1 rounded border border-black/5 dark:border-white/5">
                                                                {p}
                                                            </span>
                                                        ))}
                                                        {(Array.isArray(item.platform) ? item.platform.length : 1) > 3 && (
                                                             <span className="text-[9px] font-bold text-zinc-500 px-1 py-1">+{(Array.isArray(item.platform) ? item.platform.length : 1) - 3}</span>
                                                        )}
                                                    </div>
                                                    
                                                    <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 mb-2 leading-snug group-hover:text-black dark:group-hover:text-white transition-colors">
                                                        {item.title || 'Untitled'}
                                                    </h4>
                                                    
                                                    {item.description && (
                                                        <p className="text-[11px] text-zinc-500 line-clamp-2 mb-4 leading-relaxed group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5 mt-auto">
                                                        <div className="flex items-center gap-2">
                                                             <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-[9px] text-purple-300 font-bold border border-black/5 dark:border-white/5">
                                                                {item.createdBy?.email?.[0].toUpperCase() || '?'}
                                                             </div>
                                                             <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">
                                                                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                             </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {isColumnEmpty && (
                                            <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-700 py-12 opacity-60">
                                                <div className="w-10 h-10 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center mb-2 bg-zinc-100/50 dark:bg-zinc-900/50">
                                                     <div className={`w-1.5 h-1.5 rounded-full ${col.color.split(' ')[0].replace('/10', '/40')}`} />
                                                </div>
                                                <span className="text-[10px] font-medium uppercase tracking-widest">No Items</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
        </CoreWrapper>
    );
}
