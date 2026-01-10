"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Member } from "./shared";
import { AdminToolbar } from "./components/AdminToolbar";
import { Users, Plus, ShieldAlert } from "lucide-react";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { AdminTable } from "./components/AdminTable";
import { AddMemberModal } from "./components/modals/AddMemberModal";
import { EditAccessModal } from "./components/modals/EditAccessModal";
import { DeleteMemberModal } from "./components/modals/DeleteMemberModal";

export default function TeamPage() {
    const { data: session, status } = useSession();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // UI State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [deletingMember, setDeletingMember] = useState<Member | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const refreshMembers = () => {
        setIsLoading(true);
        fetch('/api/members')
            .then(res => res.json())
            .then(data => {
                setMembers(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch members", err);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        refreshMembers();
    }, []);

    // Filter logic
    const filteredMembers = members.filter(m => {
        const matchesSearch = m.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              m.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    // Check permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPerms = (session?.user as any)?.permissions || {};
    const hasFullAccess = userPerms['*'] === 'FULL_ACCESS';
    
    const canManageUsers = hasFullAccess || userPerms['members'] === 'WRITE' || userPerms['members'] === 'FULL_ACCESS' || userPerms['users'] === 'WRITE';
    const canGrantAccess = hasFullAccess || userPerms['permissions'] === 'FULL_ACCESS';
    const canAddMembers = hasFullAccess;

    const handleSaveAccess = async () => {
        if (!editingMember) return;
        setIsSubmitting(true);
        try {
            // Update Permissions
            const permRes = await fetch(`/api/members/${editingMember.id}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions: editingMember.permissions })
            });

            // Update Tags
            const tagRes = await fetch(`/api/members/${editingMember.id}/tags`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: editingMember.tags })
            });

            if (permRes.ok && tagRes.ok) {
                setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, permissions: editingMember.permissions, tags: editingMember.tags } : m));
                setEditingMember(null);
            }
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
         try {
            await fetch(`/api/members/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            setMembers(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
            setActiveMenuId(null);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleDeleteMember = async () => {
        if (!deletingMember) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/members?id=${deletingMember.id}`, {
                method: 'DELETE',
            });
            
            if (res.ok) {
                setMembers(prev => prev.filter(m => m.id !== deletingMember.id));
                setDeletingMember(null);
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddMember = async (email: string, permissions: Record<string, string>, tags: string[]) => {
        if (!email) return;

        setIsSubmitting(true);
        
        // Logic for auto-admin tag moved here from usage
        let finalTags = tags;
        if (permissions['*'] === 'FULL_ACCESS') {
             const hasAdmin = tags.includes('Admin');
             if (!hasAdmin) finalTags = [...tags, 'Admin'];
        }

        // Just in case AddMemberModal didn't ensure tags, but it likely did.
        // We'll trust the Modal passed valid data, but we can do a quick check if desired.

        try {
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    permissions,
                    tags: finalTags 
                })
            });

            if (res.ok) {
                const newMember = await res.json();
                setMembers(prev => [newMember, ...prev]);
                setIsAddingMember(false);
            } 
        } catch (error) {
            console.error("Add failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading") return <div className="min-h-screen pt-24 px-12 text-zinc-500 font-mono text-sm animate-pulse">Initializing Interface...</div>;

    return (
        <div className="md:pt-4">
             {/* Click Outside Handler for Menus */}
             {activeMenuId && (
                <div className="fixed inset-0 z-20 cursor-default" onClick={() => setActiveMenuId(null)} />
             )}

             <CorePageHeader
                title="Core Team Management"
                description="Manage admins and page access permissions. (Member Table)"
                icon={<ShieldAlert className="w-5 h-5 text-indigo-400" />}
             >
                {canAddMembers && (
                    <button 
                        onClick={() => setIsAddingMember(true)}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Add Admin
                    </button>
                )}
             </CorePageHeader>

             <AdminToolbar 
                searchTerm={searchTerm} 
                onSearchChange={setSearchTerm} 
                onRefresh={refreshMembers} 
                isLoading={isLoading} 
             />

             <AdminTable 
                members={filteredMembers}
                isLoading={isLoading}
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
                currentUserEmail={session?.user?.email}
                canManageUsers={canManageUsers}
                canGrantAccess={canGrantAccess}
                onEditAccess={setEditingMember}
                onDelete={setDeletingMember}
                onApprove={(id) => handleStatusChange(id, 'approved')}
             />

             <AddMemberModal 
                isOpen={isAddingMember}
                onClose={() => setIsAddingMember(false)}
                onAdd={handleAddMember}
                isSubmitting={isSubmitting}
             />

             <EditAccessModal 
                member={editingMember}
                onChange={setEditingMember}
                onClose={() => setEditingMember(null)}
                onSave={handleSaveAccess}
                isSubmitting={isSubmitting}
             />

             <DeleteMemberModal 
                member={deletingMember}
                onClose={() => setDeletingMember(null)}
                onConfirm={handleDeleteMember}
                isSubmitting={isSubmitting}
             />
        </div>
    );
}
