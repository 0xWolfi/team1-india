"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { BarChart3, Clock, Globe, Lock, Plus, Trophy, Users, X } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { useSession } from "next-auth/react";

interface Voter {
    id: string;
    name: string;
    image?: string;
}

interface PollOption {
    id: string;
    text: string;
    voters: Voter[];
}

interface Poll {
    id: string;
    title: string; // Question
    status: string; // ACTIVE, CLOSED
    createdAt: string;
    customFields: {
        audience: 'CORE' | 'PUBLIC';
        options: PollOption[];
    };
}

export default function PollsPage() {
    const { data: session } = useSession();
    const canManage = usePermission('content', 'WRITE');
    
    // State
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ONGOING' | 'PAST'>('ONGOING');

    // Create State
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [newOptions, setNewOptions] = useState(["", ""]);
    const [audience, setAudience] = useState<'CORE' | 'PUBLIC'>('CORE');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/polls');
            const data = await res.json();
            // content resource returns title, type, status, customFields
            setPolls(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const createPoll = async () => {
        if (!newQuestion || newOptions.some(o => !o.trim())) return;
        setIsSubmitting(true);
        
        try {
            const res = await fetch('/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question: newQuestion, 
                    options: newOptions,
                    audience 
                })
            });

            if (res.ok) {
                setIsCreating(false);
                setNewQuestion("");
                setNewOptions(["", ""]);
                fetchPolls();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (pollId: string, optionId: string) => {
        // Optimistic update could be hard with complex structure, just fetch for now
        await fetch('/api/polls', {
            method: 'PATCH',
            body: JSON.stringify({ type: 'VOTE', id: pollId, optionId })
        });
        fetchPolls();
    };

    const toggleStatus = async (pollId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
         await fetch('/api/polls', {
            method: 'PATCH',
            body: JSON.stringify({ type: 'STATUS', id: pollId, status: newStatus })
        });
        fetchPolls();
    };

    const addOptionField = () => {
        setNewOptions([...newOptions, ""]);
    }

    // Filter polls
    const filteredPolls = polls.filter(p => {
        if (activeTab === 'ONGOING') return p.status === 'ACTIVE';
        return p.status !== 'ACTIVE';
    });

    const userVoted = (poll: Poll) => {
        if (!session?.user?.email) return false;
        // Check all options
        return poll.customFields.options.some(opt => 
            opt.voters?.some((v: any) => v.name === session.user?.name || v.id ) // rough check, ideally ID match
            // Since we save ID in backend, we should match ID. 
            // However, frontend session might not have ID easily if not customized.
            // Let's assume backend check prevents double voting, this is just for UI state.
        );
    };

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Voting Console"
                description="Launch and manage governance polls."
                icon={<BarChart3 className="w-5 h-5 text-indigo-500"/>}
            >
                {canManage && !isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-bold transition-all hover:bg-red-500 hover:text-white text-sm shadow-lg shadow-red-500/20"
                    >
                        <Plus className="w-4 h-4"/> New Poll
                    </button>
                )}
            </CorePageHeader>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-8 border-b border-black/5 dark:border-white/5 pb-1">
                <button 
                    onClick={() => setActiveTab('ONGOING')}
                    className={`pb-3 text-sm font-bold transition-all relative ${
                        activeTab === 'ONGOING' ? 'text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                >
                    Ongoing Polls
                    {activeTab === 'ONGOING' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_8px_rgba(99,102,241,0.5)]" />}
                </button>
                <button 
                    onClick={() => setActiveTab('PAST')}
                    className={`pb-3 text-sm font-bold transition-all relative ${
                        activeTab === 'PAST' ? 'text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                >
                    Past Results
                    {activeTab === 'PAST' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-500 rounded-t-full" />}
                </button>
            </div>

            {/* Create Modal */}
            {isCreating && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className="bg-white/20 dark:bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-black/5 dark:ring-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-black dark:text-white">Create New Poll</h2>
                            <button onClick={() => setIsCreating(false)} className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-zinc-500 dark:text-zinc-400"/></button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Question</label>
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-4 text-black dark:text-white focus:outline-none focus:border-indigo-500/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all font-medium"
                                    placeholder="e.g. What should be our next priority?"
                                    value={newQuestion}
                                    onChange={e => setNewQuestion(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Audience</label>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setAudience('CORE')} 
                                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${audience === 'CORE' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-zinc-500'}`}
                                    >
                                        <Lock className="w-4 h-4"/> Core Only
                                    </button>
                                    <button 
                                        onClick={() => setAudience('PUBLIC')} 
                                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${audience === 'PUBLIC' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-zinc-500'}`}
                                    >
                                        <Globe className="w-4 h-4"/> Public
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Options</label>
                                {newOptions.map((opt, idx) => (
                                    <div key={idx}>
                                         <input 
                                            type="text" 
                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-indigo-500/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all"
                                            placeholder={`Option ${idx + 1}`}
                                            value={opt}
                                            onChange={e => {
                                                const next = [...newOptions];
                                                next[idx] = e.target.value;
                                                setNewOptions(next);
                                            }}
                                        />
                                    </div>
                                ))}
                                <button onClick={addOptionField} className="text-xs text-indigo-400 font-bold hover:text-indigo-300 mt-2 flex items-center gap-1 pl-1">
                                    <Plus className="w-3 h-3"/> Add Another Option
                                </button>
                            </div>

                            <button 
                                onClick={createPoll}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all shadow-lg hover:translate-y-[-1px]"
                            >
                                {isSubmitting ? "Launching..." : "Launch Poll"}
                            </button>
                        </div>
                    </div>
                 </div>
            )}

            {/* Polls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center text-zinc-500 border border-dashed border-black/10 dark:border-white/10 rounded-3xl">
                        No polls found.
                    </div>
                )}
                
                {filteredPolls.map(poll => {
                    const totalVotes = poll.customFields.options.reduce((acc, o) => acc + (o.voters?.length || 0), 0);
                    const isEnded = poll.status === 'CLOSED';

                    return (
                        <div key={poll.id} className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-8 hover:border-black/20 dark:hover:border-white/20 transition-all group flex flex-col">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                            poll.customFields.audience === 'CORE' 
                                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                            {poll.customFields.audience}
                                        </span>
                                        {isEnded && <span className="text-zinc-500 text-[10px] font-bold uppercase border border-black/5 dark:border-white/5 px-2 py-0.5 rounded">Ended</span>}
                                    </div>
                                    <h3 className="text-xl font-bold text-black dark:text-white leading-tight">{poll.title}</h3>
                                </div>
                                {canManage && (
                                    <button 
                                        onClick={() => toggleStatus(poll.id, poll.status)}
                                        className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                                        title={isEnded ? "Reopen Poll" : "End Poll"}
                                    >
                                        {isEnded ? <Clock className="w-4 h-4"/> : <Trophy className="w-4 h-4"/>}
                                    </button>
                                )}
                            </div>

                            {/* Options */}
                            <div className="space-y-6 flex-1">
                                {poll.customFields.options.map((opt) => {
                                    const voteCount = opt.voters?.length || 0;
                                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                                    
                                    return (
                                        <div 
                                            key={opt.id} 
                                            onClick={() => !isEnded && handleVote(poll.id, opt.id)}
                                            className={`relative ${!isEnded ? 'cursor-pointer' : ''}`}
                                        >
                                            {/* Progress Bar Background */}
                                            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden">
                                                <div 
                                                    className={`h-full opacity-20 transition-all duration-1000 ${isEnded ? 'bg-zinc-500' : 'bg-indigo-500'}`} 
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="relative p-4 flex flex-col gap-2 z-10">
                                                <div className="flex justify-between items-center">
                                                     <span className="font-bold text-black dark:text-white text-sm">{opt.text}</span>
                                                     <span className="font-mono text-zinc-500 dark:text-zinc-400 text-xs">{percentage}%</span>
                                                </div>

                                                {/* Voters */}
                                                {voteCount > 0 && (
                                                    <div className="flex -space-x-2 overflow-hidden py-1">
                                                        {opt.voters?.slice(0, 8).map(v => (
                                                            <div key={v.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-black bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] text-black dark:text-white font-bold" title={v.name}>
                                                                {v.image ? (
                                                                    <Image src={v.image} alt={v.name} width={24} height={24} className="w-full h-full rounded-full object-cover" />
                                                                ) : v.name[0]}
                                                            </div>
                                                        ))}
                                                        {voteCount > 8 && (
                                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-black bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-500 dark:text-zinc-400 font-bold">
                                                                +{voteCount - 8}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-xs text-zinc-500">
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5"/> {totalVotes} votes
                                </span>
                                <span>
                                    {new Date(poll.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </CoreWrapper>
    );
}
