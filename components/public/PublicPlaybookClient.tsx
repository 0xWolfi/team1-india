"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Globe } from "lucide-react";
import { PlaybookShell } from "@/components/playbooks/PlaybookShell";

const Editor = dynamic(() => import("@/components/playbooks/Editor"), { ssr: false });

interface Playbook {
    id: string;
    title: string;
    body: string;
    updatedAt: string;
    createdBy?: { email: string };
    visibility: 'PUBLIC' | 'MEMBERS' | 'CORE';
    coverImage?: string;
}

interface PublicPlaybookClientProps {
    playbook: Playbook | null;
    error?: string;
}

export default function PublicPlaybookClient({ playbook, error }: PublicPlaybookClientProps) {
    if (error || !playbook) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2 text-white">Error</h1>
                    <p className="text-zinc-500">{error || "Something went wrong"}</p>
                    <Link href="/public" className="mt-4 inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2"/> Back to Directory
                    </Link>
                </div>
            </div>
        );
    }

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
