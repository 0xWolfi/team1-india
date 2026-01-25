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
// Simplified Table for Community
// We will create this inline for now or as simple component since columns differ
import { MoreVertical, XCircle, CheckCircle, Eye, Globe, User } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Tab = 'members' | 'public';

export default function CommunityMembersPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const initialTab = (searchParams.get('tab') as Tab) || 'members';
    const initialSearch = searchParams.get('search') || '';
    const initialPage = parseInt(searchParams.get('page') || '1');

    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [members, setMembers] = useState<any[]>([]); // Using any to support both types for now
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    
    const [page, setPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const targetPageRef = React.useRef(initialPage);

    // Sync URL with state
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (activeTab !== 'members') params.set('tab', activeTab);
        else params.delete('tab');
        
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');

        params.set('page', page.toString());
        
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [activeTab, searchTerm, page, router, pathname]);
    
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingMember, setDeletingMember] = useState<CommunityMember | null>(null);
    const [viewingMember, setViewingMember] = useState<any | null>(null);

    // Check if user is superadmin
    // @ts-ignore
    const userPermissions = (session?.user as any)?.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';
    
    // Simple cache: Key -> Data
    const dataCache = React.useRef<Map<string, any>>(new Map());

    const getCacheKey = (tab: Tab, p: number, search: string) => `${tab}-${p}-${search}`;

    const fetchData = async (tab: Tab, p: number, search: string): Promise<{ data: any[], pagination: any } | null> => {
        const endpoint = tab === 'members' 
            ? `/api/community-members?page=${p}&limit=25&search=${encodeURIComponent(search)}`
            : `/api/admin/public-users?page=${p}&limit=25&search=${encodeURIComponent(search)}`;
        
        try {
            const res = await fetch(endpoint);
            const data = await res.json();
            
            // Normalize data structure
            let normalizedData: any[] = [];
            let normalizedPagination = { totalPages: 1, page: p };

            if (Array.isArray(data)) {
                normalizedData = data;
            } else {
                normalizedData = data.data;
                normalizedPagination = data.pagination;
            }

            return { data: normalizedData, pagination: normalizedPagination };
        } catch (err) {
            console.error("Fetch error", err);
            return null;
        }
    };

    const refreshMembers = async (targetPage = page) => {
        const key = getCacheKey(activeTab, targetPage, searchTerm);
        
        // 1. Check Cache
        if (dataCache.current.has(key)) {
            const cached = dataCache.current.get(key);
            setMembers(cached.data);
            setTotalPages(cached.pagination.totalPages);
            setPage(cached.pagination.page); // Ensure page state is synced
            setIsLoading(false);
            
            // Trigger prefetch for next page if allowed
            if (cached.pagination.page < cached.pagination.totalPages) {
                prefetchPage(activeTab, cached.pagination.page + 1, searchTerm);
            }
            return;
        }

        // 2. Fetch if not in cache
        setIsLoading(true);
        const result = await fetchData(activeTab, targetPage, searchTerm);
        
        if (result) {
            // Cache result
            dataCache.current.set(key, result);
            
            setMembers(result.data);
            setTotalPages(result.pagination.totalPages);
            setPage(result.pagination.page);

            // 3. Prefetch next page
            if (result.pagination.page < result.pagination.totalPages) {
                prefetchPage(activeTab, result.pagination.page + 1, searchTerm);
            }
        }
        setIsLoading(false);
    };

    const prefetchPage = async (tab: Tab, p: number, search: string) => {
        const key = getCacheKey(tab, p, search);
        if (dataCache.current.has(key)) return; // Already cached

        // console.log("Prefetching page", p);
        const result = await fetchData(tab, p, search);
        if (result) {
            dataCache.current.set(key, result);
        }
    };

    // Unified Effect for data fetching
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page !== targetPageRef.current) {
                targetPageRef.current = page;
                refreshMembers(page);
            } else {
                 refreshMembers(page);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, activeTab, page]);


    // Construct manual refresh
    const handleManualRefresh = () => refreshMembers(page);



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

    const handleTabChange = (tab: Tab) => {
        if (tab === activeTab) return;
        setMembers([]); // Clear stale data
        setIsLoading(true); // Show loader immediately
        setActiveTab(tab);
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
                onRefresh={handleManualRefresh} 
                isLoading={isLoading} 
             >
                <div className="flex bg-black/40 backdrop-blur-md border border-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => handleTabChange('members')}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                            activeTab === 'members' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        <Users className="w-3.5 h-3.5" /> Members
                    </button>
                    <button
                        onClick={() => handleTabChange('public')}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                            activeTab === 'public' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        <Globe className="w-3.5 h-3.5" /> Public
                    </button>
                </div>
             </AdminToolbar>

             {/* Table */}
             <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl relative z-30 overflow-visible min-h-[300px]">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl transition-all duration-300">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <div className="text-xs text-white font-medium animate-pulse">Loading...</div>
                        </div>
                    </div>
                )}
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] text-zinc-500 font-medium uppercase text-[10px] tracking-wider border-b border-white/5 rounded-t-xl">
                        <tr>
                            <th className="p-4 pl-6 font-semibold rounded-tl-xl w-[20%]">Name</th>
                            {activeTab === 'members' ? (
                                <>
                                    <th className="p-4 font-semibold w-[10%]">Role</th>
                                    <th className="p-4 font-semibold w-[20%]">Email</th>
                                    <th className="p-4 font-semibold w-[10%]">X</th>
                                    <th className="p-4 font-semibold w-[10%]">Telegram</th>
                                    <th className="p-4 font-semibold w-[15%]">Tags</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-4 font-semibold w-[20%]">Email</th>
                                    <th className="p-4 font-semibold w-[15%]">Location</th>
                                    <th className="p-4 font-semibold w-[10%]">Consent</th>
                                    <th className="p-4 font-semibold w-[20%]">Interests</th>
                                </>
                            )}
                            <th className="p-4 text-right pr-6 font-semibold rounded-tr-xl w-[15%]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {members.length === 0 && !isLoading && (
                            <tr><td colSpan={7} className="p-12 text-center text-zinc-600">No records found.</td></tr>
                        )}
                        {members.map(member => (
                            <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                            {member.name ? member.name.charAt(0).toUpperCase() : (member.fullName ? member.fullName.charAt(0).toUpperCase() : member.email?.charAt(0).toUpperCase())}
                                        </div>
                                        <div className="font-medium text-zinc-200 text-sm">{member.name || member.fullName || "Unknown"}</div>
                                    </div>
                                </td>
                                
                                {activeTab === 'members' ? (
                                    <>
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
                                                <span className="text-zinc-700 text-xs">-</span>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4">
                                            <div className="text-[11px] text-zinc-500">{member.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-[11px] text-zinc-400">{member.location || '-'}</div>
                                        </td>
                                        <td className="p-4">
                                             {member.consentLegal ? (
                                                <CheckCircle className="w-4 h-4 text-emerald-500/50" />
                                             ) : (
                                                <XCircle className="w-4 h-4 text-zinc-800" />
                                             )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {member.interests && Array.isArray(member.interests) && member.interests.slice(0, 2).map((i: string) => (
                                                     <span key={i} className="text-[10px] bg-zinc-800 px-1 rounded text-zinc-400">{i}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </>
                                )}

                                <td className="p-4 text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        {isSuperAdmin && (
                                            <button 
                                                onClick={() => setViewingMember(member)} // Might need update for PublicUser
                                                className="p-1.5 rounded-md hover:bg-white/10 text-zinc-600 hover:text-white transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            // onClick={() => setDeletingMember(member)} // Disable delete for public for now or implement
                                            className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                                            title="Delete (Disabled for demo)"
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
             
             {/* Pagination Controls */}
             <div className="flex items-center justify-between mt-4 px-2">
                 <div className="text-xs text-zinc-500">
                     Page {page} of {totalPages}
                 </div>
                 <div className="flex gap-2">
                     <button
                         disabled={page <= 1 || isLoading}
                         onClick={() => refreshMembers(page - 1)}
                         className="px-3 py-1 rounded bg-zinc-900 border border-white/10 text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                     >
                         Previous
                     </button>
                     <button
                         disabled={page >= totalPages || isLoading}
                         onClick={() => refreshMembers(page + 1)}
                         className="px-3 py-1 rounded bg-zinc-900 border border-white/10 text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                     >
                         Next
                     </button>
                 </div>
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
