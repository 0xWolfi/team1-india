"use client";

import React, { useState, useEffect } from "react";
import { Calendar, ChevronRight, Eye, FileText, Globe, Lock, Plus, Save, Search, Trash2 } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import ReactMarkdown from 'react-markdown';

interface Note {
    id: string;
    title: string;
    content: string;
    customFields: {
        date: string;
        visibility: 'CORE' | 'MEMBER';
    };
    createdAt: string;
}

export default function NotesPage() {
    const canManage = usePermission('playbooks', 'WRITE');
    
    // Data State
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        date: new Date().toISOString().split('T')[0],
        visibility: "CORE" as 'CORE' | 'MEMBER',
        content: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    // View/Delete State
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notes');
            const data = await res.json();
            setNotes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                // Reset
                setIsModalOpen(false);
                setModalStep(1);
                setFormData({
                    title: "",
                    date: new Date().toISOString().split('T')[0],
                    visibility: "CORE",
                    content: ""
                });
                fetchNotes();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save note.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedNote) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/notes?id=${selectedNote.id}`, { method: 'DELETE' });
            if (res.ok) {
                setShowDeleteConfirm(false);
                setSelectedNote(null);
                fetchNotes();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredNotes = notes.filter(n => 
        (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.content || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Meeting Notes"
                description="Document team discussions, decisions, and action items."
                icon={<FileText className="w-5 h-5 text-red-500"/>}
            >
                {canManage && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black dark:bg-white dark:text-black rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-bold shadow-lg shadow-red-500/20"
                    >
                        <Plus className="w-4 h-4"/> New Note
                    </button>
                )}
            </CorePageHeader>

            {/* Search */}
            <div className="mb-8 relative">
                 <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"/>
                 <input 
                    type="text" 
                    placeholder="Search past meetings..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-red-500/50 transition-colors"
                />
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-24 text-zinc-500">Loading notes...</div>
                ) : filteredNotes.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-zinc-500 border border-dashed border-black/10 dark:border-white/10 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02]">
                        <FileText className="w-12 h-12 mb-4 opacity-20"/>
                        <p>No meeting notes found.</p>
                    </div>
                ) : (
                    filteredNotes.map(note => (
                        <div 
                            key={note.id} 
                            onClick={() => setSelectedNote(note)}
                            className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-6 cursor-pointer hover:border-red-500/30 hover:bg-white/40 dark:hover:bg-black/40 transition-all group flex flex-col h-[200px]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg text-red-400 group-hover:text-red-500 transition-colors">
                                    <FileText className="w-5 h-5"/>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                                    note.customFields?.visibility === 'CORE' 
                                        ? 'border-red-500/30 text-red-400 bg-red-500/10' 
                                        : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                                }`}>
                                    {note.customFields?.visibility || 'CORE'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-black dark:text-white mb-1 line-clamp-1">{note.title}</h3>
                            <div className="text-sm text-zinc-500 mb-4 flex items-center gap-2">
                                <Calendar className="w-3 h-3"/>
                                {new Date(note.customFields?.date || note.createdAt).toLocaleDateString()}
                            </div>
                            <p className="text-xs text-zinc-400 dark:text-zinc-600 line-clamp-3 leading-relaxed flex-1">
                                {note.content.replace(/[#*`_]/g, '')}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className={`bg-white/20 dark:bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border border-black/10 dark:border-white/10 rounded-3xl w-full ${modalStep === 2 ? 'max-w-4xl h-[80vh]' : 'max-w-md'} flex flex-col shadow-2xl shadow-red-500/5 animate-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 transition-all`}>
                        
                        {/* Header */}
                        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                                    {modalStep === 1 ? "New Note Details" : "Write Content"}
                                </h2>
                                <p className="text-zinc-600 dark:text-zinc-300 text-sm">
                                    {modalStep === 1 ? "Set the context for your meeting note." : `Documenting "${formData.title}"`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5">
                                <div className={`w-2.5 h-2.5 rounded-full ${modalStep >= 1 ? 'bg-red-500' : 'bg-black/10 dark:bg-white/10'}`} />
                                <div className={`w-6 h-0.5 rounded-full ${modalStep >= 2 ? 'bg-red-500' : 'bg-black/10 dark:bg-white/10'}`} />
                                <div className={`w-2 h-2 rounded-full ${modalStep >= 2 ? 'bg-red-500' : 'bg-black/10 dark:bg-white/10'}`} />
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {modalStep === 1 && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Meeting Title</label>
                                        <input 
                                            type="text" 
                                            autoFocus
                                            placeholder="e.g. Q4 Strategy Review"
                                            value={formData.title}
                                            onChange={e => setFormData({...formData, title: e.target.value})}
                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-4 text-black dark:text-white focus:outline-none focus:border-red-500/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Date</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-4 text-black dark:text-white focus:outline-none focus:border-red-500/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all font-medium custom-date-input"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">View Access</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => setFormData({...formData, visibility: 'CORE'})}
                                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                                    formData.visibility === 'CORE'
                                                        ? 'bg-red-500/10 border-red-500 text-black dark:text-white'
                                                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-zinc-500 hover:bg-black/10 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <Lock className="w-5 h-5"/>
                                                <span className="text-sm font-bold">Core Only</span>
                                            </button>
                                            <button 
                                                onClick={() => setFormData({...formData, visibility: 'MEMBER'})}
                                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                                    formData.visibility === 'MEMBER'
                                                        ? 'bg-blue-500/10 border-blue-500 text-black dark:text-white'
                                                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-zinc-500 hover:bg-black/10 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <Globe className="w-5 h-5"/>
                                                <span className="text-sm font-bold">Members</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalStep === 2 && (
                                <div className="h-full flex flex-col">
                                    <div className="relative flex-1">
                                        <textarea 
                                            value={formData.content}
                                            onChange={e => setFormData({...formData, content: e.target.value})}
                                            placeholder="# Meeting Agenda&#10;&#10;1. Review Updates&#10;2. Brainstorming..."
                                            className="w-full h-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-red-500/20 font-mono resize-none leading-relaxed"
                                        />
                                        <div className="absolute top-4 right-6 text-xs text-zinc-400 dark:text-zinc-600 pointer-events-none font-bold uppercase tracking-wider">Markdown Supported</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-black/5 dark:border-white/5 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setModalStep(1);
                                }}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            {modalStep === 1 ? (
                                <button 
                                    onClick={() => setModalStep(2)}
                                    disabled={!formData.title}
                                    className="px-8 py-3 bg-white text-black dark:bg-white dark:text-black rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    Proceed <ChevronRight className="w-4 h-4"/>
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-400 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4"/> {isSaving ? "Saving..." : "Save Note"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Note Modal */}
            {selectedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className="bg-white/20 dark:bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        
                        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-black dark:text-white mb-2">{selectedNote.title}</h2>
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">
                                        <Calendar className="w-3.5 h-3.5"/>
                                        {new Date(selectedNote.customFields?.date || selectedNote.createdAt).toLocaleDateString(undefined, {
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </span>
                                    <span className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${
                                        selectedNote.customFields?.visibility === 'CORE' 
                                            ? 'border-red-500/20 text-red-400 bg-red-500/5' 
                                            : 'border-blue-500/20 text-blue-400 bg-blue-500/5'
                                    }`}>
                                        {selectedNote.customFields?.visibility} ACCESS
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedNote(null)}
                                className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-black dark:hover:text-white"
                            >
                                <Eye className="w-5 h-5"/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white/10 dark:bg-black/10">
                            <article className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white prose-p:text-zinc-600 dark:prose-p:text-zinc-300 prose-a:text-red-400 prose-strong:text-black dark:prose-strong:text-white prose-code:text-red-300 prose-pre:bg-white/50 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-pre:rounded-xl">
                                <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                            </article>
                        </div>

                        <div className="p-6 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
                            {canManage && (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4"/> Delete Note
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedNote(null)}
                                className="px-6 py-2.5 text-sm font-bold text-zinc-400 hover:text-black dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-colors"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                    <div className="bg-white/20 dark:bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border border-red-500/20 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-red-500/10">
                         <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                <Trash2 className="w-8 h-8"/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-black dark:text-white">Delete Note?</h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                                    Are you sure you want to permanently delete <br/><span className="text-black dark:text-white font-bold">"{selectedNote?.title}"</span>?
                                </p>
                            </div>
                            <div className="flex items-center gap-3 w-full mt-2">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDelete}
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
