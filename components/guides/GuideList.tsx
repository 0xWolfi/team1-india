"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Image from 'next/image';
import { Search, LayoutGrid, List, MoreHorizontal, Edit, Trash2, Lock, Globe, Cpu, FileText, ArrowRight } from "lucide-react";

interface Guide {
    id: string;
    title: string;
    body: {
        description: string;
    };
    type: string;
    visibility: string;
    coverImage?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: { email: string };
    lockedBy?: { email: string };
}

interface GuideListProps {
    guides: Guide[];
    basePath: string; // e.g. '/core/events/guides'
    isLoading?: boolean;
    onDelete?: (id: string) => void;
    canDelete?: boolean;
    canWrite?: boolean;
}

export const GuideList: React.FC<GuideListProps> = ({ guides, basePath, isLoading, onDelete, canDelete, canWrite = false }) => {
    const effectiveCanDelete = canDelete ?? canWrite;
    const effectiveCanWrite = canWrite;

    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "CORE" | "MEMBER" | "PUBLIC">("ALL");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenuId(null);
            setShowFilterMenu(false);
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
        setShowDeleteConfirm(true);
        setActiveMenuId(null);
    };

    const confirmDelete = () => {
        if (deleteId && onDelete) {
            onDelete(deleteId);
        }
        setShowDeleteConfirm(false);
        setDeleteId(null);
    };

    const filtered = guides.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = visibilityFilter === "ALL" || p.visibility === visibilityFilter;
        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                ))}
            </div>
        );
    }

    return (
        <div>
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
                            {visibilityFilter === "ALL" && <LayoutGrid className="w-3.5 h-3.5" />}
                            {visibilityFilter === "CORE" && <Cpu className="w-3.5 h-3.5" />}
                            {visibilityFilter === "MEMBER" && <Cpu className="w-3.5 h-3.5" />}
                            {visibilityFilter === "PUBLIC" && <Globe className="w-3.5 h-3.5" />}
                            {visibilityFilter === "ALL" ? "All Views" : 
                             visibilityFilter.charAt(0) + visibilityFilter.slice(1).toLowerCase()}
                        </span>
                        <MoreHorizontal className="w-3.5 h-3.5 rotate-90" />
                    </button>

                    {showFilterMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            {[
                                { id: "ALL", label: "All Views", icon: LayoutGrid },
                                { id: "CORE", label: "Core Only", icon: Cpu },
                                { id: "MEMBER", label: "Members", icon: Cpu },
                                { id: "PUBLIC", label: "Public", icon: Globe }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setVisibilityFilter(opt.id as any);
                                        setShowFilterMenu(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors ${
                                        visibilityFilter === opt.id 
                                        ? "bg-white/10 text-white" 
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
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
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {!isLoading && filtered.length === 0 && (
                <div className="py-32 text-center border-2 border-white/5 rounded-[2rem] border-dashed bg-white/5 backdrop-blur-sm flex flex-col items-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                        <Search className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-zinc-200 text-xl font-bold mb-2">No guides found</h3>
                    <p className="text-zinc-500 max-w-xs mx-auto">
                        We couldn't find anything matching "{searchTerm}". Try a different term or create a new guide.
                    </p>
                </div>
            )}

            {/* Grid/List */}
            <div className={`
                ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-4 max-w-4xl"}
            `}>
                {filtered.map(doc => (
                    <div key={doc.id} className="relative group/card perspective-1000">
                            <div className={`
                                group relative overflow-hidden transition-all duration-500 border border-white/[0.08] hover:border-white/20
                                ${viewMode === "grid" 
                                    ? "bg-black/40 backdrop-blur-xl rounded-[2rem] h-full flex flex-col hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]" 
                                    : "bg-black/40 backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between hover:bg-white/5"
                                }
                            `}>
                                {/* Click Target */}
                                <Link href={`${basePath}/${doc.id}`} className="absolute inset-0 z-20" />
                                
                                {/* Glowing Effect on Hover (Grid only) */}
                                {viewMode === "grid" && (
                                    <div className="absolute -inset-2 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none" />
                                )}

                                {/* Card Content */}
                                <div className={`relative z-10 w-full ${viewMode === "list" ? "flex flex-row items-center justify-between p-6 gap-8" : "flex flex-col h-full"}`}>
                                    
                                    {/* Grid View: Image Top */}
                                    {viewMode === "grid" && (
                                        <div className="relative h-48 w-full bg-zinc-900 overflow-hidden border-b border-white/5">
                                            {doc.coverImage ? (
                                                <Image 
                                                    src={doc.coverImage} 
                                                    alt={doc.title} 
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
                                                    <FileText className="w-12 h-12 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                                                </div>
                                            )}
                                            
                                            {/* Badges Overlay on Image */}
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                {doc.lockedBy && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                                                        <Lock className="w-3 h-3" />
                                                        Locked
                                                    </div>
                                                )}
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] uppercase tracking-wider font-bold ${
                                                    doc.visibility === "PUBLIC" ? "bg-black/60 border-white/10 text-zinc-300" :
                                                    doc.visibility === "CORE" ? "bg-black/60 border-white/10 text-white" :
                                                    "bg-black/60 border-white/10 text-zinc-400"
                                                }`}>
                                                    {doc.visibility === "PUBLIC" && <Globe className="w-3 h-3" />}
                                                    {doc.visibility === "MEMBER" && <Cpu className="w-3 h-3" />}
                                                    {doc.visibility === "CORE" && <Cpu className="w-3 h-3" />}
                                                    <span>{doc.visibility}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text Content */}
                                    <div className={`flex-1 flex flex-col ${viewMode === "grid" ? "bg-transparent" : "min-w-0"}`}>
                                        {viewMode === "grid" ? (
                                            <>
                                                <div className="p-4 flex items-start justify-between gap-4 mb-2">
                                                    <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight group-hover:text-zinc-200 transition-colors">
                                                        {doc.title}
                                                    </h3>
                                                    <div className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-all flex items-center gap-2">
                                                        Open <ArrowRight className="w-3 h-3" />
                                                    </div>
                                                </div>

                                                <div className="px-4 mb-3 flex-1">
                                                    <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">
                                                        {doc.body?.description || "No description provided."}
                                                    </p>
                                                </div>
                                                
                                                <div className="px-4 pb-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-medium mt-auto">
                                                    <span className="truncate max-w-[150px]">by <span className="text-zinc-400 capitalize">{doc.createdBy?.email.split("@")[0]}</span></span>
                                                    <span className="flex items-center gap-1.5">
                                                        {doc.updatedAt && formatDistanceToNow(new Date(doc.updatedAt))} ago
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-bold text-white text-xl truncate group-hover:text-zinc-200 transition-all duration-300">
                                                        {doc.title}
                                                    </h3>
                                                    
                                                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                                        {doc.lockedBy && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500">
                                                                <Lock className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                        <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                                            doc.visibility === "PUBLIC" ? "bg-zinc-800/50 border-white/10 text-zinc-300" :
                                                            doc.visibility === "CORE" ? "bg-zinc-800/50 border-white/20 text-white" :
                                                            "bg-zinc-800/50 border-white/5 text-zinc-500"
                                                        }`}>
                                                            {doc.visibility}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-4">
                                                        {doc.body?.description || "No description provided."}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                                                    <span className="truncate max-w-[150px] text-zinc-400">By {doc.createdBy?.email.split("@")[0]}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        {doc.updatedAt && formatDistanceToNow(new Date(doc.updatedAt))} ago
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* List View: Image Right */}
                                    {viewMode === "list" && doc.coverImage && (
                                        <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                            <Image 
                                                src={doc.coverImage} 
                                                alt={doc.title} 
                                                fill
                                                sizes="128px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                        {/* Menu Actions */}
                        {(effectiveCanWrite || effectiveCanDelete) && (
                            <div className={`absolute z-30 ${viewMode === "grid" ? "top-4 right-4" : "top-1/2 -translate-y-1/2 right-4"}`}>
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
                                        {effectiveCanWrite && (
                                            <Link 
                                                href={`${basePath}/${doc.id}`}
                                                className="px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                                                onClick={(e) => e.stopPropagation()} 
                                            >
                                                <Edit className="w-3.5 h-3.5" /> Open Editor
                                            </Link>
                                        )}
                                        {effectiveCanWrite && effectiveCanDelete && <div className="h-px bg-white/5 my-1" />}
                                        {effectiveCanDelete && (
                                            <button 
                                                onClick={(e) => handleDeleteClick(e, doc.id)}
                                                className="text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2 w-full"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#09090b]/90 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 backdrop-blur-xl ring-1 ring-white/10">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-4 rounded-full bg-zinc-800 border border-white/10 text-zinc-400">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Delete Guide?</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    Are you sure you want to delete this guide? <br/>
                                    <span className="text-zinc-500 font-medium">This action cannot be undone.</span>
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
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-colors shadow-lg shadow-black/20"
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
