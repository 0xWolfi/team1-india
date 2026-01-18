"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Plus, Lock, Search, RefreshCw, MoreHorizontal, Trash2, Edit, Globe, Cpu, Clock, LayoutGrid, List, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

import { usePermission } from "@/hooks/usePermission";

// Types
interface Playbook {
    id: string;
    title: string;
    updatedAt: string;
    lockedBy?: { email: string };
    createdBy?: { email: string };
    visibility: 'CORE' | 'MEMBER' | 'PUBLIC';
    coverImage?: string;
    description?: string;
}

export default function PlaybooksPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const canCreate = usePermission("playbooks", "WRITE");

    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'CORE' | 'MEMBER' | 'PUBLIC'>('ALL');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
             setActiveMenuId(null);
             setShowFilterMenu(false);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchPlaybooks = () => {
        setIsLoading(true);
        fetch('/api/playbooks')
            .then(res => res.json())
            .then(data => {
                setPlaybooks(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchPlaybooks();
    }, []);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    const handleCreateClick = () => {
        setNewTitle("");
        setShowCreateModal(true);
    };

    const handleCreateConfirm = async () => {
        if (!newTitle.trim()) return;
        setIsCreating(true);
        try {
            const res = await fetch('/api/playbooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                const newDoc = await res.json();
                router.push(`/core/playbooks/${newDoc.id}?autoEdit=true`);
            }
        } catch (error) {
            console.error(error);
            setIsCreating(false);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
        setShowDeleteConfirm(true);
        setActiveMenuId(null);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        const res = await fetch(`/api/playbooks/${deleteId}`, { method: 'DELETE' });
        if (res.ok) {
            setPlaybooks(prev => prev.filter(p => p.id !== deleteId));
        } else {
            alert("Failed to delete. You might not have permission.");
        }
        setShowDeleteConfirm(false);
        setDeleteId(null);
    };

    const filtered = playbooks.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = visibilityFilter === 'ALL' || p.visibility === visibilityFilter;
        return matchesSearch && matchesFilter;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPerms = (session?.user as any)?.permissions || {};
    const canDelete = userPerms['*'] === 'FULL_ACCESS' || 
                      userPerms['playbooks'] === 'FULL_ACCESS' || 
                      userPerms['playbooks'] === 'WRITE';


    return (
        <CoreWrapper>
             <CorePageHeader
                title="Playbooks"
                description="Centralized repository for your organization's strategic documentation, SOPs, and knowledge."
                icon={<BookOpen className="w-5 h-5 text-zinc-200" />}
             >
                 {canCreate && (
                     <button 
                        onClick={handleCreateClick}
                        disabled={isCreating}
                        className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-lg bg-white px-4 font-medium text-black transition-all hover:bg-zinc-200 active:scale-95 text-sm disabled:opacity-70 disabled:hover:scale-100"
                     >
                        <span className="flex items-center gap-2">
                            {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            New Playbook
                        </span>
                     </button>
                 )}
             </CorePageHeader>

            {/* Toolbar */}
             <div className="flex flex-col md:flex-row gap-4 mb-10">
                 <div className="relative flex-1 group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                     </div>
                     <input 
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all hover:bg-zinc-900/80"
                        placeholder="Search by title..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                 </div>

                 {/* Filter Dropdown */}
                 <div className="relative">
                     <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowFilterMenu(!showFilterMenu);
                        }}
                        className="h-full px-4 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center gap-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all min-w-[140px] justify-between"
                     >
                         <span className="flex items-center gap-2">
                             {visibilityFilter === 'ALL' && <LayoutGrid className="w-3.5 h-3.5" />}
                             {visibilityFilter === 'CORE' && <Cpu className="w-3.5 h-3.5" />}
                             {visibilityFilter === 'MEMBER' && <Cpu className="w-3.5 h-3.5" />}
                             {visibilityFilter === 'PUBLIC' && <Globe className="w-3.5 h-3.5" />}
                             {visibilityFilter === 'ALL' ? 'All Views' : 
                              visibilityFilter.charAt(0) + visibilityFilter.slice(1).toLowerCase()}
                         </span>
                         <MoreHorizontal className="w-3.5 h-3.5 rotate-90" />
                     </button>

                     {showFilterMenu && (
                         <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                             {[
                                 { id: 'ALL', label: 'All Views', icon: LayoutGrid },
                                 { id: 'CORE', label: 'Core Only', icon: Cpu },
                                 { id: 'MEMBER', label: 'Members', icon: Cpu },
                                 { id: 'PUBLIC', label: 'Public', icon: Globe }
                             ].map((opt) => (
                                 <button
                                     key={opt.id}
                                     onClick={() => {
                                         setVisibilityFilter(opt.id as any);
                                         setShowFilterMenu(false);
                                     }}
                                     className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors ${
                                         visibilityFilter === opt.id 
                                         ? 'bg-white/10 text-white' 
                                         : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                     }`}
                                 >
                                     <opt.icon className="w-3.5 h-3.5" />
                                     {opt.label}
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>

                 <div className="flex gap-1 bg-zinc-900/50 border border-white/5 p-1 rounded-xl self-start md:self-auto backdrop-blur-sm">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                 </div>
             </div>

             {/* Content */}
             <div>
                 {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                 )}
                 
                 {!isLoading && filtered.length === 0 && (
                     <div className="py-32 text-center border-2 border-white/5 rounded-[2rem] border-dashed bg-white/5 backdrop-blur-sm flex flex-col items-center max-w-2xl mx-auto">
                         <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                            <Search className="w-8 h-8 text-zinc-600" />
                         </div>
                         <h3 className="text-zinc-200 text-xl font-bold mb-2">No playbooks found</h3>
                         <p className="text-zinc-500 max-w-xs mx-auto">
                            We couldn't find anything matching "{searchTerm}". Try a different term or create a new playbook.
                         </p>
                     </div>
                 )}

                 <div className={`
                    ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-4 max-w-4xl'}
                 `}>
                     {filtered.map(doc => (
                         <div key={doc.id} className="relative group/card perspective-1000">
                             <div className={`
                                group relative overflow-hidden transition-all duration-500 border border-white/[0.08] hover:border-white/20
                                ${viewMode === 'grid' 
                                    ? 'bg-black/40 backdrop-blur-xl rounded-[2rem] h-full flex flex-col hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]' 
                                    : 'bg-black/40 backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between hover:bg-white/5'
                                }
                             `}>
                                 {/* Click Target */}
                                 <Link href={`/core/playbooks/${doc.id}`} className="absolute inset-0 z-20" />
                                 
                                 {/* Glowing Effect on Hover (Grid only) */}
                                 {viewMode === 'grid' && (
                                    <div className="absolute -inset-2 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none" />
                                 )}

                                 {/* Card Content */}
                                 <div className={`relative z-10 w-full ${viewMode === 'list' ? 'flex flex-row items-center justify-between p-6 gap-8' : 'flex flex-col h-full'}`}>
                                     
                                     {/* Grid View: Image Top */}
                                     {viewMode === 'grid' && (
                                         <div className="relative h-48 w-full bg-zinc-900 overflow-hidden border-b border-white/5">
                                            {doc.coverImage ? (
                                                <img 
                                                    src={doc.coverImage} 
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                                                    onError={(e) => {
                                                        // Fallback if image fails to load
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        if (target.parentElement) {
                                                            target.parentElement.innerHTML = `
                                                                <div class="w-full h-full flex items-center justify-center bg-zinc-800/50">
                                                                    <svg class="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                </div>
                                                            `;
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                 <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
                                                    <FileText className="w-12 h-12 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                                                 </div>
                                             )}
                                             
                                             {/* Badges Overlay on Image */}
                                             <div className="absolute top-4 right-4 flex gap-2">
                                                 {doc.lockedBy && (
                                                     <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-red-500/20 text-[10px] uppercase tracking-wider font-bold text-red-500">
                                                         <Lock className="w-3 h-3" />
                                                         Locked
                                                     </div>
                                                 )}
                                                 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] uppercase tracking-wider font-bold ${
                                                     doc.visibility === 'PUBLIC' ? 'bg-black/60 border-white/10 text-zinc-300' :
                                                     doc.visibility === 'CORE' ? 'bg-black/60 border-red-500/20 text-red-400' :
                                                     'bg-black/60 border-white/10 text-zinc-400'
                                                 }`}>
                                                     {doc.visibility === 'PUBLIC' && <Globe className="w-3 h-3" />}
                                                     {doc.visibility === 'MEMBER' && <Cpu className="w-3 h-3" />}
                                                     {doc.visibility === 'CORE' && <Cpu className="w-3 h-3" />}
                                                     <span>{doc.visibility}</span>
                                                 </div>
                                             </div>
                                         </div>
                                     )}

                                     {/* Text Content */}
                                     <div className={`flex-1 flex flex-col ${viewMode === 'grid' ? 'bg-transparent' : 'min-w-0'}`}>
                                         {viewMode === 'grid' ? (
                                             <>
                                                <div className="p-4 flex items-start justify-between gap-4 mb-2">
                                                    <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                                                        {doc.title}
                                                    </h3>
                                                    <div className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-all flex items-center gap-2">
                                                        Open <ArrowRight className="w-3 h-3" />
                                                    </div>
                                                </div>

                                                <div className="px-4 mb-3 flex-1">
                                                    <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">
                                                        {doc.description || "No description provided."}
                                                    </p>
                                                </div>
                                                
                                                <div className="px-4 pb-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-medium mt-auto">
                                                     <span className="truncate max-w-[150px]">by <span className="text-zinc-400 capitalize">{doc.createdBy?.email.split('@')[0]}</span></span>
                                                     <span className="flex items-center gap-1.5">
                                                         {formatDistanceToNow(new Date(doc.updatedAt))} ago
                                                     </span>
                                                </div>
                                             </>
                                         ) : (
                                             <>
                                                 <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-bold text-white text-xl truncate group-hover:text-red-400 transition-all duration-300">
                                                        {doc.title}
                                                    </h3>
                                                    
                                                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                                         {doc.lockedBy && (
                                                             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500">
                                                                 <Lock className="w-3 h-3" />
                                                             </div>
                                                         )}
                                                         <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                                             doc.visibility === 'PUBLIC' ? 'bg-zinc-800/50 border-white/10 text-zinc-300' :
                                                             doc.visibility === 'CORE' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                             'bg-zinc-800/50 border-white/5 text-zinc-500'
                                                         }`}>
                                                             {doc.visibility}
                                                         </div>
                                                     </div>
                                                 </div>
                                                 
                                                 <div className="flex-1">
                                                     <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-4">
                                                         {doc.description || "No description provided."}
                                                     </p>
                                                 </div>
        
                                                 <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                                                     <span className="truncate max-w-[150px] text-zinc-400">By {doc.createdBy?.email.split('@')[0]}</span>
                                                     <span>•</span>
                                                      <span className="flex items-center gap-1.5">
                                                         {formatDistanceToNow(new Date(doc.updatedAt))} ago
                                                     </span>
                                                 </div>
                                             </>
                                         )}
                                     </div>

                                    {/* List View: Image Right */}
                                    {viewMode === 'list' && doc.coverImage && (
                                        <div className="w-32 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-zinc-900">
                                            <img 
                                               src={doc.coverImage} 
                                               alt={doc.title} 
                                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                               onError={(e) => {
                                                   // Fallback if image fails to load
                                                   const target = e.target as HTMLImageElement;
                                                   target.style.display = 'none';
                                                   if (target.parentElement) {
                                                       target.parentElement.innerHTML = `
                                                           <div class="w-full h-full flex items-center justify-center bg-zinc-800/50">
                                                               <svg class="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                               </svg>
                                                           </div>
                                                       `;
                                                   }
                                               }}
                                            />
                                        </div>
                                    )}
                                 </div>
                             </div>

                             {/* Menu Actions - Outside of Overflow Hidden Container */}
                             {canDelete && (
                                 <div className={`absolute z-30 ${viewMode === 'grid' ? 'top-4 right-4' : 'top-1/2 -translate-y-1/2 right-4'}`}>
                                     <button 
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             e.preventDefault();
                                             setActiveMenuId(activeMenuId === doc.id ? null : doc.id);
                                         }}
                                         className="p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors opacity-0 group-hover/card:opacity-100 bg-[#121212]/50 backdrop-blur-sm border border-white/5"
                                     >
                                         <MoreHorizontal className="w-5 h-5" />
                                     </button>
 
                                     {activeMenuId === doc.id && (
                                         <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                             <Link 
                                                 href={`/core/playbooks/${doc.id}`}
                                                 className="px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                                                 onClick={(e) => e.stopPropagation()} 
                                             >
                                                 <Edit className="w-3.5 h-3.5" /> Open Editor
                                             </Link>
                                             <div className="h-px bg-white/5 my-1" />
                                             <button 
                                                 onClick={(e) => handleDelete(e, doc.id)}
                                                 className="text-left px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2 w-full"
                                             >
                                                 <Trash2 className="w-3.5 h-3.5" /> Delete
                                             </button>
                                         </div>
                                     )}
                                 </div>
                             )}
                         </div>
                     ))}
             </div>

             </div>


             {/* Create Playbook Modal */}
             {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#09090b]/90 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 backdrop-blur-xl ring-1 ring-white/10">
                        <div className="flex flex-col gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto flex items-center justify-center mb-4 border border-white/5">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">New Playbook</h3>
                                <p className="text-sm text-zinc-400">Enter a title to get started. By default, this will be visible only to <strong>Core</strong> members.</p>
                            </div>
                            
                            <input 
                                autoFocus
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateConfirm()}
                                placeholder="e.g. Q4 Growth Strategy"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all text-sm"
                            />

                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm font-semibold hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleCreateConfirm}
                                    disabled={!newTitle.trim() || isCreating}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : 'Create Playbook'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {/* Delete Confirmation Modal */}
             {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#09090b]/90 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 backdrop-blur-xl ring-1 ring-red-500/20">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Delete Playbook?</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    Are you sure you want to delete this playbook? <br/>
                                    <span className="text-red-400 font-medium">This action cannot be undone.</span>
                                </p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm font-semibold hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             )}
        </CoreWrapper>
    );
}
