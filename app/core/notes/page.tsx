"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileText, CheckCircle2, Circle, Plus, X, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { usePermission } from "@/hooks/usePermission";

interface ActionItem {
    id: string;
    text: string;
    isDone: boolean;
}

export default function NotesPage() {
    const canEdit = usePermission('playbooks', 'WRITE');
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [newItem, setNewItem] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Auto export/save timer logic could go here, but manual save is simpler for now
    
    useEffect(() => {
        // Load initial data
        fetch('/api/notes').then(res => res.json()).then(data => setNoteContent(data.content || ""));
        fetch('/api/action-items').then(res => res.json()).then(data => setActionItems(data));
    }, []);

    const saveNote = async () => {
        setIsSaving(true);
        await fetch('/api/notes', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ content: noteContent })
        });
        setTimeout(() => setIsSaving(false), 500);
    };

    const addActionItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        
        const res = await fetch('/api/action-items', {
            method: 'POST',
            body: JSON.stringify({ text: newItem })
        });
        const item = await res.json();
        
        setActionItems([...actionItems, item]);
        setNewItem("");
    }

    const toggleItem = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setActionItems(items => items.map(i => i.id === id ? { ...i, isDone: !currentStatus } : i));
        
        await fetch('/api/action-items', {
            method: 'PATCH',
            body: JSON.stringify({ id, isDone: !currentStatus })
        });
    }
    
    const deleteItem = async (id: string) => {
        if (!confirm("Delete this task?")) return;
        setActionItems(items => items.filter(i => i.id !== id));
        await fetch(`/api/action-items?id=${id}`, { method: 'DELETE' });
    }

    return (
        <div className="min-h-screen pt-24 px-6 max-w-6xl mx-auto pb-20 text-white">
            <Link href="/core" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Core
            </Link>

            <header className="mb-10 flex justify-between items-end">
                 <div>
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                         <FileText className="w-8 h-8 text-purple-500" /> Meeting Notes
                     </h1>
                    <p className="text-zinc-400">Document discussions and track action items.</p>
                 </div>
                 {canEdit && (
                    <button 
                        onClick={saveNote}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all font-bold text-sm"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Notes'}
                    </button>
                 )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                {/* Notes Area */}
                <div className="flex flex-col h-full bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative group">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-zinc-400" /> Meeting Minutes
                    </h3>
                     <textarea 
                        className="flex-1 w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-white/20 resize-none font-mono leading-relaxed"
                        placeholder={canEdit ? "Type meeting notes here..." : "No notes yet."}
                        value={noteContent}
                        readOnly={!canEdit}
                        onChange={(e) => setNoteContent(e.target.value)}
                        onBlur={() => canEdit && saveNote()} // Auto-save on blur
                    />
                    <div className="absolute top-6 right-6 text-xs text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Auto-saves on edit
                    </div>
                </div>

                {/* Action Items Area */}
                <div className="flex flex-col h-full bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Action Items
                    </h3>
                    
                    {canEdit && (
                        <form onSubmit={addActionItem} className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Add new task..." 
                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
                            />
                            <button type="submit" className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 border border-indigo-500/20">
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                        {actionItems.length === 0 && (
                            <p className="text-zinc-600 text-sm text-center py-4 italic">No action items yet.</p>
                        )}
                        {actionItems.map(item => (
                            <div key={item.id} className="group flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                <button onClick={() => canEdit && toggleItem(item.id, item.isDone)} className={!canEdit ? 'cursor-default' : ''}>
                                    {item.isDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-zinc-500 hover:text-white" />
                                    )}
                                </button>
                                <span className={`flex-1 text-sm ${item.isDone ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                                    {item.text}
                                </span>
                                {canEdit && (
                                    <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
