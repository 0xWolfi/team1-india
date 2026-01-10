"use client";

import React, { useState } from "react";
import { XCircle, Loader2, Tag, User, Send, AtSign } from "lucide-react";

interface AddCommunityMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: { email: string, name: string, telegram: string, xHandle: string, tags: string[] }) => void;
    isSubmitting: boolean;
}

export const AddCommunityMemberModal: React.FC<AddCommunityMemberModalProps> = ({ isOpen, onClose, onAdd, isSubmitting }) => {
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        telegram: "",
        xHandle: ""
    });
    const [tags, setTags] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            ...formData,
            tags
        });
    };

    const addTag = (tag: string) => {
        if (tag && !tags.includes(tag)) {
            setTags(prev => [...prev, tag]);
        }
    };

    const removeTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h3 className="text-xl font-bold text-white">Add Community Member</h3>
                        <p className="text-zinc-500 text-xs mt-1">Register a new member to the community roster.</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Full Name</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <User className="w-4 h-4 text-zinc-600" />
                                </div>
                                <input 
                                    autoFocus
                                    type="text" 
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Email Address</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <AtSign className="w-4 h-4 text-zinc-600" />
                                </div>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="member@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Telegram */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Telegram Handle</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <Send className="w-4 h-4 text-zinc-600" />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="@username"
                                        value={formData.telegram}
                                        onChange={e => setFormData({...formData, telegram: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>
                            {/* X Handle */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">X Handle</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <span className="text-zinc-600 font-bold text-xs">X</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="@handle" // cleaned @ later if needed
                                        value={formData.xHandle}
                                        onChange={e => setFormData({...formData, xHandle: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Tags */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Tags</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <Tag className="w-4 h-4 text-zinc-600" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Type tag and press Enter... (e.g. Founder)" 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag(e.currentTarget.value.trim());
                                            e.currentTarget.value = "";
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1 min-h-[30px]">
                                {tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 border border-white/10 animate-in zoom-in-90">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-zinc-500 hover:text-white transition-colors">
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 rounded-lg text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Member"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
