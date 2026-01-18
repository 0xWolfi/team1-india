"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Globe, ArrowLeft } from "lucide-react";
import { PlaybookShell } from "@/components/playbooks/PlaybookShell";

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
                <h1 className="text-2xl font-bold mb-2 text-white">Error</h1>
                <p className="text-zinc-500">{error || "Something went wrong"}</p>
                 <Link href="/public" className="mt-4 inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
                </Link>
            </div>
        </div>
    );

    return (
        <PlaybookShell 
            playbook={playbook} 
            backLink="/public" 
            backLabel="Back to Directory"
        >
             <Editor 
                initialContent={playbook.body}
                editable={false}
                onChange={() => {}} 
             />
        </PlaybookShell>
    );
}
