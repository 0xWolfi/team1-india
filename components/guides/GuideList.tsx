"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    Calendar,
    Cpu,
    Edit,
    FileText,
    Globe,
    LayoutGrid,
    List,
    Lock,
    MoreHorizontal,
    Search,
    Trash2,
    Users,
} from "lucide-react";

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
    basePath: string;
    isLoading?: boolean;
    onDelete?: (id: string) => void;
    canDelete?: boolean;
    canWrite?: boolean;
}

const VISIBILITY_FILTERS = [
    { id: "ALL", label: "All", icon: LayoutGrid },
    { id: "CORE", label: "Core", icon: Cpu },
    { id: "MEMBER", label: "Member", icon: Users },
    { id: "PUBLIC", label: "Public", icon: Globe },
] as const;

type VisibilityFilter = "ALL" | "CORE" | "MEMBER" | "PUBLIC";

export const GuideList: React.FC<GuideListProps> = ({
    guides,
    basePath,
    isLoading,
    onDelete,
    canDelete,
    canWrite = false,
}) => {
    const effectiveCanDelete = canDelete ?? canWrite;
    const effectiveCanWrite = canWrite;

    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("ALL");
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setActiveMenuId(null);
            }
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
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

    const filtered = guides.filter((p) => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = visibilityFilter === "ALL" || p.visibility === visibilityFilter;
        return matchesSearch && matchesFilter;
    });

    // -- Loading Skeletons --
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/6 overflow-hidden"
                    >
                        <div className="h-44 bg-zinc-800/50 animate-pulse" />
                        <div className="p-5 space-y-3">
                            <div className="h-5 w-3/4 bg-zinc-800/60 rounded-lg animate-pulse" />
                            <div className="h-4 w-full bg-zinc-800/40 rounded-lg animate-pulse" />
                            <div className="h-4 w-2/3 bg-zinc-800/30 rounded-lg animate-pulse" />
                            <div className="pt-3 border-t border-white/4 flex items-center justify-between">
                                <div className="h-3 w-24 bg-zinc-800/40 rounded animate-pulse" />
                                <div className="h-3 w-16 bg-zinc-800/40 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            {/* ---- Toolbar ---- */}
            <div className="flex flex-col md:flex-row gap-3 mb-8">
                {/* Search */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-zinc-600 group-focus-within:text-zinc-300 transition-colors duration-200" />
                    </div>
                    <input
                        className="w-full bg-zinc-900/40 backdrop-blur-xl border border-white/6 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/10 focus:border-white/10 hover:border-white/10 transition-all duration-200"
                        placeholder="Search guides..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Visibility Filter Pills */}
                <div className="flex gap-1 bg-zinc-900/40 backdrop-blur-xl border border-white/6 p-1 rounded-xl">
                    {VISIBILITY_FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setVisibilityFilter(filter.id as VisibilityFilter)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 flex items-center gap-1.5",
                                visibilityFilter === filter.id
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/4"
                            )}
                        >
                            <filter.icon className="w-3 h-3" />
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Grid / List Toggle */}
                <div className="flex gap-1 bg-zinc-900/40 backdrop-blur-xl border border-white/6 p-1 rounded-xl self-start md:self-auto">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-2 rounded-lg transition-all duration-200",
                            viewMode === "grid"
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "p-2 rounded-lg transition-all duration-200",
                            viewMode === "list"
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ---- Empty State ---- */}
            {filtered.length === 0 && (
                <div className="py-28 text-center border border-white/6 border-dashed rounded-2xl bg-zinc-900/20 backdrop-blur-xl flex flex-col items-center max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border border-white/6 flex items-center justify-center mb-5">
                        <FileText className="w-7 h-7 text-zinc-600" />
                    </div>
                    <h3 className="text-zinc-300 text-lg font-bold mb-1.5">No guides found</h3>
                    <p className="text-zinc-600 text-sm max-w-xs mx-auto leading-relaxed">
                        {searchTerm
                            ? `No results for "${searchTerm}". Try a different search term.`
                            : "There are no guides to display yet. Create one to get started."}
                    </p>
                </div>
            )}

            {/* ---- Grid View ---- */}
            {filtered.length > 0 && viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((doc) => (
                        <div key={doc.id} className="relative group/card" ref={activeMenuId === doc.id ? menuRef : undefined}>
                            <div className="relative overflow-hidden rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/6 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 h-full flex flex-col">
                                {/* Link overlay */}
                                <Link href={`${basePath}/${doc.id}`} className="absolute inset-0 z-10" />

                                {/* Cover Image */}
                                <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                                    {doc.coverImage ? (
                                        <>
                                            <Image
                                                src={doc.coverImage}
                                                alt={doc.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900/80">
                                            <FileText className="w-10 h-10 text-zinc-700" />
                                        </div>
                                    )}

                                    {/* Visibility Badge - top right */}
                                    <div className="absolute top-3 right-3 flex gap-2 z-20">
                                        {doc.lockedBy && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/8 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                                                <Lock className="w-2.5 h-2.5" />
                                                Locked
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/8 text-[10px] uppercase tracking-wider font-bold text-zinc-300">
                                            {doc.visibility === "PUBLIC" && <Globe className="w-2.5 h-2.5" />}
                                            {doc.visibility === "MEMBER" && <Users className="w-2.5 h-2.5" />}
                                            {doc.visibility === "CORE" && <Cpu className="w-2.5 h-2.5" />}
                                            {doc.visibility}
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="flex flex-col flex-1 p-4">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <h3 className="text-[15px] font-bold text-white line-clamp-2 leading-snug">
                                            {doc.title}
                                        </h3>
                                    </div>

                                    <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
                                        {doc.body?.description || "No description provided."}
                                    </p>

                                    {/* Open action */}
                                    <div className="relative z-20 mb-3">
                                        <Link
                                            href={`${basePath}/${doc.id}`}
                                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-200"
                                        >
                                            Open
                                            <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-3 border-t border-white/4 flex items-center justify-between text-[11px] text-zinc-600 font-medium">
                                        <span className="truncate max-w-35 flex items-center gap-1.5">
                                            <Users className="w-3 h-3" />
                                            <span className="text-zinc-500 capitalize">
                                                {doc.createdBy?.email.split("@")[0] || "Unknown"}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1.5 text-zinc-600">
                                            <Calendar className="w-3 h-3" />
                                            {doc.updatedAt
                                                ? formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: false }) + " ago"
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions Menu (hover reveal) */}
                                {(effectiveCanWrite || effectiveCanDelete) && (
                                    <div className="absolute top-3 left-3 z-30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setActiveMenuId(activeMenuId === doc.id ? null : doc.id);
                                            }}
                                            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/8 text-zinc-400 hover:text-white hover:bg-black/70 transition-all duration-200"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>

                                        {activeMenuId === doc.id && (
                                            <div
                                                className="absolute left-0 top-full mt-1.5 w-44 bg-zinc-900/95 backdrop-blur-xl border border-white/8 rounded-xl shadow-2xl shadow-black/40 z-50 p-1 animate-in fade-in zoom-in-95 duration-150 origin-top-left"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {effectiveCanWrite && (
                                                    <Link
                                                        href={`${basePath}/${doc.id}`}
                                                        className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/6 rounded-lg flex items-center gap-2.5 transition-colors duration-150"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                        Open Editor
                                                    </Link>
                                                )}
                                                {effectiveCanWrite && effectiveCanDelete && (
                                                    <div className="h-px bg-white/4 my-1" />
                                                )}
                                                {effectiveCanDelete && (
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, doc.id)}
                                                        className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/6 rounded-lg flex items-center gap-2.5 transition-colors duration-150"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ---- List View ---- */}
            {filtered.length > 0 && viewMode === "list" && (
                <div className="flex flex-col gap-3 max-w-4xl">
                    {filtered.map((doc) => (
                        <div key={doc.id} className="relative group/card" ref={activeMenuId === doc.id ? menuRef : undefined}>
                            <div className="relative overflow-hidden rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/6 hover:border-white/10 transition-all duration-300 hover:bg-zinc-900/60">
                                {/* Link overlay */}
                                <Link href={`${basePath}/${doc.id}`} className="absolute inset-0 z-10" />

                                <div className="flex items-center gap-5 p-4">
                                    {/* Thumbnail */}
                                    {doc.coverImage ? (
                                        <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-white/6 shrink-0">
                                            <Image
                                                src={doc.coverImage}
                                                alt={doc.title}
                                                fill
                                                sizes="112px"
                                                className="object-cover group-hover/card:scale-[1.03] transition-transform duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-28 h-20 rounded-xl bg-zinc-900/80 border border-white/6 flex items-center justify-center shrink-0">
                                            <FileText className="w-6 h-6 text-zinc-700" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <h3 className="text-[15px] font-bold text-white truncate">
                                                {doc.title}
                                            </h3>
                                            {doc.lockedBy && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-800/80 border border-white/6 text-[9px] uppercase tracking-wider font-bold text-zinc-500 shrink-0">
                                                    <Lock className="w-2.5 h-2.5" />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 border border-white/6 text-[9px] uppercase tracking-wider font-bold text-zinc-500 shrink-0">
                                                {doc.visibility === "PUBLIC" && <Globe className="w-2.5 h-2.5" />}
                                                {doc.visibility === "MEMBER" && <Users className="w-2.5 h-2.5" />}
                                                {doc.visibility === "CORE" && <Cpu className="w-2.5 h-2.5" />}
                                                {doc.visibility}
                                            </div>
                                        </div>
                                        <p className="text-zinc-500 text-sm line-clamp-1 leading-relaxed mb-2">
                                            {doc.body?.description || "No description provided."}
                                        </p>
                                        <div className="flex items-center gap-4 text-[11px] text-zinc-600 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <Users className="w-3 h-3" />
                                                <span className="text-zinc-500 capitalize">
                                                    {doc.createdBy?.email.split("@")[0] || "Unknown"}
                                                </span>
                                            </span>
                                            <span className="text-zinc-700">|</span>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" />
                                                {doc.updatedAt
                                                    ? formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: false }) + " ago"
                                                    : "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="shrink-0 text-zinc-700 group-hover/card:text-zinc-400 transition-colors duration-200">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Actions Menu (hover reveal) */}
                                {(effectiveCanWrite || effectiveCanDelete) && (
                                    <div className="absolute top-1/2 -translate-y-1/2 right-12 z-30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setActiveMenuId(activeMenuId === doc.id ? null : doc.id);
                                            }}
                                            className="p-1.5 rounded-lg bg-zinc-900/80 backdrop-blur-md border border-white/8 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>

                                        {activeMenuId === doc.id && (
                                            <div
                                                className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-900/95 backdrop-blur-xl border border-white/8 rounded-xl shadow-2xl shadow-black/40 z-50 p-1 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {effectiveCanWrite && (
                                                    <Link
                                                        href={`${basePath}/${doc.id}`}
                                                        className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/6 rounded-lg flex items-center gap-2.5 transition-colors duration-150"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                        Open Editor
                                                    </Link>
                                                )}
                                                {effectiveCanWrite && effectiveCanDelete && (
                                                    <div className="h-px bg-white/4 my-1" />
                                                )}
                                                {effectiveCanDelete && (
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, doc.id)}
                                                        className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/6 rounded-lg flex items-center gap-2.5 transition-colors duration-150"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ---- Delete Confirmation Modal ---- */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div
                        className="bg-zinc-900/90 backdrop-blur-xl border border-white/8 rounded-2xl p-7 max-w-sm w-full shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center gap-5">
                            {/* Icon */}
                            <div className="p-4 rounded-2xl bg-red-500/8 border border-red-500/10">
                                <Trash2 className="w-7 h-7 text-red-400/80" />
                            </div>

                            {/* Text */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Delete Guide?</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    This will permanently remove this guide.
                                    <br />
                                    <span className="text-zinc-600 font-medium">This action cannot be undone.</span>
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 w-full mt-1">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-white/6 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700/80 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-all duration-200"
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
