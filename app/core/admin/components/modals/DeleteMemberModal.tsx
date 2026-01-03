"use client";

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Member } from "../../shared";

interface DeleteMemberModalProps {
    member: Member | null;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({ member, onClose, onConfirm, isSubmitting }) => {
    if (!member) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#09090b] border border-red-500/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-red-500/10" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Terminate Operative?</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-1">
                        You are about to permanently delete <strong>{member.email}</strong>.
                    </p>
                    <p className="text-zinc-500 text-xs">This action cannot be undone. All data associated with this identity will be erased from the registry.</p>
                </div>
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Termination"}
                    </button>
                </div>
            </div>
        </div>
    );
};
