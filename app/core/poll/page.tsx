"use client";

import React, { useEffect, useState } from "react";
import { 
    BarChart3, Plus, Trash2, Check, X, Clock, Users, ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface Poll {
    id: string;
    question: string;
    options: { id: string, text: string, votes: number }[];
    status: string;
    createdAt: string;
}

export default function PollsPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [newOptions, setNewOptions] = useState(["", ""]);

    useEffect(() => {
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        const res = await fetch('/api/polls');
        const data = await res.json();
        setPolls(data);
    };

    const createPoll = async () => {
        if (!newQuestion || newOptions.some(o => !o.trim())) return;
        
        const optionsData = newOptions.map((text, idx) => ({ 
            id: `opt-${Date.now()}-${idx}`, 
            text, 
            votes: 0 
        }));

        const res = await fetch('/api/polls', {
            method: 'POST',
            body: JSON.stringify({ question: newQuestion, options: optionsData })
        });

        if (res.ok) {
            setIsCreating(false);
            setNewQuestion("");
            setNewOptions(["", ""]);
            fetchPolls();
        }
    };

    const handleVote = async (pollId: string, optionId: string) => {
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

    return (
        <div className="min-h-screen pt-24 px-6 max-w-5xl mx-auto pb-20 text-white">
            <Link href="/core" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Core
            </Link>

            <header className="mb-10 flex justify-between items-end">
                <div>
                     <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                         <BarChart3 className="w-8 h-8 text-indigo-500" /> Voting Console
                     </h1>
                    <p className="text-zinc-400">Launch and manage governance polls.</p>
                </div>
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25"
                    >
                        <Plus className="w-5 h-5" /> New Poll
                    </button>
                )}
            </header>

            {isCreating && (
                 <div className="mb-12 bg-zinc-900 border border-white/10 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold">Create New Poll</h2>
                        <button onClick={() => setIsCreating(false)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
                    </div>

                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Question</label>
                            <input 
                                type="text" 
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-indigo-500/50 outline-none"
                                placeholder="e.g. What should be our next priority?"
                                value={newQuestion}
                                onChange={e => setNewQuestion(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Options</label>
                            {newOptions.map((opt, idx) => (
                                <div key={idx} className="flex gap-3 mb-2">
                                     <input 
                                        type="text" 
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none"
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
                            <button onClick={addOptionField} className="text-xs text-indigo-400 font-bold hover:text-indigo-300 mt-2 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Option
                            </button>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={createPoll}
                                className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200"
                            >
                                Launch Poll
                            </button>
                        </div>
                    </div>
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.map(poll => (
                    <div key={poll.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <button 
                                onClick={() => toggleStatus(poll.id, poll.status)}
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    poll.status === 'ACTIVE' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                    : 'bg-zinc-800 text-zinc-500 border-white/5 hover:bg-zinc-700'
                                }`}
                            >
                                {poll.status}
                            </button>
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                                <Users className="w-3 h-3" /> {poll.options.reduce((acc, o) => acc + o.votes, 0)} votes
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-6">{poll.question}</h3>

                        <div className="space-y-4">
                            {poll.options.map((opt) => {
                                const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
                                const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                return (
                                    <div key={opt.id} onClick={() => poll.status === 'ACTIVE' && handleVote(poll.id, opt.id)} className={`relative group ${poll.status === 'ACTIVE' ? 'cursor-pointer' : 'cursor-default'}`}>
                                        <div className="flex justify-between text-sm mb-1 z-10 relative">
                                            <span className="text-zinc-300 group-hover:text-white transition-colors">{opt.text}</span>
                                            <span className="font-mono text-zinc-500">{percentage}%</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
