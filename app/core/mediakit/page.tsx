'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import {
    Download,
    Search,
    Palette,
    Image as ImageIcon,
    FileText,
    Copy,
    Check,
    Plus,
    Loader2
} from 'lucide-react';

interface Asset {
    id: string;
    title: string;
    type: string;
    content: string;
    customFields: any;
    createdBy?: {
        name: string;
        image: string;
    }
}

export default function MediaKitPage() {
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const tabs = [
        { id: 'ALL', label: 'All Assets' },
        { id: 'BRAND_ASSET', label: 'Logos' },
        { id: 'COLOR_PALETTE', label: 'Colors' },
        { id: 'BIO', label: 'Bios' },
        { id: 'FILE', label: 'Files' },
    ];

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab !== 'ALL') params.set('type', activeTab);
            if (searchQuery) params.set('search', searchQuery);
            
            const res = await fetch(`/api/mediakit?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setAssets(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchAssets, 300);
        return () => clearTimeout(timeout);
    }, [activeTab, searchQuery]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Media Kit"
                description="Official brand assets, logos, and resources."
                icon={<Palette className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />}
            >
                <Link href="/core/mediakit/new">
                    <button className="flex items-center gap-2 bg-white text-black dark:bg-white dark:text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                        <Plus className="w-4 h-4" /> Upload Asset
                    </button>
                </Link>
            </CorePageHeader>

            <div className="space-y-6">
                {/* Search & Tabs */}
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-center bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-xl border border-black/5 dark:border-white/5 flex-wrap">
                    <div className="flex gap-1 overflow-x-auto w-full md:w-auto p-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="relative w-full md:w-64 mr-2">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                    </div>
                ) : assets.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
                        <ImageIcon className="w-10 h-10 text-zinc-400 dark:text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-zinc-500 dark:text-zinc-400 font-medium">No assets found</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {assets.map(asset => (
                            <div key={asset.id} className="group relative bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-xl overflow-hidden hover:border-black/20 dark:hover:border-white/20 transition-all hover:translate-y-[-2px]">
                                {/* Preview Area */}
                                <div className="aspect-square bg-[url('/grid-pattern.svg')] bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-8 relative border-b border-black/5 dark:border-white/5">
                                    {asset.type === 'BRAND_ASSET' ? (
                                        <img src={asset.content} alt={asset.title} className="max-w-full max-h-full object-contain" />
                                    ) : asset.type === 'COLOR_PALETTE' ? (
                                        <div 
                                            className="w-24 h-24 rounded-full shadow-2xl border-4 border-black/10 dark:border-white/10"
                                            style={{ backgroundColor: asset.content }}
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                            {asset.type === 'BIO' ? <ImageIcon className="w-8 h-8 text-zinc-500" /> : <FileText className="w-8 h-8 text-zinc-500" />}
                                        </div>
                                    )}
                                    
                                    {/* Quick Format Badge */}
                                    {asset.customFields?.format && (
                                        <div className="absolute top-3 right-3 px-2 py-1 bg-white/50 dark:bg-black/50 backdrop-blur-md border border-black/10 dark:border-white/10 rounded text-[10px] font-mono text-zinc-400 uppercase">
                                            {asset.customFields.format}
                                        </div>
                                    )}
                                </div>

                                {/* Info Area */}
                                <div className="p-4">
                                    <h3 className="text-sm font-bold text-black dark:text-white truncate mb-1">{asset.title}</h3>
                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                                            {asset.customFields?.description || asset.type.replace('_', ' ')}
                                        </p>
                                        
                                        <div className="flex gap-2">
                                            {asset.type === 'COLOR_PALETTE' ? (
                                                <button 
                                                    onClick={() => handleCopy(asset.content, asset.id)}
                                                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                                                    title="Copy Hex Code"
                                                >
                                                    {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            ) : (
                                                <a 
                                                    href={asset.content} 
                                                    download 
                                                    target="_blank"
                                                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Color Hex Display */}
                                    {asset.type === 'COLOR_PALETTE' && (
                                        <div className="mt-3 p-2 bg-white/30 dark:bg-black/30 rounded border border-black/5 dark:border-white/5 flex justify-between items-center">
                                            <code className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{asset.content}</code>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CoreWrapper>
    );
}
