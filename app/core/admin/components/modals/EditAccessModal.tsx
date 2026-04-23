"use client";

import React from "react";
import { Loader2, Shield, Tag, XCircle } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Member, PERMISSION_SCOPES } from "../../shared";

interface EditAccessModalProps {
    member: Member | null;
    onChange: (member: Member) => void;
    onClose: () => void;
    onSave: () => void;
    isSubmitting: boolean;
}

export const EditAccessModal: React.FC<EditAccessModalProps> = ({ member, onChange, onClose, onSave, isSubmitting }) => {
    if (!member) return null;

    const addTag = (tag: string) => {
        if (tag && !member.tags.includes(tag)) {
            onChange({
                ...member,
                tags: [...member.tags, tag]
            });
        }
    };

    const removeTag = (tag: string) => {
        onChange({
            ...member,
            tags: member.tags.filter(t => t !== tag)
        });
    };

    const bulkSetPermissions = (level: string) => {
        const next: Record<string, string> = { ...member.permissions };
        PERMISSION_SCOPES.forEach(scope => {
            if (level === 'NONE') delete next[scope.key];
            else next[scope.key] = level;
        });
        onChange({ ...member, permissions: next });
    };

    return (
        <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#09090b] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-black/10 dark:ring-white/10" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-black/10 dark:border-white/10 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02] flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-black dark:text-white">Access Settings</h3>
                        <p className="text-zinc-500 text-xs mt-1 font-mono">{member.email}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-black dark:hover:text-white p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <XCircle className="w-5 h-5"/>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {/* TAGS SECTION */}
                    <div className="mb-8 p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-3 block">Designation Tags</label>
                        <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                                {(member.tags || []).map(tag => (
                                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-black/10 dark:border-white/10">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="ml-1.5 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"><XCircle className="w-3 h-3"/></button>
                                    </span>
                                ))}
                                {(!member.tags || member.tags.length === 0) && <span className="text-zinc-400 dark:text-zinc-600 text-xs italic py-1">No tags assigned</span>}
                        </div>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Tag className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-zinc-500 dark:group-focus-within:text-zinc-400 transition-colors"/></div>
                            <input
                                type="text"
                                placeholder="Add tag..."
                                className="w-full bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag(e.currentTarget.value.trim());
                                        e.currentTarget.value = "";
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* PERMISSIONS SECTION */}
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-3 block">Protocols & Permissions</label>
                    
                    {/* Master Switch */}
                    <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-5 flex items-center justify-between group hover:border-purple-500/40 transition-colors mb-6">
                        <div>
                            <div className="font-bold text-purple-400 flex items-center gap-2">
                                <Shield className="w-4 h-4"/> Superadmin
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px] leading-snug">Grants full unrestricted access.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={(member.permissions || {})['*'] === 'FULL_ACCESS'}
                                onChange={(e) => {
                                    const newPerms = { ...(member.permissions || {}) };
                                    if (e.target.checked) {
                                        newPerms['*'] = 'FULL_ACCESS';
                                    } else {
                                        delete newPerms['*'];
                                        newPerms['default'] = 'READ';
                                    }
                                    onChange({ ...member, permissions: newPerms });
                                }}
                            />
                            <div className="w-12 h-6 bg-zinc-900 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-900/50 peer-checked:border-purple-500/50 peer-checked:after:bg-purple-400"></div>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between mt-6 mb-3">
                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Modular Access Breakdown</label>
                            <div className="flex bg-white/40 dark:bg-black/40 rounded-lg p-1 border border-black/5 dark:border-white/5">
                                <button onClick={() => bulkSetPermissions('READ')} className="px-3 py-1 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">All Read</button>
                                <div className="w-px bg-black/10 dark:bg-white/10 my-1" />
                                <button onClick={() => bulkSetPermissions('WRITE')} className="px-3 py-1 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">All Write</button>
                                <div className="w-px bg-black/10 dark:bg-white/10 my-1" />
                                <button onClick={() => bulkSetPermissions('NONE')} className="px-3 py-1 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Reset</button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {PERMISSION_SCOPES.map(scope => {
                                const isFull = (member.permissions || {})['*'] === 'FULL_ACCESS';
                                const permissions = member.permissions || {};
                                const currentLevel = permissions[scope.key];
                                
                                return (
                                    <div key={scope.key} className={`flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] ${isFull ? 'opacity-30 pointer-events-none grayscale' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors'} group transition-colors`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg border border-black/5 dark:border-white/5 transition-colors ${currentLevel ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-white/40 dark:bg-black/40'}`}>
                                                <DynamicIcon name={scope.iconName} className={`w-4 h-4 ${currentLevel ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600'}`}/>
                                            </div>
                                            <div>
                                                <div className={`text-sm font-medium transition-colors ${currentLevel ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-500'}`}>{scope.label}</div>
                                                <div className="text-[10px] text-zinc-400 dark:text-zinc-600 hidden sm:block">{scope.description}</div>
                                            </div>
                                        </div>
                                        
                                        {/* Segmented Control */}
                                        <div className="flex bg-white/40 dark:bg-black/40 rounded-lg border border-black/5 dark:border-white/5 p-1">
                                            <button
                                                onClick={() => {
                                                    const np = { ...permissions };
                                                    delete np[scope.key]; // Default/None
                                                    onChange({ ...member, permissions: np });
                                                }}
                                                className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${!currentLevel ? 'bg-zinc-300 dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                            >
                                                None
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const np = { ...permissions };
                                                    np[scope.key] = 'READ';
                                                    onChange({ ...member, permissions: np });
                                                }}
                                                className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${currentLevel === 'READ' ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20' : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                            >
                                                Read
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const np = { ...permissions };
                                                    np[scope.key] = 'WRITE';
                                                    onChange({ ...member, permissions: np });
                                                }}
                                                className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${currentLevel === 'WRITE' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20' : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                            >
                                                Write
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onSave}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black dark:bg-white dark:text-black hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-lg shadow-black/10 dark:shadow-white/10 flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};
