'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Beaker, LayoutGrid, List as ListIcon, Loader2, MessageSquare, ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

interface Experiment {
  id: string;
  title: string;
  description: string;
  stage: "PROPOSED" | "DISCUSSION" | "APPROVED" | "REJECTED";
  createdAt: string;
  createdBy: {
    name: string;
    image: string;
  };
  _count: {
    comments: number;
  };
}

export default function MemberExperimentsPage() {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"BOARD" | "LIST">("BOARD");
    const [filterStage, setFilterStage] = useState<string>("ALL");

    useEffect(() => {
        fetchExperiments();
    }, []);

    const fetchExperiments = async () => {
        try {
            const res = await fetch("/api/experiments");
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Failed to fetch experiments:", res.status, res.statusText, errorData);
                setExperiments([]);
                return;
            }
            const data = await res.json();
            setExperiments(data);
        } catch (error) {
            console.error("Failed to fetch experiments", error);
            setExperiments([]);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { id: "PROPOSED", label: "Proposed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
        { id: "DISCUSSION", label: "Discussion", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
        { id: "APPROVED", label: "Approved", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
        { id: "REJECTED", label: "Rejected", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
    ];

    const filteredList = filterStage === "ALL"
        ? experiments
        : experiments.filter(e => e.stage === filterStage);

    return (
        <MemberWrapper>
            <CorePageHeader
                title="Experiments Lab"
                description="The innovation engine. Propose new ideas, debate implementations, and govern the roadmap."
                icon={<Beaker className="w-5 h-5 text-zinc-200" />}
                backLink="/member"
            >
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("BOARD")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "BOARD" ? "bg-zinc-100 text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("LIST")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "LIST" ? "bg-zinc-100 text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <Link href="/member/experiments/new">
                        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                            <Plus className="w-4 h-4" /> New Proposal
                        </button>
                    </Link>
                </div>
            </CorePageHeader>

            {loading ? (
                <div className="flex justify-center py-40">
                    <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                </div>
            ) : viewMode === "BOARD" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
                    {columns.map((col) => (
                        <div key={col.id} className="min-w-[300px]">
                            <div className={`flex items-center justify-between mb-4 px-1 pb-2 border-b border-white/5`}>
                                <div className="flex items-center gap-2 font-bold text-sm text-zinc-300">
                                    {col.label}
                                    <span className="bg-white/5 px-2 py-0.5 rounded-full text-xs text-zinc-500 border border-white/5">
                                        {experiments.filter(e => e.stage === col.id).length}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {experiments.filter(e => e.stage === col.id).map(exp => (
                                    <ExperimentCard key={exp.id} exp={exp} />
                                ))}
                                {experiments.filter(e => e.stage === col.id).length === 0 && (
                                    <div className="h-24 rounded-lg border border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center text-xs text-zinc-600 italic">
                                        No items
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* List Controls */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={filterStage}
                                onChange={(e) => setFilterStage(e.target.value)}
                                className="appearance-none bg-[#121212] border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm font-bold text-zinc-300 focus:outline-none focus:border-white/20 hover:border-white/20 transition-colors cursor-pointer"
                            >
                                <option value="ALL">All Stages</option>
                                {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* List Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-white/5 border border-white/5 rounded-lg text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        <div className="col-span-5">Proposal</div>
                        <div className="col-span-3">Proposed By</div>
                        <div className="col-span-2">Tags</div>
                        <div className="col-span-2 text-right">Status</div>
                    </div>

                    <div className="space-y-2">
                        {filteredList.map(exp => (
                            <ExperimentRow key={exp.id} exp={exp} />
                        ))}
                         {filteredList.length === 0 && (
                            <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/5 rounded-xl text-zinc-500 text-sm">
                                No experiments found matching your filter.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </MemberWrapper>
    );
}

function ExperimentCard({ exp }: { exp: Experiment }) {
    return (
        <Link
            href={`/member/experiments/${exp.id}`}
            className="group block bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-white/20 rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-xl"
        >
            <div className="flex items-center gap-2 mb-3">
                 {exp.createdBy?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={exp.createdBy.image} alt={exp.createdBy.name} className="w-5 h-5 rounded-full" />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                        {exp.createdBy?.name?.[0] || 'U'}
                    </div>
                )}
                <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[100px]">{exp.createdBy?.name}</span>
                <span className="text-[10px] text-zinc-600 font-mono ml-auto">
                    {new Date(exp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
            </div>

            <h4 className="text-sm font-bold text-zinc-100 mb-2 leading-snug group-hover:text-white transition-colors line-clamp-2">
                {exp.title}
            </h4>

            <div className="flex items-center justify-between mt-4">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 group-hover:text-zinc-400">
                    <MessageSquare className="w-3 h-3" />
                    {exp._count.comments}
                </div>
            </div>
        </Link>
    )
}

function ExperimentRow({ exp }: { exp: Experiment }) {
    const stageColors: Record<string, string> = {
        PROPOSED: "bg-zinc-800 text-zinc-300 border-zinc-700",
        DISCUSSION: "bg-zinc-100 text-black border-zinc-200",
        APPROVED: "bg-white text-black border-white",
        REJECTED: "bg-zinc-900 text-zinc-500 border-zinc-800 line-through",
    };

    return (
        <Link
             href={`/member/experiments/${exp.id}`}
             className="grid grid-cols-12 gap-4 items-center p-4 bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-white/20 rounded-xl transition-all group"
        >
            {/* Title Section */}
            <div className="col-span-5">
                <h4 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                    {exp.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="text-xs text-zinc-500">by {exp.createdBy?.name}</span>
                </div>
            </div>

            {/* Proposed By */}
            <div className="col-span-3 hidden md:flex items-center gap-2">
                {exp.createdBy?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={exp.createdBy.image} alt={exp.createdBy.name} className="w-6 h-6 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        {exp.createdBy?.name?.[0]}
                    </div>
                )}
                <span className="text-sm text-zinc-400 font-medium truncate">{exp.createdBy?.name}</span>
            </div>

            {/* Tags (Mock) */}
            <div className="col-span-2 hidden md:flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-500 border border-white/5">
                    Product
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-500 border border-white/5">
                    Core
                </span>
            </div>

            {/* Status */}
            <div className="col-span-2 flex justify-end">
                 <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${stageColors[exp.stage] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    {exp.stage}
                 </div>
            </div>
        </Link>
    )
}
