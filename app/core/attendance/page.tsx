"use client";

import { Calendar, CheckCircle2, Search, Trash2, Users } from "lucide-react";
import React, { useState, useEffect } from "react";
import { usePermission } from "@/hooks/usePermission";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

interface Member {
    id: string;
    name: string;
    email: string;
    xHandle?: string | null;
    discord?: string | null;
    type: 'CORE' | 'COMMUNITY';
    role: string;
}

export default function AttendancePage() {
    const canManage = usePermission('operations', 'WRITE');
    
    // Main View State (History)
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [searchQuery, setSearchQuery] = useState(""); // Filter history by note
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    
    // New Session State
    const [meetingName, setMeetingName] = useState("");
    const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
    
    // View Details State
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    // Member & Saving State
    const [members, setMembers] = useState<Member[]>([]);
    const [memberSearch, setMemberSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Delete State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchHistory();
        fetchMembers();
    }, []);

    // Fetch members only when needed (Modal Step 2)
    useEffect(() => {
        // (Removed lazy fetch since we fetch on mount now)
    }, [isModalOpen, modalStep]);

    const fetchHistory = () => {
        setLoadingHistory(true);
        fetch('/api/attendance?history=true')
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error(err))
            .finally(() => setLoadingHistory(false));
    };

    const fetchMembers = () => {
        fetch('/api/attendance')
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(err => console.error(err));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: meetingDate,
                    note: meetingName,
                    presentIds: Array.from(selectedMembers),
                })
            });
            if (res.ok) {
                // Reset and Close
                setIsModalOpen(false);
                setModalStep(1);
                setMeetingName("");
                setMeetingDate(new Date().toISOString().split('T')[0]);
                setSelectedMembers(new Set());
                fetchHistory(); // Refresh list
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleMember = (id: string) => {
        const next = new Set(selectedMembers);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedMembers(next);
    };

    // Filters
    const filteredHistory = history.filter(h => 
        (h.note || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMembers = members.filter(m =>
        (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.discord || '').toLowerCase().includes(memberSearch.toLowerCase())
    );

    const getAttendees = (record: any) => {
        if (!record || !record.presentMemberIds) return [];
        return members.filter(m => record.presentMemberIds.includes(m.id));
    };

    const performDelete = async () => {
        if (!selectedRecord) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/attendance?id=${selectedRecord.id}`, { method: 'DELETE' });
            if (res.ok) {
                setShowDeleteConfirm(false);
                setSelectedRecord(null);
                fetchHistory();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Attendance Tracker"
                description="Manage meeting logs and track member presence."
                icon={<Users className="w-5 h-5 text-red-500"/>}
            >
                {canManage && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-bold shadow-lg shadow-red-500/20"
                    >
                        <Calendar className="w-4 h-4"/> New Session
                    </button>
                )}
            </CorePageHeader>

            {/* Controls */}
            <div className="mb-6 relative">
                 <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"/>
                 <input 
                    type="text" 
                    placeholder="Search past meetings..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                />
            </div>

            {/* History List */}
            <div className="grid gap-4">
                {loadingHistory ? (
                    <div className="text-center py-12 text-zinc-500">Loading history...</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <Calendar className="w-12 h-12 mb-4 opacity-20"/>
                        <p>No attendance logs found.</p>
                    </div>
                ) : (
                    filteredHistory.map(record => (
                        <div 
                            key={record.id} 
                            onClick={() => setSelectedRecord(record)}
                            className="p-5 bg-zinc-900/50 backdrop-blur border border-white/5 rounded-xl flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer"
                        >
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                                    {record.note || "Untitled Meeting"}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                                    <Calendar className="w-3 h-3"/>
                                    {new Date(record.date).toLocaleDateString(undefined, {
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {record.presentMemberIds.length}
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                        Attendees
                                    </div>
                                </div>
                                <div className="w-1 h-8 bg-white/5 rounded-full" />
                                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-xs text-zinc-400 font-mono">
                                    LOG
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            
            {/* View Details Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className="bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-white/5">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{selectedRecord.note || "Untitled Meeting"}</h2>
                                <div className="flex items-center gap-2 text-sm text-zinc-300">
                                    <Calendar className="w-4 h-4"/>
                                    {new Date(selectedRecord.date).toLocaleDateString(undefined, {
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                    <span className="text-zinc-600 mx-1">•</span>
                                    <span className="text-white font-bold">{selectedRecord.presentMemberIds.length}</span> present
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedRecord(null)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white"
                            >
                                <Users className="w-5 h-5"/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getAttendees(selectedRecord).map(member => (
                                    <div key={member.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-sm ring-1 ring-red-500/20">
                                            {member.name?.[0] || "?"}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-sm font-bold text-white truncate">{member.name || "Unknown"}</div>
                                            <div className="text-[10px] text-zinc-300 truncate font-mono">{member.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/5 flex justify-between items-center">
                            {canManage && (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4"/> Delete Log
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedRecord(null)}
                                className="px-6 py-2.5 text-sm font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className="bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 rounded-3xl w-full max-w-xl flex flex-col shadow-2xl shadow-red-500/5 animate-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-white/5">
                        
                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/5 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {modalStep === 1 ? "New Session" : "Mark Attendance"}
                                </h2>
                                <p className="text-zinc-300">
                                    {modalStep === 1 ? "Enter meeting details to create a new log." : `Select members present for "${meetingName}"`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                                <div className={`w-2.5 h-2.5 rounded-full transition-all ${modalStep >= 1 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/10'}`} />
                                <div className={`w-6 h-0.5 rounded-full transition-all ${modalStep >= 2 ? 'bg-red-500' : 'bg-white/10'}`} />
                                <div className={`w-2 h-2 rounded-full transition-all ${modalStep >= 2 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/10'}`} />
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8">
                            {modalStep === 1 && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Meeting Name</label>
                                        <div className="group relative">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                <Users className="w-5 h-5 text-zinc-500 group-focus-within:text-red-500 transition-colors"/>
                                            </div>
                                            <input 
                                                type="text" 
                                                autoFocus
                                                placeholder="e.g. Weekly Priority Sync"
                                                value={meetingName}
                                                onChange={e => setMeetingName(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Date</label>
                                        <div className="group relative">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                <Calendar className="w-5 h-5 text-zinc-500 group-focus-within:text-red-500 transition-colors"/>
                                            </div>
                                            <input 
                                                type="date" 
                                                value={meetingDate}
                                                onChange={e => setMeetingDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all font-medium custom-date-input"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalStep === 2 && (
                                <div className="space-y-4">
                                    <div className="relative group">
                                         <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-red-500 transition-colors"/>
                                         <input 
                                            type="text" 
                                            placeholder="Search members..." 
                                            value={memberSearch}
                                            onChange={e => setMemberSearch(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02] h-[300px] overflow-y-auto custom-scrollbar">
                                        {filteredMembers.map(member => (
                                            <div 
                                                key={member.id} 
                                                onClick={() => toggleMember(member.id)}
                                                className={`p-4 flex items-center gap-4 transition-all cursor-pointer border-b border-white/5 last:border-0 ${
                                                    selectedMembers.has(member.id) ? 'bg-red-500/10 hover:bg-red-500/20' : 'hover:bg-white/5'
                                                }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    selectedMembers.has(member.id) 
                                                        ? 'bg-red-500 border-red-500 text-white scale-110 shadow-lg shadow-red-500/20' 
                                                        : 'border-zinc-700 text-transparent'
                                                }`}>
                                                    <CheckCircle2 className="w-3.5 h-3.5"/>
                                                </div>
                                                <div className="flex-1">
                                                     <div className="flex items-center gap-2">
                                                        <h3 className={`font-bold text-sm transition-colors ${selectedMembers.has(member.id) ? 'text-white' : 'text-zinc-300'}`}>
                                                            {member.name || 'Unknown'}
                                                        </h3>
                                                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 uppercase font-bold">{member.type}</span>
                                                    </div>
                                                    <div className="text-xs text-zinc-500">{member.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setModalStep(1);
                                }}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            {modalStep === 1 ? (
                                <button 
                                    onClick={() => setModalStep(2)}
                                    disabled={!meetingName}
                                    className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-400 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    {isSaving ? "Saving..." : (
                                        <>
                                            Save Session <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs ml-1">{selectedMembers.size}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className="bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border border-red-500/20 rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-red-500/10">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                <Trash2 className="w-8 h-8"/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Delete Log?</h3>
                                <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                                    Are you sure you want to permanently remove <br/><span className="text-white font-bold">"{selectedRecord?.note}"</span>?
                                </p>
                            </div>
                            <div className="flex items-center gap-3 w-full mt-2">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={performDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 bg-red-500 rounded-xl font-bold text-white hover:bg-red-400 transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20"
                                >
                                    {isDeleting ? "Deleting..." : "Delete It"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CoreWrapper>
    );
}
