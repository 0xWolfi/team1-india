'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem, Comment } from './modal/types';
import { MediaModalHeader } from './modal/MediaModalHeader';
import { MediaModalDetails } from './modal/MediaModalDetails';
import { MediaModalActivity } from './modal/MediaModalActivity';

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData?: MediaItem | null;
}

export default function MediaModal({ isOpen, onClose, onSave, initialData }: MediaModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const [comments, setComments] = useState<Comment[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    const [formData, setFormData] = useState<MediaItem>({
        title: '',
        description: '',
        platform: ['Twitter'], 
        links: ['']
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                ...initialData,
                platform: Array.isArray(initialData.platform) ? initialData.platform : (initialData.platform ? [initialData.platform] : []),
                links: initialData.links && initialData.links.length > 0 ? initialData.links : ['']
            });

            if (initialData.id) {
                setIsFetchingDetails(true);
                fetch(`/api/media/${initialData.id}`)
                    .then(res => res.json())
                    .then(data => {
                        setComments(data.comments || []);
                        setAuditLogs(data.auditLogs || []);
                    })
                    .catch(console.error)
                    .finally(() => setIsFetchingDetails(false));
            }
            setActiveTab('details');
        } else {
            setFormData({
                title: '',
                description: '',
                platform: ['Twitter'],
                links: ['']
            });
            setComments([]);
            setAuditLogs([]);
            setActiveTab('details');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = initialData?.id ? `/api/media/${initialData.id}` : '/api/media';
            const method = initialData?.id ? 'PUT' : 'POST';
            
            const cleanLinks = formData.links.filter(l => l.trim() !== '');

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, links: cleanLinks })
            });

            if (!res.ok) throw new Error("Failed to save");
            
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to save media item");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async (content: string) => {
        if (!initialData?.id) return;
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mediaId: initialData.id, content })
            });
            
            if (res.ok) {
                const comment = await res.json();
                setComments(prev => [...prev, comment]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!initialData?.id) return;
        setIsLoading(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let body: any = { status: newStatus };
            if (newStatus === 'posted') {
                const url = prompt("Enter the live post URL:");
                if (!url) {
                    setIsLoading(false);
                    return;
                }
                body.postUrl = url;
            }

            const res = await fetch(`/api/media/${initialData.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorMsg = await res.text();
                throw new Error(errorMsg || "Failed to update status");
            }
            
            onSave(); 
            onClose();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <MediaModalHeader 
                    initialData={initialData} 
                    onClose={onClose} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                />

                {activeTab === 'details' ? (
                    <MediaModalDetails 
                        formData={formData}
                        setFormData={setFormData}
                        initialData={initialData}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        onClose={onClose}
                        handleStatusChange={handleStatusChange}
                    />
                ) : (
                    <MediaModalActivity 
                        comments={comments}
                        auditLogs={auditLogs}
                        isFetchingDetails={isFetchingDetails}
                        initialData={initialData}
                        onAddComment={handleAddComment}
                    />
                )}
            </div>
        </div>
    );
}
