"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LayoutGrid, List, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";

function TimeAgo({ date }: { date: Date | string }) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

    let text = "";
    if (diff < 60) text = "just now";
    else if (diff < 3600) text = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) text = `${Math.floor(diff / 3600)}h ago`;
    else if (diff < 604800) text = `${Math.floor(diff / 86400)}d ago`;
    else text = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return <span>{text}</span>;
}

export default function ProgramsClient({ programs }: { programs: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filteredPrograms = programs.filter(
        (p) =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Search & View Toggle Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors duration-300" />
                    <input
                        type="text"
                        placeholder="Search programs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={cn(
                            "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-zinc-600",
                            "bg-zinc-900/40 backdrop-blur-xl border border-white/6",
                            "focus:outline-none focus:border-white/12 focus:bg-zinc-900/60",
                            "transition-all duration-300"
                        )}
                    />
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-zinc-900/40 backdrop-blur-xl border border-white/6 rounded-xl p-1 self-start">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            viewMode === "grid"
                                ? "bg-white/8 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                        aria-label="Grid view"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            viewMode === "list"
                                ? "bg-white/8 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                        aria-label="List view"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Programs Grid / List */}
            {filteredPrograms.length > 0 ? (
                <div
                    className={cn(
                        viewMode === "grid"
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                            : "flex flex-col gap-5"
                    )}
                >
                    {filteredPrograms.map((item: any) =>
                        viewMode === "grid" ? (
                            /* ───────── GRID CARD ───────── */
                            <Link
                                key={item.id}
                                href={`/public/programs/${item.id}`}
                                className={cn(
                                    "group relative flex flex-col rounded-2xl overflow-hidden",
                                    "bg-zinc-900/40 backdrop-blur-xl border border-white/6",
                                    "hover:-translate-y-1 hover:border-white/10 hover:shadow-2xl hover:shadow-black/30",
                                    "transition-all duration-300"
                                )}
                            >
                                {/* Cover Image */}
                                <div className="relative w-full h-48 overflow-hidden bg-zinc-900">
                                    {item.coverImage ? (
                                        <>
                                            <Image
                                                src={item.coverImage}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                                            />
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900/80">
                                            <div className="p-4 rounded-full bg-white/4">
                                                <Users className="w-8 h-8 text-zinc-700" />
                                            </div>
                                        </div>
                                    )}

                                    {/* OPEN badge */}
                                    <div
                                        className={cn(
                                            "absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                                            "bg-white/8 backdrop-blur-md border border-white/8",
                                            "text-[10px] font-bold uppercase tracking-widest text-zinc-300",
                                            "group-hover:bg-white group-hover:text-zinc-900",
                                            "transition-all duration-300"
                                        )}
                                    >
                                        Open
                                        <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-5 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-semibold text-white text-[15px] leading-snug line-clamp-2 mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed">
                                            {item.description || "No description provided."}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-600 border-t border-white/4 pt-3.5">
                                        <span>
                                            by{" "}
                                            <span className="text-zinc-400">
                                                {item.createdBy?.name || "Team 1"}
                                            </span>
                                        </span>
                                        <TimeAgo date={item.createdAt} />
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            /* ───────── LIST CARD ───────── */
                            <Link
                                key={item.id}
                                href={`/public/programs/${item.id}`}
                                className={cn(
                                    "group flex flex-col sm:flex-row rounded-2xl overflow-hidden",
                                    "bg-zinc-900/40 backdrop-blur-xl border border-white/6",
                                    "hover:-translate-y-1 hover:border-white/10 hover:shadow-2xl hover:shadow-black/30",
                                    "transition-all duration-300"
                                )}
                            >
                                {/* Image (left) */}
                                <div className="relative w-full sm:w-56 h-44 sm:h-auto shrink-0 overflow-hidden bg-zinc-900">
                                    {item.coverImage ? (
                                        <>
                                            <Image
                                                src={item.coverImage}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent to-zinc-950/40 hidden sm:block" />
                                            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/60 to-transparent sm:hidden" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full min-h-30 flex items-center justify-center bg-zinc-900/80">
                                            <div className="p-3 rounded-full bg-white/4">
                                                <Users className="w-6 h-6 text-zinc-700" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content (right) */}
                                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                    <div>
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="font-semibold text-white text-[15px] leading-snug line-clamp-2 flex-1">
                                                {item.title}
                                            </h3>
                                            <div
                                                className={cn(
                                                    "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                                                    "bg-white/6 border border-white/6",
                                                    "text-[10px] font-bold uppercase tracking-widest text-zinc-400",
                                                    "group-hover:bg-white group-hover:text-zinc-900",
                                                    "transition-all duration-300"
                                                )}
                                            >
                                                Open
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                        <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed">
                                            {item.description || "No description provided."}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-600 border-t border-white/4 pt-3.5">
                                        <span>
                                            by{" "}
                                            <span className="text-zinc-400">
                                                {item.createdBy?.name || "Team 1"}
                                            </span>
                                        </span>
                                        <TimeAgo date={item.createdAt} />
                                    </div>
                                </div>
                            </Link>
                        )
                    )}
                </div>
            ) : (
                /* ───────── EMPTY STATE ───────── */
                <div className="py-32 flex flex-col items-center justify-center gap-4 border border-dashed border-white/6 rounded-2xl">
                    <div className="p-4 rounded-full bg-white/3">
                        <Users className="w-7 h-7 text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-500">No programs found</p>
                </div>
            )}
        </div>
    );
}
