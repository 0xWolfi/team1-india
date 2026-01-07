import React from 'react';
import Link from 'next/link';
import { Download, Palette, Video, FileText, Image as ImageIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface MediaItem {
    id: string;
    title: string | null;
    links: string[];
    description: string | null;
}

interface MediaKitModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaItems: MediaItem[];
}

export function MediaKitModal({ isOpen, onClose, mediaItems }: MediaKitModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Media Kit">
            <div className="space-y-6">
                {mediaItems && mediaItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mediaItems.map((item) => {
                        const title = item.title?.toLowerCase() || "";
                        let Icon = Download;
                        if (title.includes("logo") || title.includes("brand")) Icon = Palette;
                        if (title.includes("video") || title.includes("reel")) Icon = Video;
                        if (title.includes("guide") || title.includes("press")) Icon = FileText;
                        if (title.includes("photo") || title.includes("image")) Icon = ImageIcon;

                        return (
                            <Link 
                                key={item.id} 
                                href={item.links[0] || '#'} 
                                target="_blank"
                                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group flex flex-col items-center justify-center text-center gap-3 h-40 hover:-translate-y-1"
                            >
                                <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                                    <Icon className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-sm font-bold text-zinc-300 group-hover:text-white line-clamp-2 uppercase tracking-wide">{item.title}</span>
                                    {item.description && (
                                        <span className="block text-[10px] text-zinc-500 group-hover:text-zinc-400 line-clamp-1">{item.description}</span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                    </div>
                ) : (
                    <div className="text-center py-10 text-zinc-500">
                        No media assets available.
                    </div>
                )}
                
                <div className="p-5 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3 text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                        <FileText className="w-3 h-3" /> Press One-Liner
                    </div>
                    <p className="text-sm text-zinc-300 italic leading-relaxed font-serif group-hover:text-white transition-colors">
                        "Team1 India is the largest decentralized community of builders, founders, and students driving the web3 ecosystem forward."
                    </p>
                </div>
            </div>
        </Modal>
    );
}
