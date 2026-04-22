'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { ArrowLeft, Save, Upload, Palette, FileText, Type } from 'lucide-react';

export default function NewAssetPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'BRAND_ASSET',
        content: '',
        description: '',
        format: 'PNG' // Default format
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/mediakit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    type: formData.type,
                    content: formData.content,
                    customFields: {
                        description: formData.description,
                        format: formData.format
                    }
                })
            });

            if (res.ok) {
                router.push('/core/mediakit');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Upload Asset"
                description="Add a new resource to the media kit."
                icon={<Upload className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />}
            >
                <div className="flex gap-2">
                    <button 
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-black/10 dark:border-white/10 rounded-lg text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                         onClick={(e) => handleSubmit(e as any)}
                         disabled={isSubmitting}
                         className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Asset</>}
                    </button>
                </div>
            </CorePageHeader>

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Asset Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all"
                            placeholder="e.g. Primary Logo (White)"
                        />
                    </div>

                    {/* Type Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { id: 'BRAND_ASSET', label: 'Logo / Image', icon: <Upload className="w-4 h-4" /> },
                            { id: 'COLOR_PALETTE', label: 'Color', icon: <Palette className="w-4 h-4" /> },
                            { id: 'BIO', label: 'Bio / Photo', icon: <FileText className="w-4 h-4" /> },
                            { id: 'FILE', label: 'Document', icon: <Type className="w-4 h-4" /> },
                        ].map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setFormData({...formData, type: type.id})}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                                    formData.type === type.id
                                    ? 'bg-zinc-200 dark:bg-zinc-800 border-black dark:border-white text-black dark:text-white'
                                    : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-black/5 dark:border-white/5 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-black/10 dark:hover:border-white/10'
                                }`}
                            >
                                {type.icon}
                                <span className="text-xs font-bold mt-2">{type.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Content Field */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                            {formData.type === 'COLOR_PALETTE' ? 'Hex Code' : 'URL / Link'}
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.content}
                            onChange={e => setFormData({...formData, content: e.target.value})}
                            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all font-mono"
                            placeholder={formData.type === 'COLOR_PALETTE' ? '#FFFFFF' : 'https://...'}
                        />
                    </div>

                     {/* Format (Optional) */}
                     {formData.type !== 'COLOR_PALETTE' && (
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Format / Extension</label>
                            <select
                                value={formData.format}
                                onChange={e => setFormData({...formData, format: e.target.value})}
                                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all"
                            >
                                <option value="PNG">PNG</option>
                                <option value="SVG">SVG</option>
                                <option value="JPG">JPG</option>
                                <option value="PDF">PDF</option>
                                <option value="ZIP">ZIP</option>
                            </select>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all h-32 resize-none"
                            placeholder="Brief details about usage..."
                        />
                    </div>
                </form>
            </div>
        </CoreWrapper>
    );
}
