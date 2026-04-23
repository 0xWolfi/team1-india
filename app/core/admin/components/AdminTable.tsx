"use client";

import React from "react";
import { CheckCircle, MoreVertical, Settings, XCircle } from "lucide-react";
import { Member } from "../shared";

interface AdminTableProps {
    members: Member[];
    isLoading: boolean;
    activeMenuId: string | null;
    setActiveMenuId: (id: string | null) => void;
    currentUserEmail?: string | null;
    canManageUsers: boolean;
    canGrantAccess: boolean;
    onEditAccess: (member: Member) => void;
    onDelete: (member: Member) => void;
    onApprove: (id: string) => void;
}

export const AdminTable: React.FC<AdminTableProps> = ({ 
    members, 
    isLoading, 
    activeMenuId, 
    setActiveMenuId, 
    currentUserEmail,
    canManageUsers,
    canGrantAccess,
    onEditAccess,
    onDelete,
    onApprove
}) => {
    return (
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-2xl relative z-30 overflow-visible">
            <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-zinc-500 font-medium uppercase text-[10px] tracking-wider border-b border-black/5 dark:border-white/5 rounded-t-xl">
                    <tr>
                        <th className="p-4 pl-6 font-semibold rounded-tl-xl w-[35%]">Identity</th>
                        <th className="p-4 font-semibold w-[35%]">Designations</th>
                        <th className="p-4 font-semibold w-[15%]">Status</th>
                        <th className="p-4 text-right pr-6 font-semibold rounded-tr-xl w-[15%]"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {members.length === 0 && !isLoading && (
                        <tr><td colSpan={4} className="p-12 text-center text-zinc-400 dark:text-zinc-600">No operatives found in registry.</td></tr>
                    )}
                    
                    {members.map(member => {
                        const isSelf = currentUserEmail === member.email;
                        
                        return (
                        <tr key={member.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group relative">
                            <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 dark:from-zinc-800 to-white dark:to-black border border-black/10 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:border-black/20 dark:group-hover:border-white/20 transition-colors">
                                        {member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2 text-sm">
                                            {member.email}
                                            {isSelf && <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] bg-black/10 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/5 font-mono">YOU</span>}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">ID: {member.id.substring(0,8)}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {member.tags.length > 0 ? (
                                        <>
                                            {member.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border border-black/5 dark:border-white/5">
                                                    {tag}
                                                </span>
                                            ))}
                                            {member.tags.length > 2 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-black/5 dark:border-white/5">
                                                    +{member.tags.length - 2}
                                                </span>
                                            )}
                                        </>
                                    ) : <span className="text-zinc-400 dark:text-zinc-700 text-[10px] italic">Unassigned</span>}
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                                    member.status === 'active' ? 'text-emerald-500' :
                                    member.status === 'applied' ? 'text-amber-500' :
                                    member.status === 'removed' ? 'text-red-500' :
                                    'text-zinc-500'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        member.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                        member.status === 'applied' ? 'bg-amber-500' :
                                        member.status === 'removed' ? 'bg-red-500' :
                                        'bg-zinc-500'
                                    }`} />
                                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                </span>
                            </td>
                            <td className="p-4 text-right pr-6 relative">
                                {(canManageUsers || canGrantAccess) && (
                                    <>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === member.id ? null : member.id);
                                            }}
                                            className={`p-1.5 rounded-md transition-all ${activeMenuId === member.id ? 'bg-white text-black dark:bg-white dark:text-black' : 'hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 hover:text-black dark:hover:text-white'}`}
                                        >
                                            <MoreVertical className="w-4 h-4"/>
                                        </button>
                                        
                                        {activeMenuId === member.id && (
                                            <div onClick={(e) => e.stopPropagation()} className="absolute right-10 top-6 w-56 bg-white dark:bg-[#09090b] border border-black/10 dark:border-white/10 rounded-xl shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.6)] z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/5">
                                                
                                                {canGrantAccess && (
                                                    <button 
                                                        onClick={() => {
                                                            onEditAccess(member);
                                                            setActiveMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white flex items-center gap-2 transition-colors group/btn"
                                                    >
                                                        <Settings className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-black dark:group-hover/btn:text-white"/> Access
                                                    </button>
                                                )}
                                                
                                                <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
                                                
                                                {member.status === 'applied' ? (
                                                    <button 
                                                        onClick={() => onApprove(member.id)}
                                                        className="w-full text-left px-4 py-2 text-xs hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-colors"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5"/> Approve
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            onDelete(member);
                                                            setActiveMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-xs hover:bg-red-500/10 text-red-400 hover:text-red-300 flex items-center gap-2 transition-colors"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5"/> Remove
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </td>
                        </tr>
                        )})
                    }
                </tbody>
            </table>
        </div>
    );
};
