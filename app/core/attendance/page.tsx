"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, CheckCircle2, Circle, Calendar, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Member {
    id: string;
    name: string;
    email: string;
    xHandle?: string | null;
    type: 'CORE' | 'COMMUNITY';
    role: string;
}

export default function AttendancePage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetch('/api/attendance')
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(err => console.error(err));
    }, []);

    const toggleMember = (id: string) => {
        const next = new Set(selectedMembers);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedMembers(next);
    };

    const handleSave = async () => {
        if (!confirm(`Save attendance for ${selectedMembers.size} members on ${date}?`)) return;
        
        setIsSaving(true);
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    presentIds: Array.from(selectedMembers),
                })
            });
            if (res.ok) {
                alert("Attendance Saved!");
                setSelectedMembers(new Set()); // Reset or keep? Reset usually better.
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-24 px-6 max-w-5xl mx-auto pb-20 text-white">
            <Link href="/core" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Core
            </Link>

            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                         <Users className="w-8 h-8 text-emerald-500" /> Attendance Tracker
                     </h1>
                    <p className="text-zinc-400">Mark presence for meetings and events.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-zinc-900 border border-white/10 p-2 rounded-xl">
                    <div className="flex items-center gap-2 px-3 border-r border-white/10">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <input 
                            type="date" 
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="bg-transparent text-sm text-white focus:outline-none"
                        />
                    </div>
                     <button 
                        onClick={handleSave}
                        disabled={isSaving || selectedMembers.size === 0}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Log"}
                    </button>
                </div>
            </header>

            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-white/5 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search members..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                    <div className="text-sm text-zinc-500 font-mono">
                        <span className="text-white font-bold">{selectedMembers.size}</span> selected
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {filteredMembers.map(member => (
                        <div 
                            key={member.id} 
                            onClick={() => toggleMember(member.id)}
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                                selectedMembers.has(member.id) ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-white/5'
                            }`}
                        >
                            <div className={`p-1 rounded-full border ${selectedMembers.has(member.id) ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700 text-transparent'}`}>
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm text-white">{member.name}</h3>
                                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-400 uppercase tracking-wider">{member.type}</span>
                                </div>
                                <div className="text-xs text-zinc-500">{member.email} {member.xHandle && `• @${member.xHandle}`}</div>
                            </div>
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="p-8 text-center text-zinc-500 italic">
                            No members found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
