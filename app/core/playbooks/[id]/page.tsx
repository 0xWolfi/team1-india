"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Unlock, RefreshCw, Trash2, Edit3, Eye, Check, Globe, Shield, Cpu, MoreVertical, Download, FileText, Image as ImageIcon, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";

// Dynamically import editor to avoid SSR issues
const Editor = dynamic(() => import("../../../../components/playbooks/Editor"), { ssr: false });
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import { Toast, ToastType } from "../../../../components/ui/Toast";

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

export default function PlaybookPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    
    // State
    const [playbook, setPlaybook] = useState<PlaybookDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false); // Mode State
    const [isSaving, setIsSaving] = useState(false);
    const [isLockedByOther, setIsLockedByOther] = useState(false);
    const [lockOwner, setLockOwner] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false
    });



    // Permission Logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPerms = (session?.user as any)?.permissions || {};
    // Check if user has write access basics
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

                const lockedByOtherUser = data.lockedBy && data.lockedBy.email !== session?.user?.email;
                if (lockedByOtherUser) {
                    setIsLockedByOther(true);
                    setLockOwner(data.lockedBy.email);
                    // If locked by someone else, force view mode
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



    // Initial Load
    useEffect(() => {
        if (session?.user?.email) {
            fetchPlaybook();
        }
    }, [fetchPlaybook, session]);

    const searchParams = useSearchParams();
    const autoEditStr = searchParams?.get('autoEdit');

    // Handle Edit Mode Toggle
    const handleEnterEdit = useCallback(async () => {
        if (isLockedByOther) return; 
        
        // Try to acquire lock
        try {
            const res = await fetch(`/api/playbooks/${id}/lock`, { method: 'POST' });
            if (res.ok) {
                setIsEditing(true);
            } else {
                // Only alert if this was a manual user action, or maybe just log if auto
                // For now, simple logic
                console.warn("Could not acquire lock (maybe auto-edit failed?)");
                fetchPlaybook();
            }
        } catch (e) {
            console.error("Lock error", e);
        }
    }, [id, isLockedByOther, fetchPlaybook]);

    // Check for Auto-Edit query param
    useEffect(() => {
        if (autoEditStr === 'true' && !isEditing && !isLoading && !isLockedByOther && playbook) {
             // Clear the param so it doesn't re-trigger on refresh if possible (optional but good UX)
             // For now just trigger edit
             handleEnterEdit();
        }
    }, [autoEditStr, isEditing, isLoading, isLockedByOther, playbook, handleEnterEdit]);

    // State for Unsaved Changes
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const contentRef = React.useRef<string | null>(null);

    // Initial Load checks...

    // Handle Editor Change (Local only)
    const handleEditorChange = useCallback((json: string) => {
        if (!isEditing) return;
        contentRef.current = json;
        if (!hasUnsavedChanges) setHasUnsavedChanges(true);
    }, [hasUnsavedChanges, isEditing]);

    // Manual Save Function
    const handleManualSave = async () => {
        if (!playbook || !contentRef.current) return;
        
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
            
            // Update local state with response (e.g. new version number)
            const updatedPlaybook = await res.json();
            setPlaybook(updatedPlaybook);
            
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // ... (rest of logic) ...



    const handleExitEdit = async () => {
        // If unsaved changes, force save first or confirm?
        // User asked: "give pop of save when quiting without save"
        // But "Done" implies saving. So we will auto-save on Done.
        
        if (hasUnsavedChanges) {
            await handleManualSave();
        }

        setIsEditing(false);
        try {
            await fetch(`/api/playbooks/${id}/unlock`, { method: 'POST' });
        } catch (e) {
            console.error("Unlock error", e);
        }
    };

    // Warning on Navigation / Close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = ''; // Chrome requires returnValue to be set
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDestructive?: boolean;
        confirmText?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
    });

    const handleBackClick = (e: React.MouseEvent) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            setModalConfig({
                isOpen: true,
                title: "Unsaved Changes",
                message: "You have unsaved changes. Do you want to save them before leaving?",
                confirmText: "Save & Leave",
                onConfirm: async () => {
                   await handleManualSave();
                   router.push('/core/playbooks');
                },
                isDestructive: false
            });
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setPlaybook(prev => prev ? { ...prev, title: newTitle } : null);
        if(!hasUnsavedChanges) setHasUnsavedChanges(true); // Title change is also unsaved
    };

    const handleDelete = async () => {
        setModalConfig({
            isOpen: true,
            title: "Delete Playbook",
            message: "Are you sure you want to delete this playbook? This action cannot be undone.",
            confirmText: "Delete",
            isDestructive: true,
            onConfirm: async () => {
                const res = await fetch(`/api/playbooks/${id}`, { method: 'DELETE' });
                if(res.ok) router.push('/core/playbooks');
                else alert("Failed to delete");
            }
        });
    };

    // Unload safety for locks
    useEffect(() => {
        const handleUnload = () => {
            if (isEditing) {
                 // Try to unlock if possible, though beacon is best effort
                navigator.sendBeacon(`/api/playbooks/${id}/unlock`);
            }
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [id, isEditing]);

    if (isLoading) return <div className="min-h-screen pt-24 text-center text-zinc-500">Loading protocol...</div>;
    if (!playbook) return <div className="min-h-screen pt-24 text-center text-zinc-500">Playbook not found.</div>;

    return (
        <>
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />
            <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
             {/* Header */}
             <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur fixed top-0 w-full z-50">
                 <div className="flex items-center gap-4 flex-1">
                     <Link href="/core/playbooks" onClick={handleBackClick} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">
                         <ArrowLeft className="w-5 h-5" />
                     </Link>
                     <div className="h-6 w-px bg-white/10" />
                     
                     {isEditing ? (
                         <input 
                            value={playbook.title}
                            onChange={handleTitleChange}
                            className="bg-transparent text-lg font-bold focus:outline-none focus:bg-white/5 px-2 rounded -ml-2 w-full max-w-md truncate placeholder:text-zinc-600"
                            placeholder="Untitled Playbook"
                         />
                     ) : (
                         <h1 className="text-lg font-bold px-2 text-zinc-200 truncate max-w-md">{playbook.title}</h1>
                     )}
                     
                     {hasUnsavedChanges && <span className="text-amber-500 text-xs font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">Unsaved</span>}
                     {isSaving && <span className="text-zinc-500 text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Saving...</span>}
                 </div>
                 
                 <div className="flex items-center gap-2">
                     {/* Visibility Toggle */}
                     {playbook ? (
                        <button
                            onClick={() => {
                                if (!isEditing && !hasWriteAccess) return;
                                const order: ('CORE' | 'MEMBER' | 'PUBLIC')[] = ['CORE', 'MEMBER', 'PUBLIC'];
                                const currentIndex = order.indexOf(playbook.visibility);
                                const newVis = order[(currentIndex + 1) % 3];
                                
                                if ((newVis === 'MEMBER' || newVis === 'PUBLIC') && !playbook.coverImage) {
                                    alert("A cover image is required before making a playbook visible to Members or Public.");
                                    return;
                                }

                                const newPlaybookState = { ...playbook, visibility: newVis };
                                setPlaybook(newPlaybookState);
                                
                                // Logic: If editing, just update state (unsaved). If viewing, simple PUT.
                                if (isEditing) {
                                    if(!hasUnsavedChanges) setHasUnsavedChanges(true); 
                                } else {
                                    fetch(`/api/playbooks/${id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ title: playbook.title, body: JSON.parse(playbook.body), visibility: newVis })
                                    }).then(() => router.refresh());
                                }
                            }}
                            disabled={(!hasWriteAccess || isLockedByOther) && !isEditing}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                playbook.visibility === 'PUBLIC' 
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' 
                                : playbook.visibility === 'CORE'
                                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
                                : 'bg-zinc-800 border-white/10 text-zinc-400 hover:bg-zinc-700'
                            } ${((!hasWriteAccess || isLockedByOther) && !isEditing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {playbook.visibility === 'PUBLIC' && <Globe className="w-3.5 h-3.5" />}
                            {playbook.visibility === 'MEMBER' && <Shield className="w-3.5 h-3.5" />}
                            {playbook.visibility === 'CORE' && <Cpu className="w-3.5 h-3.5" />}
                            <span>{playbook.visibility === 'CORE' ? 'Core' : playbook.visibility === 'MEMBER' ? 'Members' : 'Public'}</span>
                        </button>
                     ) : null}

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
                        <Check className="w-3.5 h-3.5" />
                        Execute
                     </button>
                     )}

                     <div className="w-px h-4 bg-white/10 mx-1" />



                     {/* Edit / Done / Locked Status */}
                     {isLockedByOther ? (
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
                             <Lock className="w-3 h-3" />
                             Locked by {lockOwner}
                         </div>
                     ) : isEditing ? (
                         <>
                            <button 
                                onClick={async () => {
                                    // Save logic
                                    if (hasUnsavedChanges) {
                                        setIsSaving(true);
                                        try {
                                             await handleManualSave();
                                        } catch(e) { 
                                            // logic inside handleManualSave handles error alerts
                                            setIsSaving(false);
                                            return; 
                                        }
                                        setIsSaving(false);
                                    }
                                    
                                    // Exit logic
                                    setIsEditing(false);
                                    try {
                                        await fetch(`/api/playbooks/${id}/unlock`, { method: 'POST' });
                                    } catch (e) {
                                        console.error("Unlock error", e);
                                    }
                                }}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-white/10 text-zinc-200 text-xs font-bold rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Save
                            </button>
                         </>
                     ) : (
                         hasWriteAccess && (
                             <button 
                                onClick={handleEnterEdit}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-xs font-bold rounded-lg hover:bg-zinc-700 transition-colors border border-white/5"
                             >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                             </button>
                         )
                     )}

                     {/* Actions Menu */}
                     <div className="relative group">
                        <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-200 p-1">
                            <button 
                                onClick={() => window.print()}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                            >
                                <Download className="w-3.5 h-3.5" />
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
                                className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Export JSON
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            {hasWriteAccess && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Playbook
                                </button>
                            )}
                        </div>
                     </div>
                 </div>
             </div>



             {/* Content */}
             <div className="pt-24 px-4 md:px-0 max-w-4xl mx-auto pb-40">
                {/* Header Section in Main Content */}
                <div className="mb-8">
                    {isEditing ? (
                         <div className="flex-1 space-y-4">
                             {/* Cover Image Input */}
                             {playbook.coverImage ? (
                                 <div className="relative w-full h-48 rounded-xl overflow-hidden group border border-white/10">
                                     <img src={playbook.coverImage} className="w-full h-full object-cover" />
                                     <button 
                                         onClick={() => {
                                             setPlaybook({ ...playbook, coverImage: undefined });
                                             setHasUnsavedChanges(true);
                                         }}
                                         className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/50 rounded-full text-white transition-colors backdrop-blur-md opacity-0 group-hover:opacity-100"
                                     >
                                         <X className="w-4 h-4" />
                                     </button>
                                 </div>
                             ) : (
                                 <div className="w-full">
                                    <label className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-800 hover:border-zinc-600 transition-all w-fit">
                                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                                        <span className="text-sm text-zinc-400 font-medium">Add Cover Image</span>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                // Check file size before uploading (4MB limit to avoid 413 error)
                                                const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
                                                if (file.size > MAX_FILE_SIZE) {
                                                    setToast({
                                                        message: `File size exceeds 4MB limit. Please choose a smaller image.`,
                                                        type: 'error',
                                                        visible: true
                                                    });
                                                    // Reset input
                                                    e.target.value = '';
                                                    return;
                                                }

                                                // Check file type
                                                if (!file.type.startsWith('image/')) {
                                                    setToast({
                                                        message: 'Only image files are allowed.',
                                                        type: 'error',
                                                        visible: true
                                                    });
                                                    e.target.value = '';
                                                    return;
                                                }

                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', file);

                                                    const res = await fetch('/api/upload', {
                                                        method: 'POST',
                                                        body: formData
                                                    });

                                                    if (res.ok) {
                                                        const data = await res.json();
                                                        setPlaybook({ ...playbook, coverImage: data.url });
                                                        setHasUnsavedChanges(true);
                                                        setToast({
                                                            message: 'Cover image uploaded successfully!',
                                                            type: 'success',
                                                            visible: true
                                                        });
                                                    } else {
                                                        const errorText = await res.text();
                                                        setToast({
                                                            message: errorText || 'Upload failed. Please try again.',
                                                            type: 'error',
                                                            visible: true
                                                        });
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    setToast({
                                                        message: 'Upload failed. Please check your connection and try again.',
                                                        type: 'error',
                                                        visible: true
                                                    });
                                                }
                                            }}
                                        />
                                    </label>
                                 </div>
                             )}

                             <div className="space-y-2">
                                 <input 
                                     value={playbook.title}
                                     onChange={handleTitleChange}
                                     className="text-4xl font-bold bg-transparent text-white border-none focus:ring-0 placeholder:text-zinc-600 w-full px-0"
                                     placeholder="Untitled Playbook"
                                 />
                                 <textarea 
                                     value={playbook.description || ''}
                                     onChange={(e) => {
                                         setPlaybook({ ...playbook, description: e.target.value });
                                         setHasUnsavedChanges(true);
                                     }}
                                     className="text-lg bg-transparent text-zinc-400 border-none focus:ring-0 placeholder:text-zinc-700 w-full px-0 resize-none h-auto"
                                     placeholder="Add a brief description..."
                                     rows={1}
                                     onInput={(e) => {
                                         e.currentTarget.style.height = 'auto';
                                         e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                     }}
                                 />
                             </div>
                         </div>
                     ) : (
                         <div className="flex-1">
                             {playbook.coverImage && (
                                 <div className="w-full h-48 rounded-xl overflow-hidden mb-6 border border-white/5">
                                     <img src={playbook.coverImage} className="w-full h-full object-cover" />
                                 </div>
                             )}
                             <h1 className="text-4xl font-bold text-white mb-2">{playbook.title}</h1>
                             {playbook.description && <p className="text-lg text-zinc-400 mb-4">{playbook.description}</p>}

                         </div>
                     )}
                </div>

                <Editor 
                     initialContent={playbook.body}
                     editable={isEditing} 
                     onChange={handleEditorChange}
                />
             </div>

             
             <ConfirmationModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                isDestructive={modalConfig.isDestructive}
             />
        </div>
        </>
    );
}
