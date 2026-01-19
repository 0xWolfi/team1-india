"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, Plus, Star } from "lucide-react";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Member } from "../admin/shared"; 

// Reusing Admin components until specialized ones are needed
import { AdminToolbar } from "../admin/components/AdminToolbar";
import { AddCommunityMemberModal } from "./components/AddCommunityMemberModal";
import { DeleteCommunityMemberModal } from "./components/DeleteCommunityMemberModal";
import { ViewMemberModal, type CommunityMember } from "./components/ViewMemberModal";

// Simplified Table for Community
// We will create this inline for now or as simple component since columns differ
import { MoreVertical, XCircle, CheckCircle, Eye } from "lucide-react";

export default function CommunityMembersPage() {
    const { data: session } = useSession();
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingMember, setDeletingMember] = useState<CommunityMember | null>(null);
    const [viewingMember, setViewingMember] = useState<CommunityMember | null>(null);

    // Check if user is superadmin
    // @ts-ignore
    const userPermissions = (session?.user as any)?.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    const refreshMembers = () => {
        setIsLoading(true);
        fetch('/api/community-members')
            .then(res => res.json())
            .then(data => {
                setMembers(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch community members", err);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        refreshMembers();
    }, []);

    const filteredMembers = members.filter(m => {
        return m.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
               (m.tags && m.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const handleAddMember = async (data: { email: string, tags: string }) => {
        if (!data.email) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/community-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: data.email, 
                    tags: data.tags
                })
            });

            if (res.ok) {
                const newMember = await res.json();
                setMembers(prev => [newMember, ...prev]);
                setIsAddingMember(false);
            } else {
                const err = await res.text();
                alert("Error: " + err); // Simple error handling
            }
        } catch (error) {
            console.error("Add failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMember = async () => {
        if (!deletingMember) return;
        
        setIsSubmitting(true);
        try {
             // Mocking member object to fit the modal props if needed or just calling API
             const res = await fetch(`/api/community-members?id=${deletingMember.id}`, { method: 'DELETE' });
             if(res.ok) {
                 setMembers(prev => prev.filter(m => m.id !== deletingMember.id));
                 setDeletingMember(null);
                 setViewingMember(null); // Close view modal if open
             }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/community-members/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: newRole })
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }

            // Update local state
            setMembers(prev => prev.map(m => 
                m.id === memberId ? { ...m, tags: newRole } : m
            ));
        } catch (error) {
            console.error("Failed to change role:", error);
            throw error;
        }
    };

    return (
        <>
             <CorePageHeader
                title="Community Members"
                description="Manage the broader community roster. (CommunityMember Table)"
                icon={<Users className="w-5 h-5 text-emerald-400" />}
             >
                <button 
                    onClick={() => setIsAddingMember(true)}
                    className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 flex items-center gap-2 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add Member
                </button>
             </CorePageHeader>

             <AdminToolbar 
                searchTerm={searchTerm} 
                onSearchChange={setSearchTerm} 
                onRefresh={refreshMembers} 
                isLoading={isLoading} 
             />

             {/* Table */}
             <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl relative z-30 overflow-visible">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] text-zinc-500 font-medium uppercase text-[10px] tracking-wider border-b border-white/5 rounded-t-xl">
                        <tr>
                            <th className="p-4 pl-6 font-semibold rounded-tl-xl w-[20%]">Name</th>
                            <th className="p-4 font-semibold w-[10%]">Role</th>
                            <th className="p-4 font-semibold w-[20%]">Email</th>
                            <th className="p-4 font-semibold w-[10%]">X</th>
                            <th className="p-4 font-semibold w-[10%]">Telegram</th>
                            <th className="p-4 font-semibold w-[15%]">Tags</th>
                            <th className="p-4 text-right pr-6 font-semibold rounded-tr-xl w-[15%]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {members.length === 0 && !isLoading && (
                            <tr><td colSpan={7} className="p-12 text-center text-zinc-600">No community members found.</td></tr>
                        )}
                        {members.map(member => (
                            <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                            {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="font-medium text-zinc-200 text-sm">{member.name || "Unknown"}</div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-zinc-900/50 text-zinc-400 border border-white/5 uppercase">
                                        {member.tags || 'member'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="text-[11px] text-zinc-500">{member.email}</div>
                                </td>
                                <td className="p-4">
                                    {member.xHandle ? (
                                        <span className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer">@{member.xHandle.replace('@','')}</span>
                                    ) : (
                                        <span className="text-zinc-700">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                     {member.telegram ? (
                                        <span className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer">@{member.telegram.replace('@','')}</span>
                                    ) : (
                                        <span className="text-zinc-700">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-1">
                                         {/* Future tags placeholder */}
                                         <span className="text-zinc-700 text-xs">-</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        {isSuperAdmin && (
                                            <button 
                                                onClick={() => setViewingMember(member)}
                                                className="p-1.5 rounded-md hover:bg-white/10 text-zinc-600 hover:text-white transition-colors"
                                                title="View Member Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setDeletingMember(member)}
                                            className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                                            title="Remove Member"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             <AddCommunityMemberModal 
                isOpen={isAddingMember}
                onClose={() => setIsAddingMember(false)}
                onAdd={handleAddMember}
                isSubmitting={isSubmitting}
             />
             
             {deletingMember && (
                <DeleteCommunityMemberModal 
                    member={deletingMember} 
                    onClose={() => setDeletingMember(null)}
                    onConfirm={handleDeleteMember}
                    isSubmitting={isSubmitting}
                />
             )}

             {viewingMember && isSuperAdmin && (
                <ViewMemberModal
                    member={viewingMember}
                    onClose={() => setViewingMember(null)}
                    onDelete={(member) => {
                        setViewingMember(null);
                        setDeletingMember(member);
                    }}
                    onRoleChange={handleRoleChange}
                    isSubmitting={isSubmitting}
                />
             )}
        </>
    );
}
