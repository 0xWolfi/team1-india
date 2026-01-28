"use client";

import React, { useState, useEffect } from "react";
import { XCircle, Loader2, Tag, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { PERMISSION_SCOPES } from "../../shared";

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (email: string, permissions: Record<string, string>, tags: string[]) => void;
    isSubmitting: boolean;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onAdd, isSubmitting }) => {
    const [email, setEmail] = useState("");
    const [permissions, setPermissions] = useState<Record<string, string>>({ default: "READ" });
    const [tags, setTags] = useState<string[]>([]);
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
        onAdd(email, permissions, tags);
    };

    const addTag = (tag: string) => {
        if (tag && !tags.includes(tag)) {
            setTags(prev => [...prev, tag]);
        }
    };

    const removeTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    const togglePermission = (scopeKey: string, level: string) => {
         setPermissions(prev => {
             const next = { ...prev };
             if (level === 'NONE') {
                 delete next[scopeKey];
             } else {
                 next[scopeKey] = level;
             }
             return next;
         });
    };

    const bulkSetPermissions = (level: string) => {
        const next: Record<string, string> = { ...permissions };
        PERMISSION_SCOPES.forEach(scope => {
            if (level === 'NONE') delete next[scope.key];
            else next[scope.key] = level;
        });
        setPermissions(next);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h3 className="text-xl font-bold text-white">Deploy Agent</h3>
                        <p className="text-zinc-500 text-xs mt-1">Assign identity and define operational scope.</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Email Identity</label>
                                <div className="relative">
                                    <input 
                                        autoFocus
                                        type="email" 
                                        required
                                        placeholder="agent@team1.network"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:ring-1 transition-all placeholder:text-zinc-700 ${
                                            emailStatus === 'exists' 
                                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                                                : emailStatus === 'available'
                                                ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                                                : 'border-white/10 focus:border-white/20 focus:ring-white/20'
                                        }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {emailStatus === 'checking' && (
                                            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                                        )}
                                        {emailStatus === 'exists' && (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        {emailStatus === 'available' && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        )}
                                    </div>
                                </div>
                                {emailStatus === 'exists' && emailMessage && (
                                    <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {emailMessage}
                                    </p>
                                )}
                            </div>
                            
                            {/* Add Tags Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Designation Tags</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <Tag className="w-4 h-4 text-zinc-600" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Type tag and press Enter... (e.g. Lead, Analyst)" 
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
                                {/* Tag Chips */}
                                <div className="flex flex-wrap gap-2 pt-1 min-h-[30px]">
                                    {tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 border border-white/10 animate-in zoom-in-90">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-zinc-500 hover:text-white transition-colors">
                                                <XCircle className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {permissions['*'] === 'FULL_ACCESS' && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-900/50 text-zinc-600 border border-white/5 border-dashed">
                                            + Admin (Auto)
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg border border-purple-500/20 bg-purple-900/10">
                                    <div>
                                        <div className="font-bold text-xs text-purple-400">Superadmin</div>
                                        <div className="text-[10px] text-zinc-500">Full unrestricted access</div>
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={permissions['*'] === 'FULL_ACCESS'}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setPermissions({ '*': 'FULL_ACCESS' });
                                            } else {
                                                setPermissions({ default: 'READ' });
                                            }
                                        }}
                                        className="accent-purple-500 w-4 h-4 rounded"
                                    />
                                </div>

                                {/* Granular Toggles - only show if not superadmin */}
                                {permissions['*'] !== 'FULL_ACCESS' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mt-4 mb-2">
                                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Modular Access</label>
                                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                                <button type="button" onClick={() => bulkSetPermissions('READ')} className="px-3 py-1 text-[10px] text-zinc-400 hover:text-white transition-colors">All Read</button>
                                                <div className="w-px bg-white/10 my-1" />
                                                <button type="button" onClick={() => bulkSetPermissions('WRITE')} className="px-3 py-1 text-[10px] text-zinc-400 hover:text-white transition-colors">All Write</button>
                                                <div className="w-px bg-white/10 my-1" />
                                                <button type="button" onClick={() => bulkSetPermissions('NONE')} className="px-3 py-1 text-[10px] text-zinc-400 hover:text-white transition-colors">Reset</button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {PERMISSION_SCOPES.map(scope => {
                                                const Icon = scope.icon;
                                                const currentLevel = permissions[scope.key];
                                                
                                                return (
                                                    <div key={scope.key} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg border border-white/5 ${currentLevel ? 'bg-zinc-800' : 'bg-black/40'}`}>
                                                                <Icon className={`w-4 h-4 ${currentLevel ? 'text-zinc-200' : 'text-zinc-600'}`} />
                                                            </div>
                                                            <div>
                                                                <div className={`text-sm font-medium ${currentLevel ? 'text-zinc-200' : 'text-zinc-500'}`}>{scope.label}</div>
                                                                <div className="text-[10px] text-zinc-600 hidden sm:block">{scope.description}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Segmented Control */}
                                                        <div className="flex bg-black/40 rounded-lg border border-white/5 p-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePermission(scope.key, 'NONE')}
                                                                className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${!permissions[scope.key] ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                            >
                                                                None
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePermission(scope.key, 'READ')}
                                                                className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${permissions[scope.key] === 'READ' ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                            >
                                                                Read
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePermission(scope.key, 'WRITE')}
                                                                className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${permissions[scope.key] === 'WRITE' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                            >
                                                                Write
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    Abort
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting || emailStatus === 'exists' || emailStatus === 'checking'}
                                    className="flex-1 py-3 rounded-lg text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Agent"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
