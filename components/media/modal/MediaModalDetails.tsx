"use client";

import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { MediaItem } from './types';

interface MediaModalDetailsProps {
    formData: MediaItem;
    setFormData: React.Dispatch<React.SetStateAction<MediaItem>>;
    initialData?: MediaItem | null;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    isLoading: boolean;
    onClose: () => void;
    handleStatusChange: (status: string) => Promise<void>;
}

export function MediaModalDetails({ 
    formData, 
    setFormData, 
    initialData, 
    handleSubmit, 
    isLoading, 
    onClose,
    handleStatusChange 
}: MediaModalDetailsProps) {
    const [customPlatform, setCustomPlatform] = useState('');
    
    const PREDEFINED_PLATFORMS = ['Twitter', 'LinkedIn', 'Instagram', 'YouTube', 'Blog', 'Newsletter'];
    const existingPlatforms = formData.platform || [];
    const customPlatforms = existingPlatforms.filter(p => !PREDEFINED_PLATFORMS.includes(p));

    const togglePlatform = (p: string) => {
        setFormData(prev => {
            const current = prev.platform || [];
            if (current.includes(p)) {
                return { ...prev, platform: current.filter(x => x !== p) };
            } else {
                return { ...prev, platform: [...current, p] };
            }
        });
    };

    const addCustomPlatform = () => {
        if (!customPlatform.trim()) return;
        const p = customPlatform.trim();
        if (!formData.platform.includes(p)) {
             setFormData(prev => ({ ...prev, platform: [...prev.platform, p] }));
        }
        setCustomPlatform('');
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Title</label>
                    <input 
                        required
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Weekly Roundup Thread"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Target Platforms</label>
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_PLATFORMS.map(p => {
                                const isSelected = existingPlatforms.includes(p);
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => togglePlatform(p)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                            isSelected 
                                            ? 'bg-white text-black border-white hover:bg-zinc-200' 
                                            : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300 hover:bg-zinc-900'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                        {customPlatforms.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {customPlatforms.map(p => (
                                    <div key={p} className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                                        {p}
                                        <button 
                                            type="button"
                                            onClick={() => togglePlatform(p)}
                                            className="p-0.5 hover:bg-indigo-500/20 rounded-md transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input 
                                value={customPlatform}
                                onChange={e => setCustomPlatform(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomPlatform())}
                                placeholder="Add custom platform..."
                                className="flex-1 bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-600"
                            />
                            <button 
                                type="button"
                                onClick={addCustomPlatform}
                                disabled={!customPlatform.trim()}
                                className="px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-white hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Description / Content Draft</label>
                    <textarea 
                        rows={5}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-zinc-900 transition-all resize-none placeholder:text-zinc-600 leading-relaxed"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Draft your content here..."
                        disabled={initialData?.status === 'posted'}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Reference Links</label>
                    <div className="space-y-2">
                        {formData.links.map((link, idx) => (
                            <div key={idx} className="flex gap-2 group">
                                <input 
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                                    value={link}
                                    onChange={e => {
                                        const newLinks = [...formData.links];
                                        newLinks[idx] = e.target.value;
                                        setFormData({ ...formData, links: newLinks });
                                    }}
                                    placeholder="https://..."
                                    disabled={initialData?.status === 'posted'}
                                />
                                {formData.links.length > 1 && (
                                     <button 
                                        type="button"
                                        onClick={() => {
                                            const newLinks = formData.links.filter((_, i) => i !== idx);
                                            setFormData({ ...formData, links: newLinks });
                                        }}
                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                     >
                                        <X className="w-4 h-4" />
                                     </button>
                                )}
                            </div>
                        ))}
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, links: [...formData.links, ''] })}
                            className="text-xs flex items-center gap-1.5 text-zinc-400 hover:text-white font-medium px-2 py-1 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                            disabled={initialData?.status === 'posted'}
                        >
                            <Plus className="w-3 h-3" />
                            Add Link
                        </button>
                    </div>
                </div>
            </form>

            <div className="p-4 border-t border-white/10 flex justify-between items-center bg-zinc-900/40 rounded-b-xl">
                <div className="flex gap-2">
                    {initialData?.status === 'draft' && (
                        <button 
                            type="button"
                            onClick={() => handleStatusChange('pending_approval')}
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                        >
                            Submit
                        </button>
                    )}
                    {initialData?.status === 'pending_approval' && (
                        <>
                            <button 
                                type="button"
                                onClick={() => handleStatusChange('approved')}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                            >
                                Approve
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleStatusChange('needs_edit')}
                                className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                            >
                                Reject
                            </button>
                        </>
                    )}
                    {initialData?.status === 'approved' && (
                        <button 
                            type="button"
                            onClick={() => handleStatusChange('posted')}
                            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Mark Posted
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wide"
                    >
                        Cancel
                    </button>
                    {initialData?.status !== 'posted' && (
                        <button 
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-5 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50 uppercase tracking-wide"
                        >
                            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Save Item
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
