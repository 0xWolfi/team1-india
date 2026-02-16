"use client";

import React from 'react';
import { X, LayoutList, MessageSquare } from 'lucide-react';
import { MediaItem } from './types';

interface MediaModalHeaderProps {
    initialData?: MediaItem | null;
    onClose: () => void;
    activeTab: 'details' | 'activity';
    setActiveTab: (tab: 'details' | 'activity') => void;
}

export function MediaModalHeader({ initialData, onClose, activeTab, setActiveTab }: MediaModalHeaderProps) {
    return (
        <div className="px-4 pt-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                    {initialData?.id ? 'Media Item' : 'New Media Item'}
                </h2>
                <button 
                    onClick={onClose} 
                    className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {initialData?.id && (
                <div className="flex gap-6 text-sm">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={`pb-3 border-b-2 transition-all ${activeTab === 'details' ? 'border-purple-500 text-white font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <span className="flex items-center gap-2"><LayoutList className="w-4 h-4"/> Details</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('activity')}
                        className={`pb-3 border-b-2 transition-all ${activeTab === 'activity' ? 'border-purple-500 text-white font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Activity</span>
                    </button>
                </div>
            )}
        </div>
    );
}
