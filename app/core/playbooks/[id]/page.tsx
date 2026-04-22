"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Check, Cpu, Download, Edit3, FileText, Globe, Lock, MoreVertical, RefreshCw, Shield, Trash2 } from "lucide-react";
// Dynamic import for canvas-confetti to avoid SSR issues
import confetti from "canvas-confetti";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";

// Dynamically import editor to avoid SSR issues
const Editor = dynamic(() => import("../../../../components/playbooks/Editor"), { ssr: false });
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import { Toast, ToastType } from "../../../../components/ui/Toast";
import { PlaybookShell } from "@/components/playbooks/PlaybookShell";

interface PlaybookDetail {
    id: string;
    title: string;
    body: any; // JSON string or object from Prisma
    updatedAt: string;
    lockedBy?: { id: string; email: string } | null;
    visibility: 'CORE' | 'MEMBER' | 'PUBLIC';
    coverImage?: string;
    description?: string;
    version: number;
}

// Helper to calculate read time from BlockNote blocks


export default function PlaybookPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    
    // State
    const [playbook, setPlaybook] = useState<PlaybookDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false); 
    const [isSaving, setIsSaving] = useState(false);
    const [isLockedByOther, setIsLockedByOther] = useState(false);
    const [lockOwner, setLockOwner] = useState<string | null>(null);
    
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '', type: 'info', visible: false
    });

    // ... (Permission Logic stays same)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPerms = (session?.user as any)?.permissions || {};
    const hasWriteAccess = userPerms['*'] === 'FULL_ACCESS' || 
                           userPerms['playbooks'] === 'FULL_ACCESS' || 
                           userPerms['playbooks'] === 'WRITE';

    const fetchPlaybook = useCallback(async () => {
        try {
            const res = await fetch(`/api/playbooks/${id}`);
            if (res.ok) {
                const data = await res.json();
                let bodyStr = JSON.stringify(data.body);
                if (typeof data.body === 'string') bodyStr = data.body;
                
                setPlaybook({ ...data, body: bodyStr });

                // ... (Lock logic)
                const lockedByOtherUser = data.lockedBy && data.lockedBy.email !== session?.user?.email;
                if (lockedByOtherUser) {
                    setIsLockedByOther(true);
                    setLockOwner(data.lockedBy.email);
                    setIsEditing(false); 
                } else {
                    setIsLockedByOther(false);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [id, session?.user?.email]);

    // ... (Initial Load & Auto Edit logic stays same)
    useEffect(() => {
        if (session?.user?.email) {
            fetchPlaybook();
        }
    }, [fetchPlaybook, session]);

    const searchParams = useSearchParams();
    const autoEditStr = searchParams?.get('autoEdit');

    const handleEnterEdit = useCallback(async () => {
        if (isLockedByOther) return; 
        try {
            const res = await fetch(`/api/playbooks/${id}/lock`, { method: 'POST' });
            if (res.ok) setIsEditing(true);
            else { console.warn("Lock failed"); fetchPlaybook(); }
        } catch (e) { console.error("Lock error", e); }
    }, [id, isLockedByOther, fetchPlaybook]);

    useEffect(() => {
        if (autoEditStr === 'true' && !isEditing && !isLoading && !isLockedByOther && playbook) {
             handleEnterEdit();
        }
    }, [autoEditStr, isEditing, isLoading, isLockedByOther, playbook, handleEnterEdit]);

    // State for Unsaved Changes
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const contentRef = React.useRef<string | null>(null);

    const handleEditorChange = useCallback((json: string) => {
        if (!isEditing) return;
        contentRef.current = json;
        if (!hasUnsavedChanges) setHasUnsavedChanges(true); // Dirty state
    }, [hasUnsavedChanges, isEditing]);

    // Manual Save Function - UPDATED with Confetti
    const handleManualSave = async (): Promise<boolean> => {
        if (!playbook || !contentRef.current) return false;
        
        setIsSaving(true);
        try {
            const res = await fetch(`/api/playbooks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    body: JSON.parse(contentRef.current),
                    title: playbook.title,
                    visibility: playbook.visibility,
                    coverImage: playbook.coverImage,
                    description: playbook.description
                })
            });

            if (!res.ok) throw new Error("Failed to save");
            
            const updatedPlaybook = await res.json();
            // Use functional update to ensure we don't clobber other pending state
            setPlaybook(prev => ({ ...updatedPlaybook, body: JSON.stringify(updatedPlaybook.body) }));
            setHasUnsavedChanges(false);
            
            // Celebration!
            if (typeof window !== 'undefined' && confetti) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#a855f7', '#ec4899', '#ffffff'] // Brand colors
                });
            }
            setToast({ message: "Saved successfully!", type: 'success', visible: true });
            return true;

        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save changes. Please try again.");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // ... (Exit Edit, Unload, Modal logic stays same)

    const handleExitEdit = async () => {
        if (hasUnsavedChanges) {
             const success = await handleManualSave();
             if (!success) return; // Don't exit if save failed
        }
        setIsEditing(false);
        try { await fetch(`/api/playbooks/${id}/unlock`, { method: 'POST' }); } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const [modalConfig, setModalConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void; isDestructive?: boolean; confirmText?: string;}>({
        isOpen: false, title: "", message: "", onConfirm: () => {},
    });

    const handleBackClick = (e: React.MouseEvent) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            setModalConfig({
                isOpen: true,
                title: "Unsaved Changes",
                message: "You have unsaved changes. Save before leaving?",
                confirmText: "Save & Leave",
                onConfirm: async () => { 
                    const success = await handleManualSave(); 
                    if (success) router.push('/core/playbooks'); 
                },
                isDestructive: false
            });
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setPlaybook(prev => prev ? { ...prev, title: newTitle } : null);
        if(!hasUnsavedChanges) setHasUnsavedChanges(true); 
    };

    const handleDelete = async () => {
        setModalConfig({
            isOpen: true,
            title: "Delete Playbook",
            message: "Permanently delete this playbook? Cannot be undone.",
            confirmText: "Delete",
            isDestructive: true,
            onConfirm: async () => {
                const res = await fetch(`/api/playbooks/${id}`, { method: 'DELETE' });
                if(res.ok) router.push('/core/playbooks');
                else alert("Failed to delete");
            }
        });
    };

    const handleVisibilityToggle = async () => {
        if (!playbook) return;
        if (!isEditing && !hasWriteAccess) return;

        const order: ('CORE' | 'MEMBER' | 'PUBLIC')[] = ['CORE', 'MEMBER', 'PUBLIC'];
        const currentIndex = order.indexOf(playbook.visibility);
        const newVis = order[(currentIndex + 1) % 3];
        
        if ((newVis === 'MEMBER' || newVis === 'PUBLIC') && !playbook.coverImage) {
            alert("A cover image is required for Member/Public visibility.");
            return;
        }

        // Optimistic update
        setPlaybook(prev => prev ? { ...prev, visibility: newVis } : null);

        if (isEditing) {
            if(!hasUnsavedChanges) setHasUnsavedChanges(true); 
        } else {
            // Direct save
            try {
                const res = await fetch(`/api/playbooks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        ...playbook, // Use current state including body
                        visibility: newVis 
                    })
                });

                if (res.ok) {
                    const updated = await res.json();
                    setPlaybook(prev => ({ ...updated, body: typeof updated.body === 'string' ? updated.body : JSON.stringify(updated.body) }));
                    setToast({ message: `Visibility changed to ${newVis}`, type: 'success', visible: true });
                } else {
                    throw new Error("Failed to save visibility");
                }
            } catch (e) {
                console.error(e);
                setPlaybook(prev => prev ? { ...prev, visibility: playbook.visibility } : null); // Revert
                alert("Failed to change visibility.");
            }
        }
    };

    useEffect(() => {
        const handleUnload = () => { if (isEditing) navigator.sendBeacon(`/api/playbooks/${id}/unlock`); };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [id, isEditing]);

    if (isLoading) return <div className="min-h-screen pt-24 text-center text-zinc-500">Loading protocol...</div>;
    if (!playbook) return <div className="min-h-screen pt-24 text-center text-zinc-500">Playbook not found.</div>;

    // derived for badge
    const statusText = isSaving ? "Saving..." : hasUnsavedChanges ? "Unsaved" : "Saved";
    const statusColor = isSaving ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : hasUnsavedChanges ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

    // Action Components (Extracted for reuse in Sticky Header)
    const ViewAction = playbook ? (
        <button
            onClick={handleVisibilityToggle}
            disabled={(!hasWriteAccess || isLockedByOther) && !isEditing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                playbook.visibility === 'PUBLIC' 
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' 
                : playbook.visibility === 'CORE'
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
                : 'bg-zinc-200 dark:bg-zinc-800 border-black/10 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            } ${((!hasWriteAccess || isLockedByOther) && !isEditing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {playbook.visibility === 'PUBLIC' && <Globe className="w-3.5 h-3.5"/>}
            {playbook.visibility === 'MEMBER' && <Shield className="w-3.5 h-3.5"/>}
            {playbook.visibility === 'CORE' && <Cpu className="w-3.5 h-3.5"/>}
            <span>{playbook.visibility === 'CORE' ? 'Core' : playbook.visibility === 'MEMBER' ? 'Members' : 'Public'}</span>
        </button>
    ) : null;

    const EditAction = isLockedByOther ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
              <Lock className="w-3 h-3"/>
              <span className="hidden sm:inline">Locked by {lockOwner}</span>
          </div>
      ) : isEditing ? (
          <>
             {hasUnsavedChanges && <span className="text-amber-500 text-xs font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 mr-2">Unsaved</span>}
             {isSaving && <span className="text-zinc-500 text-xs flex items-center gap-1 mr-2"><RefreshCw className="w-3 h-3 animate-spin"/> Saving...</span>}
             
             <button 
                 onClick={async () => {
                     if (hasUnsavedChanges) {
                         const success = await handleManualSave();
                         if (!success) return; 
                     }
                     setIsEditing(false);
                     try { await fetch(`/api/playbooks/${id}/unlock`, { method: 'POST' }); } catch (e) { console.error("Unlock error", e); }
                 }}
                 disabled={isSaving}
                 className="flex items-center gap-2 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
             >
                 <Check className="w-3.5 h-3.5"/>
                 Save
             </button>
          </>
      ) : (
          hasWriteAccess && (
              <button 
                 onClick={handleEnterEdit}
                 className="flex items-center gap-2 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-black/5 dark:border-white/5"
              >
                 <Edit3 className="w-3.5 h-3.5"/> <span className="hidden sm:inline">Edit</span>
              </button>
          )
      );

    const MenuAction = (
        <div className="relative group">
            <button className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-zinc-500 dark:text-zinc-400"/>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#18181b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-200 p-1">
                <button 
                    onClick={() => window.print()}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
                >
                    <Download className="w-3.5 h-3.5"/>
                    Export as PDF
                </button>
                <button
                    onClick={() => {
                        if(!playbook) return;
                        const blob = new Blob([playbook.body], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${playbook.title.replace(/\s+/g, '_')}.json`;
                        a.click();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
                >
                    <FileText className="w-3.5 h-3.5"/>
                    Export JSON
                </button>
                <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
                {hasWriteAccess && (
                    <button
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5"/>
                        Delete Playbook
                    </button>
                )}
            </div>
        </div>
    );


    return (
        <>
            <Toast
                message={toast.message} type={toast.type} isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />
             <PlaybookShell
                playbook={playbook}
                backLink="/core/playbooks"
                backLabel="Back to Core"
                isEditing={isEditing}
                onTitleChange={handleTitleChange}
                onDescriptionChange={(e) => { 
                    const val = e.target.value;
                    setPlaybook(prev => prev ? { ...prev, description: val } : null); 
                    setHasUnsavedChanges(true); 
                }}
                onCoverImageChange={(url) => { 
                    setPlaybook(prev => prev ? { ...prev, coverImage: url } : null); 
                    setHasUnsavedChanges(true); 
                }}
                headerActions={
                    <div className="flex items-center gap-3">
                     
                     {/* Status Badge */}
                     {isEditing && (
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor} transition-all`}>
                            {statusText}
                        </div>
                     )}

                     {ViewAction}

                     {/* Execute Button */}
                     {!isEditing && (
                     <button
                        onClick={async () => {
                            if (!playbook) return;
                            if (confirm(`Create a new task from "${playbook.title}"?`)) {
                                try {
                                    const res = await fetch('/api/operations', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ 
                                            title: `Execute: ${playbook.title}`,
                                            type: 'task',
                                            status: 'todo',
                                            timeEstimate: 60, // Default 1h
                                            links: [`/core/playbooks/${playbook.id}`]
                                        })
                                    });
                                    if (res.ok) {
                                      const task = await res.json();
                                      if (confirm("Task created! View it now?")) {
                                          router.push('/core/operations'); 
                                      }
                                    }
                                } catch (e) { console.error(e); }
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all text-xs font-semibold"
                        title="Create Task from Playbook"
                     >
                        <Check className="w-3.5 h-3.5"/>
                        Execute
                     </button>
                     )}

                     <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />

                     {EditAction}
                     {MenuAction}
                  </div>
                }
                stickyActions={
                    <div className="flex items-center gap-2">
                        {ViewAction}
                        <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
                        {EditAction}
                        {MenuAction}
                    </div>
                }
            >
                <Editor 
                     initialContent={playbook.body}
                     editable={isEditing} 
                     onChange={handleEditorChange}
                />
             </PlaybookShell>

             
             <ConfirmationModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                isDestructive={modalConfig.isDestructive}
             />
        </>
    );
}
