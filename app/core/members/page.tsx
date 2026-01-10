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

// Simplified Table for Community
// We will create this inline for now or as simple component since columns differ
import { MoreVertical, XCircle, CheckCircle } from "lucide-react";

interface CommunityMember {
    id: string;
    email: string;
    name?: string;
    tags: string; // single string in schema "member" but API returns string?
    status: string;
    xHandle?: string;
    telegram?: string;
}

export default function CommunityMembersPage() {
    const { data: session } = useSession();
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingMember, setDeletingMember] = useState<CommunityMember | null>(null);

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

    const handleAddMember = async (data: { email: string, name: string, telegram: string, xHandle: string, tags: string[] }) => {
        if (!data.email) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/community-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: data.email, 
                    name: data.name,
                    telegram: data.telegram,
                    xHandle: data.xHandle,
                    tags: data.tags.join(', ') // Schema expects string? API logic might need array handling or comma join
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
             }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="md:pt-4">
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
                            <th className="p-4 pl-6 font-semibold rounded-tl-xl w-[35%]">Member</th>
                            <th className="p-4 font-semibold w-[20%]">Contact</th>
                            <th className="p-4 font-semibold w-[15%]">Tags</th>
                            <th className="p-4 font-semibold w-[15%]">Status</th>
                            <th className="p-4 text-right pr-6 font-semibold rounded-tr-xl w-[15%]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {members.length === 0 && !isLoading && (
                            <tr><td colSpan={4} className="p-12 text-center text-zinc-600">No community members found.</td></tr>
                        )}
                        {members.map(member => (
                            <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                            {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-zinc-200 text-sm">{member.name || "Unknown"}</div>
                                            <div className="text-[11px] text-zinc-500">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        {member.telegram && <span className="text-[10px] text-blue-400">tg: {member.telegram}</span>}
                                        {member.xHandle && <span className="text-[10px] text-zinc-500">x: {member.xHandle}</span>}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-zinc-900/50 text-zinc-400 border border-white/5">
                                        {member.tags || 'member'}
                                    </span>
                                </td>
                                <td className="p-4">
                                     <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                        Active
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <button 
                                        onClick={() => setDeletingMember(member)}
                                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                                        title="Remove Member"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
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
        </div>
    );
}
