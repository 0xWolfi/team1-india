"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Globe, Clock, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Footer } from "@/components/website/Footer";

// Dynamic import with NO SSR to avoid build errors with web APIs
const Editor = dynamic(() => import("@/components/playbooks/Editor"), { ssr: false });

interface Playbook {
    id: string;
    title: string;
    body: string; // JSON
    updatedAt: string;
    createdBy?: { email: string };
    visibility: 'PUBLIC' | 'MEMBERS' | 'CORE';
    coverImage?: string;
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
                 <Link href="/public" className="mt-4 inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 relative">
             {/* Back Button */}
             <div className="absolute top-6 left-6 z-50">
                <Link href="/public" className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-black/80 transition-all">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
             </div>
            {/* Cover Image */}
            {playbook.coverImage && (
                <div className="w-full h-80 md:h-96 relative">
                    <img 
                        src={playbook.coverImage} 
                        alt={playbook.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </div>
            )}

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
                 {/* Title */}
                 <div className="border-b border-white/10 pb-8">
                     <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        {playbook.title}
                     </h1>
                 </div>

                 <Editor 
                    initialContent={playbook.body}
                    editable={false}
                    onChange={() => {}} 
                 />

                 {/* Footer Metadata */}
                 <div className="border-t border-white/10 pt-8 mt-12 flex items-center justify-between text-zinc-500 text-sm">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            Updated {formatDistanceToNow(new Date(playbook.updatedAt))} ago
                        </span>
                        {playbook.createdBy && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                by {playbook.createdBy.email.split('@')[0]}
                            </span>
                        )}
                    </div>
                 </div>
            </div>
            <Footer />
        </div>
    );
}
