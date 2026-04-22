"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, AtSign, CheckCircle2, ChevronDown, Loader2, Tag, XCircle } from "lucide-react";
interface AddCommunityMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: { email: string, tags: string }) => void;
    isSubmitting: boolean;
}

export const AddCommunityMemberModal: React.FC<AddCommunityMemberModalProps> = ({ isOpen, onClose, onAdd, isSubmitting }) => {
    const [email, setEmail] = useState("");
    const [tag, setTag] = useState<string>("member");
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle');
    const [emailMessage, setEmailMessage] = useState("");

    // Reset email status when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEmail("");
            setEmailStatus('idle');
            setEmailMessage("");
        }
    }, [isOpen]);

    // Real-time email validation
    useEffect(() => {
        if (!email || !isOpen) {
            setEmailStatus('idle');
            setEmailMessage("");
            return;
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailStatus('idle');
            setEmailMessage("");
            return;
        }

        // Debounce the API call
        const timeoutId = setTimeout(async () => {
            setEmailStatus('checking');
            try {
                const res = await fetch(`/api/members/check-email?email=${encodeURIComponent(email)}`);
                const data = await res.json();
                
                if (data.exists) {
                    setEmailStatus('exists');
                    setEmailMessage(data.message || "Email already exists");
                } else {
                    setEmailStatus('available');
                    setEmailMessage("");
                }
            } catch (error) {
                console.error("Email check error:", error);
                setEmailStatus('idle');
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [email, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (emailStatus === 'exists') {
            return; // Prevent submission if email exists
        }
        onAdd({
            email,
            tags: tag
        });
    };

    return (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#09090b] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b border-black/10 dark:border-white/10 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
                    <div>
                        <h3 className="text-xl font-bold text-black dark:text-white">Add Community Member</h3>
                        <p className="text-zinc-500 text-xs mt-1">Register a new member to the community roster.</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-black dark:hover:text-white p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <XCircle className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Email Address</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <AtSign className="w-4 h-4 text-zinc-400 dark:text-zinc-600"/>
                                </div>
                                <input 
                                    autoFocus
                                    type="email" 
                                    required
                                    placeholder="member@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={`w-full bg-white/40 dark:bg-black/40 border rounded-lg pl-10 pr-10 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-1 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 ${
                                        emailStatus === 'exists' 
                                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                                            : emailStatus === 'available'
                                            ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                                            : 'border-black/10 dark:border-white/10 focus:border-black/20 dark:focus:border-white/20 focus:ring-black/20 dark:focus:ring-white/20'
                                    }`}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {emailStatus === 'checking' && (
                                        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin"/>
                                    )}
                                    {emailStatus === 'exists' && (
                                        <AlertCircle className="w-4 h-4 text-red-500"/>
                                    )}
                                    {emailStatus === 'available' && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
                                    )}
                                </div>
                            </div>
                            {emailStatus === 'exists' && emailMessage && (
                                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3"/>
                                    {emailMessage}
                                </p>
                            )}
                        </div>
                        
                        {/* Tags Dropdown */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Role</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                    <Tag className="w-4 h-4 text-zinc-400 dark:text-zinc-600"/>
                                </div>
                                <select
                                    value={tag}
                                    onChange={e => setTag(e.target.value)}
                                    className="w-full bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="member">Member</option>
                                    <option value="collaborator">Collaborator</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-zinc-500"/>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">The member will be asked to complete their profile details after first login.</p>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-black/5 dark:border-white/5 mt-6">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSubmitting || emailStatus === 'exists' || emailStatus === 'checking'}
                                className="flex-1 py-3 rounded-lg text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Add Member"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
