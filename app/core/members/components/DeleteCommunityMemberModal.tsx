"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { type CommunityMember } from "./ViewMemberModal";

interface DeleteCommunityMemberModalProps {
    member: CommunityMember | null;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export const DeleteCommunityMemberModal: React.FC<DeleteCommunityMemberModalProps> = ({ member, onClose, onConfirm, isSubmitting }) => {
    if (!member) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                        <AlertTriangle className="w-6 h-6 text-red-500"/>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">Remove Member?</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        Are you sure you want to remove <span className="text-white font-medium">{member.name || member.email}</span> from the community roster? This action cannot be undone.
                    </p>

                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm}
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Remove Member"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
