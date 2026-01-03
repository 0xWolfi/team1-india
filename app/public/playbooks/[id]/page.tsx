"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Globe, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Dynamic import with NO SSR to avoid build errors with web APIs
const Editor = dynamic(() => import("@/components/playbooks/Editor"), { ssr: false });

interface Playbook {
    id: string;
    title: string;
    body: string; // JSON
    updatedAt: string;
    createdBy?: { email: string };
    visibility: 'PUBLIC' | 'MEMBERS' | 'CORE';
}

export default function PublicPlaybookPage() {
    const { id } = useParams();
    const [playbook, setPlaybook] = useState<Playbook | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        fetch(`/api/public/playbooks/${id}`)
            .then(async res => {
                if (res.ok) {
                    const data = await res.json();
                    setPlaybook(data);
                } else if (res.status === 404) {
                    setError("Playbook not found or removed.");
                } else if (res.status === 403) {
                    setError("This playbook is private.");
                } else {
                    setError("Failed to load content.");
                }
            })
            .catch(err => {
                console.error(err);
                setError("Network error occurred.");
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
                <Globe className="w-8 h-8 text-blue-500 animate-spin-slow" />
                <span className="text-zinc-500 text-sm">Loading Public Doc...</span>
            </div>
        </div>
    );

    if (error || !playbook) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
             <div className="text-center">
                <h1 className="text-2xl font-bold mb-2 text-red-400">Error</h1>
                <p className="text-zinc-500">{error || "Something went wrong"}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between">
                <div>
                     <h1 className="text-xl font-bold flex items-center gap-2">
                        {playbook.title}
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] uppercase font-bold border border-blue-500/20">
                            Public
                        </span>
                     </h1>
                     <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {formatDistanceToNow(new Date(playbook.updatedAt))} ago
                        </span>
                        {playbook.createdBy && (
                            <span>by {playbook.createdBy.email.split('@')[0]}</span>
                        )}
                     </div>
                </div>
                <div className="text-zinc-500 text-sm font-semibold tracking-wider">
                    TEAM 1 INDIA
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                 <Editor 
                    initialContent={playbook.body}
                    editable={false}
                    onChange={() => {}} 
                 />
            </div>
        </div>
    );
}
