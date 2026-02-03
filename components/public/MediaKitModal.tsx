import React from 'react';
import Link from 'next/link';
import { MotionIcon } from "motion-icons-react";
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
                        let IconName = "Download";
                        if (title.includes("logo") || title.includes("brand")) IconName = "Palette";
                        if (title.includes("video") || title.includes("reel")) IconName = "Video";
                        if (title.includes("guide") || title.includes("press")) IconName = "FileText";
                        if (title.includes("photo") || title.includes("image")) IconName = "Image";

                        return (
                            <Link
                                key={item.id}
                                href={item.links[0] || '#'}
                                target="_blank"
                                className="p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group flex flex-col justify-between text-left gap-3 min-h-[140px] hover:-translate-y-1 cursor-pointer"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors flex-shrink-0">
                                        <MotionIcon name={IconName} className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white group-hover:text-white line-clamp-2 leading-snug mb-1">{item.title}</h4>
                                        {item.description && (
                                            <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 line-clamp-2 leading-relaxed">{item.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-white transition-colors pt-2 border-t border-white/5">
                                    <MotionIcon name="ExternalLink" className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Open in Drive</span>
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
                        <MotionIcon name="FileText" className="w-3 h-3" /> Press One-Liner
                    </div>
                    <p className="text-sm text-zinc-300 italic leading-relaxed font-serif group-hover:text-white transition-colors">
                        "Team1 India is the largest decentralized community of builders, founders, and students driving the web3 ecosystem forward."
                    </p>
                </div>
            </div>
        </Modal>
    );
}
