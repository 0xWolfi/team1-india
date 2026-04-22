"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Clock, Loader2, Mail, Video } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Member {
    id: string;
    email: string;
    name?: string;
}

interface ScheduleMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ScheduleMeetingModal({ isOpen, onClose, onSuccess }: ScheduleMeetingModalProps) {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");
    
    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState("60");
    const [memberSelection, setMemberSelection] = useState<'all' | 'individual'>('all');
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState("");

    // Fetch members when modal opens and individual selection is chosen
    useEffect(() => {
        if (isOpen && memberSelection === 'individual') {
            fetchMembers();
        }
    }, [isOpen, memberSelection]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTitle("");
            setDescription("");
            setDate("");
            setTime("");
            setDuration("60");
            setMemberSelection('all');
            setSelectedMemberIds(new Set());
            setMemberSearch("");
            setError("");
        }
    }, [isOpen]);

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            // Use attendance API which returns both core members and community members
            const res = await fetch('/api/attendance');
            if (res.ok) {
                const data = await res.json();
                // The attendance API already returns all active members (core + community)
                // No need to filter by status as it's already handled by the API
                setMembers(data);
            }
        } catch (err) {
            console.error('Failed to fetch members:', err);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch('/api/operations/schedule-meeting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    date,
                    time,
                    duration: parseInt(duration),
                    memberSelection,
                    selectedMemberIds: memberSelection === 'individual' ? Array.from(selectedMemberIds) : []
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to schedule meeting');
            }

            // Success
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to schedule meeting');
        } finally {
            setLoading(false);
        }
    };

    const toggleMemberSelection = (memberId: string) => {
        const newSet = new Set(selectedMemberIds);
        if (newSet.has(memberId)) {
            newSet.delete(memberId);
        } else {
            newSet.add(memberId);
        }
        setSelectedMemberIds(newSet);
    };

    const filteredMembers = members.filter(m =>
        (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(memberSearch.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Google Meet">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Meeting Title */}
                <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        Meeting Title *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Video className="w-4 h-4 text-zinc-500"/>
                        </div>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Team Sync"
                            className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        Description (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Meeting agenda, topics to discuss..."
                        rows={3}
                        className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none"
                    />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                            Date *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Calendar className="w-4 h-4 text-zinc-500"/>
                            </div>
                            <input
                                required
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-all custom-date-input"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                            Time *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Clock className="w-4 h-4 text-zinc-500"/>
                            </div>
                            <input
                                required
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        Duration (minutes) *
                    </label>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-all"
                    >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                    </select>
                </div>

                {/* Member Selection */}
                <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        Invite Members *
                    </label>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setMemberSelection('all')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                                    memberSelection === 'all'
                                        ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20 text-black dark:text-white'
                                        : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-black/10 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                All Members
                            </button>
                            <button
                                type="button"
                                onClick={() => setMemberSelection('individual')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                                    memberSelection === 'individual'
                                        ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20 text-black dark:text-white'
                                        : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-black/10 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                Select Individual
                            </button>
                        </div>

                        {memberSelection === 'individual' && (
                            <div className="space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                        className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 border border-black/10 dark:border-white/10 rounded-lg p-3 bg-zinc-100/30 dark:bg-zinc-900/30">
                                    {loadingMembers ? (
                                        <div className="text-center py-8 text-zinc-500 text-sm">Loading members...</div>
                                    ) : filteredMembers.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-500 text-sm">No members found</div>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => toggleMemberSelection(member.id)}
                                                className={`w-full p-3 rounded-lg text-left transition-all border ${
                                                    selectedMemberIds.has(member.id)
                                                        ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20'
                                                        : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium text-black dark:text-white">
                                                            {member.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                    {selectedMemberIds.has(member.id) && (
                                                        <CheckCircle2 className="w-5 h-5 text-black dark:text-white"/>
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                                {selectedMemberIds.size > 0 && (
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {selectedMemberIds.size} member{selectedMemberIds.size !== 1 ? 's' : ''} selected
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100/50 dark:bg-zinc-900/50 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all border border-black/10 dark:border-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !title || !date || !time || (memberSelection === 'individual' && selectedMemberIds.size === 0)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin"/>
                                Scheduling...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4"/>
                                Schedule Meeting
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
